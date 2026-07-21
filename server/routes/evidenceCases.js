const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { validateEvidence, assertTransition } = require('../domain/evidenceWorkflow');
router.use(auth);

function tenant(req) { const t=req.user.tenantId||req.user.tenant_id; if(!t) throw new Error('tenant-bound identity required'); return String(t); }

router.post('/', async (req,res) => {
  try {
    const e=validateEvidence(req.body.evidence);
    if (!req.body.idempotencyKey) throw new Error('idempotencyKey required');
    const client=await pool.connect();
    try {
      await client.query('BEGIN');
      const c=await client.query(`INSERT INTO evidence_cases (tenant_id,title,state,idempotency_key,created_by)
        VALUES ($1,$2,'intake',$3,$4) ON CONFLICT (tenant_id,idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`,
        [tenant(req),String(req.body.title||'Untitled').slice(0,500),req.body.idempotencyKey,req.user.id]);
      await client.query(`INSERT INTO evidence_items (case_id,sha256,source_uri,captured_at,custody_event,metadata)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (case_id,sha256) DO NOTHING`, [c.rows[0].id,e.sha256,e.sourceUri,req.body.evidence.capturedAt,req.body.evidence.custodyEvent,req.body.evidence.metadata||{}]);
      await client.query('COMMIT'); res.status(201).json(c.rows[0]);
    } catch(err){await client.query('ROLLBACK'); throw err;} finally{client.release();}
  } catch(error){res.status(400).json({error:error.message});}
});

router.post('/:id/detector-runs', async (req,res) => {
  try {
    if(!req.body.detector || !req.body.version || !req.body.inputHash || !Number.isFinite(req.body.score)) throw new Error('detector, version, inputHash, and numeric score required');
    const result=await pool.query(`INSERT INTO detector_runs (case_id,detector,detector_version,input_hash,score,uncertainty,raw_result)
      SELECT $1,$2,$3,$4,$5,$6,$7 WHERE EXISTS (SELECT 1 FROM evidence_cases WHERE id=$1 AND tenant_id=$8)
      ON CONFLICT (case_id,detector,detector_version,input_hash) DO UPDATE SET score=EXCLUDED.score,uncertainty=EXCLUDED.uncertainty,raw_result=EXCLUDED.raw_result RETURNING *`,
      [req.params.id,req.body.detector,req.body.version,req.body.inputHash,req.body.score,req.body.uncertainty||null,req.body.rawResult||{},tenant(req)]);
    if(!result.rows[0]) return res.status(404).json({error:'case not found'}); res.status(201).json(result.rows[0]);
  } catch(error){res.status(400).json({error:error.message});}
});

router.post('/:id/transition', async (req,res) => {
  try {
    const current=await pool.query(`SELECT c.*,(SELECT COUNT(*)::int FROM evidence_items e WHERE e.case_id=c.id) evidence_count FROM evidence_cases c WHERE c.id=$1 AND c.tenant_id=$2`,[req.params.id,tenant(req)]);
    if(!current.rows[0]) return res.status(404).json({error:'case not found'});
    assertTransition(current.rows[0].state,req.body.to,{...req.body,role:req.user.role,evidenceCount:current.rows[0].evidence_count});
    const result=await pool.query(`UPDATE evidence_cases SET state=$1,verdict=$2,methodology_version=$3,updated_at=NOW() WHERE id=$4 AND tenant_id=$5 RETURNING *`,[req.body.to,req.body.verdict||null,req.body.methodologyVersion||null,req.params.id,tenant(req)]);
    await pool.query(`INSERT INTO evidence_case_events (case_id,actor_id,from_state,to_state,reason) VALUES ($1,$2,$3,$4,$5)`,[req.params.id,req.user.id,current.rows[0].state,req.body.to,req.body.reason||null]);
    res.json(result.rows[0]);
  } catch(error){res.status(409).json({error:error.message});}
});
module.exports=router;
