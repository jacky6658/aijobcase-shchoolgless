# EduMind AI — 擬真隱形眼鏡/眼鏡 AR 教學平台 + AI 智能語音助理

結合 **AR 擴增實境** 與 **AI 語音互動** 的教學平台，提供擬真隱形眼鏡/眼鏡配戴模擬、課程教材管理、AI 問答與考題系統。

## 開發進度

### 已完成功能

#### 學生端
- [x] AR 配戴模擬（臉部偵測 + 隱眼/眼鏡即時疊加）
- [x] 隱形眼鏡 5 色選擇（透明/藍/綠/棕/灰）
- [x] 眼鏡 5 款選擇（黑框/玳瑁/金屬/紅框/墨鏡）
- [x] 鏡片/眼鏡大小調整滑桿（50%~150%）
- [x] 操作流程引導（6 步驟 + 自動偵測張眼/眨眼）
- [x] 文字提問（AI 助教 SSE 串流回覆）
- [x] 語音提問（Web Speech API，每次最長 30 秒）
- [x] 練習紀錄查看（彈窗顯示歷史紀錄）
- [x] 全螢幕模式
- [x] 每日使用次數限制（50 問/天）

#### 教師／管理端
- [x] 課程管理（CRUD + 學生選課）
- [x] 教材管理（PDF/DOCX/PPTX/XLSX 上傳 → 自動切片 → 向量化）
- [x] AI 聊天（SSE 串流 + RAG 語意搜尋）
- [x] 考題系統（AI 自動出題 + Excel 上傳 + 即時批改）
- [x] AR 練習報表（查看學生練習次數、完成率、詳細紀錄）
- [x] 用戶管理（批次建帳）

#### 系統技術
- [x] JWT 認證系統
- [x] AR 擴增實境模組（face-api.js 臉部辨識 + 眼部定位）
- [x] 前端系統（React 19 + Vite + Tailwind CSS）
- [x] 後端系統（Express.js 5）
- [x] 資料庫系統（PostgreSQL 16 + pgvector）
- [x] AI 語音助理（Speech-to-Text + Gemini 智慧回覆）

#### 雲端部署
- [x] Supabase PostgreSQL + pgvector 資料庫建立完成
- [x] Render.com Web Service 部署設定完成
- [x] 環境變數設定（DATABASE_URL, JWT_SECRET, NODE_ENV）
- [x] Build 成功（前端 + AR 頁面打包）
- [ ] 修復 DB 連線問題（密碼特殊字元 URL encode）
- [ ] 設定 Gemini API Key（AI 聊天 + 自動出題功能需要）

#### 批次建帳
- [x] Excel 上傳批次建立學生帳號（教師 + 管理員可用）
- [x] 自動產生隨機密碼 + CSV 下載

### 待完成項目
- [ ] 修復 Render 部署 DB 連線（DATABASE_URL 密碼 `!` → `%21`）
- [ ] 申請並設定 Gemini API Key（AI 功能啟用）
- [ ] 系統操作說明文件（交付項目）
- [ ] 行動裝置 RWD 優化（手機版 AR 面板佈局）

## 角色權限對照表

| 功能 | 管理員 | 教師 | 學生 |
|------|:------:|:----:|:----:|
| 數據儀表板 | ✅ 系統總覽 | ✅ 教學數據 | ✅ 學習進度 |
| 我的課程 | ✅ 建立/管理 | ✅ 建立/管理 | ✅ 選課/進入 |
| 教材管理 | ✅ | ✅ | ❌ |
| AI 課業問答 | ❌ | ✅ | ✅ |
| AR 模擬練習 | ✅ | ✅ | ✅（登入直跳）|
| AR 練習報表 | ✅ | ✅ | ❌ |
| 測驗系統 | ❌ | ✅ 出題/管理 | ✅ 答題 |
| 用戶管理（批次建帳）| ✅ 可建教師+學生 | ✅ 僅建學生 | ❌ |
| 系統架構文件 | ✅ | ❌ | ❌ |

### 批次建立學生帳號流程
1. 教師或管理員進入「用戶管理」頁面
2. 點擊「批次建立學生帳號」
3. 上傳 Excel 檔案（須包含「學號」欄位，「姓名」欄位選填）
4. 系統自動產生隨機密碼
5. 建立完成後可下載帳號密碼 CSV 發給學生

## 系統架構

```
aijobcase-shchoolgless/
├── client/                  # React + TypeScript + Vite 前端
│   ├── components/          # 主系統 UI 元件
│   │   ├── Dashboard.tsx    # 儀表板（管理員/教師/學生）
│   │   ├── ARPracticeReport.tsx  # 教師端 AR 練習報表
│   │   ├── CourseList.tsx   # 課程列表
│   │   ├── MaterialManagement.tsx # 教材管理
│   │   ├── AIChatView.tsx   # AI 課業問答
│   │   ├── LoginView.tsx    # 登入頁面
│   │   └── Sidebar.tsx      # 側邊導航
│   ├── services/            # API 服務封裝
│   └── ar/                  # AR 模擬獨立頁面
│       ├── index.html       # AR 頁面入口
│       ├── ar-main.ts       # AR 主程式（模組協調）
│       ├── modules/
│       │   ├── face-detector.ts       # face-api.js 臉部偵測
│       │   ├── lens-renderer.ts       # Canvas 2D 隱眼/眼鏡渲染
│       │   ├── glasses-assets.ts      # 眼鏡 PNG 載入
│       │   ├── guidance-controller.ts # 6 步驟操作引導 FSM
│       │   ├── session-recorder.ts    # 練習紀錄 API
│       │   ├── ar-chat.ts             # AI 助教 SSE 串流
│       │   └── voice-input.ts         # 語音輸入（30 秒）
│       └── assets/          # 眼鏡 PNG 圖片 x5
├── server/                  # Express.js 後端
│   ├── routes/
│   │   ├── auth.js          # 登入、改密碼
│   │   ├── courses.js       # 課程 CRUD + 選課
│   │   ├── materials.js     # 教材上傳 + 向量化
│   │   ├── chat.js          # AI 聊天 SSE + RAG
│   │   ├── exams.js         # 出題、答題、批改
│   │   ├── ar-practice.js   # AR 練習紀錄 + 教師報表
│   │   └── users.js         # 用戶管理
│   ├── services/
│   │   ├── geminiService.js       # Gemini 2.0 Flash 串流
│   │   ├── embeddingService.js    # text-embedding-004 (768 維)
│   │   ├── vectorSearchService.js # pgvector cosine similarity
│   │   ├── chunkingService.js     # 800 字切片 + 200 字重疊
│   │   ├── fileParserService.js   # PDF/DOCX/PPTX/XLSX 解析
│   │   └── examGeneratorService.js # AI 自動出題 + 批改
│   ├── middleware/authMiddleware.js # JWT 認證
│   └── db/
│       ├── init-postgres.sql      # 主資料表 Schema
│       └── migration-ar.sql       # AR 練習紀錄資料表
└── package.json             # Root: concurrently 啟動前後端
```

## 快速啟動

### 1. 環境設定

```bash
cp server/.env.example server/.env
# 填入：DATABASE_URL, GEMINI_API_KEY, JWT_SECRET
```

### 2. 安裝依賴

```bash
npm run install:all
```

### 3. 初始化資料庫

需要 PostgreSQL 16 + pgvector 擴充：

```bash
npm run init-db
psql -U <user> -d edumind -f server/db/migration-ar.sql
```

### 4. 啟動開發伺服器

```bash
npm run dev
# 前端：http://localhost:3000
# 後端：http://localhost:3001
# AR 頁面：http://localhost:3000/ar/index.html
```

### 5. 預設帳號

| 學號 | 密碼 | 角色 |
|------|------|------|
| admin | admin123 | 管理員 |
| teacher01 | teacher123 | 教師 |
| student01 | student123 | 學生 |

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | React 19, TypeScript, Vite, Tailwind CSS |
| AR | face-api.js, Canvas 2D, Web Speech API |
| 後端 | Express.js 5, JWT, Multer |
| AI | Google Gemini 2.0 Flash, text-embedding-004 |
| 資料庫 | PostgreSQL 16 + pgvector (HNSW) |
| 圖表 | Recharts |

## API 端點

| 路徑 | 方法 | 說明 |
|------|------|------|
| `/api/auth/login` | POST | 登入 |
| `/api/auth/me` | GET | 取得目前使用者 |
| `/api/courses` | GET/POST | 課程列表/建立 |
| `/api/courses/:id/enroll` | POST | 學生選課 |
| `/api/materials/upload` | POST | 上傳教材 |
| `/api/chat/stream` | POST | AI 聊天 SSE 串流 |
| `/api/exams/generate` | POST | AI 自動出題 |
| `/api/exams/attempt` | POST | 答題 + AI 批改 |
| `/api/ar-practice/sessions` | POST/GET | 建立/查看練習紀錄 |
| `/api/ar-practice/students` | GET | 教師查看學生練習報表 |
| `/api/ar-practice/students/:id/sessions` | GET | 教師查看學生詳細紀錄 |

## 部署（Render + Supabase）

### 線上網址
- 主系統：https://edumind-ai-107n.onrender.com
- AR 模擬：https://edumind-ai-107n.onrender.com/ar/index.html

### 架構
- **前端 + 後端**：Render.com Web Service（Node.js）
- **資料庫**：Supabase PostgreSQL + pgvector（Asia-Pacific）

### 本地 Production 模式

```bash
npm run build   # 打包前端（含 AR 頁面）
npm start       # 啟動後端 + 靜態檔案
```

### 環境變數

| 變數 | 說明 |
|------|------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `GEMINI_API_KEY` | Google Gemini API Key（AI 功能） |
| `JWT_SECRET` | JWT 簽名密鑰 |
| `NODE_ENV` | `production` |
| `PORT` | 預設 3001 |
