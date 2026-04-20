/**
 * 用戶管理路由
 */
const express = require('express');
const { pool } = require('../db');
const { requireRole } = require('../middleware/authMiddleware');
const safeError = require('../safeError');

const router = express.Router();

/**
 * GET /api/users
 * 列出所有用戶（Admin/Teacher）
 */
router.get('/', requireRole('ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, student_id, name, role, status, created_at FROM users';
    const params = [];

    if (role) {
      query += ' WHERE role = $1';
      params.push(role);
    }
    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    safeError(res, err, 'GET /api/users');
  }
});

/**
 * GET /api/users/usage
 * 取得當前用戶今日用量
 */
router.get('/usage', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT question_count, exam_count FROM daily_usage
       WHERE user_id = $1 AND usage_date = CURRENT_DATE`,
      [req.user.id]
    );
    const usage = rows[0] || { question_count: 0, exam_count: 0 };
    res.json({
      success: true,
      data: {
        questionCount: usage.question_count,
        examCount: usage.exam_count,
        questionLimit: 30,
        examLimit: 100,
      },
    });
  } catch (err) {
    safeError(res, err, 'GET /api/users/usage');
  }
});

module.exports = router;
