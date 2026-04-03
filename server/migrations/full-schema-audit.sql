-- =============================================================================
-- GluMira V7 — Full Schema Audit Migration
-- Generated 2026-04-03
-- Safe to run against existing databases (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- Run this in Supabase SQL Editor after full-schema-sync.sql
-- =============================================================================

-- ── patient_self_profiles: add missing columns ─────────────────────────────

-- Create table if not exists (from 0003)
CREATE TABLE IF NOT EXISTS patient_self_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE,
  first_name        VARCHAR(100),
  last_name         VARCHAR(100),
  date_of_birth     DATE,
  diabetes_type     VARCHAR(20) CHECK (diabetes_type IN ('T1D','T2D','LADA','Gestational','Other')),
  diagnosis_date    DATE,
  country           VARCHAR(100),
  insulin_types     JSONB DEFAULT '[]',
  delivery_method   VARCHAR(50),
  icr               DECIMAL(5,2),
  isf               DECIMAL(5,2),
  dietary_approach  VARCHAR(50),
  allergens         JSONB DEFAULT '[]',
  meals_per_day     SMALLINT DEFAULT 3,
  comorbidities     JSONB DEFAULT '[]',
  is_caregiver      BOOLEAN NOT NULL DEFAULT false,
  patient_name      VARCHAR(200),
  relationship      VARCHAR(100),
  under_18_flag     BOOLEAN NOT NULL DEFAULT false,
  profile_complete  BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Columns from 0004_add_special_conditions
ALTER TABLE patient_self_profiles ADD COLUMN IF NOT EXISTS special_conditions JSONB DEFAULT '[]';

-- Columns from 0007_add_glucose_units
ALTER TABLE patient_self_profiles ADD COLUMN IF NOT EXISTS glucose_units VARCHAR(10) DEFAULT 'mmol';

-- Columns from 0011_nightscout_profile_fields
ALTER TABLE patient_self_profiles ADD COLUMN IF NOT EXISTS nightscout_url TEXT;
ALTER TABLE patient_self_profiles ADD COLUMN IF NOT EXISTS nightscout_api_secret TEXT;
ALTER TABLE patient_self_profiles ADD COLUMN IF NOT EXISTS nightscout_sync_enabled BOOLEAN DEFAULT false;

-- New columns from audit (sex, language, basal_frequency, correction_target)
ALTER TABLE patient_self_profiles ADD COLUMN IF NOT EXISTS sex VARCHAR(30);
ALTER TABLE patient_self_profiles ADD COLUMN IF NOT EXISTS language VARCHAR(50);
ALTER TABLE patient_self_profiles ADD COLUMN IF NOT EXISTS basal_frequency VARCHAR(50);
ALTER TABLE patient_self_profiles ADD COLUMN IF NOT EXISTS basal_times JSONB DEFAULT '[]';
ALTER TABLE patient_self_profiles ADD COLUMN IF NOT EXISTS correction_target DECIMAL(5,2);

-- ── RLS policies (safe to re-run with DROP IF EXISTS) ──────────────────────

ALTER TABLE patient_self_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON patient_self_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON patient_self_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON patient_self_profiles;

CREATE POLICY "Users can read own profile"
  ON patient_self_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile"
  ON patient_self_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile"
  ON patient_self_profiles FOR UPDATE USING (auth.uid() = user_id);

-- ── caregiver_links table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS caregiver_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL,
  caregiver_email TEXT NOT NULL,
  caregiver_user_id UUID,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  invited_by UUID NOT NULL,
  invite_status TEXT NOT NULL DEFAULT 'pending' CHECK (invite_status IN ('pending', 'accepted', 'revoked')),
  invite_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(child_profile_id, caregiver_email)
);

ALTER TABLE caregiver_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Caregivers can view their own links" ON caregiver_links;
DROP POLICY IF EXISTS "Editors can manage links" ON caregiver_links;

CREATE POLICY "Caregivers can view their own links"
  ON caregiver_links FOR SELECT
  USING (caregiver_user_id = auth.uid() OR invited_by = auth.uid());

CREATE POLICY "Editors can manage links"
  ON caregiver_links FOR ALL
  USING (invited_by = auth.uid() OR
    EXISTS (SELECT 1 FROM caregiver_links cl
            WHERE cl.child_profile_id = caregiver_links.child_profile_id
            AND cl.caregiver_user_id = auth.uid()
            AND cl.role = 'editor'));

-- ── Max 4 caregivers trigger ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_max_caregivers()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM caregiver_links
      WHERE child_profile_id = NEW.child_profile_id
      AND invite_status != 'revoked') >= 4 THEN
    RAISE EXCEPTION 'Maximum 4 caregivers per child profile';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_max_caregivers ON caregiver_links;
CREATE TRIGGER enforce_max_caregivers
  BEFORE INSERT ON caregiver_links
  FOR EACH ROW EXECUTE FUNCTION check_max_caregivers();

-- ── glucose_readings: ensure recorded_at column exists ─────────────────────

DO $$ BEGIN
  ALTER TABLE glucose_readings ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── update_updated_at function (used by triggers) ──────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Done. Run this in Supabase SQL Editor.
-- =============================================================================
