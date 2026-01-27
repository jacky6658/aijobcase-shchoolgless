
# EduMind AI - RAG Backend Scaffold

本專案展示了多租戶架構下的教材問答 RAG 流程。

## 快速啟動

1. **環境設定**
   建立 `.env` 檔案並填入 API Key：
   ```env
   API_KEY=你的_GEMINI_API_KEY
   POSTGRES_URL=你的_POSTGRES_連線字串 (含 pgvector)
   ```

2. **資料庫遷移**
   執行 `schema.sql` 中的 DDL 來初始化資料表與向量索引。

3. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

## API 測試流程

1. **上傳教材**
   `POST /api/materials/upload`
   Payload: `{ "title": "Python 101", "courseId": "c1", "tenantId": "t1", "fileUrl": "..." }`

2. **AI 問答 (RAG)**
   `POST /api/chat`
   Payload: `{ "prompt": "期中考是什麼時候？", "courseId": "c1", "tenantId": "t1" }`
   *系統會自動檢索 t1 租戶下 c1 課程的教材內容並回答。*

## 部署至 Zeabur

1. 在 Zeabur 建立新的 Service。
2. 連結你的 GitHub 儲存庫。
3. 設定環境變數 `API_KEY`。
4. Zeabur 會自動辨識 Next.js 並完成部署。
