-- GluMira™ Wave 17 Migration
-- clinician_notes table + RLS policies
-- Version: 7.0.0
-- 2026-03-26

-- ─── clinician_notes ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clinician_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinician_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category        TEXT NOT NULL CHECK (category IN ('observation','adjustment','concern','praise','school')),
  body            TEXT NOT NULL CHECK (char_length(body) BETWEEN 5 AND 2000),
  follow_up_date  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clinician_notes_patient   ON clinician_notes(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_clinician_notes_clinician ON clinician_notes(clinician_user_id);
CREATE INDEX IF NOT EXISTS idx_clinician_notes_category  ON clinician_notes(category);
CREATE INDEX IF NOT EXISTS idx_clinician_notes_created   ON clinician_notes(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_clinician_notes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinician_notes_updated_at ON clinician_notes;
CREATE TRIGGER trg_clinician_notes_updated_at
  BEFORE UPDATE ON clinician_notes
  FOR EACH ROW EXECUTE FUNCTION update_clinician_notes_updated_at();

-- ─── Row Level Security ───────────────────────────────────────

ALTER TABLE clinician_notes ENABLE ROW LEVEL SECURITY;

-- Clinicians can only see notes they authored
CREATE POLICY "clinician_notes_select"
  ON clinician_notes FOR SELECT
  USING (
    auth.uid() = clinician_user_id
    OR
    -- Admins can see all notes
    EXISTS (
      SELECT 1 FROM patient_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Clinicians can only insert notes they author
CREATE POLICY "clinician_notes_insert"
  ON clinician_notes FOR INSERT
  WITH CHECK (
    auth.uid() = clinician_user_id
    AND EXISTS (
      SELECT 1 FROM patient_profiles
      WHERE user_id = auth.uid() AND role IN ('clinician', 'admin')
    )
  );

-- Clinicians can only update their own notes
CREATE POLICY "clinician_notes_update"
  ON clinician_notes FOR UPDATE
  USING (auth.uid() = clinician_user_id)
  WITH CHECK (auth.uid() = clinician_user_id);

-- Clinicians can only delete their own notes
CREATE POLICY "clinician_notes_delete"
  ON clinician_notes FOR DELETE
  USING (auth.uid() = clinician_user_id);

-- ─── patient_profiles role column (if not already present) ───

ALTER TABLE patient_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'patient'
  CHECK (role IN ('patient', 'clinician', 'admin'));

-- ─── Convenience view: open_concerns ─────────────────────────

CREATE OR REPLACE VIEW open_concerns AS
  SELECT
    cn.id,
    cn.patient_user_id,
    cn.clinician_user_id,
    cn.body,
    cn.follow_up_date,
    cn.created_at,
    pp.display_name AS patient_name
  FROM clinician_notes cn
  JOIN patient_profiles pp ON pp.user_id = cn.patient_user_id
  WHERE cn.category = 'concern'
  ORDER BY cn.follow_up_date ASC NULLS LAST;

-- ─── Summary: tables in this migration ───────────────────────
-- clinician_notes   (new)
-- patient_profiles  (role column added if missing)
-- open_concerns     (view)
