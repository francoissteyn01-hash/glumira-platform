CREATE TABLE IF NOT EXISTS education_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  topic_id TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_ms INTEGER DEFAULT 0,
  UNIQUE(user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS education_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  topic_id TEXT NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_education_progress_user ON education_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_education_votes_topic ON education_votes(topic_id);
