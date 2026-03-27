-- GluMira™ Group B Migration — Beta Telemetry & Onboarding
-- Version: 7.0.0
-- Date: 2026-03-27
--
-- Adds:
--   1. telemetry_events — tracks every user action for DAU/feature utilization
--   2. onboarding_checkpoints — enforces mandatory baseline data capture
--   3. beta_metrics_daily — materialized daily aggregates for grant dashboards
--   4. beta_cohort_summary view — real-time cohort analytics
--
-- GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.

-- ─── 1. telemetry_events ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.telemetry_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id      UUID,
  event_name      TEXT        NOT NULL,
  event_category  TEXT        NOT NULL
                              CHECK (event_category IN (
                                'navigation', 'feature_use', 'data_entry',
                                'sync', 'ai_interaction', 'feedback',
                                'onboarding', 'export', 'error'
                              )),
  event_data      JSONB       DEFAULT '{}',
  page_context    TEXT,
  device_type     TEXT        CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_user_created
  ON public.telemetry_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_event_name
  ON public.telemetry_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_category
  ON public.telemetry_events (event_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_session
  ON public.telemetry_events (session_id);

ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own telemetry"
  ON public.telemetry_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can read all telemetry"
  ON public.telemetry_events FOR SELECT
  USING (auth.role() = 'service_role');

-- ─── 2. onboarding_checkpoints ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.onboarding_checkpoints (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  profile_created       BOOLEAN     NOT NULL DEFAULT FALSE,
  diabetes_type_set     BOOLEAN     NOT NULL DEFAULT FALSE,
  glucose_unit_set      BOOLEAN     NOT NULL DEFAULT FALSE,
  target_range_set      BOOLEAN     NOT NULL DEFAULT FALSE,
  isf_set               BOOLEAN     NOT NULL DEFAULT FALSE,
  icr_set               BOOLEAN     NOT NULL DEFAULT FALSE,
  dia_set               BOOLEAN     NOT NULL DEFAULT FALSE,
  cgm_source_connected  BOOLEAN     NOT NULL DEFAULT FALSE,
  first_sync_complete   BOOLEAN     NOT NULL DEFAULT FALSE,
  dashboard_viewed      BOOLEAN     NOT NULL DEFAULT FALSE,
  iob_chart_viewed      BOOLEAN     NOT NULL DEFAULT FALSE,
  feedback_submitted    BOOLEAN     NOT NULL DEFAULT FALSE,
  onboarding_complete   BOOLEAN     GENERATED ALWAYS AS (
    profile_created AND diabetes_type_set AND glucose_unit_set AND
    target_range_set AND isf_set AND icr_set AND dia_set AND
    cgm_source_connected AND first_sync_complete
  ) STORED,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_user
  ON public.onboarding_checkpoints (user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_complete
  ON public.onboarding_checkpoints (onboarding_complete);

ALTER TABLE public.onboarding_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own onboarding"
  ON public.onboarding_checkpoints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding"
  ON public.onboarding_checkpoints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding"
  ON public.onboarding_checkpoints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS onboarding_checkpoints_updated_at ON public.onboarding_checkpoints;
CREATE TRIGGER onboarding_checkpoints_updated_at
  BEFORE UPDATE ON public.onboarding_checkpoints
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 3. beta_metrics_daily ───────────────────────────────────
-- Aggregated daily metrics for grant reporting dashboards

CREATE TABLE IF NOT EXISTS public.beta_metrics_daily (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date     DATE        NOT NULL,
  total_users     INTEGER     NOT NULL DEFAULT 0,
  active_users    INTEGER     NOT NULL DEFAULT 0,    -- DAU
  new_users       INTEGER     NOT NULL DEFAULT 0,
  total_events    INTEGER     NOT NULL DEFAULT 0,
  sync_count      INTEGER     NOT NULL DEFAULT 0,
  feedback_count  INTEGER     NOT NULL DEFAULT 0,
  ai_queries      INTEGER     NOT NULL DEFAULT 0,
  avg_session_sec INTEGER     NOT NULL DEFAULT 0,
  feature_usage   JSONB       DEFAULT '{}',          -- { "iob_chart": 12, "glucose_timeline": 45, ... }
  retention_7d    NUMERIC(5,2),                      -- % of users active in last 7 days
  retention_30d   NUMERIC(5,2),                      -- % of users active in last 30 days
  avg_tir         NUMERIC(5,2),                      -- Average Time in Range across cohort
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_beta_metrics_date
  ON public.beta_metrics_daily (metric_date);

ALTER TABLE public.beta_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage beta metrics"
  ON public.beta_metrics_daily FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 4. beta_cohort_summary view ─────────────────────────────
-- Real-time view for the admin dashboard

CREATE OR REPLACE VIEW public.beta_cohort_summary AS
SELECT
  -- Participant counts
  (SELECT COUNT(*) FROM public.beta_participants)                                   AS total_enrolled,
  (SELECT COUNT(*) FROM public.beta_participants WHERE status = 'active')           AS active_participants,
  (SELECT COUNT(*) FROM public.beta_participants WHERE status = 'pending')          AS pending_participants,

  -- Onboarding funnel
  (SELECT COUNT(*) FROM public.onboarding_checkpoints WHERE profile_created)        AS profiles_created,
  (SELECT COUNT(*) FROM public.onboarding_checkpoints WHERE cgm_source_connected)   AS cgm_connected,
  (SELECT COUNT(*) FROM public.onboarding_checkpoints WHERE first_sync_complete)    AS first_sync_done,
  (SELECT COUNT(*) FROM public.onboarding_checkpoints WHERE onboarding_complete)    AS fully_onboarded,

  -- Engagement (last 24h)
  (SELECT COUNT(DISTINCT user_id) FROM public.telemetry_events
   WHERE created_at > NOW() - INTERVAL '24 hours')                                 AS dau_24h,

  -- Engagement (last 7d)
  (SELECT COUNT(DISTINCT user_id) FROM public.telemetry_events
   WHERE created_at > NOW() - INTERVAL '7 days')                                   AS wau_7d,

  -- Feedback
  (SELECT COUNT(*) FROM public.beta_feedback)                                       AS total_feedback,
  (SELECT ROUND(AVG(rating), 2) FROM public.beta_feedback)                          AS avg_rating,

  -- Data volume
  (SELECT COUNT(*) FROM public.glucose_readings)                                    AS total_glucose_readings,
  (SELECT COUNT(*) FROM public.doses)                                               AS total_doses,

  -- Telemetry volume
  (SELECT COUNT(*) FROM public.telemetry_events)                                    AS total_events,

  NOW() AS computed_at;

-- ─── Summary ─────────────────────────────────────────────────
-- Migration complete.
-- Tables created: telemetry_events, onboarding_checkpoints, beta_metrics_daily
-- View created: beta_cohort_summary
-- RLS enabled on all new tables.
-- Indexes optimized for time-series queries and cohort analytics.
