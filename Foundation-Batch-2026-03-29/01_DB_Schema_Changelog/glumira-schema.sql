-- ============================================================
-- GluMira™ V7 — Complete Database Schema
-- Engine: Supabase (PostgreSQL)
-- ORM: Drizzle (drizzle/schema.ts equivalent in SQL)
-- Version: v1.0 · 2026-03-29
-- Source: Phase 2 Master Execution Plan §2
-- Built in Namibia. Designed for the world.
-- ============================================================
-- ALWAYS run migrations via Drizzle, never raw SQL in production.
-- This file is the canonical reference schema.
-- Pending migration: 20260327_wave_groupb_telemetry.sql
-- ============================================================

-- ── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMS ───────────────────────────────────────────────────
CREATE TYPE user_role         AS ENUM ('user', 'clinician', 'admin');
CREATE TYPE diagnosis_type    AS ENUM ('T1D', 'T2D', 'Gestational');
CREATE TYPE gender_type       AS ENUM ('M', 'F', 'Other');
CREATE TYPE module_type       AS ENUM ('pediatric', 'school', 'pregnancy', 'menstrual_cycle');
CREATE TYPE age_group_type    AS ENUM ('toddler', 'child', 'teen', 'adult', 'older_adult');
CREATE TYPE media_type        AS ENUM ('photo', 'file');
CREATE TYPE permission_level  AS ENUM ('view', 'edit');
CREATE TYPE appt_status       AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE tier_type         AS ENUM ('free', 'pro', 'ai');
CREATE TYPE region_type       AS ENUM ('AF', 'UAE', 'UK', 'EU', 'US', 'INT');
CREATE TYPE cycle_phase_type  AS ENUM ('follicular', 'ovulation', 'luteal', 'menstruation');
CREATE TYPE risk_zone_type    AS ENUM ('safe', 'caution', 'elevated', 'high');
CREATE TYPE insulin_type_enum AS ENUM (
  'glargine_u100', 'glargine_u300', 'degludec', 'detemir', 'nph',
  'aspart', 'lispro', 'glulisine', 'regular'
);

-- ============================================================
-- PART 1 — USERS & AUTH (extends Supabase auth.users)
-- ============================================================

-- 1.1 User profiles (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id                UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role              user_role     NOT NULL DEFAULT 'user',
  first_name        VARCHAR(100),
  last_name         VARCHAR(100),
  clinic_name       VARCHAR(255),
  license_number    VARCHAR(255),   -- HPCSA / medical licence
  specialization    VARCHAR(100),   -- 'endocrinologist', 'diabetes_educator', etc.
  region            region_type     NOT NULL DEFAULT 'INT',
  onboarding_done   BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 1.2 Subscriptions & trial management
CREATE TABLE public.subscriptions (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID          NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  tier                  tier_type     NOT NULL DEFAULT 'free',
  trial_start_date      TIMESTAMPTZ,
  trial_end_date        TIMESTAMPTZ,
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date   TIMESTAMPTZ,
  region                region_type,
  discount_applied      DECIMAL(4,3)  NOT NULL DEFAULT 1.000,  -- 0.700 = 30% Africa discount
  auto_renew            BOOLEAN       NOT NULL DEFAULT TRUE,
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  stripe_customer_id    VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT one_subscription_per_user UNIQUE(user_id)
);

-- ============================================================
-- PART 2 — PATIENT PROFILES
-- ============================================================

-- 2.1 Patient profiles (clinician-created)
CREATE TABLE public.patient_profiles (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinician_id      UUID          NOT NULL REFERENCES public.user_profiles(id),
  patient_name      VARCHAR(255)  NOT NULL,
  date_of_birth     DATE          NOT NULL,
  gender            gender_type,
  diagnosis         diagnosis_type NOT NULL,
  diagnosis_date    DATE,
  photo_url         TEXT,           -- S3/Supabase storage URL
  nightscout_url    TEXT,           -- CGM integration
  nightscout_token  TEXT,           -- encrypted
  tdd               DECIMAL(6,2),   -- Total Daily Dose (U/day)
  typical_basal_dose DECIMAL(6,2),  -- Used in stacking score calc
  glucose_target_low  DECIMAL(4,1) NOT NULL DEFAULT 4.4,  -- mmol/L
  glucose_target_high DECIMAL(4,1) NOT NULL DEFAULT 10.0, -- mmol/L
  glucose_unit       VARCHAR(10)   NOT NULL DEFAULT 'mmol',  -- 'mmol' | 'mgdl'
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE(clinician_id, patient_name)
);

-- 2.2 Specialist module assignments
CREATE TABLE public.patient_modules (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  module_type       module_type   NOT NULL,
  age_group         age_group_type,
  trimester         SMALLINT,       -- 1, 2, 3 for pregnancy
  cycle_phase       cycle_phase_type,
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  activated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE(patient_id, module_type)
);

-- ============================================================
-- PART 3 — INSULIN PROFILES & CURVES
-- ============================================================

-- 3.1 Insulin profiles (curves & carb ratios — editable)
CREATE TABLE public.insulin_profiles (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  profile_name      VARCHAR(100)  NOT NULL DEFAULT 'Default',  -- 'Weekday', 'School Day', etc.
  carb_ratio        DECIMAL(5,2),   -- grams per unit (ICR)
  isf               DECIMAL(5,2),   -- mmol/L per unit (ISF)
  glucose_target_low  DECIMAL(4,1),
  glucose_target_high DECIMAL(4,1),
  basal_rates       JSONB,          -- Array of { hour: 0-23, rate: U/h }
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 3.2 Time-of-day ISF modifiers (spec 01.3 §7)
CREATE TABLE public.tod_isf_modifiers (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  period_start      TIME          NOT NULL,  -- e.g. '03:00'
  period_end        TIME          NOT NULL,  -- e.g. '08:00'
  isf_multiplier    DECIMAL(3,2)  NOT NULL DEFAULT 1.00,  -- e.g. 0.80 for dawn phenomenon
  label             VARCHAR(100),  -- 'Dawn phenomenon', 'Overnight', etc.
  is_enabled        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 4 — DOSE LOG & IOB TRACKING
-- ============================================================

-- 4.1 Dose log (all doses used for IOB calculation)
CREATE TABLE public.dose_log (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  insulin_type      insulin_type_enum NOT NULL,
  dose_units        DECIMAL(6,2)  NOT NULL,
  administered_at   TIMESTAMPTZ   NOT NULL,
  dose_reason       VARCHAR(50),   -- 'basal', 'meal_bolus', 'correction'
  carbs_g           DECIMAL(5,1),  -- if meal bolus
  glucose_at_time   DECIMAL(4,1), -- mmol/L at time of dose
  notes             TEXT,
  iob_at_time       DECIMAL(6,3),  -- calculated IOB when dose was given
  created_by        UUID          REFERENCES public.user_profiles(id),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 4.2 IOB snapshots (cached calculations — for chart history)
CREATE TABLE public.iob_snapshots (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  calculated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  total_iob         DECIMAL(6,3)  NOT NULL,
  stacking_score    DECIMAL(5,2)  NOT NULL,
  risk_zone         risk_zone_type NOT NULL,
  dose_breakdown    JSONB,         -- Array of { dose_log_id, insulin_type, residual_iob }
  isf_used          DECIMAL(5,2),
  icr_used          DECIMAL(5,2),
  optimal_next_dose_h DECIMAL(4,1),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 5 — CGM DATA
-- ============================================================

-- 5.1 Glucose readings (from Nightscout/Dexcom/Libre)
CREATE TABLE public.glucose_readings (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  value_mmol        DECIMAL(4,1)  NOT NULL,
  value_mgdl        DECIMAL(6,1),
  trend_arrow       VARCHAR(20),   -- 'FLAT', 'FORTY_FIVE_UP', 'SINGLE_UP', 'DOUBLE_UP', etc.
  source            VARCHAR(50)   NOT NULL DEFAULT 'nightscout',
  recorded_at       TIMESTAMPTZ   NOT NULL,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE(patient_id, recorded_at)
);

CREATE INDEX idx_glucose_patient_time ON public.glucose_readings(patient_id, recorded_at DESC);

-- ============================================================
-- PART 6 — MEDIA STORAGE
-- ============================================================

-- 6.1 Patient media (photos, lab reports, prescriptions)
CREATE TABLE public.patient_media (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  media_type        media_type    NOT NULL,
  file_type         VARCHAR(20),   -- 'jpg', 'pdf', 'docx'
  storage_path      TEXT          NOT NULL,  -- Supabase Storage path
  public_url        TEXT,
  description       VARCHAR(255),
  file_size_bytes   INTEGER,
  uploaded_by       UUID          REFERENCES public.user_profiles(id),
  uploaded_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ    -- Free tier: 3 months, Pro: NULL = unlimited
);

-- ============================================================
-- PART 7 — CAREGIVER SHARING
-- ============================================================

-- 7.1 Caregiver shares
CREATE TABLE public.caregiver_shares (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  caregiver_email   VARCHAR(255)  NOT NULL,
  permission_level  permission_level NOT NULL DEFAULT 'view',
  share_token       VARCHAR(64)   UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  caregiver_user_id UUID          REFERENCES public.user_profiles(id),  -- set when they claim
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_by        UUID          REFERENCES public.user_profiles(id),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,   -- Free tier: 3 months

  UNIQUE(patient_id, caregiver_email)
);

-- ============================================================
-- PART 8 — APPOINTMENTS
-- ============================================================

-- 8.1 Appointment booking
CREATE TABLE public.appointments (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          NOT NULL REFERENCES public.patient_profiles(id),
  clinician_id      UUID          NOT NULL REFERENCES public.user_profiles(id),
  appointment_date  TIMESTAMPTZ   NOT NULL,
  purpose           VARCHAR(255),  -- 'Upload patient data', 'Review results', etc.
  status            appt_status   NOT NULL DEFAULT 'scheduled',
  notes             TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 9 — SPECIALIST MODULES
-- ============================================================

-- 9.1 Menstrual cycle tracking (spec Phase 2 §2.8)
-- ISF/ICR adjustments by cycle phase
CREATE TABLE public.menstrual_cycles (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  cycle_start_date  DATE          NOT NULL,
  cycle_length_days INTEGER       NOT NULL DEFAULT 28,
  current_phase     cycle_phase_type,
  isf_adjustment    DECIMAL(3,2)  NOT NULL DEFAULT 1.00,  -- multiplier by phase
  icr_adjustment    DECIMAL(3,2)  NOT NULL DEFAULT 1.00,  -- multiplier by phase
  -- Phase-specific multipliers (research-based)
  follicular_isf_mult  DECIMAL(3,2) DEFAULT 1.10,
  ovulation_isf_mult   DECIMAL(3,2) DEFAULT 1.00,
  luteal_isf_mult      DECIMAL(3,2) DEFAULT 0.80,  -- insulin resistance in luteal
  menstruation_isf_mult DECIMAL(3,2) DEFAULT 1.15,
  notes             TEXT,
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE(patient_id, cycle_start_date)
);

-- 9.2 Pediatric module data
CREATE TABLE public.pediatric_profiles (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE UNIQUE,
  age_group         age_group_type NOT NULL,
  current_weight_kg DECIMAL(5,2),
  current_height_cm DECIMAL(5,1),
  school_name       VARCHAR(255),
  school_nurse_email VARCHAR(255),
  emergency_contact VARCHAR(255),
  emergency_phone   VARCHAR(50),
  -- Age-based carb ratio presets
  preset_carb_ratio DECIMAL(5,2),  -- overrides calculated ICR for age group
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 9.3 School care plan
CREATE TABLE public.school_care_plans (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE UNIQUE,
  plan_version      VARCHAR(20)   NOT NULL DEFAULT '1.0',
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  hypo_protocol     TEXT,          -- What to do if BG < 3.9
  hyper_protocol    TEXT,          -- What to do if BG > 13.9
  lunch_carb_g      DECIMAL(5,1), -- Typical lunch carbs for bolus calc
  snack_carb_g      DECIMAL(5,1),
  teacher_notes     TEXT,
  emergency_glucagon BOOLEAN      DEFAULT FALSE,
  pdf_url           TEXT,          -- Generated PDF share link
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 9.4 Pregnancy module
CREATE TABLE public.pregnancy_profiles (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE UNIQUE,
  trimester         SMALLINT      NOT NULL CHECK (trimester BETWEEN 1 AND 3),
  expected_due_date DATE,
  gestational_diabetes BOOLEAN    DEFAULT FALSE,
  -- Trimester-specific targets (CONCEPTT study aligned)
  t1_target_low     DECIMAL(3,1) DEFAULT 3.5,
  t1_target_high    DECIMAL(3,1) DEFAULT 7.8,
  t2_target_low     DECIMAL(3,1) DEFAULT 3.5,
  t2_target_high    DECIMAL(3,1) DEFAULT 7.8,
  t3_target_low     DECIMAL(3,1) DEFAULT 3.5,
  t3_target_high    DECIMAL(3,1) DEFAULT 7.8,
  postpartum_mode   BOOLEAN       DEFAULT FALSE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 10 — TELEMETRY & AUDIT
-- ============================================================

-- 10.1 Audit log (security & compliance)
CREATE TABLE public.audit_log (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID          REFERENCES public.user_profiles(id),
  action            VARCHAR(100)  NOT NULL,  -- 'dose_logged', 'profile_viewed', etc.
  resource_type     VARCHAR(50),
  resource_id       UUID,
  ip_address        INET,
  user_agent        TEXT,
  metadata          JSONB,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_time ON public.audit_log(user_id, created_at DESC);

-- 10.2 Wave Group B telemetry (PENDING DEPLOYMENT — migration 20260327)
CREATE TABLE public.telemetry_wave_groupb (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID          REFERENCES public.patient_profiles(id),
  event_type        VARCHAR(100)  NOT NULL,
  event_data        JSONB,
  session_id        UUID,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.user_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_readings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_media       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_shares    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iob_snapshots       ENABLE ROW LEVEL SECURITY;

-- Users see own profile
CREATE POLICY "users_own_profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

-- Clinicians see patients they created
CREATE POLICY "clinician_sees_own_patients" ON public.patient_profiles
  FOR ALL USING (clinician_id = auth.uid());

-- Caregivers see shared patients via token
CREATE POLICY "caregiver_sees_shared_patients" ON public.patient_profiles
  FOR SELECT USING (
    id IN (
      SELECT patient_id FROM public.caregiver_shares
      WHERE caregiver_user_id = auth.uid()
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Dose log: clinician or caregiver (edit permission)
CREATE POLICY "dose_log_clinician" ON public.dose_log
  FOR ALL USING (
    patient_id IN (
      SELECT id FROM public.patient_profiles WHERE clinician_id = auth.uid()
    )
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_patient_profiles_updated_at
  BEFORE UPDATE ON public.patient_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_insulin_profiles_updated_at
  BEFORE UPDATE ON public.insulin_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- IOB calculation function (mirrors TypeScript engine)
CREATE OR REPLACE FUNCTION calc_iob(
  p_dose       DECIMAL,
  p_hours_ago  DECIMAL,
  p_doa        DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  lambda DECIMAL;
BEGIN
  lambda := LN(2) / (p_doa * 0.5);
  RETURN GREATEST(0, p_dose * EXP(-lambda * p_hours_ago));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Stacking score function
CREATE OR REPLACE FUNCTION calc_stacking_score(
  p_patient_id      UUID,
  p_typical_basal   DECIMAL DEFAULT 18
) RETURNS TABLE (
  total_iob      DECIMAL,
  stacking_score DECIMAL,
  risk_zone      risk_zone_type
) AS $$
DECLARE
  insulin_doa_map JSONB := '{
    "glargine_u100": 24, "glargine_u300": 36, "degludec": 42,
    "detemir": 20, "nph": 14, "aspart": 4, "lispro": 4,
    "glulisine": 3.5, "regular": 7
  }';
  v_total_iob    DECIMAL := 0;
  v_score        DECIMAL;
  v_zone         risk_zone_type;
  rec            RECORD;
BEGIN
  FOR rec IN
    SELECT dose_units, administered_at,
           insulin_type::TEXT AS itype
    FROM public.dose_log
    WHERE patient_id = p_patient_id
      AND administered_at > NOW() - INTERVAL '48 hours'
  LOOP
    DECLARE
      doa          DECIMAL;
      hours_elapsed DECIMAL;
    BEGIN
      doa := (insulin_doa_map ->> rec.itype)::DECIMAL;
      hours_elapsed := EXTRACT(EPOCH FROM (NOW() - rec.administered_at)) / 3600;
      v_total_iob := v_total_iob + calc_iob(rec.dose_units, hours_elapsed, doa);
    END;
  END LOOP;

  v_score := LEAST(100, (v_total_iob / NULLIF(p_typical_basal, 0)) * 100);
  v_zone  := CASE
    WHEN v_score <= 30 THEN 'safe'::risk_zone_type
    WHEN v_score <= 55 THEN 'caution'::risk_zone_type
    WHEN v_score <= 75 THEN 'elevated'::risk_zone_type
    ELSE 'high'::risk_zone_type
  END;

  RETURN QUERY SELECT v_total_iob, v_score, v_zone;
END;
$$ LANGUAGE plpgsql;
