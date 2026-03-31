/**
 * GluMira™ V7 — server/analytics/iob-engine.ts
 * Re-exports all IOB Hunter™ engine functions from glumira-trpc-types.ts
 * Source of truth: spec 01.1 (IOB Hunter Core Engine Logic)
 * Version: v1.0 · 2026-03-29
 */

export type InsulinType =
  | "glargine_u100" | "glargine_u300" | "degludec" | "detemir" | "nph"
  | "aspart" | "lispro" | "glulisine" | "regular";

export const INSULIN_PARAMS: Record<InsulinType, { name: string; type: "basal"|"bolus"; doa: number; onset: number; peak: number }> = {
  glargine_u100: { name: "Glargine (Lantus)",      type: "basal",  doa: 24,  onset: 1,    peak: 0    },
  glargine_u300: { name: "Glargine U300 (Toujeo)", type: "basal",  doa: 36,  onset: 2,    peak: 0    },
  degludec:      { name: "Degludec (Tresiba)",     type: "basal",  doa: 42,  onset: 1,    peak: 0    },
  detemir:       { name: "Detemir (Levemir)",      type: "basal",  doa: 20,  onset: 1.5,  peak: 0    },
  nph:           { name: "NPH",                    type: "basal",  doa: 14,  onset: 3,    peak: 6    },
  aspart:        { name: "Aspart (NovoRapid)",     type: "bolus",  doa: 4,   onset: 0.25, peak: 1.25 },
  lispro:        { name: "Lispro (Humalog)",       type: "bolus",  doa: 4,   onset: 0.25, peak: 1    },
  glulisine:     { name: "Glulisine (Apidra)",     type: "bolus",  doa: 3.5, onset: 0.25, peak: 1    },
  regular:       { name: "Regular (Actrapid)",     type: "bolus",  doa: 7,   onset: 0.75, peak: 2.5  },
};

export type RiskZone = "safe" | "caution" | "elevated" | "high";

/** λ = ln(2) / (DOA × 0.5) */
export function getLambda(doa: number): number {
  return Math.LN2 / (doa * 0.5);
}

/** IOB(t) = dose × e^(−λt) — spec 01.1 §2.1 */
export function calcIOB(dose: number, hoursElapsed: number, doa: number): number {
  return Math.max(0, dose * Math.exp(-getLambda(doa) * hoursElapsed));
}

/** stackingScore = min(100, (totalIOB / basalDose) × 100) */
export function calcStackingScore(totalIOB: number, typicalBasalDose: number): number {
  return Math.min(100, (totalIOB / typicalBasalDose) * 100);
}

export function getStackingRiskZone(score: number): RiskZone {
  if (score <= 30) return "safe";
  if (score <= 55) return "caution";
  if (score <= 75) return "elevated";
  return "high";
}

/** ISF — 100 Rule (mmol/L per unit) */
export function calcISF(tdd: number): number { return 100 / tdd; }

/** ICR — 500 Rule (g carbs per unit) */
export function calcICR(tdd: number): number { return 500 / tdd; }

export function calcCorrectionDose(current: number, target: number, isf: number): number {
  return (current - target) / isf;
}

export function calcNetCorrection(correctionDose: number, totalIOB: number): number {
  return Math.max(0, correctionDose - totalIOB);
}

export function calcMealBolus(carbGrams: number, icr: number): number {
  return carbGrams / icr;
}

export function calcTotalBolus(mealBolus: number, netCorrection: number): number {
  return Math.max(0, mealBolus + netCorrection);
}

/** Binary search: when does totalIOB drop below 20% of basal? */
export function calcOptimalDoseTime(
  doses: Array<{ doseUnits: number; hoursElapsed: number; insulinType: InsulinType }>,
  typicalBasalDose: number,
  maxHours = 48
): number {
  const threshold = typicalBasalDose * 0.20;
  const totalAtT  = (t: number) => doses.reduce((s, d) => s + calcIOB(d.doseUnits, d.hoursElapsed + t, INSULIN_PARAMS[d.insulinType].doa), 0);
  if (totalAtT(0) <= threshold) return 0;
  let lo = 0, hi = maxHours;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    totalAtT(mid) <= threshold ? (hi = mid) : (lo = mid);
  }
  return Math.round(hi * 10) / 10;
}
