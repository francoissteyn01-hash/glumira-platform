/**
 * GluMira™ — Bolus Advisor Module
 *
 * Calculates suggested bolus doses based on carb intake, current
 * glucose, target glucose, ISF, ICR, and active insulin on board (IOB).
 *
 * Supports standard, extended, and split bolus strategies for
 * different meal types.
 *
 * NOT a medical device. Educational purposes only.
 */

export interface BolusInput {
  currentGlucoseMmol: number;
  targetGlucoseMmol: number;
  carbsG: number;
  icr: number;                     // 1 unit per X grams
  isf: number;                     // mmol/L per unit
  iob: number;                     // insulin on board (units)
  mealType: "standard" | "high-fat" | "high-protein" | "low-gi" | "liquid" | "snack";
  exercisePlanned: boolean;
  exerciseIntensity?: "light" | "moderate" | "vigorous";
  exerciseTimingHours?: number;    // hours until exercise
  isPreBolus: boolean;             // bolusing before eating
  preBolusMinutes?: number;
}

export interface BolusBreakdown {
  carbBolus: number;
  correctionBolus: number;
  iobAdjustment: number;
  exerciseAdjustment: number;
  totalBolus: number;
}

export interface BolusStrategy {
  type: "standard" | "extended" | "split";
  upfrontPercent: number;
  extendedPercent: number;
  extendedDurationMinutes: number;
  reason: string;
}

export interface BolusResult {
  breakdown: BolusBreakdown;
  strategy: BolusStrategy;
  suggestedDose: number;
  upfrontDose: number;
  extendedDose: number;
  preBolusTiming: string;
  warnings: string[];
  notes: string[];
  disclaimer: string;
}

/* ── Main advisor ────────────────────────────────────────────── */

export function calculateBolus(input: BolusInput): BolusResult {
  const {
    currentGlucoseMmol, targetGlucoseMmol, carbsG, icr, isf, iob,
    mealType, exercisePlanned, exerciseIntensity, exerciseTimingHours,
    isPreBolus, preBolusMinutes,
  } = input;

  const warnings: string[] = [];
  const notes: string[] = [];

  // ── Carb bolus ──
  const carbBolus = icr > 0 ? Math.round((carbsG / icr) * 10) / 10 : 0;

  // ── Correction bolus ──
  const glucoseDiff = currentGlucoseMmol - targetGlucoseMmol;
  let correctionBolus = 0;
  if (glucoseDiff > 0 && isf > 0) {
    correctionBolus = Math.round((glucoseDiff / isf) * 10) / 10;
  }

  // ── IOB adjustment ──
  const iobAdjustment = iob === 0 ? 0 : -Math.round(Math.min(iob, carbBolus + correctionBolus) * 10) / 10;

  // ── Exercise adjustment ──
  let exerciseAdjustment = 0;
  if (exercisePlanned) {
    let reductionPercent = 0;
    const timing = exerciseTimingHours ?? 2;

    switch (exerciseIntensity) {
      case "light": reductionPercent = 10; break;
      case "moderate": reductionPercent = 25; break;
      case "vigorous": reductionPercent = 40; break;
      default: reductionPercent = 20;
    }

    // Less reduction if exercise is far away
    if (timing > 3) reductionPercent = Math.round(reductionPercent * 0.5);

    const baseTotal = carbBolus + correctionBolus + iobAdjustment;
    exerciseAdjustment = -Math.round(baseTotal * reductionPercent / 100 * 10) / 10;

    notes.push(`Exercise adjustment: ${reductionPercent}% reduction for ${exerciseIntensity ?? "planned"} exercise in ${timing}h.`);
  }

  // ── Total ──
  const rawTotal = carbBolus + correctionBolus + iobAdjustment + exerciseAdjustment;
  const totalBolus = Math.max(0, Math.round(rawTotal * 10) / 10);

  // ── Strategy ──
  let strategy: BolusStrategy;

  switch (mealType) {
    case "high-fat":
      strategy = {
        type: "split",
        upfrontPercent: 60,
        extendedPercent: 40,
        extendedDurationMinutes: 120,
        reason: "High-fat meals cause delayed glucose rise. Split bolus covers both immediate and delayed absorption.",
      };
      break;
    case "high-protein":
      strategy = {
        type: "split",
        upfrontPercent: 70,
        extendedPercent: 30,
        extendedDurationMinutes: 90,
        reason: "High-protein meals cause a delayed glucose rise from gluconeogenesis.",
      };
      break;
    case "low-gi":
      strategy = {
        type: "extended",
        upfrontPercent: 40,
        extendedPercent: 60,
        extendedDurationMinutes: 180,
        reason: "Low-GI meals absorb slowly. Extended bolus matches the gradual glucose rise.",
      };
      break;
    case "liquid":
      strategy = {
        type: "standard",
        upfrontPercent: 100,
        extendedPercent: 0,
        extendedDurationMinutes: 0,
        reason: "Liquid carbs absorb rapidly. Standard bolus with pre-bolus timing is best.",
      };
      break;
    case "snack":
      strategy = {
        type: "standard",
        upfrontPercent: 100,
        extendedPercent: 0,
        extendedDurationMinutes: 0,
        reason: "Small snack — standard bolus is sufficient.",
      };
      break;
    default:
      strategy = {
        type: "standard",
        upfrontPercent: 100,
        extendedPercent: 0,
        extendedDurationMinutes: 0,
        reason: "Standard meal — normal bolus delivery.",
      };
  }

  const upfrontDose = Math.round(totalBolus * strategy.upfrontPercent / 100 * 10) / 10;
  const extendedDose = Math.round((totalBolus - upfrontDose) * 10) / 10;

  // ── Pre-bolus timing ──
  let preBolusTiming = "Bolus at the start of the meal.";
  if (isPreBolus && preBolusMinutes) {
    preBolusTiming = `Pre-bolus ${preBolusMinutes} minutes before eating.`;
  } else if (currentGlucoseMmol > 10) {
    preBolusTiming = "Consider pre-bolusing 15-20 minutes before eating (glucose is elevated).";
  } else if (currentGlucoseMmol < 4.5) {
    preBolusTiming = "Eat first, then bolus — glucose is low.";
  } else if (mealType === "liquid") {
    preBolusTiming = "Pre-bolus 10-15 minutes before drinking — liquid carbs absorb fast.";
  }

  // ── Warnings ──
  if (currentGlucoseMmol < 3.5) {
    warnings.push("HYPOGLYCEMIA: Treat low glucose first. Do not bolus until glucose is above 4.0 mmol/L.");
  }
  if (totalBolus > 20) {
    warnings.push(`Large bolus (${totalBolus}U) — verify carb count and settings before delivering.`);
  }
  if (iob > 3) {
    warnings.push(`Significant insulin on board (${iob}U) — be cautious of insulin stacking.`);
  }
  if (correctionBolus > 0 && carbBolus === 0) {
    notes.push("Correction-only bolus — no carbs entered.");
  }

  return {
    breakdown: {
      carbBolus,
      correctionBolus,
      iobAdjustment,
      exerciseAdjustment,
      totalBolus,
    },
    strategy,
    suggestedDose: totalBolus,
    upfrontDose,
    extendedDose,
    preBolusTiming,
    warnings,
    notes,
    disclaimer:
      "GluMira™ is an educational platform. The science of insulin, made visible. " +
      "Always verify bolus calculations with your own judgment and healthcare team guidance.",
  };
}
