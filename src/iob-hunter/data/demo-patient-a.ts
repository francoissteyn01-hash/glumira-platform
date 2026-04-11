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
  name: "Patient A",
  age: 9,
  weight_kg: 30,
  condition: "Type 1 Diabetes",
  therapy: "Fiasp + Actrapid + Levemir",
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
    dose_units: 5.5,
    administered_at: "06:30",
    dose_type: "basal_injection",
  },
  {
    id: "demo-fiasp-breakfast",
    insulin_name: "Fiasp",
    dose_units: 2.0,
    administered_at: "08:00",
    dose_type: "bolus",
  },
  {
    id: "demo-actrapid-lunch",
    insulin_name: "Actrapid",
    dose_units: 3.5,
    administered_at: "13:00",
    dose_type: "bolus",
  },
  {
    id: "demo-levemir-pm",
    insulin_name: "Levemir",
    dose_units: 6.0,
    administered_at: "14:00",
    dose_type: "basal_injection",
  },
  {
    id: "demo-levemir-night",
    insulin_name: "Levemir",
    dose_units: 2.5,
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
