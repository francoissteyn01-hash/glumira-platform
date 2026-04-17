-- ============================================================
-- GluMira™ V7 — Fix beta_cohort_summary security
-- File: 20260417_fix_beta_cohort_summary_security.sql
-- Fixes: SECURITY DEFINER → SECURITY INVOKER (Supabase Advisor issue)
-- Version: v1.0 · 2026-04-17
-- ============================================================

-- Drop and recreate the view with SECURITY INVOKER (default, safe).
-- SECURITY DEFINER runs as the view owner (bypasses RLS).
-- SECURITY INVOKER runs as the calling user (respects RLS).
-- This view aggregates public beta metrics — no user-specific data,
-- so SECURITY INVOKER is correct and safe.

DROP VIEW IF EXISTS public.beta_cohort_summary;

CREATE VIEW public.beta_cohort_summary
  WITH (security_invoker = true)
AS
SELECT
  -- Enrollment
  COUNT(*)                                                          AS total_enrolled,
  COUNT(*) FILTER (WHERE bp.status = 'active')                     AS active_participants,
  COUNT(*) FILTER (WHERE bp.status = 'pending')                    AS pending_participants,

  -- Profile completion
  COUNT(DISTINCT pp.user_id)                                        AS profiles_created,
  COUNT(DISTINCT dc.user_id)                                        AS cgm_connected,
  COUNT(*) FILTER (WHERE bp.last_active_at IS NOT NULL)            AS first_sync_done,

  -- Activity
  COUNT(*) FILTER (
    WHERE bp.last_active_at > NOW() - INTERVAL '24 hours'
  )                                                                  AS dau_24h,
  COUNT(*) FILTER (
    WHERE bp.last_active_at > NOW() - INTERVAL '7 days'
  )                                                                  AS wau_7d,

  -- Feedback
  (SELECT COUNT(*)   FROM public.beta_feedback)                     AS total_feedback,
  (SELECT AVG(rating) FROM public.beta_feedback)                    AS avg_rating,

  -- Clinical data volume
  (SELECT COUNT(*) FROM public.glucose_readings)                    AS total_glucose_readings,
  (SELECT COUNT(*) FROM public.dose_log)                            AS total_doses,
  (SELECT COUNT(*) FROM public.telemetry_events)                    AS total_events,

  NOW()                                                             AS computed_at

FROM public.beta_participants bp
LEFT JOIN public.patient_profiles pp ON pp.user_id = bp.user_id
LEFT JOIN public.dexcom_connections dc ON dc.user_id = bp.user_id;

-- Grant SELECT to authenticated users and service_role
GRANT SELECT ON public.beta_cohort_summary TO authenticated;
GRANT SELECT ON public.beta_cohort_summary TO service_role;

COMMENT ON VIEW public.beta_cohort_summary IS
  'Aggregated beta cohort metrics. SECURITY INVOKER — respects RLS. Read-only summary, no PII exposed.';
