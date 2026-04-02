-- GluMira™ V7 — Meal log table
-- All numeric fields use DECIMAL for full precision (0.25 increments, 2.2g carbs, etc.)

CREATE TABLE IF NOT EXISTS meal_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  meal_time           TIMESTAMPTZ NOT NULL,
  event_type          TEXT NOT NULL CHECK (event_type IN (
    'basal', 'meal_bolus', 'correction', 'low_intervention', 'meal', 'snack'
  )),

  -- Insulin
  insulin_type        TEXT,
  units               DECIMAL(8,2),

  -- Glucose
  glucose_value       DECIMAL(8,2),
  glucose_units       TEXT DEFAULT 'mmol' CHECK (glucose_units IN ('mmol', 'mg')),

  -- Macros (all decimal — NEVER integer)
  protein_g           DECIMAL(8,2),
  carbs_g             DECIMAL(8,2),
  fat_g               DECIMAL(8,2),
  fibre_g             DECIMAL(8,2),

  -- Food
  food_description    TEXT,

  -- Low intervention
  low_treatment_type  TEXT CHECK (low_treatment_type IS NULL OR low_treatment_type IN (
    'dextab_quarter', 'dextab_half', 'dextab_full',
    'juice', 'coke', 'jelly_beans', 'glucose_gel', 'honey'
  )),
  low_treatment_grams DECIMAL(8,2),

  -- Notes & media
  comment             TEXT,
  photo_url           TEXT
);

-- RLS
ALTER TABLE meal_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own meal logs"
  ON meal_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
  ON meal_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON meal_log FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
  ON meal_log FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER update_meal_log_updated_at
  BEFORE UPDATE ON meal_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for date range queries
CREATE INDEX idx_meal_log_user_time ON meal_log (user_id, meal_time DESC);
