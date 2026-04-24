const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, s.name as source_name, cat.name as category_name
      FROM claims c
      LEFT JOIN sources s ON c.source_id = s.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      ORDER BY c.urgency_score DESC, c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, s.name as source_name, cat.name as category_name
      FROM claims c
      LEFT JOIN sources s ON c.source_id = s.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, content, source_id, category_id, priority, urgency_score, origin_url, assigned_to } = req.body;
    const result = await pool.query(
      `INSERT INTO claims (title, content, source_id, category_id, priority, urgency_score, origin_url, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, content, source_id || null, category_id || null, priority || 'medium', urgency_score || 5.0, origin_url, assigned_to]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, source_id, category_id, status, priority, urgency_score, origin_url, assigned_to } = req.body;
    const result = await pool.query(
      `UPDATE claims SET title=$1, content=$2, source_id=$3, category_id=$4, status=$5, priority=$6,
       urgency_score=$7, origin_url=$8, assigned_to=$9, updated_at=CURRENT_TIMESTAMP
       WHERE id=$10 RETURNING *`,
      [title, content, source_id || null, category_id || null, status, priority, urgency_score, origin_url, assigned_to, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM claims WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
