# EduMind AI 專案上下文

## 專案資訊
- GitHub: https://github.com/jacky6658/aijobcase-shchoolgless.git
- 本地路徑: /Users/user/Downloads/aijobcase-shchoolgless
- 線上版: https://edumind-ai-107n.onrender.com
- 報價單: docs/ 資料夾內兩份 PDF

## 技術環境
- iMac, macOS
- Node/npm/gh 在 /usr/local/bin/（不在預設 PATH，需要 `PATH="/usr/local/bin:$PATH"`）
- PostgreSQL 16 本地: port 5432, DB: edumind, user: user
- psql 路徑: /usr/local/Cellar/postgresql@16/16.13/bin/psql
- preview 用 launch.json name: "edumind"（只有 client，server 要另外啟動）

## 雲端部署
- **Render.com**: edumind-ai (Free plan), Web Service, Node
- **Supabase**: edumind-ai 專案, Asia-Pacific (Sydney)
  - DB URL: postgresql://postgres:[密碼]@db.wpypzcvxonknbmryeeja.supabase.co:5432/postgres
  - 資料表已全部建好（主表 + AR 練習表 + 預設帳號）

## 帳號
| 學號 | 密碼 | 角色 |
|------|------|------|
| admin | admin123 | 管理員 |
| teacher01 | teacher123 | 教師 |
| student01 | student123 | 學生 |

## 待完成項目（依優先序）
1. **修復 Render DB 連線** — Environment 的 DATABASE_URL 密碼 `!` 要改成 `%21`
2. **申請 Gemini API Key** — https://aistudio.google.com/apikey → 加到 Render Environment
3. **系統操作說明文件** — 報價單交付項目要求，需涵蓋教師端 + 學生端操作
4. **行動裝置 RWD 優化** — AR 頁面手機版面板佈局重疊問題
5. **儀表板真實數據** — 管理員/教師 Dashboard 目前是 mock data

## 已完成功能摘要
- 主系統 MVP（Express + PostgreSQL + pgvector + React）
- JWT 認證、課程管理、教材 RAG、AI 聊天串流、考題系統
- AR 模擬練習（face-api.js 臉部偵測 + 隱眼5色 + 眼鏡5款 + 大小調整）
- 6步驟操作引導 + AI 助教 + 30秒語音 + 練習紀錄
- 教師 AR 練習報表 + Excel 批次建帳
- Render + Supabase 雲端部署（build 成功，DB 連線待修）
