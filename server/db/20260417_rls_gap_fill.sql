-- ============================================================================
-- GluMira™ V7 — RLS Gap Fill
-- Date: 2026-04-17
--
-- Gaps resolved:
-- 1. insulin_doses — ENABLE ROW LEVEL SECURITY was missing; UPDATE and DELETE
--    policies were missing (only SELECT + INSERT existed).
-- 2. beta_consent / beta_participants — included in ENABLE list in
--    20260405_rls_all_tables.sql but had no user-scoped policies; adding
--    them now (guarded by IF EXISTS so migration is safe if tables absent).
--
-- Deferred (tables not yet created in production):
--   meal_plans, iob_historical_snapshots — add RLS in the migration that
--   creates them (per note in 20260416_rls_hardening_complete.sql).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. insulin_doses — enable RLS + add missing UPDATE / DELETE policies
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.insulin_doses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insulin_doses_update_own ON public.insulin_doses;
DROP POLICY IF EXISTS insulin_doses_delete_own ON public.insulin_doses;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'insulin_doses') THEN
    EXECUTE $SQL$
      CREATE POLICY insulin_doses_update_own ON public.insulin_doses
        FOR UPDATE USING (
          profile_id IN (SELECT id FROM patient_profiles WHERE user_id = auth.uid())
        ) WITH CHECK (
          profile_id IN (SELECT id FROM patient_profiles WHERE user_id = auth.uid())
        )
    $SQL$;

    EXECUTE $SQL$
      CREATE POLICY insulin_doses_delete_own ON public.insulin_doses
        FOR DELETE USING (
          profile_id IN (SELECT id FROM patient_profiles WHERE user_id = auth.uid())
        )
    $SQL$;

    -- Service role bypass for pump sync / import pipelines
    EXECUTE $SQL$
      DROP POLICY IF EXISTS insulin_doses_service_rw ON public.insulin_doses
    $SQL$;
    EXECUTE $SQL$
      CREATE POLICY insulin_doses_service_rw ON public.insulin_doses
        FOR ALL TO service_role USING (true) WITH CHECK (true)
    $SQL$;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. beta_consent — user_id = auth.uid() (authenticated can self-consent)
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'beta_consent') THEN
    ALTER TABLE public.beta_consent ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS bc_select_own ON public.beta_consent';
    EXECUTE 'DROP POLICY IF EXISTS bc_insert_own ON public.beta_consent';
    EXECUTE 'DROP POLICY IF EXISTS bc_update_own ON public.beta_consent';
    EXECUTE 'DROP POLICY IF EXISTS bc_delete_own ON public.beta_consent';

    EXECUTE 'CREATE POLICY bc_select_own ON public.beta_consent FOR SELECT USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY bc_insert_own ON public.beta_consent FOR INSERT WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY bc_update_own ON public.beta_consent FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY bc_delete_own ON public.beta_consent FOR DELETE USING (user_id = auth.uid())';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. beta_participants — user_id = auth.uid(); service_role can SELECT all
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'beta_participants') THEN
    ALTER TABLE public.beta_participants ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS bpart_select_own  ON public.beta_participants';
    EXECUTE 'DROP POLICY IF EXISTS bpart_insert_own  ON public.beta_participants';
    EXECUTE 'DROP POLICY IF EXISTS bpart_update_own  ON public.beta_participants';
    EXECUTE 'DROP POLICY IF EXISTS bpart_delete_own  ON public.beta_participants';
    EXECUTE 'DROP POLICY IF EXISTS bpart_service_sel ON public.beta_participants';

    EXECUTE 'CREATE POLICY bpart_select_own  ON public.beta_participants FOR SELECT USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY bpart_insert_own  ON public.beta_participants FOR INSERT WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY bpart_update_own  ON public.beta_participants FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY bpart_delete_own  ON public.beta_participants FOR DELETE USING (user_id = auth.uid())';
    -- Service role reads all participants for admin dashboard
    EXECUTE 'CREATE POLICY bpart_service_sel ON public.beta_participants FOR SELECT TO service_role USING (true)';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- Reload PostgREST schema cache
-- ────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
