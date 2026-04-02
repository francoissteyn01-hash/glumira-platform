-- GluMira™ V7 — Add special condition flags to patient self-service profile
-- Stores conditions like puberty, pregnancy, shift work that affect insulin sensitivity.

ALTER TABLE patient_self_profiles
  ADD COLUMN IF NOT EXISTS special_conditions JSONB DEFAULT '[]';

COMMENT ON COLUMN patient_self_profiles.special_conditions IS
  'Array of special condition flag strings: Newly diagnosed, Honeymoon phase, Puberty, Pregnancy, Illness-prone, Steroid exposure, Low hypo awareness, School schedule, Shift work, High sport variability';
