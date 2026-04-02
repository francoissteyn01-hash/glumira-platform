-- GluMira™ V7 — Multi-caregiver access
-- Up to 4 caregivers per child, editor/viewer roles

CREATE TABLE caregiver_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES users(id) NOT NULL,
  caregiver_email TEXT NOT NULL,
  caregiver_user_id UUID REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  invited_by UUID REFERENCES users(id) NOT NULL,
  invite_status TEXT NOT NULL DEFAULT 'pending' CHECK (invite_status IN ('pending', 'accepted', 'revoked')),
  invite_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(child_profile_id, caregiver_email)
);

-- Max 4 caregivers per child
CREATE OR REPLACE FUNCTION check_max_caregivers()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM caregiver_links
      WHERE child_profile_id = NEW.child_profile_id
      AND invite_status != 'revoked') >= 4 THEN
    RAISE EXCEPTION 'Maximum 4 caregivers per child profile';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_caregivers
  BEFORE INSERT ON caregiver_links
  FOR EACH ROW EXECUTE FUNCTION check_max_caregivers();

-- RLS: only the inviter or linked caregivers can see links
ALTER TABLE caregiver_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can view their own links"
  ON caregiver_links FOR SELECT
  USING (caregiver_user_id = auth.uid() OR invited_by = auth.uid());

CREATE POLICY "Editors can manage links"
  ON caregiver_links FOR ALL
  USING (invited_by = auth.uid() OR
    EXISTS (SELECT 1 FROM caregiver_links cl
            WHERE cl.child_profile_id = caregiver_links.child_profile_id
            AND cl.caregiver_user_id = auth.uid()
            AND cl.role = 'editor'));
