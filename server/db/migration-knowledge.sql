-- Knowledge Q&A table
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_qa (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID REFERENCES courses(id) ON DELETE CASCADE,
  category    VARCHAR(100) NOT NULL DEFAULT '一般',
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  embedding   vector(768),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS knowledge_qa_course_idx ON knowledge_qa(course_id);
CREATE INDEX IF NOT EXISTS knowledge_qa_embedding_idx
  ON knowledge_qa USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
