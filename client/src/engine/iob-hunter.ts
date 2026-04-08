/**
 * GluMira™ V7 — IOB Hunter™ Client-Side Pharmacokinetic Engine
 *
 * Three models matched to real insulin physics:
 *   A. Depot-Release (two-compartment) — Tresiba, Glargine, Toujeo
 *   B. Gaussian Peak — Levemir, NPH
 *   C. Rapid Gaussian — Fiasp, NovoRapid, Humalog, Apidra, Actrapid, Humulin R
 *
 * 13-insulin ZA-NAM formulary with locked PK parameters.
 * GluMira™ is an educational platform, not a medical device.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export type PKModel = "depot-release" | "gaussian-peak" | "rapid-gaussian";
export type PressureClass = "light" | "moderate" | "strong" | "overlap";

export interface InsulinPK {
  id: string;
  name: string;
  brand: string;
  category: "basal" | "bolus" | "mixed";
  model: PKModel;
  /** Subcutaneous absorption rate constant (1/h) — depot-release only */
  ka?: number;
  /** Elimination rate constant (1/h) — depot-release only */
  ke?: number;
  /** Time to peak (hours) — gaussian models */
  tPeak?: number;
  /** Gaussian width (hours) — gaussian models */
  sigma?: number;
  /** Elimination half-life (hours) */
  halfLife: number;
  /** Duration of action (hours) */
  doa: number;
  /** Peak range description */
  peakRange: string;
}

export interface InsulinDose {
  id: string;
  insulin: string; // key into FORMULARY
  dose: number;    // units
  /** Injection time as fractional hour (0–24) */
  hour: number;
}

export interface IOBTimepoint {
  /** Fractional hour (0–48+) */
  hour: number;
  totalIOB: number;
  basalIOB: number;
  bolusIOB: number;
  pressure: PressureClass;
  perInsulin: { insulin: string; iob: number }[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   13-INSULIN FORMULARY (ZA-NAM, locked PK parameters)
   ═══════════════════════════════════════════════════════════════════════════ */

export const FORMULARY: Record<string, InsulinPK> = {
  // ── MODEL A: Depot-Release (ultra-long / long, peakless) ───────────────
  "Degludec (Tresiba)": {
    id: "tresiba", name: "Degludec", brand: "Tresiba",
    category: "basal", model: "depot-release",
    ka: 0.08, ke: 0.0277,
    halfLife: 25, doa: 42,
    peakRange: "Peakless (flat profile)",
  },
  "Glargine U100 (Lantus)": {
    id: "lantus", name: "Glargine U-100", brand: "Lantus",
    category: "basal", model: "depot-release",
    ka: 0.15, ke: 0.058,
    halfLife: 12, doa: 24,
    peakRange: "Peakless (flat profile)",
  },
  "Glargine U300 (Toujeo)": {
    id: "toujeo", name: "Glargine U-300", brand: "Toujeo",
    category: "basal", model: "depot-release",
    ka: 0.10, ke: 0.0365,
    halfLife: 19, doa: 36,
    peakRange: "Peakless (flat profile)",
  },

  // ── MODEL B: Gaussian Peak (intermediate / peaked basal) ───────────────
  "Detemir (Levemir)": {
    id: "levemir", name: "Detemir", brand: "Levemir",
    category: "basal", model: "gaussian-peak",
    tPeak: 7, sigma: 3.5,
    halfLife: 6, doa: 20,
    peakRange: "6-8 hours",
  },
  "NPH (Protaphane)": {
    id: "nph-protaphane", name: "NPH", brand: "Protaphane",
    category: "basal", model: "gaussian-peak",
    tPeak: 5, sigma: 2.5,
    halfLife: 4, doa: 16,
    peakRange: "4-6 hours",
  },
  "NPH (Humulin N)": {
    id: "nph-humulin", name: "NPH", brand: "Humulin N",
    category: "basal", model: "gaussian-peak",
    tPeak: 5, sigma: 2.5,
    halfLife: 4, doa: 16,
    peakRange: "4-6 hours",
  },

  // ── MODEL C: Rapid Gaussian (ultra-rapid / rapid / short) ──────────────
  "Fiasp": {
    id: "fiasp", name: "Faster Aspart", brand: "Fiasp",
    category: "bolus", model: "rapid-gaussian",
    tPeak: 1.0, sigma: 0.7,
    halfLife: 1.1, doa: 5,
    peakRange: "0.5-1.5 hours",
  },
  "Aspart (NovoRapid)": {
    id: "novorapid", name: "Aspart", brand: "NovoRapid",
    category: "bolus", model: "rapid-gaussian",
    tPeak: 1.5, sigma: 0.8,
    halfLife: 1.1, doa: 5,
    peakRange: "1-2 hours",
  },
  "Lispro (Humalog)": {
    id: "humalog", name: "Lispro", brand: "Humalog",
    category: "bolus", model: "rapid-gaussian",
    tPeak: 1.5, sigma: 0.8,
    halfLife: 1.1, doa: 5,
    peakRange: "1-2 hours",
  },
  "Glulisine (Apidra)": {
    id: "apidra", name: "Glulisine", brand: "Apidra",
    category: "bolus", model: "rapid-gaussian",
    tPeak: 1.5, sigma: 0.75,
    halfLife: 1.0, doa: 4,
    peakRange: "1-2 hours",
  },
  "Actrapid": {
    id: "actrapid", name: "Regular/Soluble", brand: "Actrapid",
    category: "bolus", model: "rapid-gaussian",
    tPeak: 2.5, sigma: 1.25,
    halfLife: 1.5, doa: 8,
    peakRange: "2-3 hours",
  },
  "Humulin R": {
    id: "humulin-r", name: "Regular/Soluble", brand: "Humulin R",
    category: "bolus", model: "rapid-gaussian",
    tPeak: 2.5, sigma: 1.25,
    halfLife: 1.5, doa: 8,
    peakRange: "2-3 hours",
  },

  // ── PREMIX (composite models) ──────────────────────────────────────────
  "Premix 30/70 (NovoMix)": {
    id: "novomix30", name: "Premix 30/70", brand: "NovoMix 30",
    category: "mixed", model: "rapid-gaussian",
    tPeak: 1.5, sigma: 0.8,
    halfLife: 4, doa: 16,
    peakRange: "1-2 hours (rapid component)",
  },
  "Premix 25/75 (Humalog Mix)": {
    id: "humalog-mix", name: "Premix 25/75", brand: "Humalog Mix 25",
    category: "mixed", model: "rapid-gaussian",
    tPeak: 1.5, sigma: 0.8,
    halfLife: 4, doa: 16,
    peakRange: "1-2 hours (rapid component)",
  },
};

/** All insulin names for dropdown */
export const INSULIN_NAMES = Object.keys(FORMULARY);

/** Basal insulin names */
export const BASAL_NAMES = INSULIN_NAMES.filter(
  (n) => FORMULARY[n].category === "basal"
);

/** Bolus insulin names */
export const BOLUS_NAMES = INSULIN_NAMES.filter(
  (n) => FORMULARY[n].category === "bolus"
);

/* ═══════════════════════════════════════════════════════════════════════════
   CORE PK CALCULATIONS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * MODEL A: Two-compartment depot-release.
 * C(t) = dose × (ka / (ka - ke)) × (e^(-ke×t) - e^(-ka×t))
 * Returns IOB as the remaining integral of activity from t to infinity.
 *
 * For peakless ultra-long and long-acting insulins:
 * Tresiba, Glargine (Lantus/Toujeo)
 */
function depotReleaseIOB(dose: number, t: number, ka: number, ke: number): number {
  if (t < 0) return dose; // before injection — full dose pending
  if (t === 0) return dose;

  // Concentration at time t
  const scale = ka / (ka - ke);
  const concentration = scale * (Math.exp(-ke * t) - Math.exp(-ka * t));

  // IOB = integral of remaining activity from t to infinity
  // IOB(t) = dose × [ (1/ke)×e^(-ke×t) - (1/ka)×e^(-ka×t) ] / [ (1/ke) - (1/ka) ]
  const remainingKe = Math.exp(-ke * t) / ke;
  const remainingKa = Math.exp(-ka * t) / ka;
  const totalArea = (1 / ke) - (1 / ka);

  if (totalArea <= 0) return 0;
  const iob = dose * (remainingKe - remainingKa) / totalArea;
  return Math.max(0, iob);
}

/**
 * MODEL B & C: Gaussian peak model.
 * IOB(t) = dose × exp(-0.5 × ((t - tPeak) / sigma)²)
 *
 * For peaked basals (Levemir, NPH) and all rapid/short insulins.
 * The Gaussian naturally produces bell curves with meaningful tails.
 */
function gaussianIOB(dose: number, t: number, tPeak: number, sigma: number): number {
  if (t < 0) return 0;
  const diff = t - tPeak;
  return dose * Math.exp(-0.5 * (diff / sigma) ** 2);
}

/**
 * Compute IOB for a single dose of any insulin at elapsed time t (hours).
 * Returns IOB in Units.
 */
export function computeIOB(insulinName: string, dose: number, elapsedHours: number): number {
  const pk = FORMULARY[insulinName];
  if (!pk) return 0;
  if (elapsedHours < 0) return 0;
  if (elapsedHours > pk.doa) return 0;

  switch (pk.model) {
    case "depot-release":
      return depotReleaseIOB(dose, elapsedHours, pk.ka!, pk.ke!);

    case "gaussian-peak":
      return gaussianIOB(dose, elapsedHours, pk.tPeak!, pk.sigma!);

    case "rapid-gaussian":
      return gaussianIOB(dose, elapsedHours, pk.tPeak!, pk.sigma!);

    default:
      return 0;
  }
}

/**
 * Compute IOB for premix insulins (composite: rapid + NPH components).
 */
function computePremixIOB(insulinName: string, dose: number, elapsedHours: number): number {
  const pk = FORMULARY[insulinName];
  if (!pk || pk.category !== "mixed") return computeIOB(insulinName, dose, elapsedHours);

  if (insulinName.includes("30/70")) {
    // 30% rapid aspart + 70% NPH-like
    const rapidIOB = gaussianIOB(dose * 0.3, elapsedHours, 1.5, 0.8);
    const nphIOB = gaussianIOB(dose * 0.7, elapsedHours, 5, 2.5);
    if (elapsedHours > 16) return 0;
    return rapidIOB + nphIOB;
  }
  if (insulinName.includes("25/75")) {
    // 25% lispro + 75% NPH-like
    const rapidIOB = gaussianIOB(dose * 0.25, elapsedHours, 1.5, 0.8);
    const nphIOB = gaussianIOB(dose * 0.75, elapsedHours, 5, 2.5);
    if (elapsedHours > 16) return 0;
    return rapidIOB + nphIOB;
  }
  return computeIOB(insulinName, dose, elapsedHours);
}

/**
 * Universal IOB calculator — handles all 13+ insulins including premix.
 */
export function getIOB(insulinName: string, dose: number, elapsedHours: number): number {
  const pk = FORMULARY[insulinName];
  if (!pk) return 0;
  if (pk.category === "mixed") return computePremixIOB(insulinName, dose, elapsedHours);
  return computeIOB(insulinName, dose, elapsedHours);
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRESSURE CLASSIFICATION
   ═══════════════════════════════════════════════════════════════════════════ */

export function classifyPressure(iob: number, maxIOB: number): PressureClass {
  if (maxIOB <= 0) return "light";
  const ratio = iob / maxIOB;
  if (ratio < 0.25) return "light";
  if (ratio < 0.5) return "moderate";
  if (ratio < 0.75) return "strong";
  return "overlap";
}

export const PRESSURE_COLORS: Record<PressureClass, string> = {
  light: "#22c55e",
  moderate: "#f59e0b",
  strong: "#f97316",
  overlap: "#ef4444",
};

export const PRESSURE_BG_OPACITY: Record<PressureClass, number> = {
  light: 0,
  moderate: 0.1,
  strong: 0.15,
  overlap: 0.2,
};
