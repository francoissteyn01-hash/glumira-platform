-- GluMira™ V7 — Missing tables + column fixes
-- Run in Supabase SQL Editor

-- ─── Caregiver Links ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.caregiver_links (
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

-- ─── Patient profile: basal frequency column ─────────────────────────────────
ALTER TABLE public.patient_self_profiles ADD COLUMN IF NOT EXISTS basal_frequency TEXT DEFAULT 'once_daily';

-- ─── Beta Feedback ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  demo_profile_id TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  value_added TEXT CHECK (value_added IN ('yes', 'somewhat', 'no')),
  improvement TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Beta Consent ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.beta_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT NOT NULL,
  consented BOOLEAN NOT NULL DEFAULT TRUE,
  consent_text_version TEXT NOT NULL DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_caregiver_links_child ON public.caregiver_links (child_profile_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_links_email ON public.caregiver_links (caregiver_email);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created ON public.beta_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_consent_session ON public.beta_consent (session_id);
