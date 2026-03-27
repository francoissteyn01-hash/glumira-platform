-- ============================================================================
-- GluMira™ Gamification & Rewards System — Database Migration
-- Wave: Gamification V1.0
-- Date: 2026-03-27
-- ============================================================================
-- Tables:
--   gamification_profiles  — per-user mascot tier, points, streaks
--   gamification_badges    — earned badges per user
--   milestone_messages     — diaversary, birthday, caregiver, tier upgrade alerts
-- ============================================================================

-- ─── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE mascot_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'crown');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE badge_id AS ENUM (
    'first_login', 'streak_7', 'streak_30', 'streak_90',
    'a1c_improved', 'in_range_week', 'in_range_month',
    'meal_logger_10', 'meal_logger_50',
    'reading_logger_50', 'reading_logger_200',
    'diaversary_1', 'diaversary_5', 'diaversary_10',
    'caregiver_champion', 'first_a1c', 'night_owl', 'early_bird'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE milestone_type AS ENUM (
    'diaversary', 'birthday', 'caregiver_burnout',
    'streak_7', 'streak_30', 'streak_90',
    'a1c_improved', 'in_range_week', 'in_range_month',
    'tier_upgrade', 'badge_earned'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── gamification_profiles ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gamification_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_tier            mascot_tier NOT NULL DEFAULT 'bronze',
  points                  INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  current_streak_days     INTEGER NOT NULL DEFAULT 0 CHECK (current_streak_days >= 0),
  longest_streak_days     INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak_days >= 0),
  last_login_date         DATE,
  -- Active badge: if set, replaces the mascot on profile/dashboard
  active_badge_id         badge_id,
  -- Diaversary date (date of diabetes diagnosis)
  diaversary_date         DATE,
  -- Caregiver flag
  is_caregiver            BOOLEAN NOT NULL DEFAULT false,
  caregiver_erratic_count INTEGER NOT NULL DEFAULT 0 CHECK (caregiver_erratic_count >= 0),
  -- In-range streak (separate from login streak)
  in_range_streak_days    INTEGER NOT NULL DEFAULT 0 CHECK (in_range_streak_days >= 0),
  -- A1C tracking
  last_a1c_value          DECIMAL(4,2),
  previous_a1c_value      DECIMAL(4,2),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_gamification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gamification_profiles_updated_at ON gamification_profiles;
CREATE TRIGGER gamification_profiles_updated_at
  BEFORE UPDATE ON gamification_profiles
  FOR EACH ROW EXECUTE FUNCTION update_gamification_updated_at();

-- ─── gamification_badges ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gamification_badges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id      badge_id NOT NULL,
  unlocked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, badge_id)
);

-- ─── milestone_messages ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS milestone_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            milestone_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  subtext         TEXT,
  badge_id        badge_id,
  new_tier        mascot_tier,
  points_awarded  INTEGER DEFAULT 0,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  is_dismissed    BOOLEAN NOT NULL DEFAULT false,
  trigger_date    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_milestone_messages_user_id ON milestone_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_milestone_messages_unread ON milestone_messages(user_id, is_read, is_dismissed);
CREATE INDEX IF NOT EXISTS idx_gamification_badges_user_id ON gamification_badges(user_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_messages ENABLE ROW LEVEL SECURITY;

-- gamification_profiles: users can only see/edit their own profile
CREATE POLICY "Users can view own gamification profile"
  ON gamification_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification profile"
  ON gamification_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification profile"
  ON gamification_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- gamification_badges: users can only see their own badges
CREATE POLICY "Users can view own badges"
  ON gamification_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON gamification_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- milestone_messages: users can only see/dismiss their own messages
CREATE POLICY "Users can view own milestone messages"
  ON milestone_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestone messages"
  ON milestone_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own milestone messages"
  ON milestone_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- ─── Helper Function: Get or Create Gamification Profile ─────────────────────

CREATE OR REPLACE FUNCTION get_or_create_gamification_profile(p_user_id UUID)
RETURNS gamification_profiles AS $$
DECLARE
  profile gamification_profiles;
BEGIN
  SELECT * INTO profile FROM gamification_profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO gamification_profiles (user_id)
    VALUES (p_user_id)
    RETURNING * INTO profile;
  END IF;
  RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Helper Function: Award Points & Check Tier ───────────────────────────────

CREATE OR REPLACE FUNCTION award_gamification_points(
  p_user_id UUID,
  p_points INTEGER
)
RETURNS TABLE(
  new_points INTEGER,
  new_tier mascot_tier,
  tier_upgraded BOOLEAN
) AS $$
DECLARE
  old_tier mascot_tier;
  new_tier_val mascot_tier;
  new_points_val INTEGER;
BEGIN
  -- Get current tier
  SELECT current_tier INTO old_tier FROM gamification_profiles WHERE user_id = p_user_id;

  -- Update points
  UPDATE gamification_profiles
  SET points = points + p_points
  WHERE user_id = p_user_id
  RETURNING points INTO new_points_val;

  -- Determine new tier
  new_tier_val := CASE
    WHEN new_points_val >= 3000 THEN 'crown'::mascot_tier
    WHEN new_points_val >= 1200 THEN 'platinum'::mascot_tier
    WHEN new_points_val >= 500  THEN 'gold'::mascot_tier
    WHEN new_points_val >= 150  THEN 'silver'::mascot_tier
    ELSE 'bronze'::mascot_tier
  END;

  -- Update tier if changed
  IF new_tier_val != old_tier THEN
    UPDATE gamification_profiles
    SET current_tier = new_tier_val
    WHERE user_id = p_user_id;
  END IF;

  RETURN QUERY SELECT new_points_val, new_tier_val, (new_tier_val != old_tier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Comments ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE gamification_profiles IS 'GluMira™ per-user gamification state: mascot tier, points, streaks, caregiver flag';
COMMENT ON TABLE gamification_badges IS 'GluMira™ earned badges per user with unlock timestamps';
COMMENT ON TABLE milestone_messages IS 'GluMira™ empathetic milestone messages: diaversary, birthday, caregiver, tier upgrades';
