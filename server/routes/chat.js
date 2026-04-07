/**
 * 聊天路由 - SSE 串流 + 歷史紀錄
 */
const express = require('express');
const { pool } = require('../db');
const safeError = require('../safeError');
const { chatStream } = require('../services/geminiService');
const { search } = require('../services/vectorSearchService');

const router = express.Router();

const DAILY_QUESTION_LIMIT = 50;

/**
 * POST /api/chat/stream
 * SSE 串流聊天
 * Body: { message, courseId }
 */
router.post('/stream', async (req, res) => {
  const { message, courseId } = req.body;
  if (!message || !courseId) {
    return res.status(400).json({ success: false, error: '請提供 message 和 courseId' });
  }

  try {
    // 1. 檢查每日用量
    const usageResult = await pool.query(
      `INSERT INTO daily_usage (user_id, usage_date, question_count)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (user_id, usage_date)
       DO UPDATE SET question_count = daily_usage.question_count + 1
       RETURNING question_count`,
      [req.user.id]
    );
    const count = usageResult.rows[0].question_count;
    if (count > DAILY_QUESTION_LIMIT) {
      return res.status(429).json({
        success: false,
        error: `今日提問次數已達上限 (${DAILY_QUESTION_LIMIT} 題)`,
        data: { used: count, limit: DAILY_QUESTION_LIMIT },
      });
    }

    // 2. 向量搜尋相關教材
    let sources = [];
    let context = [];
    try {
      sources = await search(message, courseId, 5, 0.3);
      context = sources.map(s => s.content);
    } catch (err) {
      console.warn('向量搜尋失敗，將無教材上下文回答:', err.message);
    }

    // 3. 設定 SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx/Zeabur 禁止緩衝
    res.flushHeaders();

    // 4. 送出來源資訊
    const sourcesData = sources.map(s => ({
      content: s.content.slice(0, 200) + '...',
      metadata: s.metadata,
      similarity: Math.round(s.similarity * 100) / 100,
    }));
    res.write(`data: ${JSON.stringify({ type: 'sources', data: sourcesData })}\n\n`);

    // 5. 串流 Gemini 回覆
    let fullResponse = '';
    const stream = chatStream(message, context);
    for await (const chunk of stream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ type: 'token', text: chunk })}\n\n`);
    }

    // 6. 完成
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

    // 7. 背景存聊天紀錄
    saveMessages(req.user.id, courseId, message, fullResponse, sourcesData)
      .catch(err => console.error('存聊天紀錄失敗:', err.message));

  } catch (err) {
    // SSE 已開始就不能送 JSON error，改用 SSE error event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    } else {
      safeError(res, err, 'POST /api/chat/stream');
    }
  }
});

async function saveMessages(userId, courseId, userMsg, aiMsg, sources) {
  await pool.query(
    `INSERT INTO chat_messages (user_id, course_id, role, content)
     VALUES ($1, $2, 'user', $3)`,
    [userId, courseId, userMsg]
  );
  await pool.query(
    `INSERT INTO chat_messages (user_id, course_id, role, content, sources)
     VALUES ($1, $2, 'model', $3, $4)`,
    [userId, courseId, aiMsg, JSON.stringify(sources)]
  );
}

/**
 * GET /api/chat/history?courseId=xxx&limit=50
 */
router.get('/history', async (req, res) => {
  try {
    const { courseId, limit = 50 } = req.query;
    if (!courseId) return res.status(400).json({ success: false, error: '請指定 courseId' });

    const { rows } = await pool.query(
      `SELECT id, role, content, sources, mode, created_at
       FROM chat_messages
       WHERE user_id = $1 AND course_id = $2
       ORDER BY created_at DESC LIMIT $3`,
      [req.user.id, courseId, parseInt(limit)]
    );

    res.json({ success: true, data: rows.reverse() }); // 時間正序
  } catch (err) {
    safeError(res, err, 'GET /api/chat/history');
  }
});

module.exports = router;
