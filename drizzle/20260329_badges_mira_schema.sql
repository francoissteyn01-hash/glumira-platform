-- GluMira™ V7 — schema addendum: badges + mira_conversations
-- Run after glumira-schema.sql

-- ── Badge catalogue ───────────────────────────────────────────────────────────

CREATE TYPE badge_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');

CREATE TABLE IF NOT EXISTS badges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR(100) NOT NULL UNIQUE,
  name         VARCHAR(200) NOT NULL,
  description  TEXT NOT NULL,
  tier         badge_tier NOT NULL DEFAULT 'bronze',
  icon_emoji   VARCHAR(10) NOT NULL DEFAULT '🏅',
  criteria     JSONB,                        -- flexible unlock conditions
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── User earned badges ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_badges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  badge_id     UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_patient ON user_badges(patient_id);

-- ── Mira AI conversations ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mira_conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID REFERENCES patient_profiles(id) ON DELETE SET NULL,
  user_id      UUID REFERENCES user_profiles(id)    ON DELETE SET NULL,
  messages     JSONB NOT NULL DEFAULT '[]',          -- [{role, content, timestamp}]
  token_count  INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mira_conversations_user ON mira_conversations(user_id);

-- ── Seed: default badge catalogue ─────────────────────────────────────────────

INSERT INTO badges (slug, name, description, tier, icon_emoji) VALUES
  ('first-login',        'First Steps',           'Logged in for the first time',                        'bronze',   '👋'),
  ('module-basics',      'Diabetes Basics',        'Completed the Diabetes Basics education module',       'bronze',   '📘'),
  ('module-iob',         'IOB Master',             'Completed the Insulin on Board module',               'silver',   '💉'),
  ('module-carbs',       'Carb Counter',           'Completed the Carbohydrate Counting module',          'silver',   '🍽️'),
  ('module-nightscout',  'Nightscout Connected',   'Completed the Nightscout & CGM module',               'silver',   '📡'),
  ('module-hormones',    'Hormone Aware',          'Completed the Hormones & Glucose module',             'gold',     '🔬'),
  ('module-sick-days',   'Sick Day Pro',           'Completed the Sick Day Management module',            'gold',     '🩺'),
  ('all-modules',        'GluMira Scholar',        'Completed all education modules',                     'platinum', '🎓'),
  ('streak-7',           '7-Day Streak',           'Logged glucose data for 7 consecutive days',          'bronze',   '🔥'),
  ('streak-30',          '30-Day Streak',          'Logged glucose data for 30 consecutive days',         'gold',     '🏆'),
  ('mira-first-chat',    'Ask Mira',               'Started your first conversation with Mira AI',        'bronze',   '🤖'),
  ('nightscout-linked',  'CGM Linked',             'Connected a Nightscout instance to GluMira',          'silver',   '🔗')
ON CONFLICT (slug) DO NOTHING;
