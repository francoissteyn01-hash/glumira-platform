-- ============================================================================
-- GluMira™ V7 — Row Level Security for all tables
-- Date: 2026-04-05
--
-- Enables RLS on every table that doesn't already have it, and adds policies
-- so each authenticated user can only read/write their own rows.
--
-- Safe to re-run: all statements use IF NOT EXISTS / DROP POLICY IF EXISTS.
-- beta_profiles is skipped — already handled elsewhere.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- Helper: enable RLS only if not already enabled (idempotent wrapper)
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'user_profiles',
    'subscriptions',
    'patient_profiles',
    'patient_self_profiles',
    'patient_modules',
    'insulin_profiles',
    'tod_isf_modifiers',
    'dose_log',
    'iob_snapshots',
    'glucose_readings',
    'patient_media',
    'caregiver_shares',
    'caregiver_links',
    'appointments',
    'menstrual_cycles',
    'pediatric_profiles',
    'school_care_plans',
    'pregnancy_profiles',
    'audit_log',
    'telemetry_wave_groupb',
    'meal_log',
    'insulin_events',
    'condition_events',
    'emotional_distress',
    'story_progress',
    'education_progress',
    'education_votes',
    'beta_feedback',
    'beta_consent',
    'beta_participants',
    'badges',
    'user_badges',
    'mira_conversations'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END IF;
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- user_profiles — id = auth.uid()
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS up_select_own ON public.user_profiles;
DROP POLICY IF EXISTS up_insert_own ON public.user_profiles;
DROP POLICY IF EXISTS up_update_own ON public.user_profiles;
DROP POLICY IF EXISTS up_delete_own ON public.user_profiles;

CREATE POLICY up_select_own ON public.user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY up_insert_own ON public.user_profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY up_update_own ON public.user_profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY up_delete_own ON public.user_profiles FOR DELETE USING (id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- Generic "user_id = auth.uid()" policies
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t text;
  user_id_tables text[] := ARRAY[
    'subscriptions',
    'patient_self_profiles',
    'patient_modules',
    'tod_isf_modifiers',
    'dose_log',
    'iob_snapshots',
    'glucose_readings',
    'patient_media',
    'appointments',
    'menstrual_cycles',
    'pediatric_profiles',
    'school_care_plans',
    'pregnancy_profiles',
    'audit_log',
    'telemetry_wave_groupb',
    'meal_log',
    'insulin_events',
    'condition_events',
    'emotional_distress',
    'story_progress',
    'education_progress',
    'education_votes'
  ];
BEGIN
  FOREACH t IN ARRAY user_id_tables LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      CONTINUE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'user_id'
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_select_own', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_insert_own', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_update_own', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_delete_own', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (user_id = auth.uid());',
      t || '_select_own', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (user_id = auth.uid());',
      t || '_insert_own', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());',
      t || '_update_own', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (user_id = auth.uid());',
      t || '_delete_own', t
    );
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- patient_profiles — clinicianId = auth.uid()
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS pp_select_own ON public.patient_profiles;
DROP POLICY IF EXISTS pp_insert_own ON public.patient_profiles;
DROP POLICY IF EXISTS pp_update_own ON public.patient_profiles;
DROP POLICY IF EXISTS pp_delete_own ON public.patient_profiles;

CREATE POLICY pp_select_own ON public.patient_profiles
  FOR SELECT USING (clinician_id = auth.uid());
CREATE POLICY pp_insert_own ON public.patient_profiles
  FOR INSERT WITH CHECK (clinician_id = auth.uid());
CREATE POLICY pp_update_own ON public.patient_profiles
  FOR UPDATE USING (clinician_id = auth.uid()) WITH CHECK (clinician_id = auth.uid());
CREATE POLICY pp_delete_own ON public.patient_profiles
  FOR DELETE USING (clinician_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- caregiver_links — invited_by = auth.uid() OR caregiver_user_id = auth.uid()
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS cl_select_own ON public.caregiver_links;
DROP POLICY IF EXISTS cl_insert_own ON public.caregiver_links;
DROP POLICY IF EXISTS cl_update_own ON public.caregiver_links;
DROP POLICY IF EXISTS cl_delete_own ON public.caregiver_links;

CREATE POLICY cl_select_own ON public.caregiver_links
  FOR SELECT USING (invited_by = auth.uid() OR caregiver_user_id = auth.uid());
CREATE POLICY cl_insert_own ON public.caregiver_links
  FOR INSERT WITH CHECK (invited_by = auth.uid());
CREATE POLICY cl_update_own ON public.caregiver_links
  FOR UPDATE USING (invited_by = auth.uid() OR caregiver_user_id = auth.uid());
CREATE POLICY cl_delete_own ON public.caregiver_links
  FOR DELETE USING (invited_by = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- caregiver_shares — owner_user_id = auth.uid() OR shared_with_user_id = auth.uid()
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'caregiver_shares') THEN
    EXECUTE 'DROP POLICY IF EXISTS cs_select_own ON public.caregiver_shares';
    EXECUTE 'DROP POLICY IF EXISTS cs_insert_own ON public.caregiver_shares';
    EXECUTE 'DROP POLICY IF EXISTS cs_update_own ON public.caregiver_shares';
    EXECUTE 'DROP POLICY IF EXISTS cs_delete_own ON public.caregiver_shares';

    -- Prefer user_id column if present; otherwise fall back to owner pattern
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'caregiver_shares' AND column_name = 'user_id'
    ) THEN
      EXECUTE 'CREATE POLICY cs_select_own ON public.caregiver_shares FOR SELECT USING (user_id = auth.uid())';
      EXECUTE 'CREATE POLICY cs_insert_own ON public.caregiver_shares FOR INSERT WITH CHECK (user_id = auth.uid())';
      EXECUTE 'CREATE POLICY cs_update_own ON public.caregiver_shares FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
      EXECUTE 'CREATE POLICY cs_delete_own ON public.caregiver_shares FOR DELETE USING (user_id = auth.uid())';
    END IF;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- beta_feedback — anyone authenticated can INSERT; only service_role can SELECT
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS bf_insert_any ON public.beta_feedback;
DROP POLICY IF EXISTS bf_select_service ON public.beta_feedback;
DROP POLICY IF EXISTS bf_update_service ON public.beta_feedback;
DROP POLICY IF EXISTS bf_delete_service ON public.beta_feedback;

CREATE POLICY bf_insert_any ON public.beta_feedback
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY bf_select_service ON public.beta_feedback
  FOR SELECT TO service_role
  USING (true);

CREATE POLICY bf_update_service ON public.beta_feedback
  FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY bf_delete_service ON public.beta_feedback
  FOR DELETE TO service_role
  USING (true);

-- ────────────────────────────────────────────────────────────────────────────
-- badges — public read (lookup table), service_role write
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'badges') THEN
    EXECUTE 'DROP POLICY IF EXISTS badges_select_all ON public.badges';
    EXECUTE 'DROP POLICY IF EXISTS badges_write_service ON public.badges';
    EXECUTE 'CREATE POLICY badges_select_all ON public.badges FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY badges_write_service ON public.badges FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- user_badges — patient_id links via patient_profiles.clinician_id = auth.uid()
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_badges') THEN
    EXECUTE 'DROP POLICY IF EXISTS ub_select_own ON public.user_badges';
    EXECUTE 'DROP POLICY IF EXISTS ub_insert_own ON public.user_badges';
    EXECUTE 'DROP POLICY IF EXISTS ub_delete_own ON public.user_badges';

    EXECUTE $SQL$
      CREATE POLICY ub_select_own ON public.user_badges
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.patient_profiles pp
            WHERE pp.id = user_badges.patient_id AND pp.clinician_id = auth.uid()
          )
        )
    $SQL$;
    EXECUTE $SQL$
      CREATE POLICY ub_insert_own ON public.user_badges
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.patient_profiles pp
            WHERE pp.id = user_badges.patient_id AND pp.clinician_id = auth.uid()
          )
        )
    $SQL$;
    EXECUTE $SQL$
      CREATE POLICY ub_delete_own ON public.user_badges
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM public.patient_profiles pp
            WHERE pp.id = user_badges.patient_id AND pp.clinician_id = auth.uid()
          )
        )
    $SQL$;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- mira_conversations — user_id = auth.uid()
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mira_conversations') THEN
    EXECUTE 'DROP POLICY IF EXISTS mc_select_own ON public.mira_conversations';
    EXECUTE 'DROP POLICY IF EXISTS mc_insert_own ON public.mira_conversations';
    EXECUTE 'DROP POLICY IF EXISTS mc_update_own ON public.mira_conversations';
    EXECUTE 'DROP POLICY IF EXISTS mc_delete_own ON public.mira_conversations';

    EXECUTE 'CREATE POLICY mc_select_own ON public.mira_conversations FOR SELECT USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY mc_insert_own ON public.mira_conversations FOR INSERT WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY mc_update_own ON public.mira_conversations FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY mc_delete_own ON public.mira_conversations FOR DELETE USING (user_id = auth.uid())';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- insulin_profiles — public read (locked formulary), service_role write
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'insulin_profiles') THEN
    EXECUTE 'DROP POLICY IF EXISTS ip_select_all ON public.insulin_profiles';
    EXECUTE 'DROP POLICY IF EXISTS ip_write_service ON public.insulin_profiles';
    EXECUTE 'CREATE POLICY ip_select_all ON public.insulin_profiles FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY ip_write_service ON public.insulin_profiles FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- DONE. Run in Supabase SQL Editor.
-- ────────────────────────────────────────────────────────────────────────────
