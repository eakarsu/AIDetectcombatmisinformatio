const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const { analyzeClaim, analyzeSourceCredibility, analyzeSentiment, generateFactCheckSummary, detectMisinformationPatterns } = require('../services/openrouter');
const router = express.Router();

// Get all AI analyses
router.get('/analyses', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT aa.*, c.title as claim_title
      FROM ai_analyses aa
      LEFT JOIN claims c ON aa.claim_id = c.id
      ORDER BY aa.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analyses/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT aa.*, c.title as claim_title
      FROM ai_analyses aa
      LEFT JOIN claims c ON aa.claim_id = c.id
      WHERE aa.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/analyses/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ai_analyses WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analyze a claim
router.post('/analyze-claim', auth, async (req, res) => {
  try {
    const { text, claim_id } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const result = await analyzeClaim(text);
    const saved = await pool.query(
      'INSERT INTO ai_analyses (claim_id, analysis_type, input_text, result, model_used) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [claim_id || null, 'claim_analysis', text, JSON.stringify(result), process.env.OPENROUTER_MODEL]
    );
    res.json({ analysis: result, saved: saved.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analyze source credibility
router.post('/analyze-source', auth, async (req, res) => {
  try {
    const { name, url, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Source name is required' });
    const result = await analyzeSourceCredibility(name, url, description);
    const saved = await pool.query(
      'INSERT INTO ai_analyses (analysis_type, input_text, result, model_used) VALUES ($1, $2, $3, $4) RETURNING *',
      ['source_credibility', `Source: ${name} (${url || 'N/A'})`, JSON.stringify(result), process.env.OPENROUTER_MODEL]
    );
    res.json({ analysis: result, saved: saved.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sentiment analysis
router.post('/analyze-sentiment', auth, async (req, res) => {
  try {
    const { text, claim_id } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const result = await analyzeSentiment(text);
    const saved = await pool.query(
      'INSERT INTO ai_analyses (claim_id, analysis_type, input_text, result, model_used) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [claim_id || null, 'sentiment_analysis', text, JSON.stringify(result), process.env.OPENROUTER_MODEL]
    );
    res.json({ analysis: result, saved: saved.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate fact-check summary
router.post('/generate-summary', auth, async (req, res) => {
  try {
    const { claim, evidence, claim_id } = req.body;
    if (!claim) return res.status(400).json({ error: 'Claim is required' });
    const result = await generateFactCheckSummary(claim, evidence || 'No additional evidence provided');
    const saved = await pool.query(
      'INSERT INTO ai_analyses (claim_id, analysis_type, input_text, result, model_used) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [claim_id || null, 'fact_check_summary', claim, JSON.stringify(result), process.env.OPENROUTER_MODEL]
    );
    res.json({ analysis: result, saved: saved.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Detect misinformation patterns
router.post('/detect-patterns', auth, async (req, res) => {
  try {
    const { text, claim_id } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const result = await detectMisinformationPatterns(text);
    const saved = await pool.query(
      'INSERT INTO ai_analyses (claim_id, analysis_type, input_text, result, model_used) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [claim_id || null, 'pattern_detection', text, JSON.stringify(result), process.env.OPENROUTER_MODEL]
    );
    res.json({ analysis: result, saved: saved.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard stats
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    const [claims, factChecks, alerts, trending, sources, categories] = await Promise.all([
      pool.query('SELECT status, COUNT(*) as count FROM claims GROUP BY status'),
      pool.query('SELECT COUNT(*) as total, AVG(confidence_score) as avg_confidence FROM fact_checks'),
      pool.query("SELECT COUNT(*) as active FROM alerts WHERE status = 'active'"),
      pool.query('SELECT COUNT(*) as total FROM trending_topics'),
      pool.query('SELECT COUNT(*) as total, AVG(credibility_score) as avg_credibility FROM sources'),
      pool.query('SELECT COUNT(*) as total FROM categories'),
    ]);

    const claimStats = {};
    claims.rows.forEach(r => { claimStats[r.status] = parseInt(r.count); });

    res.json({
      claims: {
        total: Object.values(claimStats).reduce((a, b) => a + b, 0),
        ...claimStats,
      },
      factChecks: {
        total: parseInt(factChecks.rows[0].total),
        avgConfidence: parseFloat(factChecks.rows[0].avg_confidence || 0).toFixed(1),
      },
      activeAlerts: parseInt(alerts.rows[0].active),
      trendingTopics: parseInt(trending.rows[0].total),
      sources: {
        total: parseInt(sources.rows[0].total),
        avgCredibility: parseFloat(sources.rows[0].avg_credibility || 0).toFixed(1),
      },
      categories: parseInt(categories.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
