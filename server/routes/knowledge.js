/**
 * Knowledge Q&A API
 * GET    /api/knowledge?course_id=xxx          - list (teacher/admin)
 * POST   /api/knowledge                        - create + embed (teacher/admin)
 * PUT    /api/knowledge/:id                    - update + re-embed (teacher/admin)
 * DELETE /api/knowledge/:id                    - delete (teacher/admin)
 * POST   /api/knowledge/search                 - search by query (all roles)
 */
const express = require('express');
const { pool } = require('../db');
const safeError = require('../safeError');
const { embedSingle } = require('../services/embeddingService');

const router = express.Router();

// ── List ────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { course_id, category } = req.query;
    const conditions = ['is_active = TRUE'];
    const params = [];

    if (course_id) { params.push(course_id); conditions.push(`course_id = $${params.length}`); }
    if (category)  { params.push(category);  conditions.push(`category  = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT id, course_id, category, question, answer, created_at, updated_at
       FROM knowledge_qa ${where}
       ORDER BY category, created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    safeError(res, err, 'GET /api/knowledge');
  }
});

// ── Create ──────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { role } = req.user;
  if (!['teacher', 'admin'].includes(role)) {
    return res.status(403).json({ success: false, error: '權限不足' });
  }
  try {
    const { course_id, category = '一般', question, answer } = req.body;
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ success: false, error: '問題與答案不能為空' });
    }

    // Generate embedding for the question text
    const embedding = await embedSingle(question);
    const embStr = `[${embedding.join(',')}]`;

    const { rows } = await pool.query(
      `INSERT INTO knowledge_qa (course_id, category, question, answer, embedding, created_by)
       VALUES ($1, $2, $3, $4, $5::vector, $6)
       RETURNING id, course_id, category, question, answer, created_at`,
      [course_id || null, category, question.trim(), answer.trim(), embStr, req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    safeError(res, err, 'POST /api/knowledge');
  }
});

// ── Search ──────────────────────────────────────────────────────────────────
router.post('/search', async (req, res) => {
  try {
    const { query, course_id, top_k = 3, threshold = 0.55 } = req.body;
    if (!query?.trim()) {
      return res.status(400).json({ success: false, error: '請提供查詢內容' });
    }

    const embedding = await embedSingle(query);
    const embStr = `[${embedding.join(',')}]`;

    const conditions = ['is_active = TRUE', 'embedding IS NOT NULL'];
    const params = [embStr];
    if (course_id) { params.push(course_id); conditions.push(`course_id = $${params.length}`); }
    params.push(top_k);

    const { rows } = await pool.query(
      `SELECT id, category, question, answer,
              1 - (embedding <=> $1::vector) AS similarity
       FROM knowledge_qa
       WHERE ${conditions.join(' AND ')}
       ORDER BY embedding <=> $1::vector
       LIMIT $${params.length}`,
      params
    );

    const results = rows.filter(r => r.similarity >= threshold);
    res.json({ success: true, data: results });
  } catch (err) {
    safeError(res, err, 'POST /api/knowledge/search');
  }
});

// ── Update ──────────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { role } = req.user;
  if (!['teacher', 'admin'].includes(role)) {
    return res.status(403).json({ success: false, error: '權限不足' });
  }
  try {
    const { category, question, answer } = req.body;
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ success: false, error: '問題與答案不能為空' });
    }

    const embedding = await embedSingle(question);
    const embStr = `[${embedding.join(',')}]`;

    const { rows } = await pool.query(
      `UPDATE knowledge_qa
       SET category = $1, question = $2, answer = $3, embedding = $4::vector, updated_at = NOW()
       WHERE id = $5 AND is_active = TRUE
       RETURNING id, category, question, answer, updated_at`,
      [category || '一般', question.trim(), answer.trim(), embStr, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: '找不到該筆資料' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    safeError(res, err, 'PUT /api/knowledge/:id');
  }
});

// ── Delete (soft) ────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { role } = req.user;
  if (!['teacher', 'admin'].includes(role)) {
    return res.status(403).json({ success: false, error: '權限不足' });
  }
  try {
    await pool.query(
      `UPDATE knowledge_qa SET is_active = FALSE WHERE id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    safeError(res, err, 'DELETE /api/knowledge/:id');
  }
});

module.exports = router;
