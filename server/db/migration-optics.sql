-- Add optics measurement columns to ar_practice_sessions
-- These are averaged from real-time MediaPipe measurements during the session
ALTER TABLE ar_practice_sessions
  ADD COLUMN IF NOT EXISTS pd_mm          NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS pd_left_mm     NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS pd_right_mm    NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS iris_l_mm      NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS iris_r_mm      NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS eye_height_diff_mm NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS frame_tilt_deg NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS recommended_frame_width_mm INT;
