-- GluMira™ V7 — Patient self-service profile
-- Stores dietary preferences, comorbidities, insulin management, and caregiver mode.

CREATE TABLE IF NOT EXISTS patient_self_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Section 1: Personal
  first_name        VARCHAR(100),
  last_name         VARCHAR(100),
  date_of_birth     DATE,
  diabetes_type     VARCHAR(20) CHECK (diabetes_type IN ('T1D','T2D','LADA','Gestational','Other')),
  diagnosis_date    DATE,
  country           VARCHAR(100),

  -- Section 2: Insulin & Management
  insulin_types     JSONB DEFAULT '[]',   -- array of insulin type slugs
  delivery_method   VARCHAR(50),          -- MDI, Pump, Pen, Inhaled
  icr               DECIMAL(5,2),         -- insulin-to-carb ratio (optional)
  isf               DECIMAL(5,2),         -- insulin sensitivity factor (optional)

  -- Section 3: Dietary Profile
  dietary_approach  VARCHAR(50) CHECK (dietary_approach IN (
    'Standard/Full Carb Count','Moderate Carb','Low Carb','Keto',
    'Bernstein Protocol','Halal','Kosher','Ramadan Fasting',
    'Intermittent Fasting','Vegetarian','Vegan','Mediterranean',
    'High Protein/Low Fat','Grazing/Snacking'
  )),
  allergens         JSONB DEFAULT '[]',   -- array of allergen strings
  meals_per_day     SMALLINT DEFAULT 3,

  -- Section 4: Comorbidities
  comorbidities     JSONB DEFAULT '[]',   -- array of comorbidity strings

  -- Section 5: Caregiver mode
  is_caregiver      BOOLEAN NOT NULL DEFAULT false,
  patient_name      VARCHAR(200),
  relationship      VARCHAR(100),
  under_18_flag     BOOLEAN NOT NULL DEFAULT false,

  -- Profile completion
  profile_complete  BOOLEAN NOT NULL DEFAULT false,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE patient_self_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON patient_self_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON patient_self_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON patient_self_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER update_patient_self_profiles_updated_at
  BEFORE UPDATE ON patient_self_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
