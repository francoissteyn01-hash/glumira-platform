-- GluMira V7 — Profile type + Story progress
-- Safe to run against existing databases

-- Add profile_type and story fields to patient_self_profiles
ALTER TABLE patient_self_profiles ADD COLUMN IF NOT EXISTS profile_type TEXT;
ALTER TABLE patient_self_profiles ADD COLUMN IF NOT EXISTS story_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE patient_self_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Story progress tracking
CREATE TABLE IF NOT EXISTS story_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_type TEXT NOT NULL,
  current_scene_id TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  scenes_viewed TEXT[] DEFAULT '{}',
  scenes_skipped TEXT[] DEFAULT '{}',
  scenes_replayed TEXT[] DEFAULT '{}',
  total_time_spent_ms INTEGER DEFAULT 0,
  audio_enabled BOOLEAN DEFAULT TRUE,
  reduced_motion BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_progress_user_id ON story_progress(user_id);

-- RLS
ALTER TABLE story_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own story progress" ON story_progress;
DROP POLICY IF EXISTS "Users can insert own story progress" ON story_progress;
DROP POLICY IF EXISTS "Users can update own story progress" ON story_progress;

CREATE POLICY "Users can read own story progress"
  ON story_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own story progress"
  ON story_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own story progress"
  ON story_progress FOR UPDATE USING (auth.uid() = user_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
