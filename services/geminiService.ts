
import { GoogleGenAI } from "@google/genai";
import { quotaService } from "./quotaService";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async *chatStream(prompt: string, context: string, tenantId: string) {
    const { allowed } = await quotaService.checkQuota(tenantId);
    if (!allowed) {
      yield "⚠️ 您的帳號 AI 額度已用盡，請升級方案。";
      return;
    }

    try {
      const model = 'gemini-3-flash-preview';
      
      // 優化後的 Prompt 策略
      const systemInstruction = `
        你是一位專業的教育助理，正在為學生解答教材問題。
        
        【操作守則】
        1. 優先使用提供的「教材片段」回答。
        2. 若片段中包含直接定義，請明確指出。
        3. 若問題是「為什麼」或「如何」，請結合片段中的邏輯進行總結與推理。
        4. 即使片段中沒有 100% 相同的語句，只要語意相關，請嘗試為學生整理答案。
        5. 只有在檢索到的教材完全與問題無關（例如問運動但教材是數學）時，才回答「目前的教材中尚未涵蓋此部分內容」。
        
        【當前教材檢索片段】
        ${context}
      `;

      const responseStream = await this.ai.models.generateContentStream({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.4, // 降低隨機性，提高解釋的準確度
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) yield chunk.text;
      }

      await quotaService.consumeQuota(tenantId, 1);
    } catch (error) {
      console.error(error);
      yield "❌ AI 服務繁忙，請稍後。";
    }
  }

  async chatWithContext(prompt: string, context: string, history: any[] = []) {
    const model = 'gemini-3-flash-preview';
    const contents = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await this.ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: `基於以下教材回答問題。若教材有提及但非直接答案，請進行整理。內容：\n${context}`,
        temperature: 0.3,
      },
    });

    return response.text;
  }
}

export const geminiService = new GeminiService();
