/**
 * GluMira™ V7 — IOB Hunter v7 · Demo Patient A data
 *
 * Fully anonymised demo regimen used by:
 *   - The unauthenticated /iob-hunter landing experience
 *   - IOBHunterVisitorEntry "Demo data" mode
 *   - Any screenshot / marketing asset in production
 *
 * Per V7 Build Blocks master rule: "No personal names. No locations.
 * No private data." Patient A is a fictional 9-year-old T1D MDI user
 * on a Fiasp + Actrapid + Levemir regimen with a Bernstein low-carb
 * diet. There is no backing real patient — this data is illustrative
 * only.
 *
 * This replaces the legacy `src/data/demoPatientAData.ts` import
 * shape. The new shape uses the v7 `InsulinDose` type (with dose_type,
 * administered_at, etc.) so it plugs directly into the v7 engine.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type { InsulinDose } from "@/iob-hunter/types";

export const DEMO_PATIENT_A_V7 = {
  id: "DEMO-A",
  name: "Demo regimen",
  age: 8,
  weight_kg: 32,
  condition: "Type 1 Diabetes",
  therapy: "Fiasp + Actrapid + Levemir (3x basal)",
  diet: "Bernstein Low Carb",
  currentBG: 5.1,
} as const;

export type DemoPatientAMeta = typeof DEMO_PATIENT_A_V7;

/**
 * Demo dose list for the v7 engine. Alphabetical by administered_at.
 * The cycles loop in `calculateCombinedIOB` handles prior-day Levemir
 * residual automatically — NO duplicate "prev" entries.
 */
export const DEMO_PATIENT_A_V7_DOSES: readonly InsulinDose[] = [
  {
    id: "demo-levemir-am",
    insulin_name: "Levemir",
    dose_units: 5,
    administered_at: "06:30",
    dose_type: "basal_injection",
  },
  {
    id: "demo-fiasp-breakfast",
    insulin_name: "Fiasp",
    dose_units: 3.0,
    administered_at: "07:00",
    dose_type: "bolus",
  },
  {
    id: "demo-fiasp-lunch",
    insulin_name: "Fiasp",
    dose_units: 2.5,
    administered_at: "12:30",
    dose_type: "bolus",
  },
  {
    id: "demo-actrapid-dinner",
    insulin_name: "Actrapid",
    dose_units: 3.5,
    administered_at: "18:00",
    dose_type: "bolus",
  },
  {
    id: "demo-levemir-pm",
    insulin_name: "Levemir",
    dose_units: 5,
    administered_at: "14:00",
    dose_type: "basal_injection",
  },
  {
    id: "demo-levemir-night",
    insulin_name: "Levemir",
    dose_units: 4,
    administered_at: "21:00",
    dose_type: "basal_injection",
  },
] as const;

/**
 * Helper: return a mutable copy of the demo doses. Consumers MUST NOT
 * mutate the readonly constant directly.
 */
export function getDemoPatientADoses(): InsulinDose[] {
  return DEMO_PATIENT_A_V7_DOSES.map((d) => ({ ...d }));
}

/* ─── Extended regimen shape (for profile/what-if consumers) ─────────────── */

export const demoPatientRegimen = {
  id: "demo-001",
  name: "Demo Patient",
  type: "caregiver",
  childName: "Child",
  childAge: 8,
  childWeightKg: 32,
  diabetesType: "type_1",
  insulins: [
    {
      name: "levemir",
      type: "basal",
      doses: [
        { time: "06:30", units: 5 },
        { time: "14:00", units: 5 },
        { time: "21:00", units: 4 },
      ],
    },
    {
      name: "fiasp",
      type: "bolus",
      doses: [
        { time: "07:00", mealLabel: "breakfast", typicalUnits: 3 },
        { time: "12:30", mealLabel: "lunch", typicalUnits: 2.5 },
      ],
    },
    {
      name: "actrapid",
      type: "bolus",
      doses: [
        { time: "18:00", mealLabel: "dinner", typicalUnits: 3.5 },
      ],
    },
  ],
  totalDailyBasal: 14,
  glucoseUnits: "mmol/L",
  dietaryPreference: "bernstein_low_carb",
  timezone: "Africa/Johannesburg",
} as const;

export const demoInsulinProfiles = {
  levemir:  { onset: 60,  peak: 360, duration: 1200, ispkmodel: "peaked-intermediate" },
  fiasp:    { onset: 10,  peak: 90,  duration: 300,  ispkmodel: "rapid-gaussian" },
  actrapid: { onset: 30,  peak: 120, duration: 420,  ispkmodel: "short-gaussian" },
} as const;
