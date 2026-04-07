/**
 * 文字切片服務
 * 將長文字分割為適合 embedding 的 chunks
 */

const CHUNK_SIZE = 800;    // 字元（約 400-500 tokens 中文）
const CHUNK_OVERLAP = 200; // 重疊字元

/**
 * 將文字切片
 * @param {string} text - 原始文字
 * @param {object} baseMeta - 基礎 metadata（materialId, title 等）
 * @returns {Array<{content: string, metadata: object}>}
 */
function chunkText(text, baseMeta = {}) {
  if (!text || text.trim().length === 0) return [];

  // 先按段落分割
  const paragraphs = text.split(/\n{2,}/);
  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;
  let currentSection = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // 偵測章節標題
    if (isHeading(trimmed)) {
      currentSection = trimmed.slice(0, 100);
    }

    // 如果加入這段後超過 CHUNK_SIZE，先保存當前 chunk
    if (currentChunk.length + trimmed.length > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          ...baseMeta,
          chunkIndex,
          section: currentSection,
        },
      });
      chunkIndex++;

      // 保留 overlap（取最後 CHUNK_OVERLAP 字元）
      if (currentChunk.length > CHUNK_OVERLAP) {
        currentChunk = currentChunk.slice(-CHUNK_OVERLAP) + '\n\n' + trimmed;
      } else {
        currentChunk = trimmed;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
    }
  }

  // 最後一個 chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        ...baseMeta,
        chunkIndex,
        section: currentSection,
      },
    });
  }

  return chunks;
}

/**
 * 判斷是否為標題行
 */
function isHeading(text) {
  if (text.length > 100) return false;
  // 數字編號開頭 (1. / 1.1 / 第一章 / Chapter)
  if (/^(\d+[\.\)、]|第[一二三四五六七八九十百]+[章節]|Chapter|Section)/i.test(text)) return true;
  // Markdown 標題
  if (/^#{1,3}\s/.test(text)) return true;
  // 全大寫或粗體標記
  if (text === text.toUpperCase() && text.length < 50) return true;
  // [Slide N] 標記
  if (/^\[Slide \d+\]/.test(text)) return true;
  return false;
}

module.exports = { chunkText, CHUNK_SIZE, CHUNK_OVERLAP };
