ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
CREATE TABLE IF NOT EXISTS evidence_cases (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, title TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'intake', verdict TEXT,
 methodology_version TEXT, idempotency_key TEXT NOT NULL, created_by BIGINT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
 UNIQUE(tenant_id,idempotency_key), CHECK(state IN ('intake','analyzing','analyst_review','published','redress','inconclusive','withdrawn','superseded','closed'))
);
CREATE TABLE IF NOT EXISTS evidence_items (
 id BIGSERIAL PRIMARY KEY, case_id BIGINT NOT NULL REFERENCES evidence_cases(id) ON DELETE RESTRICT, sha256 CHAR(64) NOT NULL,
 source_uri TEXT NOT NULL, captured_at TIMESTAMPTZ NOT NULL, custody_event TEXT NOT NULL, metadata JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(case_id,sha256)
);
CREATE TABLE IF NOT EXISTS detector_runs (
 id BIGSERIAL PRIMARY KEY, case_id BIGINT NOT NULL REFERENCES evidence_cases(id) ON DELETE RESTRICT, detector TEXT NOT NULL,
 detector_version TEXT NOT NULL,input_hash TEXT NOT NULL,score DOUBLE PRECISION NOT NULL,uncertainty DOUBLE PRECISION,raw_result JSONB NOT NULL DEFAULT '{}',created_at TIMESTAMPTZ DEFAULT NOW(),UNIQUE(case_id,detector,detector_version,input_hash)
);
CREATE TABLE IF NOT EXISTS evidence_case_events (id BIGSERIAL PRIMARY KEY,case_id BIGINT NOT NULL REFERENCES evidence_cases(id),actor_id BIGINT NOT NULL,from_state TEXT,to_state TEXT NOT NULL,reason TEXT,created_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX IF NOT EXISTS evidence_cases_tenant_state_idx ON evidence_cases(tenant_id,state);
