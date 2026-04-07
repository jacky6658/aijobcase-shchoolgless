/**
 * ar-practice.js - AR practice session routes
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// POST /api/ar-practice/sessions - Create new practice session
router.post('/sessions', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO ar_practice_sessions (student_id) VALUES ($1) RETURNING *`,
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/ar-practice/sessions/:id - End/update session
router.patch('/sessions/:id', async (req, res) => {
  try {
    const { status, stepsCompleted, durationSeconds } = req.body;
    const { rows } = await pool.query(
      `UPDATE ar_practice_sessions
       SET status = COALESCE($1, status),
           steps_completed = COALESCE($2, steps_completed),
           duration_seconds = COALESCE($3, duration_seconds),
           ended_at = NOW()
       WHERE id = $4 AND student_id = $5
       RETURNING *`,
      [status, stepsCompleted, durationSeconds, req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ar-practice/sessions/:id/events - Log event
router.post('/sessions/:id/events', async (req, res) => {
  try {
    const { eventType, stepNumber, metadata } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO ar_practice_events (session_id, event_type, step_number, metadata)
       SELECT $1, $2, $3, $4
       FROM ar_practice_sessions WHERE id = $1 AND student_id = $5
       RETURNING *`,
      [req.params.id, eventType, stepNumber || null, metadata || {}, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ar-practice/sessions - List own sessions
router.get('/sessions', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ar_practice_sessions WHERE student_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ar-practice/students - Teacher: list all students with practice stats
router.get('/students', async (req, res) => {
  if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.student_id, u.name,
        COUNT(s.id) as total_sessions,
        COUNT(CASE WHEN s.status = 'COMPLETED' THEN 1 END) as completed_sessions,
        MAX(s.created_at) as last_practice,
        COALESCE(AVG(s.duration_seconds), 0)::int as avg_duration
      FROM users u
      LEFT JOIN ar_practice_sessions s ON s.student_id = u.id
      WHERE u.role = 'STUDENT'
      GROUP BY u.id, u.student_id, u.name
      ORDER BY u.name
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
