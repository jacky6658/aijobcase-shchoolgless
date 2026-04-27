/**
 * Gemini AI 服務 - 聊天串流 + 出題 + 批改
 */
const { GoogleGenAI } = require('@google/genai');
const { geminiLimit } = require('./geminiLimiter');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const CHAT_MODEL = 'gemini-2.5-flash-lite'; // 最便宜穩定版，適合高併發

// ══════════════════════════════════════════
// 【成本控管 #3】輸出熔斷：System Instruction 明確要求回覆精簡
// 搭配下方 maxOutputTokens: 300 雙重限制輸出長度
// ══════════════════════════════════════════
const SYSTEM_INSTRUCTION = `你是一位專業的護理教學 AI 課程助教。你的任務是根據教師提供的教材內容，以醫護溝通風格幫助護理學生理解與複習課程知識。

【回覆規範—請嚴格遵守】
- 回覆必須在 200 字以內，超出請自行摘要精簡。
- 使用條列式或步驟式，方便記憶與臨床操作對照。
- 使用繁體中文回答，語氣專業、簡潔。

【內容規則】
1. 僅根據提供的教材片段回答問題。若問題超出教材範圍，請直接說明「教材未涵蓋此內容」。
2. 適當引用教材內容佐證你的回答。
3. 當學生問「為什麼」時，嘗試從教材中找出因果關係（如生理機轉、護理依據）來解釋。
4. 若教材中有相關但不完全匹配的內容，可以做合理推論，但需標明「推論」。`;

/**
 * 串流聊天（async generator）
 */
async function* chatStream(prompt, context, history = []) {
  if (!genAI) throw new Error('Gemini API 未設定');

  const contextText = context.length > 0
    ? `\n\n以下是相關教材片段：\n${context.map((c, i) => `[片段${i + 1}] ${c}`).join('\n---\n')}`
    : '\n\n（目前沒有找到相關教材片段）';

  const fullInstruction = SYSTEM_INSTRUCTION + contextText;

  const result = await geminiLimit(async () => {
    return genAI.models.generateContentStream({
      model: CHAT_MODEL,
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: prompt }] },
      ],
      config: {
        systemInstruction: fullInstruction,
        temperature: 0.3,
        // ══════════════════════════════════════════
        // 【成本控管 #3】輸出熔斷：硬性截斷 Token 上限
        // 300 tokens ≈ 200 中文字，符合醫護溝通精簡要求
        // ══════════════════════════════════════════
        maxOutputTokens: 300,
      },
    });
  });

  for await (const chunk of result) {
    const text = chunk.text;
    if (text) yield text;
  }
}

/**
 * 非串流聊天（用於出題、批改等）
 * @param {string} prompt
 * @param {string} [systemPrompt]
 * @param {number} [maxTokens=300] - 出題場景可傳入較高值（如 800）
 */
async function chatOnce(prompt, systemPrompt, maxTokens = 300) {
  if (!genAI) throw new Error('Gemini API 未設定');

  return geminiLimit(async () => {
    const result = await genAI.models.generateContent({
      model: CHAT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt || SYSTEM_INSTRUCTION,
        temperature: 0.4,
        // 【成本控管 #3】預設 300，出題場景由呼叫端傳入更高值
        maxOutputTokens: maxTokens,
      },
    });
    return result.text;
  });
}

module.exports = { chatStream, chatOnce, SYSTEM_INSTRUCTION };
