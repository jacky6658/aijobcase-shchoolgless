
import type { NextApiRequest, NextApiResponse } from 'next';
import { vectorService } from '../../services/vectorService';
import { geminiService } from '../../services/geminiService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { prompt, tenantId, courseId, history = [] } = req.body;

  try {
    // 1. RAG: 相似度檢索
    const contextResults = await vectorService.similaritySearch(prompt, tenantId, courseId);
    
    // 2. 構建上下文文字
    const contextText = contextResults
      .map(r => `[來源: ${r.metadata.section}, 頁碼: ${r.metadata.page}]: ${r.content}`)
      .join('\n\n');

    // 3. 呼叫 Gemini
    const aiResponse = await geminiService.chatWithContext(prompt, contextText, history);

    res.status(200).json({
      answer: aiResponse,
      sources: contextResults.map(r => r.metadata)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'AI 服務暫時無法使用' });
  }
}
