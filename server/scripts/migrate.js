'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL, role VARCHAR(50) DEFAULT 'fact_checker',
    tenant_id TEXT NOT NULL DEFAULT 'default', created_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS ai_analyses (
    id BIGSERIAL PRIMARY KEY, claim_id BIGINT, analysis_type TEXT NOT NULL, input_text TEXT,
    result JSONB, model_used TEXT, input_data_json JSONB, result_json JSONB, user_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const migration = path.join(__dirname, '..', 'migrations', '001_evidence_cases.sql');
  await pool.query(fs.readFileSync(migration, 'utf8'));
  console.log('Runtime schema migrated');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
