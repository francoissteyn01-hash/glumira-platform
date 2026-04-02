-- GluMira™ V7 — Insulin events table
-- Tracks every insulin dose with optional meal linking.

CREATE TABLE IF NOT EXISTS insulin_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  event_time      TIMESTAMPTZ NOT NULL,
  event_type      TEXT NOT NULL CHECK (event_type IN (
    'basal', 'meal_bolus', 'correction', 'pre_bolus', 'snack_cover'
  )),
  insulin_type    TEXT NOT NULL,
  dose_units      DECIMAL(8,2) NOT NULL,

  food_linked_id  UUID REFERENCES meal_log(id) ON DELETE SET NULL,
  is_correction   BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT
);

-- RLS
ALTER TABLE insulin_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own insulin events"
  ON insulin_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insulin events"
  ON insulin_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insulin events"
  ON insulin_events FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insulin events"
  ON insulin_events FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER update_insulin_events_updated_at
  BEFORE UPDATE ON insulin_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for date range queries and IOB calculations
CREATE INDEX idx_insulin_events_user_time ON insulin_events (user_id, event_time DESC);
