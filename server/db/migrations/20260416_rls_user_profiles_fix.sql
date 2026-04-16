DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Caregivers can read linked profiles" ON user_profiles;

CREATE POLICY "Users can read own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Caregivers can read linked profiles"
ON user_profiles FOR SELECT
USING (EXISTS (SELECT 1 FROM caregiver_shares WHERE caregiver_shares.user_id = user_profiles.user_id AND caregiver_shares.caregiver_id = auth.uid()));

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
