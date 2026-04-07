/**
 * AI 考題生成服務
 */
const { chatOnce } = require('./geminiService');

const GENERATE_PROMPT = `你是一位專業的教育測驗出題者。請根據以下教材內容，生成考題。

要求：
1. 題目必須基於提供的教材內容
2. 每題必須包含：question_text, question_type, options (選擇題才需要), correct_answer, explanation, difficulty (1-5)
3. 選擇題的 options 格式為 JSON 陣列 ["A. 答案", "B. 答案", "C. 答案", "D. 答案"]
4. correct_answer 格式：選擇題填 "A"/"B"/"C"/"D"，是非題填 "TRUE"/"FALSE"
5. explanation 要簡明解釋為何該答案正確
6. 使用繁體中文

請以嚴格 JSON 陣列格式回覆，不要加任何其他文字：
[
  {
    "question_text": "題目內容",
    "question_type": "MULTIPLE_CHOICE",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct_answer": "B",
    "explanation": "解釋",
    "difficulty": 3
  }
]`;

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

  const response = await chatOnce(prompt, GENERATE_PROMPT);

  // 解析 JSON
  try {
    // 嘗試提取 JSON 陣列
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('未找到 JSON 陣列');

    const questions = JSON.parse(jsonMatch[0]);

    // 驗證每題必要欄位
    return questions
      .filter(q => q.question_text && q.correct_answer && q.question_type)
      .map(q => ({
        question_text: q.question_text,
        question_type: q.question_type || 'MULTIPLE_CHOICE',
        options: q.options || null,
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        difficulty: Math.max(1, Math.min(5, q.difficulty || 3)),
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
