-- GluMira™ V7 — Insulin Log Schema
-- Basal, bolus, BG, food, low intervention, Nightscout, Clarity

-- Basal insulin entries (unlimited per day)
CREATE TABLE IF NOT EXISTS basal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  profile_id UUID REFERENCES beta_profiles(id),
  insulin_name TEXT NOT NULL,
  dose DECIMAL(6,2) NOT NULL CHECK (dose > 0),
  administered_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal bolus entries
CREATE TABLE IF NOT EXISTS bolus_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  profile_id UUID REFERENCES beta_profiles(id),
  insulin_name TEXT NOT NULL,
  dose DECIMAL(6,2) NOT NULL CHECK (dose > 0),
  administered_at TIMESTAMPTZ NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack','correction')),
  food_entry_id UUID REFERENCES food_entries(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finger stick / BG readings
CREATE TABLE IF NOT EXISTS bg_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  profile_id UUID REFERENCES beta_profiles(id),
  glucose_value DECIMAL(6,2) NOT NULL,
  glucose_unit TEXT NOT NULL CHECK (glucose_unit IN ('mmol/L','mg/dL')),
  measured_at TIMESTAMPTZ NOT NULL,
  context TEXT CHECK (context IN ('fasting','pre_meal','post_meal_1h','post_meal_2h','bedtime','night_check','low_treatment','other')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual','clarity_import','nightscout','cgm')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food entries
CREATE TABLE IF NOT EXISTS food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  profile_id UUID REFERENCES beta_profiles(id),
  meal_type TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  food_regime TEXT,
  carbs_g DECIMAL(8,2),
  protein_g DECIMAL(8,2),
  fat_g DECIMAL(8,2),
  fibre_g DECIMAL(8,2),
  description TEXT,
  photo_url TEXT,
  logged_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Low intervention entries
CREATE TABLE IF NOT EXISTS low_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  profile_id UUID REFERENCES beta_profiles(id),
  treatment_type TEXT NOT NULL,
  amount DECIMAL(8,2),
  amount_unit TEXT CHECK (amount_unit IN ('g','mg','ml')),
  glucose_before DECIMAL(6,2),
  glucose_after DECIMAL(6,2),
  glucose_unit TEXT NOT NULL CHECK (glucose_unit IN ('mmol/L','mg/dL')),
  treated_at TIMESTAMPTZ NOT NULL,
  resolved BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nightscout connection config
CREATE TABLE IF NOT EXISTS nightscout_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  site_url TEXT NOT NULL,
  api_secret_hash TEXT NOT NULL,
  auto_sync BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  sync_bg BOOLEAN DEFAULT TRUE,
  sync_treatments BOOLEAN DEFAULT TRUE,
  sync_profile BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clarity import log
CREATE TABLE IF NOT EXISTS clarity_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  filename TEXT,
  rows_imported INTEGER DEFAULT 0,
  rows_skipped INTEGER DEFAULT 0,
  import_date_range_start TIMESTAMPTZ,
  import_date_range_end TIMESTAMPTZ,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_basal_user_time ON basal_entries(user_id, administered_at DESC);
CREATE INDEX IF NOT EXISTS idx_bolus_user_time ON bolus_entries(user_id, administered_at DESC);
CREATE INDEX IF NOT EXISTS idx_bg_user_time ON bg_entries(user_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_user_time ON food_entries(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_low_user_time ON low_interventions(user_id, treated_at DESC);

-- RLS
ALTER TABLE basal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolus_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bg_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nightscout_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE clarity_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own basal" ON basal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own bolus" ON bolus_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own bg" ON bg_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own food" ON food_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own low" ON low_interventions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own ns" ON nightscout_config FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own clarity" ON clarity_imports FOR ALL USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
