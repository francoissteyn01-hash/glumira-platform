-- GluMira™ V7 — Insulin Profiles reference table
-- Pharmacokinetic data for all supported insulins
-- Run in Supabase SQL Editor or as migration

-- Create ENUMs (safe if already exists)
DO $$ BEGIN
    CREATE TYPE insulin_category AS ENUM ('rapid_acting', 'short_acting', 'intermediate_acting', 'long_acting', 'ultra_long_acting', 'mixed', 'concentrated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE decay_model_type AS ENUM ('exponential', 'bilinear', 'flat_depot', 'mixed_profile');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create table
CREATE TABLE IF NOT EXISTS insulin_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_name TEXT NOT NULL UNIQUE,
    generic_name TEXT NOT NULL,
    manufacturer TEXT NULL,
    category insulin_category NOT NULL,
    onset_minutes INTEGER NOT NULL,
    peak_start_minutes INTEGER NULL,
    peak_end_minutes INTEGER NULL,
    duration_minutes INTEGER NOT NULL,
    is_peakless BOOLEAN DEFAULT FALSE,
    mechanism_notes TEXT NULL,
    pk_source TEXT NOT NULL,
    decay_model decay_model_type NOT NULL,
    decay_parameters JSONB NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE insulin_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT for all authenticated users (read-only)
DO $$ BEGIN
    CREATE POLICY "insulin_profiles_select" ON insulin_profiles
    FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- No INSERT/UPDATE policies for authenticated users — only service_role can modify

-- Indexes
CREATE INDEX IF NOT EXISTS idx_insulin_profiles_brand_name ON insulin_profiles(brand_name);
CREATE INDEX IF NOT EXISTS idx_insulin_profiles_category ON insulin_profiles(category);

-- Seed data (alphabetical by brand_name, with published PK data)
INSERT INTO insulin_profiles (brand_name, generic_name, manufacturer, category, onset_minutes, peak_start_minutes, peak_end_minutes, duration_minutes, is_peakless, mechanism_notes, pk_source, decay_model, decay_parameters) VALUES
('Afrezza', 'insulin human', 'MannKind', 'rapid_acting', 12, 35, 55, 180, FALSE, 'Inhaled insulin with Technosphere particles for rapid pulmonary absorption.', 'Afrezza Prescribing Information 2023; FDA Label', 'exponential', '{"half_life_minutes": 90}'),
('Apidra', 'insulin glulisine', 'Sanofi', 'rapid_acting', 15, 30, 90, 340, FALSE, 'Glulisine mutation for rapid subcutaneous absorption.', 'Apidra Prescribing Information 2023; Danne et al. 2005, Diabetes Care', 'exponential', '{"half_life_minutes": 80}'),
('Basaglar', 'insulin glargine', 'Eli Lilly', 'long_acting', 60, NULL, NULL, 1440, FALSE, 'Glargine microprecipitate dissolution for steady release.', 'Basaglar Prescribing Information 2023; Lantus FDA studies replicate', 'bilinear', '{"slope_1_pct_per_min": 0.0005, "inflection_minutes": 320, "slope_2_pct_per_min": 0.0001}'),
('Fiasp', 'faster insulin aspart', 'Novo Nordisk', 'rapid_acting', 3, 26, 35, 300, FALSE, 'Lower pH and nicotinamide additives for faster aspart absorption.', 'Fiasp Prescribing Information 2023; Heise et al. 2017, Diabetes Tech Ther', 'exponential', '{"half_life_minutes": 75}'),
('Humalog', 'insulin lispro', 'Eli Lilly', 'rapid_acting', 15, 30, 90, 360, FALSE, 'Lispro amino acid swap (ProLys at B28-29) for rapid monomer dissociation.', 'Humalog Prescribing Information 2023; Howey et al. 1994, Diabetes', 'exponential', '{"half_life_minutes": 90}'),
('Humalog Mix 25', 'insulin lispro / lispro protamine', 'Eli Lilly', 'mixed', 15, 60, 180, 1440, FALSE, 'Mix of rapid lispro and protamine-stabilized intermediate lispro.', 'Humalog Mix Prescribing Information 2023', 'mixed_profile', '{"rapid_pct": 0.25, "rapid_params": {"half_life_minutes": 90}, "basal_pct": 0.75, "basal_params": {"slope_1_pct_per_min": 0.0007, "inflection_minutes": 360, "slope_2_pct_per_min": 0.0002}}'),
('Humulin N', 'NPH insulin', 'Eli Lilly', 'intermediate_acting', 120, 240, 720, 1440, FALSE, 'Protamine-stabilized human insulin suspension for crystallization delay.', 'Humulin N Prescribing Information 2023; Binder 1969, Danish Med Bull', 'bilinear', '{"slope_1_pct_per_min": 0.001, "inflection_minutes": 360, "slope_2_pct_per_min": 0.0003}'),
('Humulin R', 'regular human insulin', 'Eli Lilly', 'short_acting', 30, 120, 180, 420, FALSE, 'Short-acting soluble human insulin.', 'Humulin R Prescribing Information 2023; Galloway et al. 1972, Diabetes', 'exponential', '{"half_life_minutes": 150}'),
('Humulin R U-500', 'regular human insulin U-500', 'Eli Lilly', 'concentrated', 15, 240, 480, 1440, FALSE, 'Concentrated U-500 for high-dose needs with prolonged action.', 'Humulin R U-500 Prescribing Information 2023', 'bilinear', '{"slope_1_pct_per_min": 0.0015, "inflection_minutes": 360, "slope_2_pct_per_min": 0.0003}'),
('Humulin 30/70', 'regular NPH insulin', 'Eli Lilly', 'mixed', 30, 120, 720, 1440, FALSE, '30% regular + 70% NPH human insulin mix.', 'Humulin 70/30 Prescribing Information 2023', 'mixed_profile', '{"rapid_pct": 0.3, "rapid_params": {"half_life_minutes": 150}, "basal_pct": 0.7, "basal_params": {"slope_1_pct_per_min": 0.001, "inflection_minutes": 360, "slope_2_pct_per_min": 0.0003}}'),
('Lantus', 'insulin glargine U-100', 'Sanofi', 'long_acting', 60, NULL, NULL, 1440, FALSE, 'Glargine precipitation in subcutaneous tissue for flat release.', 'Lantus Prescribing Information 2023; Lepore et al. 2000, Diabetes Care', 'bilinear', '{"slope_1_pct_per_min": 0.0005, "inflection_minutes": 320, "slope_2_pct_per_min": 0.0001}'),
('Levemir', 'insulin detemir', 'Novo Nordisk', 'long_acting', 60, 360, 520, 1440, FALSE, 'Detemir acylation for fatty acid binding and prolonged absorption.', 'Levemir Prescribing Information 2023; Heise et al. 2004, Diabetes Care', 'bilinear', '{"slope_1_pct_per_min": 0.0007, "inflection_minutes": 440, "slope_2_pct_per_min": 0.0002}'),
('Lyumjev', 'ultra-rapid lispro', 'Eli Lilly', 'rapid_acting', 5, 25, 40, 360, FALSE, 'Modified lispro with citrate and other excipients for faster absorption.', 'Lyumjev Prescribing Information 2023; Linnebjerg et al. 2018, JAMA', 'exponential', '{"half_life_minutes": 60}'),
('NovoLog', 'insulin aspart', 'Novo Nordisk', 'rapid_acting', 15, 40, 50, 360, FALSE, 'Aspart mutation (ProAsp at B28) for rapid dissociation.', 'NovoLog Prescribing Information 2023; Home et al. 1999, Diabetes Care', 'exponential', '{"half_life_minutes": 80}'),
('NovoMix 30', 'insulin aspart / aspart protamine', 'Novo Nordisk', 'mixed', 15, 60, 180, 1440, FALSE, '30% rapid aspart + 70% protamine intermediate aspart.', 'NovoMix Prescribing Information 2023', 'mixed_profile', '{"rapid_pct": 0.3, "rapid_params": {"half_life_minutes": 80}, "basal_pct": 0.7, "basal_params": {"slope_1_pct_per_min": 0.0007, "inflection_minutes": 360, "slope_2_pct_per_min": 0.0002}}'),
('NovoRapid', 'insulin aspart', 'Novo Nordisk', 'rapid_acting', 10, 40, 50, 360, FALSE, 'Same as NovoLog; regional brand name.', 'NovoRapid Prescribing Information 2023', 'exponential', '{"half_life_minutes": 80}'),
('Protaphane', 'NPH insulin', 'Novo Nordisk', 'intermediate_acting', 120, 240, 720, 1440, FALSE, 'NPH suspension with protamine crystallization delay.', 'Protaphane Prescribing Information 2023', 'bilinear', '{"slope_1_pct_per_min": 0.001, "inflection_minutes": 360, "slope_2_pct_per_min": 0.0003}'),
('Ryzodeg', 'insulin degludec / aspart', 'Novo Nordisk', 'mixed', 60, NULL, NULL, 2520, FALSE, '70% ultra-long degludec + 30% rapid aspart for co-formulation.', 'Ryzodeg Prescribing Information 2023', 'mixed_profile', '{"rapid_pct": 0.3, "rapid_params": {"half_life_minutes": 80}, "ultra_long_pct": 0.7, "ultra_long_params": {"steady_rate_pct_per_hour": 2.38}}'),
('Toujeo', 'insulin glargine U-300', 'Sanofi', 'long_acting', 360, NULL, NULL, 2160, FALSE, 'U-300 concentration for denser precipitate and flatter, longer profile.', 'Toujeo Prescribing Information 2023; Bergenstal et al. 2015, JAMA', 'bilinear', '{"slope_1_pct_per_min": 0.0003, "inflection_minutes": 720, "slope_2_pct_per_min": 0.00005}'),
('Tresiba', 'insulin degludec', 'Novo Nordisk', 'ultra_long_acting', 60, NULL, NULL, 2520, TRUE, 'Forms soluble multi-hexamer depot in subcutaneous tissue. Monomers slowly and continuously absorbed. Produces a flat, stable activity profile with no discernible peak. Steady state in 3-4 days.', 'Heise et al. 2012, Diabetes Obes Metab; Tresiba FDA Prescribing Information 2023', 'flat_depot', '{"steady_rate_pct_per_hour": 2.38}')
ON CONFLICT (brand_name) DO NOTHING;
