-- EduMind AI - 單租戶 MVP Schema
-- 備註：未來多租戶 SaaS 化時，需加回 tenants 表並在所有表加 tenant_id

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==================== 用戶 ====================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT'
        CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT')),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'DISABLED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== 課程 ====================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_enrollments (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, course_id)
);

-- ==================== 教材 ====================
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    type VARCHAR(10) NOT NULL
        CHECK (type IN ('PDF', 'DOCX', 'PPTX', 'XLSX')),
    original_filename VARCHAR(500),
    status VARCHAR(20) DEFAULT 'PROCESSING'
        CHECK (status IN ('PROCESSING', 'READY', 'FAILED')),
    chunk_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== RAG 向量 ====================
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_embedding
    ON document_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_chunks_material
    ON document_chunks(material_id);

-- ==================== 考題 ====================
CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
    question_type VARCHAR(20) NOT NULL
        CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'FILL_BLANK')),
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty INT DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
    source VARCHAR(20) DEFAULT 'MANUAL'
        CHECK (source IN ('AI', 'UPLOAD', 'MANUAL')),
    status VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_course
    ON exam_questions(course_id);

-- ==================== 學生作答 ====================
CREATE TABLE IF NOT EXISTS student_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES exam_questions(id) ON DELETE CASCADE,
    student_answer TEXT,
    is_correct BOOLEAN,
    ai_feedback TEXT,
    time_spent_seconds INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempts_student
    ON student_attempts(student_id, created_at DESC);

-- ==================== 聊天紀錄 ====================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    sources JSONB,
    mode VARCHAR(20) DEFAULT 'chat',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_user
    ON chat_messages(user_id, created_at DESC);

-- ==================== 每日用量 ====================
CREATE TABLE IF NOT EXISTS daily_usage (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    question_count INT DEFAULT 0,
    exam_count INT DEFAULT 0,
    PRIMARY KEY (user_id, usage_date)
);

-- ==================== 預設管理員帳號 ====================
-- 密碼: admin123 (bcrypt hash)
-- 上線前請務必更改
INSERT INTO users (student_id, name, role, password_hash)
VALUES ('admin', '系統管理員', 'ADMIN', '$2a$10$placeholder')
ON CONFLICT (student_id) DO NOTHING;
