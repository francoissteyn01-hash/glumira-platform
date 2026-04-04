CREATE TABLE IF NOT EXISTS story_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  profile_type TEXT NOT NULL,
  current_scene_id TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  scenes_viewed TEXT[] DEFAULT '{}',
  total_time_spent_ms INTEGER DEFAULT 0,
  audio_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_progress_user ON story_progress(user_id);
