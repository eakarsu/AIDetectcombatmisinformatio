// Public, unauthenticated, rate-limited widget API for embedding fact-check verdicts
const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const pool = require('../db');
const router = express.Router();

// Strict public rate limit: 30 req/hour per IP
const publicLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => ipKeyGenerator(req),
  message: { error: 'Public widget rate limit exceeded. Max 30 requests/hour.' },
});

// GET /api/public/verdict?url=...&q=...
// Look up the most recent fact-check for a URL or claim title text.
router.get('/verdict', publicLimiter, async (req, res) => {
  try {
    const { url, q } = req.query;
    if (!url && !q) return res.status(400).json({ error: 'url or q (claim text) is required' });

    let claimRow;
    if (url) {
      const r = await pool.query(
        `SELECT id, title, content, status, urgency_score FROM claims WHERE origin_url = $1 ORDER BY created_at DESC LIMIT 1`,
        [url]
      );
      claimRow = r.rows[0];
    }
    if (!claimRow && q) {
      const r = await pool.query(
        `SELECT id, title, content, status, urgency_score FROM claims WHERE LOWER(title) LIKE $1 OR LOWER(content) LIKE $1 ORDER BY created_at DESC LIMIT 1`,
        [`%${String(q).toLowerCase().slice(0, 200)}%`]
      );
      claimRow = r.rows[0];
    }

    if (!claimRow) {
      return res.json({ found: false, message: 'No fact-check found for this URL or claim.' });
    }

    const fc = await pool.query(
      `SELECT verdict, summary, confidence_score, checker_name, created_at FROM fact_checks WHERE claim_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [claimRow.id]
    );

    res.json({
      found: true,
      claim: {
        id: claimRow.id,
        title: claimRow.title,
        status: claimRow.status,
        urgency_score: claimRow.urgency_score,
      },
      fact_check: fc.rows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/widget.js — embeddable JS snippet
router.get('/widget.js', publicLimiter, (req, res) => {
  res.type('application/javascript').send(`
(function(){
  var els = document.querySelectorAll('[data-factcheck-url]');
  els.forEach(function(el){
    var url = el.getAttribute('data-factcheck-url');
    var apiBase = el.getAttribute('data-factcheck-api') || (location.protocol + '//' + location.host);
    fetch(apiBase + '/api/public/verdict?url=' + encodeURIComponent(url))
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (!data.found) { el.innerHTML = '<div style="font-family:sans-serif;font-size:13px;color:#888;padding:8px;border:1px solid #eee;border-radius:6px;">FactCheck AI: no verdict on file</div>'; return; }
        var fc = data.fact_check || {};
        var color = (fc.verdict||'').toLowerCase().includes('false') ? '#ef4444' : (fc.verdict||'').toLowerCase().includes('true') ? '#22c55e' : '#f59e0b';
        el.innerHTML = '<div style="font-family:sans-serif;font-size:13px;padding:10px;border-left:4px solid '+color+';background:#fafafa;border-radius:4px;"><div style="font-weight:600;color:'+color+';margin-bottom:4px;">FactCheck: '+(fc.verdict||'Pending')+'</div><div style="color:#444;">'+(fc.summary||data.claim.title)+'</div><div style="color:#888;font-size:11px;margin-top:4px;">Confidence: '+(fc.confidence_score||'—')+' • '+(fc.checker_name||'FactCheck AI')+'</div></div>';
      })
      .catch(function(){ el.innerHTML = '<div style="font-family:sans-serif;font-size:13px;color:#888;">FactCheck AI: error loading verdict</div>'; });
  });
})();
`);
});

module.exports = router;
