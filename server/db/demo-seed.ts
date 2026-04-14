/**
 * GluMira™ V7 — Demo Data Seed
 * Generates 14 days of realistic insulin doses and CGM glucose readings.
 * Run: npx tsx server/db/demo-seed.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_PROFILE_ID = "demo-patient-id-unique";

/* ─── Seeded RNG ──────────────────────────────────────────────────────────── */

let rngSeed = 42;
function seededRandom(): number {
  rngSeed = (rngSeed * 9301 + 49297) % 233280;
  return rngSeed / 233280;
}

function gaussianNoise(mu = 0, sigma = 1): number {
  const u1 = seededRandom();
  const u2 = seededRandom();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mu + sigma * z0;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/* ─── Main ────────────────────────────────────────────────────────────────── */

async function seedDemoData() {
  console.log("Cleaning previous demo data...");
  await supabase.from("glucose_readings").delete().eq("source", "demo_seed");
  await supabase.from("insulin_doses").delete().eq("source", "demo_seed");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const startDate = new Date(yesterday);
  startDate.setDate(yesterday.getDate() - 13); // 14 days ending yesterday

  /* ── Demo patient profile (upsert) ──────────────────────────────────── */
  const { error: profileErr } = await supabase.from("patient_profiles").upsert({
    id: DEMO_PROFILE_ID,
    user_id: "demo-user-id",
    display_name: "Demo Patient A",
    diabetes_type: "type_1",
    diagnosis_date: "2019-03-15",
  }, { onConflict: "id" });
  if (profileErr) console.warn("Profile upsert:", profileErr.message);

  /* ── Insulin regimens ───────────────────────────────────────────────── */
  await supabase.from("insulin_regimens").upsert([
    {
      profile_id: DEMO_PROFILE_ID,
      insulin_name: "Tresiba",
      regimen_type: "basal",
      dose_units: 18,
      dose_time: "22:00",
      is_active: true,
    },
    {
      profile_id: DEMO_PROFILE_ID,
      insulin_name: "NovoRapid",
      regimen_type: "bolus",
      is_active: true,
    },
  ], { onConflict: "profile_id,insulin_name" }).then(({ error }) => {
    if (error) console.warn("Regimen upsert:", error.message);
  });

  /* ── Patient settings ───────────────────────────────────────────────── */
  await supabase.from("patient_settings").upsert({
    profile_id: DEMO_PROFILE_ID,
    dia_hours: 4.5,
    isf_mmol: 2.5,
    isf_mgdl: 45.07,
    icr: 10,
    target_low_mmol: 4.0,
    target_high_mmol: 8.0,
    target_low_mgdl: 72.07,
    target_high_mgdl: 144.15,
    preferred_unit: "mmol",
  }, { onConflict: "profile_id" }).then(({ error }) => {
    if (error) console.warn("Settings upsert:", error.message);
  });

  /* ── Generate insulin doses (14 days) ───────────────────────────────── */
  console.log("Generating insulin doses...");
  const doses: any[] = [];

  for (let d = 0; d < 14; d++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(startDate.getDate() + d);

    // Tresiba basal: 22:00 +/- 15 min
    const tresibaTime = new Date(dayStart);
    tresibaTime.setHours(22, Math.round(seededRandom() * 30 - 15), 0, 0);
    doses.push({
      profile_id: DEMO_PROFILE_ID,
      insulin_name: "Tresiba",
      dose_units: 18,
      administered_at: tresibaTime.toISOString(),
      dose_type: "basal_injection",
      source: "demo_seed",
    });

    // Breakfast bolus: 07:30 +/- 20 min, 4-6u, 30-50g carbs
    const btime = new Date(dayStart);
    btime.setHours(7, 30 + Math.round(seededRandom() * 40 - 20), 0, 0);
    doses.push({
      profile_id: DEMO_PROFILE_ID,
      insulin_name: "NovoRapid",
      dose_units: +(4 + seededRandom() * 2).toFixed(1),
      administered_at: btime.toISOString(),
      dose_type: "bolus",
      carbs_grams: Math.round(30 + seededRandom() * 20),
      source: "demo_seed",
    });

    // Lunch bolus: 12:30 +/- 30 min, 5-8u, 40-70g carbs
    const ltime = new Date(dayStart);
    ltime.setHours(12, 30 + Math.round(seededRandom() * 60 - 30), 0, 0);
    doses.push({
      profile_id: DEMO_PROFILE_ID,
      insulin_name: "NovoRapid",
      dose_units: +(5 + seededRandom() * 3).toFixed(1),
      administered_at: ltime.toISOString(),
      dose_type: "bolus",
      carbs_grams: Math.round(40 + seededRandom() * 30),
      source: "demo_seed",
    });

    // Dinner bolus: 18:30 +/- 30 min, 5-9u, 50-80g carbs
    const dtime = new Date(dayStart);
    dtime.setHours(18, 30 + Math.round(seededRandom() * 60 - 30), 0, 0);
    doses.push({
      profile_id: DEMO_PROFILE_ID,
      insulin_name: "NovoRapid",
      dose_units: +(5 + seededRandom() * 4).toFixed(1),
      administered_at: dtime.toISOString(),
      dose_type: "bolus",
      carbs_grams: Math.round(50 + seededRandom() * 30),
      source: "demo_seed",
    });

    // Occasional afternoon correction (~50% of days)
    if (seededRandom() > 0.5) {
      const ctime = new Date(dayStart);
      ctime.setHours(15, Math.round(seededRandom() * 60), 0, 0);
      doses.push({
        profile_id: DEMO_PROFILE_ID,
        insulin_name: "NovoRapid",
        dose_units: +(1 + seededRandom()).toFixed(1),
        administered_at: ctime.toISOString(),
        dose_type: "correction",
        source: "demo_seed",
      });
    }

    // Day 3 (d=2): stacking scenario — correction at 14:45 + early dinner at 17:30
    if (d === 2) {
      const stackCorr = new Date(dayStart);
      stackCorr.setHours(14, 45, 0, 0);
      doses.push({
        profile_id: DEMO_PROFILE_ID,
        insulin_name: "NovoRapid",
        dose_units: 2,
        administered_at: stackCorr.toISOString(),
        dose_type: "correction",
        source: "demo_seed",
      });
      const stackDinner = new Date(dayStart);
      stackDinner.setHours(17, 30, 0, 0);
      doses.push({
        profile_id: DEMO_PROFILE_ID,
        insulin_name: "NovoRapid",
        dose_units: 7,
        administered_at: stackDinner.toISOString(),
        dose_type: "bolus",
        carbs_grams: 70,
        source: "demo_seed",
      });
    }

    // Day 10 (d=9): double correction 60 min apart
    if (d === 9) {
      const corr1 = new Date(dayStart);
      corr1.setHours(11, 0, 0, 0);
      const corr2 = new Date(dayStart);
      corr2.setHours(12, 0, 0, 0);
      doses.push(
        {
          profile_id: DEMO_PROFILE_ID,
          insulin_name: "NovoRapid",
          dose_units: 2,
          administered_at: corr1.toISOString(),
          dose_type: "correction",
          source: "demo_seed",
        },
        {
          profile_id: DEMO_PROFILE_ID,
          insulin_name: "NovoRapid",
          dose_units: 2,
          administered_at: corr2.toISOString(),
          dose_type: "correction",
          source: "demo_seed",
        },
      );
    }
  }

  console.log(`Inserting ${doses.length} insulin doses...`);
  const { error: dosesErr } = await supabase.from("insulin_doses").insert(doses);
  if (dosesErr) console.error("Doses insert error:", dosesErr.message);

  /* ── Generate glucose readings (every 5 min, 14 days) ───────────────── */
  console.log("Generating glucose readings (14 days x 288/day = ~4032 readings)...");
  const readings: any[] = [];

  for (let d = 0; d < 14; d++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(startDate.getDate() + d);

    for (let min = 0; min < 1440; min += 5) {
      const time = new Date(dayStart);
      time.setMinutes(time.getMinutes() + min);

      const hour = time.getHours() + time.getMinutes() / 60;

      // Base BG: 5.0 mmol/L with time-of-day meal effects
      let bgMmol = 5.0;

      // Breakfast rise/fall (08:00–10:00)
      if (hour >= 8 && hour <= 10) {
        bgMmol += clamp((hour - 8) * 2, 0, 2) - clamp((hour - 9.5) * 1.5, 0, 2);
      }
      // Lunch rise/fall (13:00–15:00)
      if (hour >= 13 && hour <= 15) {
        bgMmol += clamp((hour - 13) * 1.5, 0, 2) - clamp((hour - 14.5) * 1.2, 0, 1);
      }
      // Dinner rise/fall (19:00–22:00)
      if (hour >= 19 && hour <= 22) {
        bgMmol += clamp((hour - 19) * 2.5, 0, 4) - clamp((hour - 21) * 1.5, 0, 3);
      }

      // Rare events
      if (seededRandom() < 0.002) bgMmol -= 1.2; // Hypo dip
      if (seededRandom() < 0.002) bgMmol += 4.0;  // Hyper spike

      // Gaussian noise
      bgMmol += gaussianNoise(0, 0.3);
      bgMmol = clamp(bgMmol, 1.0, 20.0);

      const bgMgdl = +(bgMmol * 18.0182).toFixed(1);

      readings.push({
        profile_id: DEMO_PROFILE_ID,
        reading_mgdl: bgMgdl,
        timestamp: time.toISOString(),
        trend: "Flat",
        source: "demo_seed",
      });
    }
  }

  // Bulk insert in chunks of 1000
  console.log(`Inserting ${readings.length} glucose readings...`);
  for (let i = 0; i < readings.length; i += 1000) {
    const chunk = readings.slice(i, i + 1000);
    const { error } = await supabase.from("glucose_readings").insert(chunk);
    if (error) {
      console.error(`Chunk ${i}–${i + chunk.length} error:`, error.message);
    }
  }

  console.log("Demo seed complete.");
}

seedDemoData().catch(console.error);
