/**
 * GluMira™ V7 — server/analytics/bolus-calculator.ts
 * Bolus calculator stub (educational only).
 * GluMira™ is an educational platform, not a medical device.
 */
export interface BolusInput {
  currentGlucose: number;
  targetGlucose?: number;
  carbsGrams: number;
  icr: number;
  isf: number;
  iob?: number;
}

export interface BolusResult {
  correctionDose: number;
  carbDose: number;
  totalDose: number;
  iobAdjustment: number;
  note: string;
}

export function computeBolus(input: BolusInput): BolusResult {
  const target = input.targetGlucose ?? 6.0;
  const iob = input.iob ?? 0;
  const correction = input.isf > 0 ? (input.currentGlucose - target) / input.isf : 0;
  const carbDose = input.icr > 0 ? input.carbsGrams / input.icr : 0;
  const raw = correction + carbDose - iob;
  const total = Math.max(0, Math.round(raw * 10) / 10);
  return {
    correctionDose: Math.round(Math.max(0, correction) * 10) / 10,
    carbDose: Math.round(carbDose * 10) / 10,
    totalDose: total,
    iobAdjustment: Math.round(iob * 10) / 10,
    note: "This is for educational purposes only. Always consult your care team.",
  };
}
