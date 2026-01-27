
import { UserRole, SubscriptionPlan } from './types';

export const SYSTEM_ARCH_DOC = {
  project_structure: `
/src
  /components     # 可複用 UI 組件 (按鈕, 卡片, 彈窗)
  /services       # API 與 AI 邏輯 (GeminiService, 存儲服務)
  /hooks          # 狀態管理邏輯
  /pages          # 主要頁面容器
  /lib            # 共用工具 (格式化, 模擬驗證)
  types.ts        # 全域類型定義
  constants.tsx   # 配置與架構說明
  `,
  db_schema: `
-- 核心多租戶資料表
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                  -- 租戶名稱 (學校或企業)
    plan TEXT DEFAULT 'FREE',            -- 訂閱方案
    quota_limit INT DEFAULT 100,         -- AI 額度限制
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id), -- 所屬租戶 ID
    role TEXT NOT NULL,                   -- 角色: ADMIN, TEACHER, STUDENT
    email TEXT UNIQUE,
    ...
);

CREATE TABLE courses (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    title TEXT,
    ...
);

CREATE TABLE materials (
    id UUID PRIMARY KEY,
    course_id UUID REFERENCES courses(id),
    tenant_id UUID REFERENCES tenants(id),
    vector_status TEXT,                   -- RAG 向量化狀態
    ...
);

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY,
    material_id UUID REFERENCES materials(id),
    content TEXT,                         -- 文本分塊內容
    embedding VECTOR(1536)                -- pgvector 向量存儲 (Gemini Embedding)
);
  `,
  api_list: [
    "GET /api/tenants - 僅限超級管理員",
    "POST /api/auth/login - 登入驗證",
    "GET /api/courses?tenantId=xxx - 取得租戶課程",
    "POST /api/materials/upload - 教材上傳",
    "POST /api/ai/chat - RAG 問答請求",
    "GET /api/usage/quota - 檢查租戶當前用量"
  ]
};

// Use SubscriptionPlan enum instead of raw strings for type safety
export const MOCK_TENANTS = [
  { id: 't1', name: '國立台灣大學', domain: 'ntu.edu.tw', plan: SubscriptionPlan.SCHOOL_MVP, quotaLimit: 5000, quotaUsed: 120, createdAt: '2024-01-01' },
  { id: 't2', name: '全能技術學院', domain: 'global.com', plan: SubscriptionPlan.PRO, quotaLimit: 2000, quotaUsed: 800, createdAt: '2024-02-15' }
];

// Use UserRole enum instead of raw strings to prevent type mismatch in authService
export const MOCK_USER = {
  id: 'u1',
  tenantId: 't1',
  name: '陳大文 老師',
  email: 'alex@ntu.edu.tw',
  role: UserRole.TEACHER,
  avatar: 'https://picsum.photos/seed/alex/200'
};
