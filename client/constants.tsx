
export const SYSTEM_ARCH_DOC = {
  project_structure: `
/client         # React + Vite 前端
  /components   # UI 元件
  /services     # API 呼叫封裝
  types.ts      # TypeScript 型別定義
/server         # Express 後端
  /routes       # API 路由
  /services     # 業務邏輯 (RAG, Gemini, 考題)
  /middleware   # JWT Auth, Rate Limit
  /db           # PostgreSQL + pgvector Schema
  `,
  api_list: [
    "POST /api/auth/login - 學號登入",
    "POST /api/auth/batch-create - 批次建立帳號",
    "GET /api/courses - 取得課程列表",
    "POST /api/materials/upload - 教材上傳 + RAG 向量化",
    "POST /api/chat/stream - SSE 串流問答",
    "POST /api/exams/generate - AI 自動出題",
    "POST /api/exams/attempt - 學生作答",
    "GET /api/exams/results - 成績統計",
    "GET /api/users/usage - 每日用量查詢"
  ]
};
