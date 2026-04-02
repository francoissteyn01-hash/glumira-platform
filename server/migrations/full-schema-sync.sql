-- =============================================================================
-- GluMira V7 -- Full Schema Sync
-- Generated 2026-04-02 from Drizzle schema (drizzle/schema.ts + server/db/schema.ts)
-- Safe to run against existing databases (IF NOT EXISTS / DO blocks throughout)
-- =============================================================================

-- ── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'clinician', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE diagnosis_type AS ENUM ('T1D', 'T2D', 'Gestational');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('M', 'F', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE module_type AS ENUM ('pediatric', 'school', 'pregnancy', 'menstrual_cycle');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE age_group_type AS ENUM ('toddler', 'child', 'teen', 'adult', 'older_adult');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE media_type AS ENUM ('photo', 'file');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE permission_level AS ENUM ('view', 'edit');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appt_status AS ENUM ('scheduled', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tier_type AS ENUM ('free', 'pro', 'ai');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE region_type AS ENUM ('AF', 'UAE', 'UK', 'EU', 'US', 'INT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cycle_phase_type AS ENUM ('follicular', 'ovulation', 'luteal', 'menstruation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_zone_type AS ENUM ('safe', 'caution', 'elevated', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE insulin_type_enum AS ENUM (
    'glargine_u100', 'glargine_u300', 'degludec', 'detemir', 'nph',
    'aspart', 'lispro', 'glulisine', 'regular'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE badge_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Tables ───────────────────────────────────────────────────────────────────

-- 1. user_profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id               UUID PRIMARY KEY,                            -- references auth.users(id)
  role             user_role       NOT NULL DEFAULT 'user',
  first_name       VARCHAR(100),
  last_name        VARCHAR(100),
  clinic_name      VARCHAR(255),
  license_number   VARCHAR(255),
  specialization   VARCHAR(100),
  region           region_type     NOT NULL DEFAULT 'INT',
  onboarding_done  BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 2. subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID         NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tier                     tier_type    NOT NULL DEFAULT 'free',
  trial_start_date         TIMESTAMPTZ,
  trial_end_date           TIMESTAMPTZ,
  subscription_start_date  TIMESTAMPTZ,
  subscription_end_date    TIMESTAMPTZ,
  region                   region_type,
  discount_applied         DECIMAL(4,3) NOT NULL DEFAULT 1.000,
  auto_renew               BOOLEAN      NOT NULL DEFAULT TRUE,
  cancelled_at             TIMESTAMPTZ,
  cancellation_reason      TEXT,
  stripe_customer_id       VARCHAR(255),
  stripe_subscription_id   VARCHAR(255),
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- 3. patient_profiles
CREATE TABLE IF NOT EXISTS patient_profiles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id       UUID         NOT NULL REFERENCES user_profiles(id),
  patient_name       VARCHAR(255) NOT NULL,
  date_of_birth      DATE         NOT NULL,
  gender             gender_type,
  diagnosis          diagnosis_type NOT NULL,
  diagnosis_date     DATE,
  photo_url          TEXT,
  nightscout_url     TEXT,
  nightscout_token   TEXT,
  tdd                DECIMAL(6,2),
  typical_basal_dose DECIMAL(6,2),
  glucose_target_low  DECIMAL(4,1) NOT NULL DEFAULT 4.4,
  glucose_target_high DECIMAL(4,1) NOT NULL DEFAULT 10.0,
  glucose_unit       VARCHAR(10)  NOT NULL DEFAULT 'mmol',
  is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (clinician_id, patient_name)
);

-- 4. patient_modules
CREATE TABLE IF NOT EXISTS patient_modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID            NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  module_type   module_type     NOT NULL,
  age_group     age_group_type,
  trimester     SMALLINT,
  cycle_phase   cycle_phase_type,
  is_active     BOOLEAN         NOT NULL DEFAULT TRUE,
  activated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, module_type)
);

-- 5. insulin_profiles
CREATE TABLE IF NOT EXISTS insulin_profiles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id         UUID         NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  profile_name       VARCHAR(100) NOT NULL DEFAULT 'Default',
  carb_ratio         DECIMAL(5,2),
  isf                DECIMAL(5,2),
  glucose_target_low  DECIMAL(4,1),
  glucose_target_high DECIMAL(4,1),
  basal_rates        JSONB,
  is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 6. tod_isf_modifiers
CREATE TABLE IF NOT EXISTS tod_isf_modifiers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID         NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  period_start    TIME         NOT NULL,
  period_end      TIME         NOT NULL,
  isf_multiplier  DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  label           VARCHAR(100),
  is_enabled      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 7. dose_log
CREATE TABLE IF NOT EXISTS dose_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID              NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  insulin_type    insulin_type_enum NOT NULL,
  dose_units      DECIMAL(6,2)      NOT NULL,
  administered_at TIMESTAMPTZ       NOT NULL,
  dose_reason     VARCHAR(50),
  carbs_g         DECIMAL(5,1),
  glucose_at_time DECIMAL(4,1),
  notes           TEXT,
  iob_at_time     DECIMAL(6,3),
  created_by      UUID              REFERENCES user_profiles(id),
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- 8. iob_snapshots
CREATE TABLE IF NOT EXISTS iob_snapshots (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id         UUID           NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  calculated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  total_iob          DECIMAL(6,3)   NOT NULL,
  stacking_score     DECIMAL(5,2)   NOT NULL,
  risk_zone          risk_zone_type NOT NULL,
  dose_breakdown     JSONB,
  isf_used           DECIMAL(5,2),
  icr_used           DECIMAL(5,2),
  optimal_next_dose_h DECIMAL(4,1),
  created_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- 9. glucose_readings
CREATE TABLE IF NOT EXISTS glucose_readings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID         NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  value_mmol  DECIMAL(4,1) NOT NULL,
  value_mgdl  DECIMAL(6,1),
  trend_arrow VARCHAR(20),
  source      VARCHAR(50)  NOT NULL DEFAULT 'nightscout',
  recorded_at TIMESTAMPTZ  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_glucose_patient_time
  ON glucose_readings (patient_id, recorded_at);

-- 10. patient_media
CREATE TABLE IF NOT EXISTS patient_media (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID         NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  media_type      media_type   NOT NULL,
  file_type       VARCHAR(20),
  storage_path    TEXT         NOT NULL,
  public_url      TEXT,
  description     VARCHAR(255),
  file_size_bytes INTEGER,
  uploaded_by     UUID         REFERENCES user_profiles(id),
  uploaded_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);

-- 11. caregiver_shares
CREATE TABLE IF NOT EXISTS caregiver_shares (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID             NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  caregiver_email   VARCHAR(255)     NOT NULL,
  permission_level  permission_level NOT NULL DEFAULT 'view',
  share_token       VARCHAR(64)      UNIQUE,
  caregiver_user_id UUID             REFERENCES user_profiles(id),
  is_active         BOOLEAN          NOT NULL DEFAULT TRUE,
  created_by        UUID             REFERENCES user_profiles(id),
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,
  UNIQUE (patient_id, caregiver_email)
);

-- 12. appointments
CREATE TABLE IF NOT EXISTS appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID         NOT NULL REFERENCES patient_profiles(id),
  clinician_id     UUID         NOT NULL REFERENCES user_profiles(id),
  appointment_date TIMESTAMPTZ  NOT NULL,
  purpose          VARCHAR(255),
  status           appt_status  NOT NULL DEFAULT 'scheduled',
  notes            TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 13. menstrual_cycles
CREATE TABLE IF NOT EXISTS menstrual_cycles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            UUID           NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  cycle_start_date      DATE           NOT NULL,
  cycle_length_days     INTEGER        NOT NULL DEFAULT 28,
  current_phase         cycle_phase_type,
  isf_adjustment        DECIMAL(3,2)   NOT NULL DEFAULT 1.00,
  icr_adjustment        DECIMAL(3,2)   NOT NULL DEFAULT 1.00,
  follicular_isf_mult   DECIMAL(3,2)   DEFAULT 1.10,
  ovulation_isf_mult    DECIMAL(3,2)   DEFAULT 1.00,
  luteal_isf_mult       DECIMAL(3,2)   DEFAULT 0.80,
  menstruation_isf_mult DECIMAL(3,2)   DEFAULT 1.15,
  notes                 TEXT,
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, cycle_start_date)
);

-- 14. audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         REFERENCES user_profiles(id),
  action        VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id   UUID,
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 15. telemetry_wave_groupb
CREATE TABLE IF NOT EXISTS telemetry_wave_groupb (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID         REFERENCES patient_profiles(id),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  session_id UUID,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 16. badges
CREATE TABLE IF NOT EXISTS badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(100) NOT NULL UNIQUE,
  name        VARCHAR(200) NOT NULL,
  description TEXT         NOT NULL,
  tier        badge_tier   NOT NULL DEFAULT 'bronze',
  icon_emoji  VARCHAR(10)  NOT NULL DEFAULT '🏅',
  criteria    JSONB,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 17. user_badges
CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, badge_id)
);

-- 18. mira_conversations
CREATE TABLE IF NOT EXISTS mira_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID        REFERENCES patient_profiles(id) ON DELETE SET NULL,
  user_id     UUID        REFERENCES user_profiles(id) ON DELETE SET NULL,
  messages    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  token_count INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Done. 14 enums + 18 tables + 1 index.
-- =============================================================================
