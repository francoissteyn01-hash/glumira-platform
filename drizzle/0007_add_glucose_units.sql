-- GluMira™ V7 — Add glucose_units preference to patient self-service profile
-- Stores user's preferred glucose display unit: 'mmol' or 'mg'.

ALTER TABLE patient_self_profiles
  ADD COLUMN IF NOT EXISTS glucose_units TEXT DEFAULT 'mmol'
    CHECK (glucose_units IN ('mmol', 'mg'));
