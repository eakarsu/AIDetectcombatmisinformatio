const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    summary: { clusters: 14, coordinated_networks: 3, source_families: 8, debunks_ready: 5 },
    clusters: [
      { narrative: 'fabricated casualty count', origin: 'fringe forum', spread: 'high', action: 'source chain explainer' },
      { narrative: 'altered satellite image', origin: 'video channel cluster', spread: 'medium', action: 'visual forensic note' },
      { narrative: 'fake official memo', origin: 'anonymous reposts', spread: 'medium', action: 'authority verification card' },
    ],
  });
});

router.post('/attribute', (req, res) => {
  const { shares = 0, independentSources = 1 } = req.body || {};
  res.json({ coordination_risk: shares / Math.max(1, independentSources) > 100 ? 'high' : 'normal', next_step: 'compare timestamp and language templates' });
});

module.exports = router;
