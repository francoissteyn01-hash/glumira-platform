-- GluMira™ V7 — Glucose Readings table
-- Stores CGM/manual glucose readings with trend direction

DO $$ BEGIN
    CREATE TYPE trend_enum AS ENUM (
        'SingleDown', 'DoubleDown', 'TripleDown', 'FortyFiveDown',
        'Flat',
        'FortyFiveUp', 'SingleUp', 'DoubleUp', 'TripleUp'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE source_enum AS ENUM ('manual', 'csv_import', 'pump_sync', 'demo_seed', 'nightscout', 'cgm');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS glucose_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES patient_profiles(id) NOT NULL,
    reading_mgdl NUMERIC(5,1) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    trend trend_enum NOT NULL,
    source source_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE glucose_readings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "glucose_readings_select" ON glucose_readings
    FOR SELECT USING (profile_id IN (SELECT id FROM patient_profiles WHERE user_id = auth.uid()));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_glucose_readings_profile_id ON glucose_readings(profile_id);
CREATE INDEX IF NOT EXISTS idx_glucose_readings_timestamp ON glucose_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_glucose_readings_profile_timestamp ON glucose_readings(profile_id, timestamp);
