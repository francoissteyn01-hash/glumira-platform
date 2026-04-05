/**
 * GluMira™ V7 — Beta Profiles (case studies)
 * 5 preloaded case studies, used for IOB engine demos and beta testing.
 * All data is FICTIONAL / ANONYMISED. No real patients.
 */

export interface BolusEntry {
  insulin: string;
  dose: number;
  time: string;
}

export interface BetaProfile {
  id: string;
  case_code: string;
  profile_name: string;
  profile_type: "paediatric" | "adult" | "teen" | "clinician";
  basal_insulin: string | null;
  basal_dose: number | null;
  basal_times: string[] | null;
  bolus_insulins: BolusEntry[] | null;
  glucose_units: "mmol/L" | "mg/dL";
  is_preloaded: true;
  disclaimer: "BETA TEST DATA — NOT REAL PATIENT";
  clinician_patients?: { patient_id: string; summary: string }[];
}

export const BETA_PROFILES: BetaProfile[] = [
  {
    id: "case-beta-001",
    case_code: "CASE-BETA-001",
    profile_name: "Paediatric Overnight Lows",
    profile_type: "paediatric",
    basal_insulin: "Degludec",
    basal_dose: 12.0,
    basal_times: ["18:30"],
    bolus_insulins: [
      { insulin: "Fiasp",     dose: 3.0,  time: "07:00" },
      { insulin: "Fiasp",     dose: 2.5,  time: "12:30" },
      { insulin: "Humulin R", dose: 3.5,  time: "18:00" },
    ],
    glucose_units: "mmol/L",
    is_preloaded: true,
    disclaimer: "BETA TEST DATA — NOT REAL PATIENT",
  },
  {
    id: "case-beta-002",
    case_code: "CASE-BETA-002",
    profile_name: "Gastro Emergency",
    profile_type: "paediatric",
    basal_insulin: "Levemir",
    basal_dose: 7.0,
    basal_times: ["06:00", "13:30", "20:35"],
    bolus_insulins: [
      { insulin: "Fiasp",    dose: 1.0,  time: "07:00" },
      { insulin: "Actrapid", dose: 1.5,  time: "12:00" },
      { insulin: "Fiasp",    dose: 1.0,  time: "18:00" },
      { insulin: "Actrapid", dose: 1.5,  time: "18:30" },
    ],
    glucose_units: "mmol/L",
    is_preloaded: true,
    disclaimer: "BETA TEST DATA — NOT REAL PATIENT",
  },
  {
    id: "case-beta-003",
    case_code: "CASE-BETA-003",
    profile_name: "Shift Worker",
    profile_type: "adult",
    basal_insulin: "Glargine",
    basal_dose: 22.0,
    basal_times: ["22:00"],
    bolus_insulins: [
      { insulin: "Novorapid", dose: 6.0, time: "07:00" },
      { insulin: "Novorapid", dose: 8.0, time: "13:00" },
      { insulin: "Novorapid", dose: 4.0, time: "19:00" },
    ],
    glucose_units: "mmol/L",
    is_preloaded: true,
    disclaimer: "BETA TEST DATA — NOT REAL PATIENT",
  },
  {
    id: "case-beta-004",
    case_code: "CASE-BETA-004",
    profile_name: "Newly Diagnosed Teen",
    profile_type: "teen",
    basal_insulin: "Glargine",
    basal_dose: 16.0,
    basal_times: ["21:00"],
    bolus_insulins: [
      { insulin: "Novorapid", dose: 3.0, time: "07:00" },
      { insulin: "Novorapid", dose: 5.0, time: "12:30" },
      { insulin: "Novorapid", dose: 4.0, time: "18:30" },
    ],
    glucose_units: "mg/dL",
    is_preloaded: true,
    disclaimer: "BETA TEST DATA — NOT REAL PATIENT",
  },
  {
    id: "case-beta-005",
    case_code: "CASE-BETA-005",
    profile_name: "Clinician Multi-Patient",
    profile_type: "clinician",
    basal_insulin: null,
    basal_dose: null,
    basal_times: null,
    bolus_insulins: null,
    glucose_units: "mmol/L",
    is_preloaded: true,
    disclaimer: "BETA TEST DATA — NOT REAL PATIENT",
    clinician_patients: [
      { patient_id: "SUBJ-A", summary: "Paediatric, unstable, newly diagnosed" },
      { patient_id: "SUBJ-B", summary: "Teen, stable, approaching puberty" },
      { patient_id: "SUBJ-C", summary: "Adult, burnout, poor adherence" },
    ],
  },
];

/* ── Custom profile slots (localStorage-backed, max 2 per user) ────────────── */

const CUSTOM_KEY_1 = "glumira_beta_custom_1";
const CUSTOM_KEY_2 = "glumira_beta_custom_2";

export interface CustomBetaProfile {
  id: string;
  slot: 1 | 2;
  profile_name: string;
  profile_type: "paediatric" | "adult" | "teen" | "clinician";
  basal_insulin: string;
  basal_dose: number;          // decimal, 0.25U increments
  basal_times: string[];
  bolus_insulins: BolusEntry[];
  glucose_units: "mmol/L" | "mg/dL";
  is_preloaded: false;
  created_at: string;
}

export function getCustomProfiles(): CustomBetaProfile[] {
  const profiles: CustomBetaProfile[] = [];
  try {
    const slot1 = localStorage.getItem(CUSTOM_KEY_1);
    const slot2 = localStorage.getItem(CUSTOM_KEY_2);
    if (slot1) profiles.push(JSON.parse(slot1));
    if (slot2) profiles.push(JSON.parse(slot2));
  } catch {}
  return profiles;
}

export function saveCustomProfile(slot: 1 | 2, profile: Omit<CustomBetaProfile, "slot" | "is_preloaded" | "created_at" | "id">) {
  const full: CustomBetaProfile = {
    id: `custom-${slot}`,
    slot,
    ...profile,
    is_preloaded: false,
    created_at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(slot === 1 ? CUSTOM_KEY_1 : CUSTOM_KEY_2, JSON.stringify(full));
  } catch {}
  return full;
}

export function deleteCustomProfile(slot: 1 | 2) {
  try {
    localStorage.removeItem(slot === 1 ? CUSTOM_KEY_1 : CUSTOM_KEY_2);
  } catch {}
}

/* ── Active profile state (localStorage) ──────────────────────────────────── */

const ACTIVE_KEY = "glumira_active_beta_profile";

export function getActiveProfileId(): string {
  try {
    return localStorage.getItem(ACTIVE_KEY) ?? BETA_PROFILES[0].id;
  } catch {
    return BETA_PROFILES[0].id;
  }
}

export function setActiveProfileId(id: string) {
  try { localStorage.setItem(ACTIVE_KEY, id); } catch {}
}

export function getAllProfiles(): (BetaProfile | CustomBetaProfile)[] {
  return [...BETA_PROFILES, ...getCustomProfiles()];
}

export function getActiveProfile(): BetaProfile | CustomBetaProfile {
  const id = getActiveProfileId();
  return getAllProfiles().find((p) => p.id === id) ?? BETA_PROFILES[0];
}
