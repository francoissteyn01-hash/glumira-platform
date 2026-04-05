-- GluMira V7 — Autism + T1D module tables
-- Created 2026-04-05

CREATE TABLE IF NOT EXISTS autism_sensory_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  sensory_mode TEXT DEFAULT 'standard' CHECK (sensory_mode IN ('standard', 'low_stimulation', 'minimal')),
  food_aversions TEXT[] DEFAULT '{}',
  food_textures_avoided TEXT[] DEFAULT '{}',
  preferred_hypo_treatments TEXT[] DEFAULT '{}',
  injection_site_tolerance JSONB DEFAULT '{}',
  meltdown_triggers TEXT[] DEFAULT '{}',
  meltdown_glucose_protocol JSONB DEFAULT '{}',
  communication_preferences JSONB DEFAULT '{"literal": true, "one_idea_per_message": true, "no_idioms": true, "structured_responses": true}',
  visual_schedule JSONB DEFAULT '[]',
  burnout_mode BOOLEAN DEFAULT FALSE,
  burnout_detected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS injection_site_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  site TEXT NOT NULL,
  tolerance TEXT CHECK (tolerance IN ('ok','difficult','refused','not_tried')),
  notes TEXT,
  numbing_cream BOOLEAN DEFAULT FALSE,
  distraction_needed BOOLEAN DEFAULT FALSE,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meltdown_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  trigger TEXT,
  glucose_before DECIMAL,
  glucose_after DECIMAL,
  glucose_units TEXT DEFAULT 'mmol/L',
  duration_minutes INTEGER,
  hypo_treatment_used TEXT,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);
