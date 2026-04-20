/**
 * 系統統計 API（Dashboard 用）
 * 【PM 決策 #5】先求有再求好：僅提供基礎真實數據
 */
const express = require('express');
const { pool } = require('../db');
const safeError = require('../safeError');
const router = express.Router();

/**
 * GET /api/stats/overview
 * 管理員 / 教師 系統總覽數字
 */
router.get('/overview', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int  FROM courses  WHERE status = 'ACTIVE')                       AS course_count,
        (SELECT COUNT(*)::int  FROM users    WHERE role = 'STUDENT' AND status = 'ACTIVE')  AS student_count,
        (SELECT COALESCE(SUM(question_count), 0)::int FROM daily_usage)                     AS total_ai_requests,
        (SELECT COUNT(*)::int  FROM materials WHERE status = 'READY')                       AS material_count
    `);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    safeError(res, err, 'GET /api/stats/overview');
  }
});

/**
 * GET /api/stats/my-usage
 * 學生個人用量（當月發問次數、今日剩餘）
 */
router.get('/my-usage', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COALESCE(SUM(question_count), 0)                              AS month_total,
        COALESCE(
          (SELECT question_count FROM daily_usage
           WHERE user_id = $1 AND usage_date = CURRENT_DATE), 0)     AS today_used
      FROM daily_usage
      WHERE user_id = $1
        AND usage_date >= date_trunc('month', CURRENT_DATE)
    `, [req.user.id]);

    const todayUsed = parseInt(rows[0].today_used);
    res.json({
      success: true,
      data: {
        month_total: parseInt(rows[0].month_total),
        today_used:  todayUsed,
        today_limit: 30,
        today_remain: Math.max(0, 30 - todayUsed),
      },
    });
  } catch (err) {
    safeError(res, err, 'GET /api/stats/my-usage');
  }
});

module.exports = router;
