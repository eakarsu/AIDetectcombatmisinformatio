const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT fc.*, c.title as claim_title, c.content as claim_content
      FROM fact_checks fc
      LEFT JOIN claims c ON fc.claim_id = c.id
      ORDER BY fc.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT fc.*, c.title as claim_title, c.content as claim_content
      FROM fact_checks fc
      LEFT JOIN claims c ON fc.claim_id = c.id
      WHERE fc.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { claim_id, verdict, summary, evidence, sources_used, checker_name, confidence_score, methodology } = req.body;
    const result = await pool.query(
      `INSERT INTO fact_checks (claim_id, verdict, summary, evidence, sources_used, checker_name, confidence_score, methodology)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [claim_id, verdict, summary, evidence, sources_used, checker_name, confidence_score || 0, methodology]
    );
    if (claim_id) {
      await pool.query("UPDATE claims SET status = 'in_review' WHERE id = $1", [claim_id]);
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { claim_id, verdict, summary, evidence, sources_used, checker_name, confidence_score, methodology } = req.body;
    const result = await pool.query(
      `UPDATE fact_checks SET claim_id=$1, verdict=$2, summary=$3, evidence=$4, sources_used=$5,
       checker_name=$6, confidence_score=$7, methodology=$8 WHERE id=$9 RETURNING *`,
      [claim_id, verdict, summary, evidence, sources_used, checker_name, confidence_score, methodology, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM fact_checks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
