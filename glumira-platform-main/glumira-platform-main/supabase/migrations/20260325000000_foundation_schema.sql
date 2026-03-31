-- ═══════════════════════════════════════════════════════════════
-- GluMira™ Foundation Schema Migration
-- Version: 7.0.0
-- Date: 2026-03-25
-- Tables: patient_profiles (required by all subsequent migrations)
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── patient_profiles ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patient_profiles (
  user_id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name         TEXT        NOT NULL,
  diabetes_type        TEXT        NOT NULL DEFAULT 'Type 1',
  insulin_type         TEXT,
  regime_name          TEXT,
  participant_id       TEXT        UNIQUE,
  status               TEXT        NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active', 'paused', 'completed', 'withdrawn')),
  role                 TEXT        NOT NULL DEFAULT 'patient'
                                   CHECK (role IN ('patient', 'clinician', 'admin')),
  carb_ratio_morning   NUMERIC,
  carb_ratio_afternoon NUMERIC,
  carb_ratio_evening   NUMERIC,
  correction_factor    NUMERIC,
  target_bg_mmol       NUMERIC,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON patient_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON patient_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON patient_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Clinicians can view their patients
CREATE POLICY "Clinicians can view all patients"
  ON patient_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patient_profiles
      WHERE user_id = auth.uid() AND role = 'clinician'
    )
  );

-- Index for role lookups
CREATE INDEX IF NOT EXISTS idx_patient_profiles_role ON patient_profiles(role);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_status ON patient_profiles(status);
