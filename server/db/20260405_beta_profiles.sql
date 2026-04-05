-- GluMira™ V7 — Beta Profiles + 5 Case Studies
-- Run in Supabase SQL Editor

-- ─── beta_profiles table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.beta_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                                      -- null for pre-loaded case studies
  profile_name TEXT NOT NULL,
  profile_type TEXT NOT NULL,                        -- paediatric | adult | teen | clinician
  case_code TEXT,                                    -- CASE-BETA-001..005 for seeds
  basal_insulin TEXT,
  basal_dose DECIMAL(5, 2),
  basal_times TEXT[],
  bolus_insulins JSONB,                              -- array of { insulin, dose, time } objects
  glucose_units TEXT NOT NULL DEFAULT 'mmol/L',
  is_preloaded BOOLEAN NOT NULL DEFAULT FALSE,
  disclaimer TEXT NOT NULL DEFAULT 'BETA TEST DATA — NOT REAL PATIENT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beta_profiles_user ON public.beta_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_beta_profiles_preloaded ON public.beta_profiles (is_preloaded) WHERE is_preloaded = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_beta_profiles_case ON public.beta_profiles (case_code) WHERE case_code IS NOT NULL;

-- Row level security
ALTER TABLE public.beta_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own + preloaded profiles" ON public.beta_profiles;
CREATE POLICY "Users read own + preloaded profiles"
  ON public.beta_profiles FOR SELECT
  USING (is_preloaded = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own profiles" ON public.beta_profiles;
CREATE POLICY "Users insert own profiles"
  ON public.beta_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_preloaded = FALSE);

DROP POLICY IF EXISTS "Users update own profiles" ON public.beta_profiles;
CREATE POLICY "Users update own profiles"
  ON public.beta_profiles FOR UPDATE
  USING (auth.uid() = user_id AND is_preloaded = FALSE);

DROP POLICY IF EXISTS "Users delete own profiles" ON public.beta_profiles;
CREATE POLICY "Users delete own profiles"
  ON public.beta_profiles FOR DELETE
  USING (auth.uid() = user_id AND is_preloaded = FALSE);

-- ─── Seed 5 preloaded case studies ───────────────────────────────────────────

-- Clear existing seeds before reinserting (idempotent)
DELETE FROM public.beta_profiles WHERE is_preloaded = TRUE;

-- CASE-BETA-001: Paediatric overnight lows
INSERT INTO public.beta_profiles
  (user_id, profile_name, profile_type, case_code, basal_insulin, basal_dose, basal_times, bolus_insulins, glucose_units, is_preloaded)
VALUES (
  NULL,
  'Paediatric Overnight Lows',
  'paediatric',
  'CASE-BETA-001',
  'Degludec',
  12.00,
  ARRAY['18:30'],
  '[
    {"insulin": "Fiasp",    "dose": 3.00, "time": "07:00"},
    {"insulin": "Fiasp",    "dose": 2.50, "time": "12:30"},
    {"insulin": "Humulin R","dose": 3.50, "time": "18:00"}
  ]'::jsonb,
  'mmol/L',
  TRUE
);

-- CASE-BETA-002: Gastro emergency (3x basal)
INSERT INTO public.beta_profiles
  (user_id, profile_name, profile_type, case_code, basal_insulin, basal_dose, basal_times, bolus_insulins, glucose_units, is_preloaded)
VALUES (
  NULL,
  'Gastro Emergency',
  'paediatric',
  'CASE-BETA-002',
  'Levemir',
  7.00,
  ARRAY['06:00', '13:30', '20:35'],
  '[
    {"insulin": "Fiasp",    "dose": 1.00, "time": "07:00"},
    {"insulin": "Actrapid", "dose": 1.50, "time": "12:00"},
    {"insulin": "Fiasp",    "dose": 1.00, "time": "18:00"},
    {"insulin": "Actrapid", "dose": 1.50, "time": "18:30"}
  ]'::jsonb,
  'mmol/L',
  TRUE
);

-- CASE-BETA-003: Shift worker adult
INSERT INTO public.beta_profiles
  (user_id, profile_name, profile_type, case_code, basal_insulin, basal_dose, basal_times, bolus_insulins, glucose_units, is_preloaded)
VALUES (
  NULL,
  'Shift Worker',
  'adult',
  'CASE-BETA-003',
  'Glargine',
  22.00,
  ARRAY['22:00'],
  '[
    {"insulin": "Novorapid", "dose": 6.00, "time": "07:00"},
    {"insulin": "Novorapid", "dose": 8.00, "time": "13:00"},
    {"insulin": "Novorapid", "dose": 4.00, "time": "19:00"}
  ]'::jsonb,
  'mmol/L',
  TRUE
);

-- CASE-BETA-004: Newly diagnosed teen
INSERT INTO public.beta_profiles
  (user_id, profile_name, profile_type, case_code, basal_insulin, basal_dose, basal_times, bolus_insulins, glucose_units, is_preloaded)
VALUES (
  NULL,
  'Newly Diagnosed Teen',
  'teen',
  'CASE-BETA-004',
  'Glargine',
  16.00,
  ARRAY['21:00'],
  '[
    {"insulin": "Novorapid", "dose": 3.00, "time": "07:00"},
    {"insulin": "Novorapid", "dose": 5.00, "time": "12:30"},
    {"insulin": "Novorapid", "dose": 4.00, "time": "18:30"}
  ]'::jsonb,
  'mg/dL',
  TRUE
);

-- CASE-BETA-005: Clinician multi-patient view
INSERT INTO public.beta_profiles
  (user_id, profile_name, profile_type, case_code, basal_insulin, basal_dose, basal_times, bolus_insulins, glucose_units, is_preloaded)
VALUES (
  NULL,
  'Clinician Multi-Patient',
  'clinician',
  'CASE-BETA-005',
  NULL,
  NULL,
  NULL,
  '[
    {"patient_id": "SUBJ-A", "summary": "Paediatric, unstable, newly diagnosed"},
    {"patient_id": "SUBJ-B", "summary": "Teen, stable, approaching puberty"},
    {"patient_id": "SUBJ-C", "summary": "Adult, burnout, poor adherence"}
  ]'::jsonb,
  'mmol/L',
  TRUE
);
