const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — allowlist from env (comma-separated)
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (corsOrigins.includes('*') || corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/factchecks', require('./routes/factchecks'));
app.use('/api/sources', require('./routes/sources'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/trending', require('./routes/trending'));
app.use('/api/team', require('./routes/team'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai', require('./routes/aiNew'));






app.use('/api/ai', require('./routes/factcheckSeo'));
app.use('/api/ai', require('./routes/debunkPersonal'));
app.use('/api/ai', require('./routes/predictiveVerify'));
app.use('/api/ai', require('./routes/sourceTracing'));
app.use('/api/ai', require('./routes/viralEarlyWarn'));
// Public widget API (rate-limited, no auth) for embedding fact-check verdicts
app.use('/api/public', require('./routes/publicWidget'));
app.use('/api/narrative-cluster-attribution', require('./routes/narrativeClusterAttribution'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-trending-categories-lack-ai-endpoints-for-trend-prediction-a', require('./routes/gap_trending_categories_lack_ai_endpoints_for_trend_prediction_a'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-sources-lacks-ai-credibility-scoring-endpoint', require('./routes/gap_sources_lacks_ai_credibility_scoring_endpoint'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-limited-social-platform-integration-no-twitter-facebook-tikt', require('./routes/gap_limited_social_platform_integration_no_twitter_facebook_tikt'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-real-time-spread-monitoring-engine', require('./routes/gap_no_real_time_spread_monitoring_engine'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-limited-fact-check-network-integration-snopes-factcheck', require('./routes/gap_limited_fact_check_network_integration_snopes_factcheck'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-verdict-explainability-surface', require('./routes/gap_no_verdict_explainability_surface'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-webhooks', require('./routes/gap_no_webhooks'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-notifications-system', require('./routes/gap_no_notifications_system'));

app.listen(PORT, () => {
  console.log(`🚀 FactCheck AI Server running on port ${PORT}`);
  console.log(`   CORS allowlist: ${corsOrigins.join(', ')}`);
});
