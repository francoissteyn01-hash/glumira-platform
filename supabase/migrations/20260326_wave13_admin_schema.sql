-- GluMira™ Wave 13 Migration
-- Version: 7.0.0
-- Date: 2026-03-26
--
-- Adds:
--   1. beta_participants table
--   2. role column to patient_profiles
--   3. admin_platform_stats view
--   4. feedback_summary view
--   5. RLS policies for all new objects
--
-- GluMira™ is an informational tool only. Not a medical device.

-- ─── 1. beta_participants ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.beta_participants (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_id   TEXT        NOT NULL UNIQUE,          -- e.g. "NAM-001", "ZA-001"
  email            TEXT        NOT NULL,
  nightscout_url   TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('active', 'inactive', 'pending')),
  beta_code        TEXT,
  onboarding_step  INTEGER     NOT NULL DEFAULT 0,
  notes            TEXT,
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS beta_participants_user_id_idx    ON public.beta_participants(user_id);
CREATE INDEX IF NOT EXISTS beta_participants_status_idx     ON public.beta_participants(status);
CREATE INDEX IF NOT EXISTS beta_participants_joined_at_idx  ON public.beta_participants(joined_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS beta_participants_updated_at ON public.beta_participants;
CREATE TRIGGER beta_participants_updated_at
  BEFORE UPDATE ON public.beta_participants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 2. role column on patient_profiles ──────────────────────

ALTER TABLE public.patient_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'patient'
  CHECK (role IN ('patient', 'clinician', 'admin'));

CREATE INDEX IF NOT EXISTS patient_profiles_role_idx ON public.patient_profiles(role);

-- ─── 3. admin_platform_stats view ────────────────────────────

CREATE OR REPLACE VIEW public.admin_platform_stats AS
SELECT
  (SELECT COUNT(*) FROM public.patient_profiles)                                          AS total_users,
  (SELECT COUNT(*) FROM public.patient_profiles
   WHERE updated_at >= NOW() - INTERVAL '7 days')                                         AS active_users_7d,
  (SELECT COUNT(*) FROM public.glucose_readings)                                          AS total_readings,
  (SELECT COUNT(*) FROM public.doses)                                                     AS total_doses,
  (SELECT COUNT(*) FROM public.beta_participants WHERE status = 'active')                 AS beta_participants,
  (SELECT COUNT(*) FROM public.beta_feedback)                                             AS feedback_count,
  (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.beta_feedback)                      AS avg_feedback_rating,
  NOW()                                                                                   AS computed_at;

-- ─── 4. feedback_summary view ────────────────────────────────

CREATE OR REPLACE VIEW public.feedback_summary AS
SELECT
  category,
  COUNT(*)                              AS count,
  ROUND(AVG(rating)::NUMERIC, 2)        AS avg_rating,
  MIN(created_at)                       AS first_at,
  MAX(created_at)                       AS last_at
FROM public.beta_feedback
GROUP BY category
ORDER BY count DESC;

-- ─── 5. RLS policies ─────────────────────────────────────────

ALTER TABLE public.beta_participants ENABLE ROW LEVEL SECURITY;

-- Admins can read all participants
CREATE POLICY "admin_read_beta_participants"
  ON public.beta_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Participants can read their own record
CREATE POLICY "self_read_beta_participant"
  ON public.beta_participants FOR SELECT
  USING (user_id = auth.uid());

-- Admins can insert/update participants
CREATE POLICY "admin_write_beta_participants"
  ON public.beta_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Views: grant SELECT to authenticated users (RLS on underlying tables applies)
GRANT SELECT ON public.admin_platform_stats TO authenticated;
GRANT SELECT ON public.feedback_summary     TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.beta_participants TO authenticated;

-- ─── 6. Seed initial admin role for first user (optional) ────
-- Uncomment and replace with actual user_id to promote first admin:
-- UPDATE public.patient_profiles SET role = 'admin' WHERE user_id = '<your-user-id>';
