
import type { NextApiRequest, NextApiResponse } from 'next';
import { vectorService } from '../../../services/vectorService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { title, courseId, tenantId, fileUrl } = req.body;

    // 1. 建立 Material 記錄 (模擬)
    const materialId = `mat_${Date.now()}`;
    
    // 2. 異步啟動索引 (在生產環境應送入 Queue)
    // 我們不 await 它，讓 API 快速回傳
    // Fix: Added missing arguments 'title', 'tenantId', and 'courseId' to runIndexingJob call to satisfy signature requirements
    vectorService.runIndexingJob(materialId, title, tenantId, courseId);

    res.status(202).json({
      message: '上傳成功，後端正在建立 AI 索引',
      materialId,
      status: 'PROCESSING'
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
