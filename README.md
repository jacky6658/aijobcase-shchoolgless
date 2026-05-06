# 擬真眼鏡平台+AI智能語音助理&擬真隱形眼鏡平台+AI智能語音助理

## 產地：台灣
## 廠牌：德仁
## 型號：智慧語音教學系統 v1.0

> **本專案現正針對 新生醫專 (HSC11504504) 之護理教學場域進行「AI 語音對話邏輯」與「AR 模擬定位精準度」之客製化調教與優化測試，預計於決標後 45 日內交付最終穩定版。**

結合 **AR 擴增實境** 與 **AI 語音互動** 的教學平台，提供擬真隱形眼鏡/眼鏡配戴模擬、課程教材管理、AI 問答與考題系統。

## 開發進度與測試狀態

### 各模組開發與測試進度

#### 學生端
- [x] AR 配戴模擬（臉部偵測 + 隱眼/眼鏡即時疊加）
- [x] 隱形眼鏡 5 色選擇（透明/藍/綠/棕/灰）
- [x] 眼鏡 5 款選擇（黑框/玳瑁/金屬/紅框/墨鏡）
- [x] 鏡片/眼鏡大小調整滑桿（50%~150%）
- [x] 操作流程引導（6 步驟 + 自動偵測張眼/眨眼）
- [x] 文字提問（AI 助教 SSE 串流回覆）
- [x] AR 口罩補償定位（眼部偵測失效時以臉部輪廓估算）
- [x] 語音提問（Web Speech API + 護理關鍵字詞典 + 17 組同音誤字修正）
- [x] 練習紀錄查看（彈窗顯示歷史紀錄）
- [x] 全螢幕模式
- [x] 每日使用次數限制（30 次 / 天，超限回覆親切提示）
- [x] **臉型眼鏡推薦**（圓臉/方臉/長臉/心型臉/鵝蛋臉 → 推薦框型 + 搭配說明）
- [x] **左右擺頭透視效果**（AR 試戴時轉頭可看鏡框側面視角，模擬照鏡子體驗）
- [x] **真 3D 眼鏡渲染**（Three.js + MediaPipe FaceLandmarker 4×4 矩陣，眼鏡跟隨頭部 yaw/pitch/roll 真實旋轉）
- [x] **鏡腳遠側自動淡化**（轉頭時遠側鏡腳依 yaw 漸隱，避免戳眼）

#### 教師／管理端
- [x] 課程管理（CRUD + 學生選課）
- [x] 教材管理（PDF/DOCX/PPTX/XLSX 上傳 → 自動切片 → 向量化）
- [x] AI 聊天（SSE 串流 + RAG 語意搜尋）
- [x] 考題系統（AI 自動出題 5 題/次 + 極簡 JSON prompt）
- [x] AR 練習報表（查看學生練習次數、詳細紀錄）
- [x] 用戶管理（批次建帳）
- [x] Dashboard 真實數據（總課程數、活躍學生、AI 累計問答、教材數量）
- [x] **眼鏡素材管理**（後台匯入眼鏡/隱眼圖片，最多 30+ 種，標記框型/材質/風格/適合臉型）

#### 系統技術
- [x] JWT 認證系統
- [x] AR 擴增實境模組（MediaPipe FaceLandmarker 478 點 + iris 追蹤 + Three.js 3D 渲染）
- [x] 前端系統（React 19 + Vite + Tailwind CSS）
- [x] 後端系統（Express.js 5）
- [x] 資料庫系統（PostgreSQL 16 + pgvector）
- [x] 成本控管三層機制（Rate Limit + Sliding Window + Output 熔斷）
- [x] AI 語音助理（Speech-to-Text + Gemini 對話邏輯，護理情境詞典完成）

#### 雲端部署
- [x] Supabase PostgreSQL + pgvector 資料庫建立
- [x] Zeabur 部署設定
- [x] 環境變數設定（見下方說明）
- [x] Build 打包（前端 + AR 頁面）
- [ ] Gemini API Key 整合測試（待填入 Zeabur 環境變數）

#### 批次建帳
- [x] Excel 上傳批次建立學生帳號（教師 + 管理員可用）
- [x] 自動產生隨機密碼 + CSV 下載

### 待完成項目
- [ ] Zeabur 環境變數填入（DATABASE_URL + GEMINI_API_KEY）— 部署前動作
- [x] 語音提問護理情境調教（[nursing-vocab.ts](client/ar/modules/nursing-vocab.ts)）
- [x] 行動裝置 RWD 優化（AR 頁 bottom-sheet + 浮動切換鈕）
- [x] 系統操作說明文件（[docs/操作手冊.md](docs/操作手冊.md)）

### 已知待驗證（需瀏覽器 + 攝影機實測）
- [ ] AR 口罩補償定位視覺效果（程式已加，需實機驗證）
- [ ] AR RWD 在實機手機上的操作流暢度
- [ ] Web Speech API 在不同瀏覽器的辨識率

## AI 成本控管機制

| 機制 | 實作方式 | 效果 |
|------|------|------|
| **每日次數防線** | `daily_usage` 資料表，30 次/人/天，超限即擋，不呼叫 API | 防止單一用戶爆量 |
| **記憶體瘦身** | Sliding Window 只保留最近 8 則對話 | 減少每次送出的 Token 數 |
| **輸出熔斷** | `maxOutputTokens: 300`（出題用 800），System Instruction 要求 200 字內 | 控制每次輸出成本 |
| **模型選擇** | `gemini-2.0-flash-lite` | 比 flash 便宜，適合高併發 |
| **出題上限** | 每次最多 5 題，極簡 JSON prompt 減少輸出 token | 防止出題費用失控 |

## 角色權限對照表

| 功能 | 管理員 | 教師 | 學生 |
|------|:------:|:----:|:----:|
| 數據儀表板（真實數據）| ✅ 系統總覽 | ✅ 教學數據 | ✅ 學習進度 + 用量 |
| 我的課程 | ✅ 建立/管理 | ✅ 建立/管理 | ✅ 選課/進入 |
| 教材管理 | ✅ | ✅ | ❌ |
| AI 課業問答 | ❌ | ✅ | ✅ |
| AR 模擬練習 | ✅ | ✅ | ✅（登入直跳）|
| AR 練習報表 | ✅ | ✅ | ❌ |
| 測驗系統 | ❌ | ✅ 出題/管理 | ✅ 答題 |
| 用戶管理（批次建帳）| ✅ 可建教師+學生 | ✅ 僅建學生 | ❌ |
| 系統架構文件 | ✅ | ❌ | ❌ |

## 系統架構

```
aijobcase-shchoolgless/
├── client/                  # React + TypeScript + Vite 前端
│   ├── components/          # 主系統 UI 元件
│   │   ├── Dashboard.tsx    # 儀表板（真實數據串接）
│   │   ├── ARPracticeReport.tsx  # 教師端 AR 練習報表
│   │   ├── CourseList.tsx   # 課程列表
│   │   ├── MaterialManagement.tsx # 教材管理
│   │   ├── AIChatView.tsx   # AI 課業問答
│   │   ├── LoginView.tsx    # 登入頁面
│   │   ├── Sidebar.tsx      # 側邊導航
│   │   ├── GlassesManagement.tsx    # 眼鏡/隱眼素材後台管理
│   │   └── FaceShapeRecommendation.tsx  # 臉型推薦 UI（含臉型選擇按鈕）
│   ├── services/            # API 服務封裝
│   └── ar/                  # AR 模擬獨立頁面
│       ├── index.html       # AR 頁面入口（含 video + canvas + Three.js canvas）
│       ├── ar-main.ts       # AR 主程式（60fps render loop，協調 face → glasses）
│       ├── modules/
│       │   ├── face-detector.ts       # MediaPipe FaceLandmarker（478 點 + iris + 4×4 pose 矩陣）
│       │   ├── glasses-3d.ts          # Three.js 3D 眼鏡（PNG texture + 程序化鏡腳）
│       │   ├── lens-renderer.ts       # Canvas 2D 隱眼渲染（隱眼模式專用）
│       │   ├── face-shape-analyzer.ts # 臉型分類 + 左右偏轉角（yaw）計算
│       │   ├── recommendation-engine.ts # Rule-based 臉型推薦引擎
│       │   ├── glasses-assets.ts      # 眼鏡 PNG 載入
│       │   ├── guidance-controller.ts # 6 步驟操作引導 FSM
│       │   ├── session-recorder.ts    # 練習紀錄 API
│       │   ├── ar-chat.ts             # AI 助教 SSE 串流
│       │   └── voice-input.ts         # 語音輸入（30 秒）
│       └── assets/          # 眼鏡 PNG 圖片（front 鏡框去背照）
├── server/                  # Express.js 後端
│   ├── routes/
│   │   ├── auth.js          # 登入、改密碼
│   │   ├── courses.js       # 課程 CRUD + 選課
│   │   ├── materials.js     # 教材上傳 + 向量化
│   │   ├── chat.js          # AI 聊天 SSE + RAG + Rate Limit + Sliding Window
│   │   ├── exams.js         # 出題（上限 5 題）、答題、批改
│   │   ├── ar-practice.js   # AR 練習紀錄 + 教師報表
│   │   ├── glasses.js       # 眼鏡目錄 CRUD + 圖片上傳 + 臉型推薦 API
│   │   ├── stats.js         # Dashboard 統計 API
│   │   └── users.js         # 用戶管理
│   ├── services/
│   │   ├── geminiService.js       # Gemini 2.0 Flash Lite + 輸出熔斷
│   │   ├── geminiLimiter.js       # p-limit 併發控制（max 20）
│   │   ├── embeddingService.js    # text-embedding-004 (768 維)
│   │   ├── vectorSearchService.js # pgvector cosine similarity
│   │   ├── chunkingService.js     # 800 字切片 + 200 字重疊
│   │   ├── fileParserService.js   # PDF/DOCX/PPTX/XLSX 解析
│   │   └── examGeneratorService.js # AI 自動出題（極簡 JSON prompt）+ 批改
│   ├── middleware/authMiddleware.js # JWT 認證
│   └── db/
│       ├── init-postgres.sql      # 主資料表 Schema
│       └── migration-ar.sql       # AR 練習紀錄資料表
│       └── migration-glasses.sql  # 眼鏡目錄 + 推薦紀錄資料表
└── package.json             # Root: concurrently 啟動前後端
```

## AR 3D 眼鏡引擎（重要！維護必讀）

### 整體架構
```
攝影機 video → MediaPipe FaceLandmarker (30fps)
                      ↓ 每幀產出
                      ├─ 478 個 face landmarks（含 iris 468/473）
                      ├─ 4×4 facial transformation matrix
                      └─ 抽出 yaw / pitch / roll Euler 角度
                              ↓ 餵給
                      Three.js Glasses3D (WebGL canvas 透明疊在 video 上)
                              │
                              ├─ Front 鏡框：PNG texture 貼 PlaneGeometry
                              └─ 兩支鏡腳：TubeGeometry + 末端水滴 SphereGeometry（程序化建模）
```

### 關鍵檔案
| 檔案 | 職責 |
|---|---|
| `client/ar/modules/face-detector.ts` | MediaPipe 偵測 + 從 4×4 矩陣抽出 YXZ Euler 角 |
| `client/ar/modules/glasses-3d.ts` | Three.js 場景、眼鏡 mesh、平滑、依 yaw 鏡腳淡化 |
| `client/ar/ar-main.ts` | 60fps render loop，串接 face → glasses |
| `client/ar/index.html` | 三層疊加：`<video>` + `<canvas#lens-canvas>` (隱眼) + `<canvas#glasses-3d-canvas>` (眼鏡 3D) |
| `client/ar/assets/glasses-black-front.png` | 鏡框正面去背圖（**鏡片中心必須在圖寬 50% 位置**）|

### 可調參數（`glasses-3d.ts` 上方常數）
```ts
FRONT.frameOuterPD     = 0.86  // 鏡框外緣 X 位置（PD 單位，鏡腳起點對齊這裡）
FRONT.templeAttachYRatio = 0.28 // 鏡腳合頁 Y（圖片從上到下的比例）
STUB.len    = 1.80   // 鏡腳長度（PD 單位 ≈ 108mm）
STUB.tube   = 0.010  // 鏡腳粗細
STUB.tipR   = 0.022  // 末端水滴耳鉤半徑
STUB.bend   = 0.07   // 末端下垂量
STUB.inward = 0.12   // 末端往內收量
ROT_SMOOTH  = 0.18   // 旋轉平滑（小=穩，大=反應快）
POS_SMOOTH  = 0.75   // 位置平滑
SIZE_SMOOTH = 0.20   // 大小平滑
FADE_START  = 0.10   // |yaw| 超過這值，遠側鏡腳開始淡化
FADE_RANGE  = 0.35   // 淡化過渡範圍
```

### 重要陷阱（踩過、別重蹈覆轍）

#### 1. CSS `transform: scaleX(-1)` 會把 CSS3D 攤平成 2D
**症狀**：用 CSS3D `transform: rotateY(angle)` 旋轉 DOM 元素，當父層有 `mirror` class（scaleX -1），3D 上下文崩潰，所有 rotateY/rotateZ 變成 2D 翻轉。
**對策**：放棄 CSS3D，用 Three.js WebGL canvas（不受 CSS 父層 transform 影響）。鏡像在 JS 計算位置時手動翻：`px = videoRect.width - cxRaw * sx`。

#### 2. `scale.y = -unit` 翻轉 Y 後，X 軸旋轉方向會反
**症狀**：抬頭時鏡框沒跟著仰，反而往下傾。
**原因**：Y 翻轉改變了座標系手性，rotateX 視覺方向反轉。
**對策**：pitch 取負號 → `rotation.set(-pitch, -yaw, +roll, 'YXZ')`
- pitch（X 軸）：Y 翻轉 → 反號
- yaw（Y 軸）：CSS 鏡像 → 反號
- roll（Z 軸）：兩次反向相消 → 不反號

#### 3. 從 MediaPipe 4×4 矩陣抽 YXZ Euler 的公式（column-major）
```ts
const m02 = m[8], m12 = m[9], m22 = m[10], m10 = m[1], m11 = m[5];
pitch = Math.asin(-m12);
yaw   = Math.atan2(m02, m22);
roll  = Math.atan2(m10, m11);
```

#### 4. 2D 圖片套頭部姿態永遠不真實
- 試過：把正面 PNG 用 cos(yaw) 水平壓縮
- 試過：把正面 + 兩側面 PNG 拼成一張長條圖
- 試過：CSS3D rotate 三層 DOM 平面（front + 左/右鏡腳）
**結論：2D 永遠假。3D 才是正解。**

#### 5. 程序化建模 ≠ 100% 還原商品照
- 寶島眼鏡上的金色雕花、鼻托細節等是 2D 紋理，無法從一張正面照逆推 3D 模型
- 折衷做法：**正面用 PNG 貼圖（保留所有細節）+ 鏡腳用 Three.js 程序化（簡化但結構正確）**

#### 6. 沒有頭部 3D 模型 → 無法遮擋（occlusion）
**症狀**：鏡腳尾端在側面看時會穿過頭部、戳到眼睛。
**對策**：根據 yaw 角度動態調 material.opacity。轉哪邊就保留哪邊鏡腳，遠側淡化到 0。

#### 7. 平滑（lerp）太強會 lag、太弱會抖
**最佳組合**：
- 旋轉 0.18（強平滑）→ 避免左右擺頭時鏡框抖動
- 位置 0.75（弱平滑）→ 緊貼臉，無拖延
- 大小 0.20（中）→ 避免閃爍縮放

#### 8. 眼距用瞳孔位置算出來會被 yaw 透視壓縮
**對策**：`trueDist = eyeDistPx / max(|cos(yaw)|, 0.3)` 還原 3D 真實眼距，避免轉頭時鏡框變小。clamp 0.3 防止極側面除零爆值。

#### 9. 鏡腳起點 X 不能等於正面圖的 frame outer
**症狀**：側面看時鏡腳跟鏡框中間有縫隙。
**原因**：CatmullRomCurve3 端點精準在 x0，但 PNG 紋理的鏡框邊緣可能在 x0 內側。
**對策**：鏡腳起點往內 0.04 PD（深入鏡框內部 4mm 以上），確保視覺重疊。

### 35 款眼鏡如何擴充
1. 把每款 front 去背 PNG 放到 `client/ar/assets/glasses/`
2. 維護一個 catalog 配置（id / name / file / templeColor / category）
3. `Glasses3D.setStyle(id)` 動態切換 texture + STUB.color
4. UI 改成可滑動款式選單（取代目前 5 款按鈕）
5. （詳見「眼鏡素材管理」對應的後台模組）

## 圖片資產說明

| 資料夾 | 用途 | 數量 | 格式 |
|--------|------|------|------|
| `server/uploads/glasses/` | **AR 試戴去背圖**（正面，透明背景，由後端 API 提供給 AR 頁面使用）| 35 張 | 1000×1000 PNG，透明背景 |
| `images/glasses/{臉型}/` | **臉型推薦展示圖**（_01 正面、_02/_03 側面，原始商品照）| 各臉型數張 | PNG，白底 |
| `client/ar/assets/` | **內建 3D 眼鏡材質貼圖**（black/gold/red/tortoise/sunglasses 五款，程式碼 import 使用）| 8 張 | PNG，透明背景 |

> `server/uploads/glasses/` 的詳細說明與商品列表請見 [server/uploads/glasses/README.md](server/uploads/glasses/README.md)

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
psql -U <user> -d edumind -f server/db/migration-glasses.sql
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
| AR | MediaPipe Tasks Vision 0.10 (FaceLandmarker), Three.js 0.184, Canvas 2D, Web Speech API |
| 後端 | Express.js 5, JWT, Multer |
| AI | Google Gemini 2.0 Flash Lite, text-embedding-004 |
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
| `/api/chat/stream` | POST | AI 聊天 SSE 串流（含 Rate Limit + 8 則記憶）|
| `/api/exams/generate` | POST | AI 自動出題（上限 5 題）|
| `/api/exams/attempt` | POST | 答題 + AI 批改 |
| `/api/ar-practice/sessions` | POST/GET | 建立/查看練習紀錄 |
| `/api/ar-practice/students` | GET | 教師查看學生練習報表 |
| `/api/glasses/upload` | POST | 上傳眼鏡/隱眼圖片 + metadata（Admin/Teacher）|
| `/api/glasses` | GET | 取得眼鏡目錄列表 |
| `/api/glasses/recommend` | GET | 依臉型推薦眼鏡（`?face_shape=round`）|
| `/api/glasses/:id` | PATCH/DELETE | 更新/刪除眼鏡品項 |
| `/api/stats/overview` | GET | 系統總覽統計（管理員/教師）|
| `/api/stats/my-usage` | GET | 個人用量查詢（學生）|

## 部署（Zeabur + Supabase）

### 線上網址
- 主系統：部署至 Zeabur 後取得
- AR 模擬：`<你的網址>/ar/index.html`

### 架構
- **前端 + 後端**：Zeabur（Node.js）
- **資料庫**：Supabase PostgreSQL + pgvector（Asia-Pacific）

### Zeabur 環境變數設定

| 變數 | 說明 | 備註 |
|------|------|------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | 密碼中的 `!` 須改為 `%21` |
| `GEMINI_API_KEY` | Google Gemini API Key | 至 aistudio.google.com 申請 |
| `JWT_SECRET` | JWT 簽名密鑰 | 任意亂數字串 |
| `NODE_ENV` | `production` | |
| `PORT` | 預設 3001 | Zeabur 通常自動注入 |

### 本地 Production 模式

```bash
npm run build   # 打包前端（含 AR 頁面）
npm start       # 啟動後端 + 靜態檔案
```
