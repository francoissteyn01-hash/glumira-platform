-- GluMira™ V7 — CGM Comment System
-- Allows inline annotations on glucose data points for data quality.

CREATE TABLE IF NOT EXISTS cgm_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  profile_id UUID,
  comment_type TEXT NOT NULL CHECK (comment_type IN (
    'false_low', 'false_high', 'fingerstick', 'compression_low',
    'new_sensor', 'sensor_warmup', 'sensor_drift', 'sensor_defective',
    'calibration', 'exercise', 'illness_stress', 'custom'
  )),
  comment_text TEXT,
  glucose_value DECIMAL(6,2),
  fingerstick_value DECIMAL(6,2),
  glucose_unit TEXT NOT NULL DEFAULT 'mmol/L' CHECK (glucose_unit IN ('mmol/L','mg/dL')),
  commented_at TIMESTAMPTZ NOT NULL,
  exclude_from_analysis BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cgm_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own cgm comments"
  ON cgm_comments FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_cgm_comments_user_time ON cgm_comments(user_id, commented_at);

-- Auto-set exclude_from_analysis for types that invalidate readings
CREATE OR REPLACE FUNCTION set_cgm_exclusion() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.comment_type IN ('false_low', 'false_high', 'sensor_drift', 'sensor_defective', 'compression_low') THEN
    NEW.exclude_from_analysis := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cgm_comment_exclusion
  BEFORE INSERT OR UPDATE ON cgm_comments
  FOR EACH ROW EXECUTE FUNCTION set_cgm_exclusion();
