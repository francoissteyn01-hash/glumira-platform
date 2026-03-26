/**
 * GluMira™ — bolus-calculator.ts
 *
 * Advanced bolus dose calculation engine (IOB Hunter™ integration).
 * Computes: meal bolus, correction bolus, combined bolus, super-bolus.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 * All outputs must be reviewed by a qualified healthcare professional.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BolusInput {
  carbsGrams: number;
  currentGlucose: number;   // mmol/L
  targetGlucose: number;    // mmol/L (default 6.0)
  icr: number;              // insulin-to-carb ratio (g/U)
  isf: number;              // insulin sensitivity factor (mmol/L per 1U)
  activeIob: number;        // active IOB in units
  glucaemicIndex?: number;  // optional GI for timing adjustment
}

export interface BolusResult {
  mealDose: number;         // units for carbs
  correctionDose: number;   // units for glucose correction
  iobOffset: number;        // units subtracted for active IOB
  totalDose: number;        // final recommended dose (>= 0)
  suggestedDose: number;    // rounded to 0.5U
  bolusDelay: number;       // minutes to wait before eating (0 = eat now)
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

export interface SuperBolusInput extends BolusInput {
  basalRate: number;        // U/hr current basal rate
  superBolusHours?: number; // hours of basal to absorb into bolus (default 2)
}

export interface SuperBolusResult extends BolusResult {
  basalAbsorbed: number;    // units of basal absorbed into super-bolus
  reducedBasalDuration: number; // hours to reduce/suspend basal
}

// ─── Core bolus calculation ───────────────────────────────────────────────────

/**
 * Compute a standard meal + correction bolus.
 */
export function computeBolus(input: BolusInput): BolusResult {
  const {
    carbsGrams,
    currentGlucose,
    targetGlucose,
    icr,
    isf,
    activeIob,
    glucaemicIndex,
  } = input;

  const warnings: string[] = [];

  // Validate inputs
  if (icr <= 0) throw new Error("ICR must be positive");
  if (isf <= 0) throw new Error("ISF must be positive");
  if (carbsGrams < 0) throw new Error("carbsGrams must be non-negative");

  // Meal dose
  const mealDose = carbsGrams / icr;

  // Correction dose
  const glucoseDelta = currentGlucose - targetGlucose;
  const correctionDose = glucoseDelta / isf;

  // IOB offset (only reduce dose, never add)
  const iobOffset = Math.min(activeIob, mealDose + Math.max(0, correctionDose));

  // Total dose
  const rawTotal = mealDose + correctionDose - iobOffset;
  const totalDose = Math.max(0, rawTotal);

  // Round to 0.5U
  const suggestedDose = Math.round(totalDose * 2) / 2;

  // Bolus delay based on GI and current glucose
  let bolusDelay = 0;
  if (glucaemicIndex !== undefined) {
    if (glucaemicIndex >= 70) {
      bolusDelay = 0; // high GI — dose at meal start
    } else if (glucaemicIndex >= 55) {
      bolusDelay = currentGlucose < 6.0 ? 0 : 10;
    } else {
      bolusDelay = currentGlucose < 5.0 ? 0 : 15;
    }
  }

  // Warnings
  if (currentGlucose < 4.0) {
    warnings.push("Glucose below 4.0 mmol/L — treat hypoglycaemia before dosing");
  }
  if (currentGlucose > 14.0) {
    warnings.push("Glucose above 14.0 mmol/L — check for ketones before dosing");
  }
  if (suggestedDose > 20) {
    warnings.push("Unusually large dose — verify carb count and ICR with clinician");
  }
  if (activeIob > mealDose * 0.5) {
    warnings.push("Significant active IOB — stacking risk, review timing");
  }

  // Confidence
  const confidence: "high" | "medium" | "low" =
    icr >= 5 && icr <= 20 && isf >= 1.0 && isf <= 5.0 ? "high"
    : icr >= 3 && icr <= 30 && isf >= 0.5 && isf <= 8.0 ? "medium"
    : "low";

  return {
    mealDose:       Math.round(mealDose * 100) / 100,
    correctionDose: Math.round(correctionDose * 100) / 100,
    iobOffset:      Math.round(iobOffset * 100) / 100,
    totalDose:      Math.round(totalDose * 100) / 100,
    suggestedDose,
    bolusDelay,
    confidence,
    warnings,
  };
}

/**
 * Compute a correction-only bolus (no meal).
 */
export function computeCorrectionBolus(
  currentGlucose: number,
  targetGlucose: number,
  isf: number,
  activeIob: number
): BolusResult {
  return computeBolus({
    carbsGrams: 0,
    currentGlucose,
    targetGlucose,
    icr: 10, // ICR irrelevant for correction-only
    isf,
    activeIob,
  });
}

/**
 * Compute a super-bolus (meal bolus + absorbed basal).
 */
export function computeSuperBolus(input: SuperBolusInput): SuperBolusResult {
  const { basalRate, superBolusHours = 2, ...bolusInput } = input;

  const basalAbsorbed = basalRate * superBolusHours;
  const augmentedInput: BolusInput = {
    ...bolusInput,
    carbsGrams: bolusInput.carbsGrams, // carbs unchanged
  };

  const base = computeBolus(augmentedInput);
  const totalWithBasal = base.totalDose + basalAbsorbed;
  const suggestedDose  = Math.round(totalWithBasal * 2) / 2;

  return {
    ...base,
    totalDose:             Math.round(totalWithBasal * 100) / 100,
    suggestedDose,
    basalAbsorbed:         Math.round(basalAbsorbed * 100) / 100,
    reducedBasalDuration:  superBolusHours,
    warnings: [
      ...base.warnings,
      `Suspend/reduce basal for ${superBolusHours}h after super-bolus`,
    ],
  };
}

// ─── Dose rounding helpers ────────────────────────────────────────────────────

/**
 * Round a dose to the nearest increment (default 0.5U).
 */
export function roundDose(units: number, increment = 0.5): number {
  return Math.round(units / increment) * increment;
}

/**
 * Classify dose size for safety display.
 */
export function classifyDoseSize(
  units: number
): "micro" | "small" | "medium" | "large" | "very-large" {
  if (units < 1)  return "micro";
  if (units < 5)  return "small";
  if (units < 10) return "medium";
  if (units < 20) return "large";
  return "very-large";
}
