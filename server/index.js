const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

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
if (process.env.NODE_ENV !== 'production') {
  corsOrigins.push(`http://127.0.0.1:${PORT}`, `http://localhost:${PORT}`);
}

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
app.use('/api/evidence-cases', require('./routes/evidenceCases'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generated gap routers are quarantined until their providers have real contracts.

app.listen(PORT, () => {
  console.log(`🚀 FactCheck AI Server running on port ${PORT}`);
  console.log(`   CORS allowlist: ${corsOrigins.join(', ')}`);
});
