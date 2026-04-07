/**
 * 認證路由 - 學號 + 密碼登入
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool, withClient } = require('../db');
const { generateToken, requireAuth, requireRole } = require('../middleware/authMiddleware');
const safeError = require('../safeError');

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { studentId, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    if (!studentId || !password) {
      return res.status(400).json({ success: false, error: '請輸入學號和密碼' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM users WHERE student_id = $1 AND status = $2',
      [studentId, 'ACTIVE']
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: '學號或密碼錯誤' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: '學號或密碼錯誤' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          studentId: user.student_id,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (err) {
    safeError(res, err, 'POST /api/auth/login');
  }
});

/**
 * GET /api/auth/me
 * 取得當前用戶資料
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, student_id, name, role, status, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: '用戶不存在' });
    }
    const u = rows[0];
    res.json({
      success: true,
      data: { id: u.id, studentId: u.student_id, name: u.name, role: u.role },
    });
  } catch (err) {
    safeError(res, err, 'GET /api/auth/me');
  }
});

/**
 * POST /api/auth/change-password
 * Body: { oldPassword, newPassword }
 */
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: '新密碼至少 6 個字元' });
    }

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: '用戶不存在' });

    const valid = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!valid) return res.status(401).json({ success: false, error: '舊密碼錯誤' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);

    res.json({ success: true, data: { message: '密碼已更新' } });
  } catch (err) {
    safeError(res, err, 'POST /api/auth/change-password');
  }
});

/**
 * POST /api/auth/batch-create
 * Body: { users: [{ studentId, name, password, role? }] }
 * 老師/Admin 批次建立帳號
 */
router.post('/batch-create', requireAuth, requireRole('ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { users: newUsers } = req.body;
    if (!Array.isArray(newUsers) || newUsers.length === 0) {
      return res.status(400).json({ success: false, error: '請提供用戶列表' });
    }

    if (newUsers.length > 200) {
      return res.status(400).json({ success: false, error: '單次最多建立 200 個帳號' });
    }

    const results = await withClient(async (client) => {
      await client.query('BEGIN');
      const created = [];
      const errors = [];

      for (const u of newUsers) {
        if (!u.studentId || !u.name || !u.password) {
          errors.push({ studentId: u.studentId, error: '缺少必要欄位' });
          continue;
        }
        try {
          const hash = await bcrypt.hash(u.password, 10);
          const role = u.role === 'TEACHER' && req.user.role === 'ADMIN' ? 'TEACHER' : 'STUDENT';
          const { rows } = await client.query(
            `INSERT INTO users (student_id, name, role, password_hash)
             VALUES ($1, $2, $3, $4)
             RETURNING id, student_id, name, role`,
            [u.studentId, u.name, role, hash]
          );
          created.push(rows[0]);
        } catch (err) {
          if (err.code === '23505') {
            errors.push({ studentId: u.studentId, error: '學號已存在' });
          } else {
            errors.push({ studentId: u.studentId, error: err.message });
          }
        }
      }

      await client.query('COMMIT');
      return { created, errors };
    });

    res.json({
      success: true,
      data: {
        createdCount: results.created.length,
        errorCount: results.errors.length,
        created: results.created,
        errors: results.errors,
      },
    });
  } catch (err) {
    safeError(res, err, 'POST /api/auth/batch-create');
  }
});

module.exports = router;
