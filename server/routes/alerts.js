const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const orderClause = `ORDER BY CASE a.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END, a.created_at DESC`;

    if (req.query.page !== undefined) {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const offset = (page - 1) * limit;
      const [result, countResult] = await Promise.all([
        pool.query(`SELECT a.*, c.title as claim_title FROM alerts a LEFT JOIN claims c ON a.claim_id = c.id ${orderClause} LIMIT $1 OFFSET $2`, [limit, offset]),
        pool.query('SELECT COUNT(*) as total FROM alerts'),
      ]);
      const total = parseInt(countResult.rows[0].total);
      return res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }

    const result = await pool.query(`
      SELECT a.*, c.title as claim_title
      FROM alerts a
      LEFT JOIN claims c ON a.claim_id = c.id
      ${orderClause}
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, c.title as claim_title
      FROM alerts a
      LEFT JOIN claims c ON a.claim_id = c.id
      WHERE a.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, severity, type, source, status, claim_id } = req.body;
    const result = await pool.query(
      'INSERT INTO alerts (title, description, severity, type, source, status, claim_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title, description, severity || 'medium', type, source, status || 'active', claim_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, severity, type, source, status, claim_id } = req.body;
    const result = await pool.query(
      'UPDATE alerts SET title=$1, description=$2, severity=$3, type=$4, source=$5, status=$6, claim_id=$7 WHERE id=$8 RETURNING *',
      [title, description, severity, type, source, status, claim_id || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM alerts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
