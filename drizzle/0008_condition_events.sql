-- GluMira™ V7 — Condition events table
-- Tracks contextual factors that affect insulin sensitivity.

CREATE TABLE IF NOT EXISTS condition_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  event_time        TIMESTAMPTZ NOT NULL,
  event_type        TEXT NOT NULL CHECK (event_type IN (
    'exercise', 'illness', 'sleep', 'stress', 'travel',
    'steroid', 'menstrual', 'exam', 'weather', 'other'
  )),
  intensity         TEXT CHECK (intensity IS NULL OR intensity IN ('low', 'moderate', 'high', 'severe')),
  duration_minutes  INTEGER,
  notes             TEXT
);

ALTER TABLE condition_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own condition events"
  ON condition_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own condition events"
  ON condition_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own condition events"
  ON condition_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own condition events"
  ON condition_events FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER update_condition_events_updated_at
  BEFORE UPDATE ON condition_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_condition_events_user_time ON condition_events (user_id, event_time DESC);
