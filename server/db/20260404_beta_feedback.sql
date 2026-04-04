-- GluMira™ V7 — Beta feedback table
-- Structured feedback collected via Mira in safe mode.

CREATE TABLE IF NOT EXISTS beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  demo_profile_id TEXT,
  most_useful TEXT,
  most_confusing TEXT,
  feature_request TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  other_thoughts TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_created ON beta_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_profile ON beta_feedback (demo_profile_id);
