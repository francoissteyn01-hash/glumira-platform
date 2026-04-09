/**
 * GluMira™ V7 — Anouk Patient Data
 * Demo data for IOB Hunter density map page.
 */

import type { InsulinEntry, InsulinPharmacology } from "@/lib/pharmacokinetics";
import { INSULIN_PROFILES } from "@/lib/pharmacokinetics";

export const ANOUK_PATIENT = {
  id: "STE-001",
  name: "Anouk",
  age: 9,
  weight: 30,
  condition: "Type 1 Diabetes",
  location: "Swakopmund, Namibia",
  therapy: "Fiasp + Actrapid + Levemir",
  diet: "Bernstein Low Carb Diet",
  currentBG: 5.1,
};

export type AnoukPatient = typeof ANOUK_PATIENT;

export const ANOUK_INJECTIONS: InsulinEntry[] = [
  {
    id: "anouk-levemir-am",
    insulinName: "Levemir",
    dose: 5.5,
    time: "06:30",
    type: "basal",
    pharmacology: INSULIN_PROFILES.detemir,
    mealType: undefined,
  },
  {
    id: "anouk-fiasp-breakfast",
    insulinName: "Fiasp",
    dose: 2.0,
    time: "08:00",
    type: "bolus",
    pharmacology: INSULIN_PROFILES.fiasp,
    mealType: "breakfast",
  },
  {
    id: "anouk-actrapid-lunch",
    insulinName: "Actrapid",
    dose: 3.5,
    time: "13:00",
    type: "bolus",
    pharmacology: INSULIN_PROFILES.regular,
    mealType: "lunch",
  },
  {
    id: "anouk-levemir-pm",
    insulinName: "Levemir",
    dose: 6.0,
    time: "14:00",
    type: "basal",
    pharmacology: INSULIN_PROFILES.detemir,
    mealType: undefined,
  },
  {
    id: "anouk-levemir-night",
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
  label: "13:30 – 15:30",
};

export const HEATMAP_HIGHLIGHT = {
  startHour: 13,
  endHour: 16,
  label: "13:30 – 15:30",
};
