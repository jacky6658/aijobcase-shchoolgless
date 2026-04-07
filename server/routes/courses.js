/**
 * 課程管理路由
 */
const express = require('express');
const { pool, withClient } = require('../db');
const { requireRole } = require('../middleware/authMiddleware');
const safeError = require('../safeError');

const router = express.Router();

/**
 * GET /api/courses
 * 列出課程（依角色過濾）
 */
router.get('/', async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let rows;

    if (role === 'ADMIN') {
      ({ rows } = await pool.query(
        `SELECT c.*, u.name as teacher_name,
                (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count
         FROM courses c LEFT JOIN users u ON c.teacher_id = u.id
         ORDER BY c.created_at DESC`
      ));
    } else if (role === 'TEACHER') {
      ({ rows } = await pool.query(
        `SELECT c.*,
                (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count
         FROM courses c WHERE c.teacher_id = $1
         ORDER BY c.created_at DESC`,
        [userId]
      ));
    } else {
      // STUDENT - 只看已加入的課程
      ({ rows } = await pool.query(
        `SELECT c.*, u.name as teacher_name
         FROM courses c
         JOIN course_enrollments ce ON ce.course_id = c.id
         LEFT JOIN users u ON c.teacher_id = u.id
         WHERE ce.user_id = $1 AND c.status = 'ACTIVE'
         ORDER BY c.created_at DESC`,
        [userId]
      ));
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    safeError(res, err, 'GET /api/courses');
  }
});

/**
 * POST /api/courses
 * 建立課程（老師/Admin）
 */
router.post('/', requireRole('ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: '課程名稱必填' });

    const { rows } = await pool.query(
      `INSERT INTO courses (name, description, teacher_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description || '', req.user.id]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    safeError(res, err, 'POST /api/courses');
  }
});

/**
 * PUT /api/courses/:id
 * 更新課程
 */
router.put('/:id', requireRole('ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE courses SET name = COALESCE($1, name), description = COALESCE($2, description),
       status = COALESCE($3, status) WHERE id = $4 RETURNING *`,
      [name, description, status, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: '課程不存在' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    safeError(res, err, 'PUT /api/courses/:id');
  }
});

/**
 * POST /api/courses/:id/enroll
 * 批次加入學生 Body: { studentIds: ["B001", "B002"] }
 */
router.post('/:id/enroll', requireRole('ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, error: '請提供學號列表' });
    }

    const results = await withClient(async (client) => {
      const enrolled = [];
      const errors = [];

      for (const sid of studentIds) {
        try {
          const userResult = await client.query(
            'SELECT id FROM users WHERE student_id = $1', [sid]
          );
          if (userResult.rows.length === 0) {
            errors.push({ studentId: sid, error: '學號不存在' });
            continue;
          }
          await client.query(
            `INSERT INTO course_enrollments (user_id, course_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userResult.rows[0].id, req.params.id]
          );
          enrolled.push(sid);
        } catch (err) {
          errors.push({ studentId: sid, error: err.message });
        }
      }

      return { enrolled, errors };
    });

    res.json({ success: true, data: results });
  } catch (err) {
    safeError(res, err, 'POST /api/courses/:id/enroll');
  }
});

/**
 * GET /api/courses/:id/students
 * 列出課程學生
 */
router.get('/:id/students', requireRole('ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.student_id, u.name, u.role, ce.enrolled_at
       FROM users u JOIN course_enrollments ce ON u.id = ce.user_id
       WHERE ce.course_id = $1 ORDER BY u.student_id`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    safeError(res, err, 'GET /api/courses/:id/students');
  }
});

/**
 * DELETE /api/courses/:id
 */
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ success: false, error: '課程不存在' });
    res.json({ success: true, data: { message: '課程已刪除' } });
  } catch (err) {
    safeError(res, err, 'DELETE /api/courses/:id');
  }
});

module.exports = router;
