
-- 1. 啟用向量擴展
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 租戶表
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plan TEXT DEFAULT 'FREE',
    quota_limit_tokens INT DEFAULT 1000000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 使用者表 (新增認證欄位)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'STUDENT',
    password_hash TEXT,             -- Bcrypt hash
    google_sub TEXT,                -- Google 帳號唯一標識
    status TEXT DEFAULT 'ACTIVE',   -- ACTIVE, PENDING_PASSWORD, DISABLED
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email),
    UNIQUE(tenant_id, google_sub)
);

-- 4. 密碼重設 Token 表 (用於 reset link 方案)
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 既有 RAG 結構保持不變...
