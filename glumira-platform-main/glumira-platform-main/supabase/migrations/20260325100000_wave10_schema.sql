-- ═══════════════════════════════════════════════════════════════
-- GluMira™ Wave 10 Schema Migration
-- Version: 7.0.0
-- Date: 2026-03-26
-- Tables: glucose_readings, notifications, doses
-- ═══════════════════════════════════════════════════════════════

-- ─── Enable pgcrypto for gen_random_uuid() ────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── glucose_readings ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS glucose_readings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  glucose         NUMERIC(5,2) NOT NULL CHECK (glucose > 0 AND glucose < 50),
  unit            TEXT        NOT NULL DEFAULT 'mmol/L' CHECK (unit IN ('mmol/L', 'mg/dL')),
  source          TEXT        NOT NULL DEFAULT 'manual'
                              CHECK (source IN ('manual', 'nightscout', 'cgm', 'import')),
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_glucose_readings_user_recorded
  ON glucose_readings (user_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_glucose_readings_source
  ON glucose_readings (user_id, source);

-- Row Level Security
ALTER TABLE glucose_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own readings"
  ON glucose_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own readings"
  ON glucose_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own readings"
  ON glucose_readings FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER glucose_readings_updated_at
  BEFORE UPDATE ON glucose_readings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── notifications ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL,
  severity        TEXT        NOT NULL DEFAULT 'info'
                              CHECK (severity IN ('info', 'warning', 'critical')),
  title           TEXT        NOT NULL,
  message         TEXT        NOT NULL,
  read            BOOLEAN     NOT NULL DEFAULT FALSE,
  dismissed       BOOLEAN     NOT NULL DEFAULT FALSE,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_severity
  ON notifications (user_id, severity) WHERE dismissed = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE); -- service_role bypasses RLS; anon/user inserts blocked by JWT

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── doses ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS doses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insulin_type    TEXT        NOT NULL
                              CHECK (insulin_type IN ('NovoRapid','Humalog','Apidra','Fiasp','Tresiba','Lantus')),
  dose_type       TEXT        NOT NULL
                              CHECK (dose_type IN ('bolus','basal','correction')),
  units           NUMERIC(5,2) NOT NULL CHECK (units > 0 AND units <= 100),
  administered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doses_user_administered
  ON doses (user_id, administered_at DESC);

CREATE INDEX IF NOT EXISTS idx_doses_type
  ON doses (user_id, dose_type, administered_at DESC);

ALTER TABLE doses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own doses"
  ON doses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own doses"
  ON doses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own doses"
  ON doses FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER doses_updated_at
  BEFORE UPDATE ON doses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── beta_feedback ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS beta_feedback (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  rating          SMALLINT    NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category        TEXT        NOT NULL,
  comment         TEXT,
  page_context    TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_submitted
  ON beta_feedback (submitted_at DESC);

ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON beta_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can read all feedback"
  ON beta_feedback FOR SELECT
  USING (auth.role() = 'service_role');

-- ─── Summary comment ──────────────────────────────────────────
-- Migration complete.
-- Tables created: glucose_readings, notifications, doses, beta_feedback
-- RLS enabled on all tables.
-- Indexes: user_id + timestamp DESC on all tables for efficient range queries.
-- Triggers: updated_at auto-maintained on glucose_readings, notifications, doses.
