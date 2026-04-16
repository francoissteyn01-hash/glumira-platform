-- ============================================================================
-- GluMira™ V7 — RLS Hardening: fix gaps in existing policies
-- Date: 2026-04-16
-- Applied via Supabase MCP (migration name: rls_hardening_complete)
--
-- Audit findings resolved:
-- 1. glucose_readings — open "qual: true" service policy dropped; replaced with
--    patient-scoped policies via patient_profiles → pro_profiles → user_id.
--    Service role retains a separate bypass policy for Dexcom/ingestion pipelines.
-- 2. patient_media — was SELECT-only; INSERT/UPDATE/DELETE added with same
--    patient ownership pattern as SELECT.
-- 3. story_progress — DELETE policy was missing; added user_id = auth.uid().
-- 4. audit_log — INSERT policy added for service_role only (app never writes
--    audit rows directly; only server-side triggers do).
--
-- Not applied (tables do not yet exist):
--   meal_plans, iob_historical_snapshots
--   → Apply RLS when those tables are created in a future migration.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. glucose_readings
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS glucose_readings_service_all ON public.glucose_readings;
DROP POLICY IF EXISTS glucose_readings_select_own  ON public.glucose_readings;
DROP POLICY IF EXISTS glucose_readings_insert_own  ON public.glucose_readings;
DROP POLICY IF EXISTS glucose_readings_update_own  ON public.glucose_readings;
DROP POLICY IF EXISTS glucose_readings_delete_own  ON public.glucose_readings;
DROP POLICY IF EXISTS glucose_readings_service_rw  ON public.glucose_readings;

CREATE POLICY glucose_readings_select_own ON public.glucose_readings
  FOR SELECT USING (
    patient_id IN (
      SELECT pp.id FROM patient_profiles pp
      JOIN pro_profiles pr ON (pp.pro_profile_id = pr.id OR pp.clinician_id = pr.id)
      WHERE pr.user_id = auth.uid()
    )
  );

CREATE POLICY glucose_readings_insert_own ON public.glucose_readings
  FOR INSERT WITH CHECK (
    patient_id IN (
      SELECT pp.id FROM patient_profiles pp
      JOIN pro_profiles pr ON (pp.pro_profile_id = pr.id OR pp.clinician_id = pr.id)
      WHERE pr.user_id = auth.uid()
    )
  );

CREATE POLICY glucose_readings_update_own ON public.glucose_readings
  FOR UPDATE USING (
    patient_id IN (
      SELECT pp.id FROM patient_profiles pp
      JOIN pro_profiles pr ON (pp.pro_profile_id = pr.id OR pp.clinician_id = pr.id)
      WHERE pr.user_id = auth.uid()
    )
  );

CREATE POLICY glucose_readings_delete_own ON public.glucose_readings
  FOR DELETE USING (
    patient_id IN (
      SELECT pp.id FROM patient_profiles pp
      JOIN pro_profiles pr ON (pp.pro_profile_id = pr.id OR pp.clinician_id = pr.id)
      WHERE pr.user_id = auth.uid()
    )
  );

-- Service role bypass for Dexcom sync / ingestion pipelines
CREATE POLICY glucose_readings_service_rw ON public.glucose_readings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. patient_media
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own patient media" ON public.patient_media;
DROP POLICY IF EXISTS patient_media_select_own ON public.patient_media;
DROP POLICY IF EXISTS patient_media_insert_own ON public.patient_media;
DROP POLICY IF EXISTS patient_media_update_own ON public.patient_media;
DROP POLICY IF EXISTS patient_media_delete_own ON public.patient_media;

CREATE POLICY patient_media_select_own ON public.patient_media
  FOR SELECT USING (
    patient_id IN (
      SELECT pp.id FROM patient_profiles pp
      JOIN pro_profiles pr ON (pp.pro_profile_id = pr.id OR pp.clinician_id = pr.id)
      WHERE pr.user_id = auth.uid()
    )
  );

CREATE POLICY patient_media_insert_own ON public.patient_media
  FOR INSERT WITH CHECK (
    patient_id IN (
      SELECT pp.id FROM patient_profiles pp
      JOIN pro_profiles pr ON (pp.pro_profile_id = pr.id OR pp.clinician_id = pr.id)
      WHERE pr.user_id = auth.uid()
    )
  );

CREATE POLICY patient_media_update_own ON public.patient_media
  FOR UPDATE USING (
    patient_id IN (
      SELECT pp.id FROM patient_profiles pp
      JOIN pro_profiles pr ON (pp.pro_profile_id = pr.id OR pp.clinician_id = pr.id)
      WHERE pr.user_id = auth.uid()
    )
  );

CREATE POLICY patient_media_delete_own ON public.patient_media
  FOR DELETE USING (
    patient_id IN (
      SELECT pp.id FROM patient_profiles pp
      JOIN pro_profiles pr ON (pp.pro_profile_id = pr.id OR pp.clinician_id = pr.id)
      WHERE pr.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 3. story_progress — add missing DELETE
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS story_progress_delete_own ON public.story_progress;

CREATE POLICY story_progress_delete_own ON public.story_progress
  FOR DELETE USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- 4. audit_log — INSERT is service_role only
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS audit_log_insert_service ON public.audit_log;

CREATE POLICY audit_log_insert_service ON public.audit_log
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────────
-- Reload PostgREST schema cache
-- ────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
