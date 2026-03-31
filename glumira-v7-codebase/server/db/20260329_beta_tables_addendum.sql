-- ============================================================
-- GluMira™ V7 — Addendum to main schema
-- File: 20260329_beta_tables_addendum.sql
-- Adds tables referenced by 04.2.86 migration that were
-- missing from the main schema.
-- Version: v1.0 · 2026-03-29
-- ============================================================

-- ─── beta_participants ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.beta_participants (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  participant_id  VARCHAR(30) UNIQUE NOT NULL,  -- ZA-001, NAM-001, AF-001, INT-001
  region          TEXT        NOT NULL DEFAULT 'INT',
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'active', 'inactive', 'withdrawn')),
  consent_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  consent_given_at TIMESTAMPTZ,
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at  TIMESTAMPTZ,
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_beta_participants_status
  ON public.beta_participants (status);
CREATE INDEX IF NOT EXISTS idx_beta_participants_region
  ON public.beta_participants (region);

ALTER TABLE public.beta_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own participant record"
  ON public.beta_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages all participants"
  ON public.beta_participants FOR ALL
  USING (auth.role() = 'service_role');

-- ─── beta_feedback ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  participant_id  VARCHAR(30),  -- matches beta_participants.participant_id
  category        TEXT        NOT NULL
                              CHECK (category IN (
                                'iob_chart', 'glucose_timeline', 'bolus_calculator',
                                'school_care_plan', 'ai_assistant', 'data_sync',
                                'general', 'bug'
                              )),
  rating          SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  nps_score       SMALLINT    CHECK (nps_score BETWEEN 0 AND 10),
  page_context    TEXT,
  session_id      TEXT,
  device_type     TEXT        CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_user
  ON public.beta_feedback (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_category
  ON public.beta_feedback (category);

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON public.beta_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role reads all feedback"
  ON public.beta_feedback FOR SELECT
  USING (auth.role() = 'service_role');

-- ─── doses (alias view for dose_log) ─────────────────────────
-- 04.2.86 migration references `public.doses` but main schema uses `dose_log`.
-- Create a view so both work during transition.
CREATE OR REPLACE VIEW public.doses AS
  SELECT * FROM public.dose_log;

-- ─── set_updated_at function (referenced by 04.2.86 trigger) ─
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
