/**
 * Gemini API 併發控制
 * 所有 Gemini 呼叫（聊天/embedding/出題/批改）統一通過此限制器
 */

let pLimitFn;

// p-limit v6 is ESM-only, use dynamic import
async function getPLimit() {
  if (!pLimitFn) {
    const mod = await import('p-limit');
    pLimitFn = mod.default(20); // 最多 20 個同時呼叫
  }
  return pLimitFn;
}

/**
 * 用 p-limit 包裝 async function
 */
async function geminiLimit(fn) {
  const limit = await getPLimit();
  return limit(fn);
}

module.exports = { geminiLimit };
