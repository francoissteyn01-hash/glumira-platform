-- GluMira™ V7 — Add Nightscout fields to patient profile

ALTER TABLE patient_self_profiles
  ADD COLUMN IF NOT EXISTS nightscout_url TEXT,
  ADD COLUMN IF NOT EXISTS nightscout_api_secret TEXT,
  ADD COLUMN IF NOT EXISTS nightscout_sync_enabled BOOLEAN NOT NULL DEFAULT false;
