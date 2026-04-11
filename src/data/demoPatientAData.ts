/**
 * GluMira™ V7 — Demo Patient A Data
 *
 * Fully anonymised demo data for the IOB Hunter module. No real names,
 * no real locations, no real dates of birth, no private data. Patient A
 * is a fictional 9-year-old T1D MDI user on a Fiasp + Actrapid + Levemir
 * regimen with a Bernstein low-carb diet.
 *
 * Per V7 Build Blocks master rule: "No personal names. No locations. No
 * private data."
 *
 * NOTE: prior-day Levemir contribution is now provided by the cycles loop
 * in `calculateCombinedIOB` (cycles=2 default). A previous version of this
 * file worked around a bug in the cycles loop by adding duplicate
 * `prev-pm` / `prev-night` entries with the same time as today's doses —
 * those duplicates double-counted Levemir at 14:00 and 21:00 and made the
 * curve visibly wrong. Both the loop and the duplicates were fixed in the
 * 2026-04-11 commit.
 */

import type { InsulinEntry } from "@/lib/pharmacokinetics";
import { INSULIN_PROFILES } from "@/lib/pharmacokinetics";

export const DEMO_PATIENT_A = {
  id: "DEMO-A",
  name: "Patient A",
  age: 9,
  weight: 30,
  condition: "Type 1 Diabetes",
  therapy: "Fiasp + Actrapid + Levemir",
  diet: "Bernstein Low Carb",
  currentBG: 5.1,
};

export type DemoPatientA = typeof DEMO_PATIENT_A;

export const DEMO_PATIENT_A_INJECTIONS: InsulinEntry[] = [
  // Today's injections — prior-day tails come from the cycles loop, not duplicates
  {
    id: "demo-levemir-am",
    insulinName: "Levemir",
    dose: 5.5,
    time: "06:30",
    type: "basal",
    pharmacology: INSULIN_PROFILES.detemir,
    mealType: undefined,
  },
  {
    id: "demo-fiasp-breakfast",
    insulinName: "Fiasp",
    dose: 2.0,
    time: "08:00",
    type: "bolus",
    pharmacology: INSULIN_PROFILES.fiasp,
    mealType: "breakfast",
  },
  {
    id: "demo-actrapid-lunch",
    insulinName: "Actrapid",
    dose: 3.5,
    time: "13:00",
    type: "bolus",
    pharmacology: INSULIN_PROFILES.regular,
    mealType: "lunch",
  },
  {
    id: "demo-levemir-pm",
    insulinName: "Levemir",
    dose: 6.0,
    time: "14:00",
    type: "basal",
    pharmacology: INSULIN_PROFILES.detemir,
    mealType: undefined,
  },
  {
    id: "demo-levemir-night",
    insulinName: "Levemir",
    dose: 2.5,
    time: "21:00",
    type: "basal",
    pharmacology: INSULIN_PROFILES.detemir,
    mealType: undefined,
  },
];

export const PEAK_ZONE = {
  startHour: 13.5,
  endHour: 15.5,
  label: "13:30 \u2013 15:30",
};

export const HEATMAP_HIGHLIGHT = {
  startHour: 13,
  endHour: 16,
  label: "13:30 \u2013 15:30",
};
