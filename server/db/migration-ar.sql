-- AR Practice Sessions
CREATE TABLE IF NOT EXISTS ar_practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INT,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS'
        CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
    steps_completed INT DEFAULT 0,
    total_steps INT DEFAULT 6,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_sessions_student
    ON ar_practice_sessions(student_id, created_at DESC);

-- AR Practice Events (step-by-step log)
CREATE TABLE IF NOT EXISTS ar_practice_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ar_practice_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL
        CHECK (event_type IN ('STEP_START', 'STEP_COMPLETE', 'CHAT_QUESTION', 'VOICE_QUESTION', 'PAUSE', 'RESUME')),
    step_number INT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_events_session
    ON ar_practice_events(session_id);
