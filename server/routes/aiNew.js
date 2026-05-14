const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter } = require('../services/openrouter');
const { parseAIJson } = require('../services/parseAIJson');
const router = express.Router();

// Ensure feedback table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_feedback (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES ai_analyses(id) ON DELETE CASCADE,
    user_id INTEGER,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    correction_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Failed to create ai_feedback table:', err.message));

// POST /api/ai/cross-claim-dedup
// Accepts {claim_id}, fetches claim, queries all other claims, uses AI to find duplicates
router.post('/cross-claim-dedup', auth, aiRateLimiter, async (req, res) => {
  try {
    const { claim_id } = req.body;
    if (!claim_id) return res.status(400).json({ error: 'claim_id is required' });

    const claimResult = await pool.query('SELECT id, title, content FROM claims WHERE id = $1', [claim_id]);
    if (claimResult.rows.length === 0) return res.status(404).json({ error: 'Claim not found' });

    const claim = claimResult.rows[0];
    const othersResult = await pool.query(
      'SELECT id, title, content FROM claims WHERE id != $1 ORDER BY created_at DESC LIMIT 100',
      [claim_id]
    );

    const candidates = othersResult.rows.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content ? r.content.slice(0, 300) : '',
    }));

    const messages = [
      {
        role: 'system',
        content: `You are a duplicate claim detection expert. Given a primary claim and a list of candidate claims, identify which candidates are duplicates or near-duplicates. Respond ONLY in JSON with format: {"matches": [{"claim_id": <number>, "similarity_score": <0-1>, "reason": "<string>"}]}`,
      },
      {
        role: 'user',
        content: `Primary claim:\nTitle: ${claim.title}\nContent: ${claim.content ? claim.content.slice(0, 500) : ''}\n\nCandidates:\n${JSON.stringify(candidates)}`,
      },
    ];

    const raw = await callOpenRouter(messages, { temperature: 0.2, max_tokens: 1024 });
    const result = parseAIJson(raw);

    res.json({ claim_id, matches: result.matches || [], raw: result.raw_response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/trending-detector
// Fetches recent claims from last 7 days, uses AI to identify emerging topics and patterns
router.post('/trending-detector', auth, aiRateLimiter, async (req, res) => {
  try {
    const recentResult = await pool.query(`
      SELECT id, title, content, created_at, category_id
      FROM claims
      WHERE created_at >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 100
    `);

    const claims = recentResult.rows.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content ? r.content.slice(0, 200) : '',
    }));

    const messages = [
      {
        role: 'system',
        content: `You are a misinformation trend analyst. Analyze the given recent claims and identify emerging topics, recurring narratives, and patterns. Respond ONLY in JSON with format: {"trending_topics": [{"topic": "string", "claim_count": <number>, "description": "string", "risk_level": "low|medium|high|critical"}], "emerging_narratives": ["string"], "summary": "string"}`,
      },
      {
        role: 'user',
        content: `Analyze these ${claims.length} claims from the last 7 days for trending topics and patterns:\n${JSON.stringify(claims)}`,
      },
    ];

    const raw = await callOpenRouter(messages, { temperature: 0.3, max_tokens: 1500 });
    const result = parseAIJson(raw);

    res.json({ claim_count: claims.length, analysis: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/fact-checker-feedback
// Stores feedback on an AI analysis
router.post('/fact-checker-feedback', auth, async (req, res) => {
  try {
    const { analysis_id, rating, correction_text } = req.body;

    if (!analysis_id) return res.status(400).json({ error: 'analysis_id is required' });
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
    }

    const analysisCheck = await pool.query('SELECT id FROM ai_analyses WHERE id = $1', [analysis_id]);
    if (analysisCheck.rows.length === 0) return res.status(404).json({ error: 'Analysis not found' });

    const user_id = req.user ? req.user.id : null;
    const saved = await pool.query(
      'INSERT INTO ai_feedback (analysis_id, user_id, rating, correction_text) VALUES ($1, $2, $3, $4) RETURNING *',
      [analysis_id, user_id, rating, correction_text || null]
    );

    res.status(201).json({ message: 'Feedback submitted successfully', feedback: saved.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/counter-narrative-gen
// Generates a detailed counter-narrative for a claim using its AI analysis
router.post('/counter-narrative-gen', auth, aiRateLimiter, async (req, res) => {
  try {
    const { claim_id } = req.body;
    if (!claim_id) return res.status(400).json({ error: 'claim_id is required' });

    const claimResult = await pool.query('SELECT * FROM claims WHERE id = $1', [claim_id]);
    if (claimResult.rows.length === 0) return res.status(404).json({ error: 'Claim not found' });

    const claim = claimResult.rows[0];
    const analysisResult = await pool.query(
      `SELECT result FROM ai_analyses WHERE claim_id = $1 AND analysis_type = 'claim_analysis' ORDER BY created_at DESC LIMIT 1`,
      [claim_id]
    );

    const analysisData = analysisResult.rows.length > 0 ? analysisResult.rows[0].result : null;

    const messages = [
      {
        role: 'system',
        content: `You are an expert counter-misinformation strategist. Generate a comprehensive counter-narrative with evidence-based talking points. Respond ONLY in JSON with format: {"counter_narrative": "string", "key_evidence_points": ["string"], "recommended_messaging": "string", "target_audiences": ["string"], "tone": "string", "citations_needed": ["string"]}`,
      },
      {
        role: 'user',
        content: `Generate a counter-narrative for this claim:\nTitle: ${claim.title}\nContent: ${claim.content}\n\nExisting AI analysis: ${analysisData ? JSON.stringify(analysisData) : 'None available'}`,
      },
    ];

    const raw = await callOpenRouter(messages, { temperature: 0.4, max_tokens: 2000 });
    const result = parseAIJson(raw);

    const saved = await pool.query(
      'INSERT INTO ai_analyses (claim_id, analysis_type, input_text, result, model_used) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [claim_id, 'counter_narrative', claim.title, JSON.stringify(result), process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022']
    );

    res.json({ claim_id, counter_narrative: result, saved: saved.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/auto-categorize
// Audit recommendation: stateless auto-categorization of a claim into the
// project's category taxonomy.
router.post('/auto-categorize', auth, aiRateLimiter, async (req, res) => {
  try {
    const { claim_text, available_categories } = req.body;
    if (!claim_text || typeof claim_text !== 'string') {
      return res.status(400).json({ error: 'claim_text is required' });
    }
    if (claim_text.length > 50000) {
      return res.status(400).json({ error: 'claim_text too long (max 50,000 chars)' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert misinformation taxonomist. Assign the most appropriate categories to a claim. Use the supplied category list when provided; otherwise use a sensible default taxonomy (health, politics, science, finance, environment, technology, society, conspiracy, other). Respond ONLY in JSON: {"primary_category": "string", "secondary_categories": ["string"], "tags": ["string"], "confidence": "low|medium|high", "rationale": "string"}`,
      },
      {
        role: 'user',
        content: `Categorize this claim:\n\nCLAIM TEXT:\n${claim_text}\n\nAVAILABLE CATEGORIES:\n${available_categories && Array.isArray(available_categories) && available_categories.length ? available_categories.join(', ') : '(none provided — use default taxonomy)'}`,
      },
    ];

    const raw = await callOpenRouter(messages, { temperature: 0.2, max_tokens: 1500 });
    const result = parseAIJson(raw);

    res.json({ categorization: result, raw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/trend-prediction
// Audit gap (`trends.js` lacks AI counterpart): forward-looking variant of
// trending-detector. Uses last 30 days of claims and asks the model to
// project what is likely to spread in the next 7 days.
router.post('/trend-prediction', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'OPENROUTER_API_KEY not configured' });
    }

    const { horizon_days = 7 } = req.body || {};
    const horizon = Math.max(1, Math.min(30, parseInt(horizon_days, 10) || 7));

    const recent = await pool.query(`
      SELECT id, title, content, created_at, category_id
      FROM claims
      WHERE created_at >= NOW() - INTERVAL '30 days'
      ORDER BY created_at DESC
      LIMIT 200
    `);

    if (recent.rows.length === 0) {
      return res.status(400).json({ error: 'No recent claims to analyze' });
    }

    const claims = recent.rows.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content ? r.content.slice(0, 200) : '',
      created_at: r.created_at,
      category_id: r.category_id,
    }));

    const messages = [
      {
        role: 'system',
        content: `You are a misinformation forecasting analyst. Given recent claims, project which narratives, topics, and tactics are most likely to surge over the next ${horizon} days. Respond ONLY in JSON with format: {"horizon_days": ${horizon}, "predicted_trends": [{"topic": "string", "expected_volume": "low|medium|high", "expected_severity": "low|medium|high|critical", "drivers": ["string"], "leading_indicators": ["string"], "confidence": "low|medium|high"}], "narratives_to_watch": ["string"], "recommended_preparations": ["string"], "summary": "string"}`,
      },
      {
        role: 'user',
        content: `Project the next ${horizon} days based on these ${claims.length} recent claims:\n${JSON.stringify(claims)}`,
      },
    ];

    const raw = await callOpenRouter(messages, { temperature: 0.3, max_tokens: 1800 });
    const result = parseAIJson(raw);

    res.json({ horizon_days: horizon, claim_count: claims.length, prediction: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Apply pass 5 — additional backlog endpoints ─────────────────────────────
//
// Required env vars (per integration; checked at request time):
//   Twitter:        TWITTER_BEARER_TOKEN
//   Facebook:       FACEBOOK_ACCESS_TOKEN
//   TikTok:         TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET
//   Snopes:         SNOPES_API_KEY (third-party / unofficial)
//   FactCheck.org:  FACTCHECK_API_KEY
//
// Schemas added on demand via CREATE TABLE IF NOT EXISTS.

pool.query(`
  CREATE TABLE IF NOT EXISTS source_relationships (
    id SERIAL PRIMARY KEY,
    source_id INTEGER,
    related_source_id INTEGER,
    relation_type VARCHAR(50),
    weight FLOAT DEFAULT 1.0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('Failed to create source_relationships table:', err.message));

pool.query(`
  CREATE TABLE IF NOT EXISTS audience_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    demographics JSONB DEFAULT '{}'::jsonb,
    information_diet JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('Failed to create audience_profiles table:', err.message));

// POST /api/ai/source-trace — build/return a small source neighbourhood from
// source_relationships rows.
// PRODUCT-DECISION: graph store is the existing Postgres `source_relationships`
// table; depth limited to 2 to bound cost. Heavier graph stores (Neo4j) are
// out of scope per the no-new-deps rule.
router.post('/source-trace', auth, aiRateLimiter, async (req, res) => {
  try {
    const { source_id, depth = 1 } = req.body || {};
    if (!source_id) return res.status(400).json({ error: 'source_id is required' });
    const d = Math.max(1, Math.min(2, parseInt(depth, 10) || 1));
    const direct = await pool.query(
      'SELECT * FROM source_relationships WHERE source_id = $1 OR related_source_id = $1 ORDER BY weight DESC LIMIT 200',
      [source_id],
    );
    let next = [];
    if (d > 1) {
      const neighbourIds = Array.from(new Set(
        direct.rows.flatMap((r) => [r.source_id, r.related_source_id]).filter((id) => id && id !== source_id),
      ));
      if (neighbourIds.length > 0) {
        const placeholders = neighbourIds.map((_, i) => `$${i + 1}`).join(',');
        const result = await pool.query(
          `SELECT * FROM source_relationships WHERE source_id IN (${placeholders}) OR related_source_id IN (${placeholders}) LIMIT 400`,
          [...neighbourIds, ...neighbourIds],
        );
        next = result.rows;
      }
    }
    res.json({ root: source_id, depth: d, direct: direct.rows, extended: next });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/source-relationships — record a learned/curated edge.
router.post('/source-relationships', auth, async (req, res) => {
  try {
    const { source_id, related_source_id, relation_type, weight, metadata } = req.body || {};
    if (!source_id || !related_source_id) {
      return res.status(400).json({ error: 'source_id and related_source_id are required' });
    }
    const result = await pool.query(
      `INSERT INTO source_relationships (source_id, related_source_id, relation_type, weight, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [source_id, related_source_id, relation_type || 'related', weight || 1.0, metadata || {}],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/personalized-debunk — generate debunk content tailored to an
// audience profile.
// PRODUCT-DECISION: audience segmentation lives in audience_profiles; the
// caller supplies an audience_profile_id and a claim_id.
router.post('/personalized-debunk', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'OPENROUTER_API_KEY not configured', missing: 'OPENROUTER_API_KEY' });
    }
    const { claim_id, audience_profile_id } = req.body || {};
    if (!claim_id) return res.status(400).json({ error: 'claim_id is required' });

    const claim = await pool.query('SELECT * FROM claims WHERE id = $1', [claim_id]);
    if (claim.rows.length === 0) return res.status(404).json({ error: 'Claim not found' });
    let profile = null;
    if (audience_profile_id) {
      const p = await pool.query('SELECT * FROM audience_profiles WHERE id = $1', [audience_profile_id]);
      profile = p.rows[0] || null;
    }
    const messages = [
      {
        role: 'system',
        content: 'You are a science communicator who tailors debunks to specific audiences. Respond ONLY in JSON: {"audience_summary":"string","tone":"string","analogies":["string"],"sources_to_cite":["string"],"debunk_text":"string","call_to_action":"string"}',
      },
      {
        role: 'user',
        content: `Audience profile: ${JSON.stringify(profile || { generic: true })}\nClaim: ${JSON.stringify({ title: claim.rows[0].title, content: claim.rows[0].content })}`,
      },
    ];
    const raw = await callOpenRouter(messages, { temperature: 0.4, max_tokens: 1500 });
    const result = parseAIJson(raw);
    res.json({ claim_id, audience_profile_id, debunk: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CRUD for audience profiles (helps populate the personalized-debunk endpoint).
router.get('/audience-profiles', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audience_profiles ORDER BY created_at DESC LIMIT 200');
    res.json({ profiles: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/audience-profiles', auth, async (req, res) => {
  try {
    const { name, description, demographics, information_diet } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await pool.query(
      `INSERT INTO audience_profiles (name, description, demographics, information_diet)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description || null, demographics || {}, information_diet || {}],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Social media + fact-checker integration adapters (NEEDS-CREDS).
const INTEGRATION_CREDS = {
  twitter: ['TWITTER_BEARER_TOKEN'],
  facebook: ['FACEBOOK_ACCESS_TOKEN'],
  tiktok: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
  snopes: ['SNOPES_API_KEY'],
  factcheck: ['FACTCHECK_API_KEY'],
};
function findMissing(provider) {
  const required = INTEGRATION_CREDS[provider];
  if (!required) return ['unknown-provider'];
  return required.filter((k) => !process.env[k]);
}
router.get('/integrations/status', auth, async (_req, res) => {
  const status = {};
  for (const p of Object.keys(INTEGRATION_CREDS)) {
    const missing = findMissing(p);
    status[p] = { configured: missing.length === 0, missing };
  }
  res.json({ success: true, status });
});
router.post('/integrations/:provider/search', auth, async (req, res) => {
  const provider = String(req.params.provider).toLowerCase();
  if (!INTEGRATION_CREDS[provider]) {
    return res.status(400).json({ error: 'Unsupported provider', supported: Object.keys(INTEGRATION_CREDS) });
  }
  const missing = findMissing(provider);
  if (missing.length > 0) {
    return res.status(503).json({ error: `${provider} credentials not configured`, missing });
  }
  return res.status(501).json({ error: 'Adapter present but upstream call not enabled in this build', provider });
});

// POST /api/ai/realtime-monitor/poll — additive polling endpoint that returns
// recently-added claims since the supplied timestamp. Real-time pub/sub is
// out of scope (no new infra deps); the FE can call this on an interval.
// TOO-RISKY for streaming infra → additive heuristic only.
router.post('/realtime-monitor/poll', auth, async (req, res) => {
  try {
    const { since } = req.body || {};
    const sinceTs = since && !Number.isNaN(Date.parse(since)) ? new Date(since) : new Date(Date.now() - 5 * 60 * 1000);
    const result = await pool.query(
      'SELECT id, title, created_at FROM claims WHERE created_at > $1 ORDER BY created_at DESC LIMIT 100',
      [sinceTs],
    );
    res.json({ since: sinceTs.toISOString(), count: result.rows.length, claims: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
