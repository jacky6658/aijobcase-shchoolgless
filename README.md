# EduMind AI — AI 課程複習助教系統

結合 **AR 擴增實境** 與 **AI 語音互動** 的教學平台，提供擬真隱形眼鏡/眼鏡配戴模擬、課程教材管理、AI 問答與考題系統。

## 系統架構

```
aijobcase-shchoolgless/
├── client/                  # React + TypeScript + Vite 前端
│   ├── components/          # 主系統 UI 元件
│   ├── services/            # API 服務封裝
│   └── ar/                  # AR 模擬獨立頁面
│       ├── index.html       # AR 頁面入口
│       ├── ar-main.ts       # AR 主程式
│       ├── modules/         # 臉部偵測、鏡片渲染、語音、聊天
│       └── assets/          # 眼鏡 PNG 圖片
├── server/                  # Express.js 後端
│   ├── routes/              # API 路由 (auth, chat, materials, exams, ar-practice)
│   ├── services/            # Gemini AI, 向量搜尋, 切片, 出題
│   ├── middleware/          # JWT 認證
│   └── db/                  # PostgreSQL + pgvector Schema
└── package.json             # Root: concurrently 啟動前後端
```

## 功能模組

### 主系統
- **JWT 認證** — 學號 + 密碼登入，老師批次建帳
- **課程管理** — CRUD + 學生選課
- **教材管理** — PDF/DOCX/PPTX/XLSX 上傳 → 自動切片 → Gemini 向量化
- **AI 聊天** — SSE 串流回覆 + RAG 語意搜尋（pgvector）
- **考題系統** — AI 自動出題 + Excel 上傳 + 即時批改
- **每日用量限制** — 50 問/天、100 題/天

### AR 模擬練習（獨立頁面）
- **臉部偵測** — face-api.js 即時臉部/眼部定位
- **隱形眼鏡模擬** — Canvas 2D 疊加，5 色可選（透明/藍/綠/棕/灰）
- **眼鏡模擬** — 真實眼鏡 PNG 圖片疊加（黑框/玳瑁/金屬/紅框/墨鏡）
- **操作流程引導** — 6 步驟狀態機（清洗雙手→戴入鏡片→眨眼確認）
- **AI 助教** — 文字/語音提問，SSE 串流回覆
- **語音輸入** — Web Speech API，30 秒上限
- **練習紀錄** — 記錄練習時長、步驟完成度

## 快速啟動

### 1. 環境設定

```bash
# 複製環境變數範本
cp server/.env.example server/.env
# 填入：DATABASE_URL, GEMINI_API_KEY, JWT_SECRET
```

### 2. 安裝依賴

```bash
npm run install:all
```

### 3. 初始化資料庫

需要 PostgreSQL + pgvector 擴充：

```bash
npm run init-db
# 另外執行 AR 練習紀錄遷移
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
| admin | admin123 | 系統管理員 |

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | React 19, TypeScript, Vite, Tailwind CSS |
| AR | face-api.js, Canvas 2D, Web Speech API |
| 後端 | Express.js 5, JWT, Multer |
| AI | Google Gemini 2.0 Flash, text-embedding-004 |
| 資料庫 | PostgreSQL 16 + pgvector (HNSW) |
| 向量搜尋 | 768 維 cosine similarity |

## 部署

Production 模式下 Express 同時靜態伺服前端 `client/dist/`：

```bash
npm run build   # 打包前端（含 AR 頁面）
npm start       # 啟動後端 + 靜態檔案
```

環境變數：`DATABASE_URL`, `GEMINI_API_KEY`, `JWT_SECRET`, `NODE_ENV=production`, `PORT`
