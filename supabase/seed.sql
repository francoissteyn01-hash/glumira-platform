-- ============================================================
-- GluMira™ Supabase Seed Data
-- Version: 7.0.0
-- Sprint:  2026-03-26
--
-- Seeds 3 beta patients (NAM-001, NAM-002, ZA-001) with:
--  - patient_profiles
--  - beta_participants
--  - glucose_readings (14 days, ~288/day sparse)
--  - doses (14 days, 4–5/day)
--  - clinician_notes (2–3 notes per patient)
--
-- Usage: supabase db seed  OR  psql -f seed.sql
-- NOTE: Auth users must be created separately via Supabase Auth.
--       Replace UUIDs below with real auth.users IDs before running.
-- ============================================================

-- ─── Seed UUIDs ──────────────────────────────────────────────
-- These are placeholder UUIDs. Replace with real auth.users IDs.

DO $$
DECLARE
  -- Beta patients
  p1_id UUID := '00000000-0000-0000-0000-000000000001'; -- NAM-001 Emma Johnson
  p2_id UUID := '00000000-0000-0000-0000-000000000002'; -- NAM-002 Liam Patel
  p3_id UUID := '00000000-0000-0000-0000-000000000003'; -- ZA-001  Amara Dlamini

  -- Clinician
  c1_id UUID := '00000000-0000-0000-0000-000000000010'; -- Dr. Sarah Mitchell

  -- Timestamps
  now_ts TIMESTAMPTZ := NOW();
  i      INT;
  ts     TIMESTAMPTZ;
  val    NUMERIC;
BEGIN

-- ─── Patient Profiles ─────────────────────────────────────────

  INSERT INTO patient_profiles (user_id, display_name, diabetes_type, insulin_type, regime_name, participant_id, status, role, carb_ratio_morning, carb_ratio_afternoon, carb_ratio_evening, correction_factor, target_bg_mmol, created_at)
  VALUES
    (p1_id, 'Emma Johnson',   'Type 1', 'NovoRapid', 'Standard School Day',     'NAM-001', 'active', 'patient', 10, 12, 10, 2.5, 6.0, now_ts - INTERVAL '60 days'),
    (p2_id, 'Liam Patel',     'Type 1', 'Humalog',   'Active Adolescent',       'NAM-002', 'active', 'patient', 12, 15, 12, 3.0, 6.5, now_ts - INTERVAL '45 days'),
    (p3_id, 'Amara Dlamini',  'Type 1', 'Apidra',    'Low Carb Strict',         'ZA-001',  'active', 'patient',  8, 10,  8, 2.0, 5.5, now_ts - INTERVAL '30 days'),
    (c1_id, 'Dr. Sarah Mitchell', 'N/A', 'N/A',      'N/A',                     'CLIN-001','active', 'clinician', NULL, NULL, NULL, NULL, NULL, now_ts - INTERVAL '90 days')
  ON CONFLICT (user_id) DO NOTHING;

-- ─── Beta Participants ────────────────────────────────────────

  INSERT INTO beta_participants (user_id, participant_id, cohort, nightscout_url, onboarded_at, status, notes)
  VALUES
    (p1_id, 'NAM-001', 'North America', 'https://emma.ns.example.com', now_ts - INTERVAL '60 days', 'active', 'School nurse briefed. Glucagon kit confirmed.'),
    (p2_id, 'NAM-002', 'North America', 'https://liam.ns.example.com',  now_ts - INTERVAL '45 days', 'active', 'CGM: Dexcom G7. Nightscout live.'),
    (p3_id, 'ZA-001',  'South Africa',  'https://amara.ns.example.com', now_ts - INTERVAL '30 days', 'active', 'CGM: Libre 3. Manual log fallback.')
  ON CONFLICT (participant_id) DO NOTHING;

-- ─── Glucose Readings — NAM-001 Emma (14 days, ~48 readings/day sparse) ──

  FOR i IN 0..671 LOOP
    ts  := now_ts - (i * INTERVAL '30 minutes');
    -- Simulate realistic BG curve: post-meal spikes, overnight lows
    val := 6.5
           + 2.0 * SIN(EXTRACT(EPOCH FROM ts) / 3600.0 * 0.8)   -- daily rhythm
           + 1.5 * SIN(EXTRACT(EPOCH FROM ts) / 3600.0 * 3.2)   -- meal spikes
           + (RANDOM() - 0.5) * 1.2;                              -- noise
    val := GREATEST(2.8, LEAST(18.0, val));

    INSERT INTO glucose_readings (user_id, value_mmol, value_mg_dl, source, recorded_at)
    VALUES (p1_id, ROUND(val::NUMERIC, 1), ROUND((val * 18.018)::NUMERIC, 0), 'nightscout', ts)
    ON CONFLICT DO NOTHING;
  END LOOP;

-- ─── Glucose Readings — NAM-002 Liam (14 days, higher variability) ──

  FOR i IN 0..671 LOOP
    ts  := now_ts - (i * INTERVAL '30 minutes');
    val := 7.2
           + 3.0 * SIN(EXTRACT(EPOCH FROM ts) / 3600.0 * 0.9)
           + 2.0 * SIN(EXTRACT(EPOCH FROM ts) / 3600.0 * 2.8)
           + (RANDOM() - 0.5) * 1.8;
    val := GREATEST(2.5, LEAST(20.0, val));

    INSERT INTO glucose_readings (user_id, value_mmol, value_mg_dl, source, recorded_at)
    VALUES (p2_id, ROUND(val::NUMERIC, 1), ROUND((val * 18.018)::NUMERIC, 0), 'nightscout', ts)
    ON CONFLICT DO NOTHING;
  END LOOP;

-- ─── Glucose Readings — ZA-001 Amara (14 days, tighter control) ──

  FOR i IN 0..671 LOOP
    ts  := now_ts - (i * INTERVAL '30 minutes');
    val := 5.8
           + 1.5 * SIN(EXTRACT(EPOCH FROM ts) / 3600.0 * 0.7)
           + 1.0 * SIN(EXTRACT(EPOCH FROM ts) / 3600.0 * 3.5)
           + (RANDOM() - 0.5) * 0.8;
    val := GREATEST(3.2, LEAST(12.0, val));

    INSERT INTO glucose_readings (user_id, value_mmol, value_mg_dl, source, recorded_at)
    VALUES (p3_id, ROUND(val::NUMERIC, 1), ROUND((val * 18.018)::NUMERIC, 0), 'libre', ts)
    ON CONFLICT DO NOTHING;
  END LOOP;

-- ─── Doses — NAM-001 Emma (4 doses/day × 14 days) ────────────

  FOR i IN 0..13 LOOP
    -- Breakfast
    INSERT INTO doses (user_id, units, insulin_type, administered_at, notes)
    VALUES (p1_id, 4 + (RANDOM() * 2)::INT, 'NovoRapid',
            now_ts - (i * INTERVAL '1 day') - INTERVAL '7 hours', 'Breakfast bolus')
    ON CONFLICT DO NOTHING;
    -- Lunch
    INSERT INTO doses (user_id, units, insulin_type, administered_at, notes)
    VALUES (p1_id, 3 + (RANDOM() * 2)::INT, 'NovoRapid',
            now_ts - (i * INTERVAL '1 day') - INTERVAL '12 hours', 'Lunch bolus — school')
    ON CONFLICT DO NOTHING;
    -- Dinner
    INSERT INTO doses (user_id, units, insulin_type, administered_at, notes)
    VALUES (p1_id, 5 + (RANDOM() * 2)::INT, 'NovoRapid',
            now_ts - (i * INTERVAL '1 day') - INTERVAL '18 hours', 'Dinner bolus')
    ON CONFLICT DO NOTHING;
    -- Correction (not every day)
    IF RANDOM() > 0.5 THEN
      INSERT INTO doses (user_id, units, insulin_type, administered_at, notes)
      VALUES (p1_id, 1 + (RANDOM())::INT, 'NovoRapid',
              now_ts - (i * INTERVAL '1 day') - INTERVAL '15 hours', 'Correction dose')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

-- ─── Doses — NAM-002 Liam (5 doses/day × 14 days) ────────────

  FOR i IN 0..13 LOOP
    INSERT INTO doses (user_id, units, insulin_type, administered_at, notes)
    VALUES (p2_id, 5 + (RANDOM() * 3)::INT, 'Humalog',
            now_ts - (i * INTERVAL '1 day') - INTERVAL '7 hours', 'Breakfast bolus')
    ON CONFLICT DO NOTHING;
    INSERT INTO doses (user_id, units, insulin_type, administered_at, notes)
    VALUES (p2_id, 4 + (RANDOM() * 2)::INT, 'Humalog',
            now_ts - (i * INTERVAL '1 day') - INTERVAL '12 hours', 'Lunch bolus')
    ON CONFLICT DO NOTHING;
    INSERT INTO doses (user_id, units, insulin_type, administered_at, notes)
    VALUES (p2_id, 6 + (RANDOM() * 3)::INT, 'Humalog',
            now_ts - (i * INTERVAL '1 day') - INTERVAL '18 hours', 'Dinner bolus')
    ON CONFLICT DO NOTHING;
    INSERT INTO doses (user_id, units, insulin_type, administered_at, notes)
    VALUES (p2_id, 2 + (RANDOM())::INT, 'Humalog',
            now_ts - (i * INTERVAL '1 day') - INTERVAL '21 hours', 'Evening snack bolus')
    ON CONFLICT DO NOTHING;
    IF RANDOM() > 0.4 THEN
      INSERT INTO doses (user_id, units, insulin_type, administered_at, notes)
      VALUES (p2_id, 1 + (RANDOM())::INT, 'Humalog',
              now_ts - (i * INTERVAL '1 day') - INTERVAL '15 hours', 'Correction dose')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

-- ─── Doses — ZA-001 Amara (3 doses/day × 14 days) ────────────

  FOR i IN 0..13 LOOP
    INSERT INTO doses (user_id, units, insulin_type, administered_at, notes)
    VALUES (p3_id, 3 + (RANDOM() * 2)::INT, 'Apidra',
            now_ts - (i * INTERVAL '1 day') - INTERVAL '7 hours', 'Breakfast bolus')
    ON CONFLICT DO NOTHING;
    INSERT INTO doses (user_id, units, insulin_type, administered_at, notes)
    VALUES (p3_id, 3 + (RANDOM() * 2)::INT, 'Apidra',
            now_ts - (i * INTERVAL '1 day') - INTERVAL '12 hours', 'Lunch bolus')
    ON CONFLICT DO NOTHING;
    INSERT INTO doses (user_id, units, insulin_type, administered_at, notes)
    VALUES (p3_id, 4 + (RANDOM() * 2)::INT, 'Apidra',
            now_ts - (i * INTERVAL '1 day') - INTERVAL '18 hours', 'Dinner bolus')
    ON CONFLICT DO NOTHING;
  END LOOP;

-- ─── Clinician Notes — NAM-001 Emma ──────────────────────────

  INSERT INTO clinician_notes (patient_user_id, clinician_user_id, category, body, follow_up_date, created_at)
  VALUES
    (p1_id, c1_id, 'observation',
     'Emma''s TIR has improved from 58% to 72% over the past 4 weeks following the regime adjustment. School nurse reports no hypo incidents this term.',
     NULL, now_ts - INTERVAL '7 days'),
    (p1_id, c1_id, 'adjustment',
     'Increased morning ICR from 1:8 to 1:10 following consistent post-breakfast spikes (avg 12.4 mmol/L at 2h). Review in 2 weeks.',
     (now_ts + INTERVAL '7 days')::DATE, now_ts - INTERVAL '14 days'),
    (p1_id, c1_id, 'school',
     'School care plan updated and signed by head teacher. Glucagon kit confirmed in school office. Nurse has completed GluMira training module.',
     NULL, now_ts - INTERVAL '21 days')
  ON CONFLICT DO NOTHING;

-- ─── Clinician Notes — NAM-002 Liam ──────────────────────────

  INSERT INTO clinician_notes (patient_user_id, clinician_user_id, category, body, follow_up_date, created_at)
  VALUES
    (p2_id, c1_id, 'concern',
     'Liam has had 3 nocturnal hypos in the past 2 weeks (2.4, 2.7, 2.9 mmol/L). Suspect basal dose too high. Recommend Lantus reduction by 1U and CGM alert at 4.0 mmol/L.',
     (now_ts + INTERVAL '3 days')::DATE, now_ts - INTERVAL '5 days'),
    (p2_id, c1_id, 'observation',
     'Post-sport hyperglycaemia pattern identified — BG rises to 14–16 mmol/L within 90 min of football training. Likely adrenaline-mediated. Discussed with family.',
     NULL, now_ts - INTERVAL '10 days')
  ON CONFLICT DO NOTHING;

-- ─── Clinician Notes — ZA-001 Amara ──────────────────────────

  INSERT INTO clinician_notes (patient_user_id, clinician_user_id, category, body, follow_up_date, created_at)
  VALUES
    (p3_id, c1_id, 'praise',
     'Amara''s low-carb regime is working exceptionally well. TIR 81%, GMI 6.8, CV 22%. Best metrics in the cohort. No hypos in 30 days.',
     NULL, now_ts - INTERVAL '3 days'),
    (p3_id, c1_id, 'adjustment',
     'Correction factor adjusted from 1:1.8 to 1:2.0 following mild over-corrections. Monitor for 1 week.',
     (now_ts + INTERVAL '7 days')::DATE, now_ts - INTERVAL '8 days')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'GluMira™ seed data loaded: 3 patients, 14d readings, doses, notes.';
END $$;
