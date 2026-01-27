
import { GoogleGenAI } from "@google/genai";

export interface SearchResult {
  content: string;
  metadata: any;
  similarity: number;
  debugInfo?: string;
}

interface MockChunk {
  content: string;
  metadata: {
    title: string;
    path: string; // 例如: RAG 課程 > 核心架構
    page: number;
    section: string;
  };
}

class VectorService {
  private ai: GoogleGenAI;
  
  private partitions: Record<string, MockChunk[]> = {
    "t1_c1": [
      {
        content: "【教材路徑：RAG 技術導論 > 核心環節】\nRAG (Retrieval-Augmented Generation) 的核心環節包括：1. 索引 (Indexing) 2. 檢索 (Retrieval) 3. 增強 (Augmentation) 4. 生成 (Generation)。這四個環節缺一不可。",
        metadata: { title: "RAG 介紹", path: "RAG 技術導論 > 核心環節", page: 1, section: "核心定義" }
      },
      {
        content: "【教材路徑：RAG 技術導論 > 資料處理 > 什麼是 Chunk】\nChunk 是指將大型文檔切割成較小的片段（例如 500 tokens）的過程，以便於向量化存儲與檢索。",
        metadata: { title: "資料處理講義", path: "RAG 技術導論 > 資料處理", page: 2, section: "Chunk 定義" }
      },
      {
        content: "【教材路徑：RAG 技術導論 > 資料處理 > 為什麼需要 Chunk】\n之所以需要進行 Chunking，主要有三個原因：第一，LLM 的上下文窗口 (Context Window) 有限；第二，過長的內容會稀釋檢索的精準度；第三，將解釋與定義保持在小範圍內能提高 AI 的回答質量。",
        metadata: { title: "資料處理講義", path: "RAG 技術導論 > 資料處理", page: 2, section: "Chunk 的必要性" }
      }
    ]
  };

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async similaritySearch(query: string, tenantId: string, courseId: string): Promise<SearchResult[]> {
    const key = `${tenantId}_${courseId}`;
    const partition = this.partitions[key] || [];

    // 模擬解釋型問題的檢索：
    // 對於 "為什麼" 類型的問題，除了關鍵字匹配，我們還會加權 "原因"、"之所以" 等邏輯詞
    const results = partition
      .map(chunk => {
        const lowerContent = chunk.content.toLowerCase();
        const lowerQuery = query.toLowerCase();
        
        let score = 0;
        // 1. 基礎關鍵字權重
        lowerQuery.split(' ').forEach(word => {
          if (lowerContent.includes(word)) score += 0.2;
        });

        // 2. 解釋型權重：若問題含 "為什麼" 且內容含 "原因/因為"
        if (lowerQuery.includes("為什麼") && (lowerContent.includes("原因") || lowerContent.includes("因為") || lowerContent.includes("之所以"))) {
          score += 0.5;
        }

        // 3. 標題路徑匹配 (非常重要)
        if (lowerContent.includes(lowerQuery.replace("為什麼", ""))) {
          score += 0.3;
        }

        return {
          content: chunk.content,
          metadata: chunk.metadata,
          similarity: Math.min(score, 0.98)
        };
      })
      .filter(res => res.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // 回傳 Top 5

    return results;
  }

  async runIndexingJob(materialId: string, title: string, tenantId: string, courseId: string) {
    const key = `${tenantId}_${courseId}`;
    
    // 模擬「標題階層感知」的索引過程
    const structuredChunks = [
      {
        content: `【教材路徑：${title} > 概覽】\n這份文件討論了 ${title} 的核心概念與重要性。`,
        metadata: { title, path: `${title} > 概覽`, page: 1, section: "導論" }
      },
      {
        content: `【教材路徑：${title} > 實務應用 > 為什麼需要採用此方案】\n採用此方案的原因在於它能有效隔離多租戶環境下的資料，並提升 ${title} 的整體效能。`,
        metadata: { title, path: `${title} > 實務應用`, page: 2, section: "原因分析" }
      }
    ];

    if (!this.partitions[key]) this.partitions[key] = [];
    this.partitions[key].push(...structuredChunks);
    
    await new Promise(r => setTimeout(r, 1000));
    return true;
  }
}

export const vectorService = new VectorService();
