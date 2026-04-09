-- Migration for insulin_doses table
-- Run in Supabase SQL Editor or as migration

CREATE TYPE dose_type_enum AS ENUM ('bolus', 'correction', 'basal_injection', 'pump_delivery');
CREATE TYPE source_enum AS ENUM ('manual', 'csv_import', 'pump_sync', 'demo_seed');

CREATE TABLE insulin_doses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES patient_profiles(id) NOT NULL,
    insulin_name TEXT REFERENCES insulin_profiles(brand_name) NOT NULL,
    dose_units NUMERIC(5,2) NOT NULL,
    administered_at TIMESTAMPTZ NOT NULL,
    dose_type dose_type_enum NOT NULL,
    carbs_grams NUMERIC(5,1) NULL,
    notes TEXT NULL,
    source source_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Users can SELECT/INSERT their own doses
CREATE POLICY "insulin_doses_select" ON insulin_doses
FOR SELECT USING (profile_id IN (SELECT id FROM patient_profiles WHERE user_id = auth.uid()));

CREATE POLICY "insulin_doses_insert" ON insulin_doses
FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM patient_profiles WHERE user_id = auth.uid()));
