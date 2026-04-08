/**
 * GluMira™ V7 — client/src/lib/country-insulin-formulary.ts
 * Region-locked insulin formulary and pharmacology data.
 * Drives dropdown options and IOB curve calculations.
 */

export interface InsulinProfile {
  name: string;
  brand: string;
  category: "basal" | "bolus" | "mixed";
  /** Duration of action in hours */
  doa: number;
  /** Time to peak in hours (null = peakless depot-release) */
  peakHours: number | null;
  /** Half-life in hours */
  halfLifeHours: number;
  /** Curve model type */
  model: "gaussian" | "depot-release" | "bilinear";
}

export const INSULIN_PHARMACOLOGY: Record<string, InsulinProfile> = {
  // ── Basal insulins ──────────────────────────────────────────
  "Degludec (Tresiba)": {
    name: "Degludec (Tresiba)",
    brand: "Tresiba",
    category: "basal",
    doa: 42,
    peakHours: null,
    halfLifeHours: 25,
    model: "depot-release",
  },
  "Detemir (Levemir)": {
    name: "Detemir (Levemir)",
    brand: "Levemir",
    category: "basal",
    doa: 20,
    peakHours: 7,
    halfLifeHours: 6,
    model: "gaussian",
  },
  "Glargine U100 (Lantus)": {
    name: "Glargine U100 (Lantus)",
    brand: "Lantus",
    category: "basal",
    doa: 24,
    peakHours: null,
    halfLifeHours: 12,
    model: "depot-release",
  },
  "Glargine U300 (Toujeo)": {
    name: "Glargine U300 (Toujeo)",
    brand: "Toujeo",
    category: "basal",
    doa: 36,
    peakHours: null,
    halfLifeHours: 18,
    model: "depot-release",
  },
  "NPH (Protaphane)": {
    name: "NPH (Protaphane)",
    brand: "Protaphane",
    category: "basal",
    doa: 16,
    peakHours: 5,
    halfLifeHours: 4,
    model: "gaussian",
  },
  "NPH (Humulin N)": {
    name: "NPH (Humulin N)",
    brand: "Humulin N",
    category: "basal",
    doa: 16,
    peakHours: 5,
    halfLifeHours: 4,
    model: "gaussian",
  },

  // ── Bolus / rapid insulins ──────────────────────────────────
  "Aspart (NovoRapid)": {
    name: "Aspart (NovoRapid)",
    brand: "NovoRapid",
    category: "bolus",
    doa: 5,
    peakHours: 1.5,
    halfLifeHours: 1.1,
    model: "gaussian",
  },
  "Fiasp": {
    name: "Fiasp",
    brand: "Fiasp",
    category: "bolus",
    doa: 5,
    peakHours: 1.5,
    halfLifeHours: 1.1,
    model: "gaussian",
  },
  "Lispro (Humalog)": {
    name: "Lispro (Humalog)",
    brand: "Humalog",
    category: "bolus",
    doa: 5,
    peakHours: 1.5,
    halfLifeHours: 1.1,
    model: "gaussian",
  },
  "Glulisine (Apidra)": {
    name: "Glulisine (Apidra)",
    brand: "Apidra",
    category: "bolus",
    doa: 4,
    peakHours: 1.5,
    halfLifeHours: 1.0,
    model: "gaussian",
  },
  "Humulin R": {
    name: "Humulin R",
    brand: "Humulin R",
    category: "bolus",
    doa: 8,
    peakHours: 2.5,
    halfLifeHours: 1.5,
    model: "gaussian",
  },
  "Actrapid": {
    name: "Actrapid",
    brand: "Actrapid",
    category: "bolus",
    doa: 8,
    peakHours: 2.5,
    halfLifeHours: 1.5,
    model: "gaussian",
  },
};

/** Country-specific formulary — which insulins are available in each region */
export const INSULIN_FORMULARY: Record<string, string[]> = {
  ZA: [
    "Degludec (Tresiba)", "Detemir (Levemir)", "Glargine U100 (Lantus)",
    "Glargine U300 (Toujeo)", "NPH (Protaphane)", "NPH (Humulin N)",
    "Aspart (NovoRapid)", "Fiasp", "Lispro (Humalog)",
    "Glulisine (Apidra)", "Humulin R", "Actrapid",
  ],
  UK: [
    "Degludec (Tresiba)", "Detemir (Levemir)", "Glargine U100 (Lantus)",
    "Glargine U300 (Toujeo)", "NPH (Humulin N)",
    "Aspart (NovoRapid)", "Fiasp", "Lispro (Humalog)",
    "Glulisine (Apidra)", "Humulin R",
  ],
  US: [
    "Degludec (Tresiba)", "Detemir (Levemir)", "Glargine U100 (Lantus)",
    "Glargine U300 (Toujeo)", "NPH (Humulin N)",
    "Aspart (NovoRapid)", "Fiasp", "Lispro (Humalog)",
    "Glulisine (Apidra)", "Humulin R",
  ],
  EU: [
    "Degludec (Tresiba)", "Detemir (Levemir)", "Glargine U100 (Lantus)",
    "Glargine U300 (Toujeo)", "NPH (Humulin N)",
    "Aspart (NovoRapid)", "Fiasp", "Lispro (Humalog)",
    "Glulisine (Apidra)", "Humulin R",
  ],
  UAE: [
    "Degludec (Tresiba)", "Detemir (Levemir)", "Glargine U100 (Lantus)",
    "NPH (Humulin N)",
    "Aspart (NovoRapid)", "Fiasp", "Lispro (Humalog)",
    "Humulin R", "Actrapid",
  ],
  INT: [
    "Degludec (Tresiba)", "Detemir (Levemir)", "Glargine U100 (Lantus)",
    "Glargine U300 (Toujeo)", "NPH (Protaphane)", "NPH (Humulin N)",
    "Aspart (NovoRapid)", "Fiasp", "Lispro (Humalog)",
    "Glulisine (Apidra)", "Humulin R", "Actrapid",
  ],
};

/** Get formulary for a country code, falling back to INT */
export function getFormularyForCountry(country: string): string[] {
  return INSULIN_FORMULARY[country] ?? INSULIN_FORMULARY.INT;
}

/** Get basal insulins for a country */
export function getBasalInsulins(country: string): string[] {
  return getFormularyForCountry(country).filter(
    (name) => INSULIN_PHARMACOLOGY[name]?.category === "basal"
  );
}

/** Get bolus insulins for a country */
export function getBolusInsulins(country: string): string[] {
  return getFormularyForCountry(country).filter(
    (name) => INSULIN_PHARMACOLOGY[name]?.category === "bolus"
  );
}

/**
 * Calculate IOB at a given time offset (hours) from injection.
 * Uses real PK models — depot-release (two-compartment) for peakless,
 * Gaussian for peaked insulins. NO linear triangles.
 * Returns fraction of original dose remaining (0–1).
 */
export function calculateIOB(
  insulinName: string,
  hoursAfterInjection: number
): number {
  const profile = INSULIN_PHARMACOLOGY[insulinName];
  if (!profile || hoursAfterInjection < 0 || hoursAfterInjection > profile.doa) return 0;

  if (profile.model === "depot-release") {
    // Two-compartment depot-release: IOB from integral of remaining activity
    const ka = profile.halfLifeHours < 15 ? 0.15 : profile.halfLifeHours < 20 ? 0.10 : 0.08;
    const ke = Math.LN2 / profile.halfLifeHours;
    const t = hoursAfterInjection;
    if (t === 0) return 1;
    const remainingKe = Math.exp(-ke * t) / ke;
    const remainingKa = Math.exp(-ka * t) / ka;
    const totalArea = (1 / ke) - (1 / ka);
    if (totalArea <= 0) return 0;
    return Math.max(0, (remainingKe - remainingKa) / totalArea);
  }

  // Gaussian-peaked model — full bell curve, no linear ramp
  const peak = profile.peakHours ?? profile.doa / 4;
  const sigma = profile.model === "bilinear"
    ? profile.halfLifeHours / 1.177
    : peak * 0.6; // sigma proportional to peak for proper bell shape
  const diff = hoursAfterInjection - peak;
  return Math.exp(-0.5 * (diff / sigma) ** 2);
}

/**
 * Generate IOB curve data points for a single injection.
 * Returns array of { hours, iob } where iob is in Units.
 */
export function generateIOBCurve(
  insulinName: string,
  doseUnits: number,
  resolutionMinutes: number = 15
): { hours: number; iob: number }[] {
  const profile = INSULIN_PHARMACOLOGY[insulinName];
  if (!profile) return [];

  const points: { hours: number; iob: number }[] = [];
  const stepHours = resolutionMinutes / 60;

  for (let h = 0; h <= profile.doa; h += stepHours) {
    points.push({ hours: h, iob: doseUnits * calculateIOB(insulinName, h) });
  }
  return points;
}
