-- GluMira™ V7 — Emotional distress daily log
-- Tracks burnout, sleep quality, and caregiver notes for doctor visit prep.

CREATE TABLE IF NOT EXISTS emotional_distress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  log_date          DATE NOT NULL,
  distress_level    INTEGER CHECK (distress_level >= 1 AND distress_level <= 5),
  sleep_hours       DECIMAL(4,1),
  overnight_alarms  INTEGER DEFAULT 0,
  burnout_flag      BOOLEAN NOT NULL DEFAULT false,
  anxiety_flag      BOOLEAN NOT NULL DEFAULT false,
  caregiver_notes   TEXT
);

ALTER TABLE emotional_distress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own distress logs"
  ON emotional_distress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own distress logs"
  ON emotional_distress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own distress logs"
  ON emotional_distress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own distress logs"
  ON emotional_distress FOR DELETE USING (auth.uid() = user_id);

-- One entry per user per day
CREATE UNIQUE INDEX idx_emotional_distress_user_date ON emotional_distress (user_id, log_date);
