/**
 * GluMira™ V7 — Safe Mode Demo Profiles
 * 5 fictional profiles for sandbox exploration.
 * All data is fictional — no real patient information.
 */

export interface InsulinRegimen {
  insulin: string;
  type: "basal" | "bolus";
  dose: number;
  times: string[];
  halfLife: number;
}

export interface GlucoseReading {
  time: string;
  value: number;
}

export interface ChildProfile {
  age: number;
  weight: number;
  diabetesType: string;
  diagnosedMonths: number;
  regimen: InsulinRegimen[];
  glucoseTarget: { low: number; high: number };
  units: "mmol/L" | "mg/dL";
  dietaryModule?: string;
  sampleGlucose: GlucoseReading[];
}

export interface ClinicianPatient {
  name: string;
  condition: string;
}

export interface DemoProfile {
  id: string;
  name: string;
  role: "caregiver" | "patient" | "clinician";
  description: string;
  avatar: string;
  child?: ChildProfile;
  patients?: ClinicianPatient[];
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "demo-parent-toddler",
    name: "Sarah & Lily (Age 3)",
    role: "caregiver",
    description:
      "Parent of a newly diagnosed toddler. Levemir 2x daily + Fiasp with meals. Frequent overnight lows.",
    avatar: "parent",
    child: {
      age: 3,
      weight: 14,
      diabetesType: "T1D",
      diagnosedMonths: 4,
      regimen: [
        { insulin: "Levemir", type: "basal", dose: 3, times: ["07:00", "19:00"], halfLife: 6 },
        { insulin: "Fiasp", type: "bolus", dose: 0.5, times: ["07:30", "12:00", "17:30"], halfLife: 1.1 },
      ],
      glucoseTarget: { low: 4.0, high: 10.0 },
      units: "mmol/L",
      sampleGlucose: [
        { time: "00:00", value: 6.2 }, { time: "02:00", value: 4.8 }, { time: "04:00", value: 3.9 },
        { time: "06:00", value: 5.1 }, { time: "08:00", value: 9.8 }, { time: "10:00", value: 7.2 },
        { time: "12:00", value: 6.5 }, { time: "14:00", value: 11.3 }, { time: "16:00", value: 8.1 },
        { time: "18:00", value: 6.8 }, { time: "20:00", value: 9.4 }, { time: "22:00", value: 7.1 },
      ],
    },
  },
  {
    id: "demo-parent-school",
    name: "James & Noah (Age 8)",
    role: "caregiver",
    description:
      "Parent of school-age child. Tresiba once daily + NovoRapid with meals. Managing school days and sports.",
    avatar: "parent",
    child: {
      age: 8,
      weight: 28,
      diabetesType: "T1D",
      diagnosedMonths: 36,
      regimen: [
        { insulin: "Tresiba", type: "basal", dose: 8, times: ["20:00"], halfLife: 25 },
        { insulin: "NovoRapid", type: "bolus", dose: 2, times: ["07:00", "12:30", "18:00"], halfLife: 1.2 },
      ],
      glucoseTarget: { low: 4.0, high: 10.0 },
      units: "mmol/L",
      sampleGlucose: [
        { time: "00:00", value: 7.5 }, { time: "03:00", value: 6.8 }, { time: "06:00", value: 8.2 },
        { time: "09:00", value: 12.1 }, { time: "12:00", value: 7.9 }, { time: "15:00", value: 5.3 },
        { time: "18:00", value: 6.1 }, { time: "21:00", value: 8.8 },
      ],
    },
  },
  {
    id: "demo-teen",
    name: "Aisha (Age 15)",
    role: "patient",
    description:
      "Teen managing independently. Tresiba + Fiasp. Navigating school exams, sport, and social life.",
    avatar: "teen",
    child: {
      age: 15,
      weight: 55,
      diabetesType: "T1D",
      diagnosedMonths: 72,
      regimen: [
        { insulin: "Tresiba", type: "basal", dose: 18, times: ["22:00"], halfLife: 25 },
        { insulin: "Fiasp", type: "bolus", dose: 4, times: ["07:00", "13:00", "19:00"], halfLife: 1.1 },
      ],
      glucoseTarget: { low: 4.0, high: 10.0 },
      units: "mmol/L",
      sampleGlucose: [
        { time: "00:00", value: 8.1 }, { time: "06:00", value: 9.5 }, { time: "08:00", value: 14.2 },
        { time: "10:00", value: 10.1 }, { time: "13:00", value: 7.3 }, { time: "16:00", value: 4.5 },
        { time: "19:00", value: 6.8 }, { time: "22:00", value: 8.9 },
      ],
    },
  },
  {
    id: "demo-adult",
    name: "Marcus (Age 34)",
    role: "patient",
    description:
      "Adult self-managing with Bernstein low-carb approach. Lantus + Actrapid. Focused on tight control.",
    avatar: "adult",
    child: {
      age: 34,
      weight: 82,
      diabetesType: "T1D",
      diagnosedMonths: 240,
      regimen: [
        { insulin: "Lantus", type: "basal", dose: 22, times: ["22:00"], halfLife: 12 },
        { insulin: "Actrapid", type: "bolus", dose: 3, times: ["07:00", "12:00", "18:00"], halfLife: 1.5 },
      ],
      glucoseTarget: { low: 4.4, high: 7.8 },
      units: "mmol/L",
      dietaryModule: "bernstein",
      sampleGlucose: [
        { time: "00:00", value: 5.4 }, { time: "06:00", value: 5.8 }, { time: "08:00", value: 6.9 },
        { time: "12:00", value: 5.2 }, { time: "14:00", value: 6.1 }, { time: "18:00", value: 5.5 },
        { time: "21:00", value: 6.3 },
      ],
    },
  },
  {
    id: "demo-clinician",
    name: "Dr Naidoo (Clinician)",
    role: "clinician",
    description:
      "Paediatric endocrinologist reviewing 3 patient profiles. Report generation and pattern analysis.",
    avatar: "clinician",
    patients: [
      { name: "Patient A (Age 5)", condition: "Newly diagnosed, unstable" },
      { name: "Patient B (Age 11)", condition: "Stable, approaching puberty" },
      { name: "Patient C (Age 16)", condition: "Burnout, poor adherence" },
    ],
  },
];
