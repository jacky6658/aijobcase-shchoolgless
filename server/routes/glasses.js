/**
 * 眼鏡目錄路由 — 後台匯入 + 臉型推薦
 * POST   /api/glasses/upload          上傳圖片 + 建立記錄（Admin/Teacher）
 * GET    /api/glasses                 取得列表（所有人）
 * GET    /api/glasses/recommend       依臉型推薦
 * PATCH  /api/glasses/:id             更新 metadata（Admin/Teacher）
 * DELETE /api/glasses/:id             刪除（Admin/Teacher）
 * POST   /api/glasses/log             記錄學生推薦事件
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { randomUUID: uuidv4 } = require('crypto');
const multer = require('multer');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const safeError = require('../safeError');

const router = express.Router();

// 圖片存在磁碟（不走 memoryStorage）
const UPLOAD_DIR = path.join(__dirname, '../uploads/glasses');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (/image\/(png|jpeg|webp|gif)/.test(file.mimetype)) return cb(null, true);
    cb(new Error('只接受 PNG / JPG / WebP 圖片'));
  },
});

// ── 上傳圖片 + 建立記錄 ────────────────────────────

router.post('/upload', requireRole('ADMIN', 'TEACHER'), (req, res) => {
  imageUpload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: '請上傳圖片' });

    try {
      const {
        name, item_type = 'glasses',
        frame_shape, thickness, material, style,
        suitable_face_types, lens_color, description,
      } = req.body;

      if (!name) return res.status(400).json({ success: false, error: '請填入名稱' });
      if (!['glasses', 'lens'].includes(item_type)) {
        return res.status(400).json({ success: false, error: 'item_type 需為 glasses 或 lens' });
      }

      const imageUrl = `/uploads/glasses/${req.file.filename}`;

      // suitable_face_types 可能是 JSON 字串陣列 或 逗號分隔字串
      let faceTypes = [];
      if (suitable_face_types) {
        try { faceTypes = JSON.parse(suitable_face_types); }
        catch { faceTypes = suitable_face_types.split(',').map(s => s.trim()).filter(Boolean); }
      }

      const { rows } = await pool.query(
        `INSERT INTO glasses_catalog
           (name, item_type, image_url, frame_shape, thickness, material, style,
            suitable_face_types, lens_color, description, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [name, item_type, imageUrl, frame_shape || null, thickness || null,
         material || null, style || null, faceTypes, lens_color || null,
         description || null, req.user.id]
      );

      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
      safeError(res, err, 'POST /api/glasses/upload');
    }
  });
});

// ── 取得列表 ───────────────────────────────────────

router.get('/', requireAuth, async (req, res) => {
  try {
    const { item_type, is_active = 'true' } = req.query;
    const params = [];
    const conditions = [];

    if (item_type) { params.push(item_type); conditions.push(`item_type = $${params.length}`); }
    if (is_active !== 'all') { params.push(is_active === 'true'); conditions.push(`is_active = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT * FROM glasses_catalog ${where} ORDER BY created_at DESC`, params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    safeError(res, err, 'GET /api/glasses');
  }
});

// ── 依臉型推薦 ─────────────────────────────────────

router.get('/recommend', requireAuth, async (req, res) => {
  try {
    const { face_shape, item_type, limit = 6 } = req.query;
    if (!face_shape) return res.status(400).json({ success: false, error: '請提供 face_shape' });

    const params = [face_shape, parseInt(limit)];
    let typeFilter = '';
    if (item_type) { params.push(item_type); typeFilter = `AND item_type = $${params.length}`; }

    // 優先推薦 suitable_face_types 包含該臉型，再補其他
    const { rows } = await pool.query(
      `SELECT *,
         CASE WHEN $1 = ANY(suitable_face_types) THEN 1 ELSE 0 END AS match_score
       FROM glasses_catalog
       WHERE is_active = TRUE ${typeFilter}
       ORDER BY match_score DESC, created_at DESC
       LIMIT $2`,
      params
    );
    res.json({ success: true, data: rows, face_shape });
  } catch (err) {
    safeError(res, err, 'GET /api/glasses/recommend');
  }
});

// ── 更新 metadata ──────────────────────────────────

router.patch('/:id', requireRole('ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, frame_shape, thickness, material, style,
      suitable_face_types, lens_color, description, is_active,
    } = req.body;

    let faceTypes;
    if (suitable_face_types !== undefined) {
      try { faceTypes = JSON.parse(suitable_face_types); }
      catch { faceTypes = suitable_face_types; }
    }

    const { rows } = await pool.query(
      `UPDATE glasses_catalog SET
         name = COALESCE($1, name),
         frame_shape = COALESCE($2, frame_shape),
         thickness = COALESCE($3, thickness),
         material = COALESCE($4, material),
         style = COALESCE($5, style),
         suitable_face_types = COALESCE($6, suitable_face_types),
         lens_color = COALESCE($7, lens_color),
         description = COALESCE($8, description),
         is_active = COALESCE($9, is_active),
         updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [name, frame_shape, thickness, material, style,
       faceTypes, lens_color, description, is_active, id]
    );

    if (!rows.length) return res.status(404).json({ success: false, error: '找不到此項目' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    safeError(res, err, 'PATCH /api/glasses/:id');
  }
});

// ── 刪除 ────────────────────────────────────────────

router.delete('/:id', requireRole('ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM glasses_catalog WHERE id = $1 RETURNING image_url', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: '找不到此項目' });

    // 刪除實體圖片
    const filePath = path.join(__dirname, '..', rows[0].image_url);
    fs.unlink(filePath, () => {});

    res.json({ success: true });
  } catch (err) {
    safeError(res, err, 'DELETE /api/glasses/:id');
  }
});

// ── 記錄推薦事件（教育追蹤）────────────────────────

router.post('/log', requireAuth, async (req, res) => {
  try {
    const { face_shape, recommended_ids, selected_id, detection_method = 'manual' } = req.body;
    await pool.query(
      `INSERT INTO recommendation_logs
         (student_id, face_shape, recommended_ids, selected_id, detection_method)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.user.id, face_shape, recommended_ids, selected_id || null, detection_method]
    );
    res.json({ success: true });
  } catch (err) {
    safeError(res, err, 'POST /api/glasses/log');
  }
});

module.exports = router;
