/**
 * AI 考題生成服務
 */
const { chatOnce } = require('./geminiService');

// 【PM 決策 #6】極簡 JSON prompt：壓縮欄位名，減少輸出 Token 消耗
// 最終由 generateQuestions 解析後轉回完整欄位名
const GENERATE_PROMPT = `你是護理考試出題專家。依教材生成考題，以繁體中文出題。

嚴格規則：
- 只輸出純 JSON 陣列，不加任何說明文字或 markdown
- 每題格式（極簡）：{"q":"題目","t":"MULTIPLE_CHOICE","o":["A.選項","B.選項","C.選項","D.選項"],"a":"A","e":"解說(20字內)","d":3}
- t 只能是 MULTIPLE_CHOICE 或 TRUE_FALSE
- TRUE_FALSE 時 o 省略，a 填 TRUE 或 FALSE
- d 為 1-5 的整數

直接輸出 JSON 陣列，範例：
[{"q":"...","t":"MULTIPLE_CHOICE","o":["A....","B....","C....","D...."],"a":"B","e":"...","d":3}]`;

/**
 * 從教材 chunks 生成考題
 */
async function generateQuestions(chunks, { count = 5, types = ['MULTIPLE_CHOICE'], difficulty = 'mixed' } = {}) {
  const materialText = chunks.map((c, i) => `[片段${i + 1}] ${c}`).join('\n---\n');

  const typeStr = types.join('、');
  const diffStr = difficulty === 'mixed' ? '混合難度 (1-5)' : `難度 ${difficulty}`;

  const prompt = `${GENERATE_PROMPT}

教材內容：
${materialText}

請生成 ${count} 題，題型：${typeStr}，${diffStr}。`;

  // 【PM 決策 #6】出題需要更多 token 空間（5 題 JSON ≈ 600-700 tokens）
  // 設為 800 作為安全上限，避免 JSON 被截斷導致解析失敗
  const response = await chatOnce(prompt, GENERATE_PROMPT, 800);

  // 解析極簡 JSON 並轉回完整欄位名
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('未找到 JSON 陣列');

    const raw = JSON.parse(jsonMatch[0]);

    return raw
      .filter(q => q.q && q.a && q.t) // 驗證極簡欄位
      .map(q => ({
        question_text:  q.q,
        question_type:  q.t || 'MULTIPLE_CHOICE',
        options:        q.o || null,
        correct_answer: q.a,
        explanation:    q.e || '',
        difficulty:     Math.max(1, Math.min(5, q.d || 3)),
      }));
  } catch (err) {
    console.error('AI 出題 JSON 解析失敗:', err.message);
    console.error('原始回覆:', response.slice(0, 500));
    throw new Error('AI 出題格式錯誤，請重試');
  }
}

/**
 * AI 批改問答題
 */
async function gradeShortAnswer(questionText, correctAnswer, studentAnswer) {
  const prompt = `你是一位教師，正在批改學生的問答題。

題目：${questionText}
參考答案：${correctAnswer}
學生答案：${studentAnswer}

請判斷學生答案是否正確或部分正確，並給出簡短回饋。
以 JSON 格式回覆：
{
  "isCorrect": true/false,
  "score": 0-100,
  "feedback": "回饋內容"
}`;

  const response = await chatOnce(prompt);
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { isCorrect: false, score: 0, feedback: '批改失敗，請老師手動評分' };
  }
}

module.exports = { generateQuestions, gradeShortAnswer };
