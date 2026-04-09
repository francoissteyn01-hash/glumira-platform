/**
 * GluMira™ V7 — Demo Patient Data
 * Anonymised sample data for IOB Hunter density map page.
 * All identifying details are fictional.
 */

import type { InsulinEntry } from "@/lib/pharmacokinetics";
import { INSULIN_PROFILES } from "@/lib/pharmacokinetics";

export const ANOUK_PATIENT = {
  id: "DEMO-001",
  name: "Patient A",
  age: 9,
  weight: 30,
  condition: "Type 1 Diabetes",
  location: "Southern Africa",
  therapy: "Fiasp + Actrapid + Levemir",
  diet: "Bernstein Low Carb",
  currentBG: 5.1,
};

export type AnoukPatient = typeof ANOUK_PATIENT;

export const ANOUK_INJECTIONS: InsulinEntry[] = [
  // Previous day's evening basal — contributes overnight IOB tail
  {
    id: "demo-levemir-prev-pm",
    insulinName: "Levemir",
    dose: 6.0,
    time: "14:00",
    type: "basal",
    pharmacology: INSULIN_PROFILES.detemir,
    mealType: undefined,
  },
  {
    id: "demo-levemir-prev-night",
    insulinName: "Levemir",
    dose: 2.5,
    time: "21:00",
    type: "basal",
    pharmacology: INSULIN_PROFILES.detemir,
    mealType: undefined,
  },
  // Today's injections
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
