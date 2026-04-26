-- 眼鏡目錄（AR試戴 + 臉型推薦）
CREATE TABLE IF NOT EXISTS glasses_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('glasses', 'lens')),
    image_url TEXT NOT NULL,

    -- 眼鏡框屬性（item_type='glasses' 時有效）
    frame_shape VARCHAR(20) CHECK (frame_shape IN ('round','square','semi','rimless','cat_eye','oval')),
    thickness VARCHAR(10) CHECK (thickness IN ('thin','thick','medium')),
    material VARCHAR(20) CHECK (material IN ('metal','plastic','mixed','titanium')),
    style VARCHAR(20) CHECK (style IN ('business','fashion','sport','casual','vintage')),

    -- 適合的臉型（陣列）
    suitable_face_types TEXT[] DEFAULT '{}',

    -- 隱形眼鏡顏色（item_type='lens' 時有效）
    lens_color VARCHAR(30),

    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_glasses_type ON glasses_catalog(item_type, is_active);
CREATE INDEX IF NOT EXISTS idx_glasses_face_types ON glasses_catalog USING GIN(suitable_face_types);

-- 推薦紀錄（教育追蹤用）
CREATE TABLE IF NOT EXISTS recommendation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    face_shape VARCHAR(20) NOT NULL,
    recommended_ids UUID[] NOT NULL,
    selected_id UUID REFERENCES glasses_catalog(id) ON DELETE SET NULL,
    detection_method VARCHAR(20) DEFAULT 'manual' CHECK (detection_method IN ('manual','auto')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rec_logs_student ON recommendation_logs(student_id, created_at DESC);
