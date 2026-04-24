const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trending_topics ORDER BY mention_count DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trending_topics WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { topic, description, mention_count, growth_rate, risk_level, category } = req.body;
    const result = await pool.query(
      'INSERT INTO trending_topics (topic, description, mention_count, growth_rate, risk_level, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [topic, description, mention_count || 0, growth_rate || 0, risk_level || 'low', category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { topic, description, mention_count, growth_rate, risk_level, category } = req.body;
    const result = await pool.query(
      'UPDATE trending_topics SET topic=$1, description=$2, mention_count=$3, growth_rate=$4, risk_level=$5, category=$6, last_seen=CURRENT_TIMESTAMP WHERE id=$7 RETURNING *',
      [topic, description, mention_count, growth_rate, risk_level, category, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM trending_topics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
