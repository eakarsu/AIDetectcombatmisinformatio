# Audit Apply Notes — AIDetectcombatmisinformatio

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_02.md` (lines 1225-1268).

## Original audit recommendations

### Existing AI features (audit listed 9; actual is 13)
ai.js: analyses CRUD, analyze-claim, analyze-source, analyze-sentiment,
generate-summary, detect-patterns, dashboard-stats.
aiNew.js: cross-claim-dedup, trending-detector, fact-checker-feedback,
counter-narrative-gen.

### Missing AI counterparts
- `trends.js`, `categories.js` lack AI endpoints for trend prediction and
  auto-categorization.

### Missing non-AI features
- Social platform integration (Twitter, Facebook, TikTok).
- Real-time monitoring of misinformation spread.
- Fact-checking network integration (Snopes, FactCheck.org).
- Explainability for claim verdicts.

### Custom feature suggestions
- Viral misinformation early warning.
- Misinformation source tracing.
- Predictive claim verification.
- Debunking personalization.
- Fact-check SEO optimization.

## Implemented in this pass (mechanical)

1. `POST /api/ai/auto-categorize` — closes the audit gap for `categories.js`
   auto-categorization. Stateless, returns primary/secondary categories, tags,
   confidence, and rationale.

Added to `server/routes/aiNew.js`. Follows the existing `callOpenRouter` +
`parseAIJson` + `auth` pattern. No DB writes (vs. `counter-narrative-gen`
which persists to `ai_analyses`). Verified with `node --check`.

## Backlog (not implemented this pass)

### Mechanical, low-risk
- `/api/ai/trend-prediction` — closes audit gap for `trends.js`. Note:
  `trending-detector` exists; this would be a forward-looking variant.

### Needs product decision
- Source-tracing model (graph store, ingestion pipeline).
- Personalized debunking (audience segmentation).

### Needs credentials / external SDK
- Twitter / Facebook / TikTok APIs.
- Snopes / FactCheck.org / IFCN connectors.

### Too risky / large refactor
- Real-time monitoring infrastructure.
- Fact-check SEO optimization (multi-channel SEO work).

## Apply pass 3 (frontend)

Verified the React frontend already exposes pages for every AI endpoint
(including the pass-2 `/auto-categorize`):

- `client/src/pages/AIClaimAnalyzer.js` → `/api/ai/analyze-claim`
- `client/src/pages/AISentiment.js` → `/api/ai/analyze-sentiment`
- `client/src/pages/AISourceChecker.js` → `/api/ai/analyze-source`
- `client/src/pages/AIPatternDetector.js` → `/api/ai/detect-patterns`
- `client/src/pages/AISummaryGenerator.js` → `/api/ai/generate-summary`
- `client/src/pages/AIAutoCategorize.js` → `/api/ai/auto-categorize` (pass 2)

All registered in `App.js` `Routes` and the sidebar's "AI Tools" section.
Auth handled via `services/api.js` axios instance.

Action: LEFT-AS-IS (FE already wired).

## Apply pass 4 (mechanical backlog)

Closed the remaining mechanical backlog item: trend prediction.

### New endpoint

- `POST /api/ai/trend-prediction` (in `server/routes/aiNew.js`) — pulls the
  last 30 days of claims, asks Claude (via OpenRouter) to project
  narratives likely to spread over a configurable `horizon_days` window
  (default 7, capped at 30). Reuses `auth`, `aiRateLimiter`,
  `callOpenRouter`, and `parseAIJson`. Returns 503 when
  `OPENROUTER_API_KEY` is unset; 400 when there are no recent claims.

### New frontend page

- `client/src/pages/AITrendPrediction.js` — horizon-days input, single
  submit button, structured rendering of `predicted_trends`,
  `narratives_to_watch`, and `recommended_preparations`. Visible 503
  handling.

Wiring: registered in `client/src/App.js` `Routes` and the `AI Tools`
section of the sidebar (with the existing `nav-section` pattern).

### Smoke test

PASS. Started `node server/index.js` on port 4000; `POST
/api/ai/trend-prediction` without a token returned 401 (auth middleware
working, route mounted). Cleaned up.

### Files touched

- `server/routes/aiNew.js`
- `client/src/App.js`
- `client/src/pages/AITrendPrediction.js` (new)

### Remaining backlog

- [TOO-RISKY] Fact-check SEO multi-channel work.

## Apply pass 5 (all backlog)

Closed five backlog items. Schemas added on demand via
`CREATE TABLE IF NOT EXISTS`; new endpoints added to existing
`server/routes/aiNew.js`.

### New endpoints (all `/api/ai/...`)

- `POST /source-trace`, `POST /source-relationships` — graph-style source
  tracing backed by a new `source_relationships` table. PRODUCT-DECISION:
  Postgres rather than Neo4j (no new deps); depth capped at 2.
- `POST /personalized-debunk`, `GET/POST /audience-profiles` — audience-aware
  debunking backed by a new `audience_profiles` table.
- `GET  /integrations/status`, `POST /integrations/:provider/search` —
  Twitter / Facebook / TikTok / Snopes / FactCheck.org adapters.
  NEEDS-CREDS gated: 503 + `missing` when env vars unset; 501 when set.
- `POST /realtime-monitor/poll` — polling endpoint that returns claims
  newer than the supplied `since` timestamp. TOO-RISKY for streaming
  infra → poll-based heuristic. FE polls every 10 s.

### Schema additions (created at module load)

- `source_relationships(id, source_id, related_source_id, relation_type, weight, metadata, created_at)`
- `audience_profiles(id, name, description, demographics, information_diet, created_at)`

### New frontend pages

- `client/src/pages/AISourceTrace.js`
- `client/src/pages/AIPersonalizedDebunk.js`
- `client/src/pages/AIIntegrations.js`
- `client/src/pages/AIRealtimeMonitor.js`

`client/src/App.js` Routes + sidebar nav both updated.

### Smoke test

**PASS.** Started `node server/index.js` on port 4000. Without auth all five
new routes returned 401. After registering and logging in:

- `GET /api/ai/audience-profiles` → 200, `{"profiles":[]}`
- `GET /api/ai/integrations/status` → 200 with full per-provider missing list
- `POST /api/ai/source-trace` → 200 with empty `direct`/`extended`
- `POST /api/ai/realtime-monitor/poll` → 200 with `count: 0`

### Files touched

- `server/routes/aiNew.js` (added 7 endpoints + 2 `CREATE TABLE` calls)
- `client/src/App.js`
- `client/src/pages/AISourceTrace.js` (new)
- `client/src/pages/AIPersonalizedDebunk.js` (new)
- `client/src/pages/AIIntegrations.js` (new)
- `client/src/pages/AIRealtimeMonitor.js` (new)

### Remaining backlog after pass 5

- [TOO-RISKY] Fact-check SEO multi-channel work.
