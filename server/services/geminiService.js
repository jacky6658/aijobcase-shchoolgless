/**
 * Gemini AI 服務 - 聊天串流 + 出題 + 批改
 */
const { GoogleGenAI } = require('@google/genai');
const { geminiLimit } = require('./geminiLimiter');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const CHAT_MODEL = 'gemini-2.0-flash';

const SYSTEM_INSTRUCTION = `你是一位專業的 AI 課程複習助教。你的任務是根據教師提供的教材內容，幫助學生理解與複習課程知識。

規則：
1. 僅根據提供的教材片段回答問題。若問題超出教材範圍，請誠實說明。
2. 回答要精簡、準確、有條理。
3. 使用繁體中文回答。
4. 適當引用教材內容佐證你的回答。
5. 當學生問「為什麼」時，嘗試從教材中找出因果關係來解釋。
6. 若教材中有相關但不完全匹配的內容，可以做合理推論，但要標明。`;

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
 */
async function chatOnce(prompt, systemPrompt) {
  if (!genAI) throw new Error('Gemini API 未設定');

  return geminiLimit(async () => {
    const result = await genAI.models.generateContent({
      model: CHAT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt || SYSTEM_INSTRUCTION,
        temperature: 0.4,
      },
    });
    return result.text;
  });
}

module.exports = { chatStream, chatOnce, SYSTEM_INSTRUCTION };
