/**
 * 向量搜尋服務 - pgvector cosine similarity
 */
const { pool } = require('../db');
const { embedSingle } = require('./embeddingService');

/**
 * 語意搜尋相關教材片段
 * @param {string} query - 用戶問題
 * @param {string} courseId - 課程 ID
 * @param {number} topK - 回傳數量
 * @param {number} threshold - 最低相似度
 */
async function search(query, courseId, topK = 5, threshold = 0.3) {
  // 1. 將問題向量化
  const queryEmbedding = await embedSingle(query);
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // 2. pgvector cosine similarity 搜尋
  const { rows } = await pool.query(
    `SELECT dc.id, dc.content, dc.metadata,
            1 - (dc.embedding <=> $1::vector) AS similarity
     FROM document_chunks dc
     JOIN materials m ON dc.material_id = m.id
     WHERE m.course_id = $2 AND m.status = 'READY'
     ORDER BY dc.embedding <=> $1::vector
     LIMIT $3`,
    [embeddingStr, courseId, topK]
  );

  // 3. 過濾低相似度結果
  return rows.filter(r => r.similarity >= threshold);
}

module.exports = { search };
