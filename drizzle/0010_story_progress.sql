-- GluMira™ V7 — Story progress tracking
-- Records onboarding story completion, scene analytics, accessibility prefs.

CREATE TABLE IF NOT EXISTS story_progress (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type        TEXT NOT NULL,
  current_scene_id    TEXT,
  completed           BOOLEAN NOT NULL DEFAULT false,
  completed_at        TIMESTAMPTZ,
  scenes_viewed       TEXT[] DEFAULT '{}',
  scenes_skipped      TEXT[] DEFAULT '{}',
  scenes_replayed     TEXT[] DEFAULT '{}',
  total_time_spent_ms INTEGER DEFAULT 0,
  audio_enabled       BOOLEAN DEFAULT true,
  reduced_motion      BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE story_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own story progress"
  ON story_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own story progress"
  ON story_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own story progress"
  ON story_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER update_story_progress_updated_at
  BEFORE UPDATE ON story_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_story_progress_user ON story_progress (user_id);
