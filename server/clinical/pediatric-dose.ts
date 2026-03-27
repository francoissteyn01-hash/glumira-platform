/**
 * GluMira™ — Pediatric Insulin Dose Calculator Module
 *
 * Calculates age-appropriate insulin doses for children and adolescents
 * with Type 1 diabetes. Accounts for growth phases, puberty, and
 * weight-based dosing.
 *
 * Clinical relevance:
 * - Children need much smaller doses than adults
 * - Puberty dramatically increases insulin resistance
 * - Honeymoon phase reduces insulin needs
 * - Weight-based TDD is the standard approach
 *
 * NOT a medical device. Educational purposes only.
 */

export interface PediatricInput {
  ageYears: number;
  weightKg: number;
  diabetesType: "type1" | "type2";
  yearsSinceDiagnosis: number;
  inHoneymoonPhase: boolean;
  pubertyStage: "pre-puberty" | "early-puberty" | "mid-puberty" | "late-puberty" | "post-puberty";
  currentTDD?: number;         // current total daily dose
  currentA1c?: number;
  recentHyposPerWeek: number;
  usePump: boolean;
  mealsPerDay: number;
  avgCarbsPerMeal: number;
}

export interface PediatricDoseResult {
  estimatedTDD: number;
  tddPerKg: number;
  basalDose: number;
  basalPercent: number;
  bolusPerMeal: number;
  icr: number;                 // insulin-to-carb ratio (1 unit per X grams)
  isf: number;                 // insulin sensitivity factor (mmol/L drop per unit)
  isfMgdl: number;
  ageGroup: string;
  adjustments: DoseAdjustment[];
  safetyChecks: SafetyCheck[];
  guidance: string[];
  warnings: string[];
  disclaimer: string;
}

export interface DoseAdjustment {
  factor: string;
  effect: string;
  magnitude: string;
}

export interface SafetyCheck {
  check: string;
  status: "pass" | "warning" | "fail";
  message: string;
}

/* ── Age group classification ────────────────────────────────── */

function classifyAgeGroup(age: number): string {
  if (age < 1) return "infant";
  if (age < 6) return "toddler";
  if (age < 12) return "child";
  if (age < 18) return "adolescent";
  return "young-adult";
}

/* ── TDD estimation ──────────────────────────────────────────── */

function estimateTDDPerKg(
  ageGroup: string,
  pubertyStage: string,
  inHoneymoon: boolean,
  yearsSinceDiagnosis: number
): number {
  // Base TDD per kg by age group
  let tddPerKg = 0.5; // default

  switch (ageGroup) {
    case "infant": tddPerKg = 0.3; break;
    case "toddler": tddPerKg = 0.4; break;
    case "child": tddPerKg = 0.5; break;
    case "adolescent": tddPerKg = 0.7; break;
    case "young-adult": tddPerKg = 0.6; break;
  }

  // Puberty adjustment
  switch (pubertyStage) {
    case "early-puberty": tddPerKg *= 1.1; break;
    case "mid-puberty": tddPerKg *= 1.3; break;
    case "late-puberty": tddPerKg *= 1.2; break;
  }

  // Honeymoon phase
  if (inHoneymoon) {
    tddPerKg *= 0.5;
  }

  // Early diagnosis (< 1 year) may still have some residual beta cell function
  if (yearsSinceDiagnosis < 1 && !inHoneymoon) {
    tddPerKg *= 0.8;
  }

  return Math.round(tddPerKg * 100) / 100;
}

/* ── Main calculator ─────────────────────────────────────────── */

export function calculatePediatricDose(input: PediatricInput): PediatricDoseResult {
  const ageGroup = classifyAgeGroup(input.ageYears);
  const tddPerKg = estimateTDDPerKg(
    ageGroup,
    input.pubertyStage,
    input.inHoneymoonPhase,
    input.yearsSinceDiagnosis
  );

  const estimatedTDD = Math.round(tddPerKg * input.weightKg * 10) / 10;

  // Basal/bolus split
  let basalPercent = 50; // default 50/50
  if (ageGroup === "infant" || ageGroup === "toddler") basalPercent = 40;
  if (input.pubertyStage === "mid-puberty") basalPercent = 45;
  if (input.usePump) basalPercent = Math.max(basalPercent - 5, 35);

  const basalDose = Math.round((estimatedTDD * basalPercent / 100) * 10) / 10;
  const totalBolus = estimatedTDD - basalDose;
  const bolusPerMeal = input.mealsPerDay > 0
    ? Math.round((totalBolus / input.mealsPerDay) * 10) / 10
    : 0;

  // ICR (insulin-to-carb ratio): 450-500 rule / TDD
  const icrBase = ageGroup === "infant" || ageGroup === "toddler" ? 500 : 450;
  const icr = estimatedTDD > 0 ? Math.round(icrBase / estimatedTDD) : 0;

  // ISF (insulin sensitivity factor): 100 rule / TDD (for mmol/L: 100/TDD/18)
  const isfMgdl = estimatedTDD > 0 ? Math.round(1800 / estimatedTDD) : 0;
  const isf = estimatedTDD > 0 ? Math.round((100 / estimatedTDD) * 10) / 10 : 0;

  // Adjustments
  const adjustments: DoseAdjustment[] = [];

  if (input.inHoneymoonPhase) {
    adjustments.push({
      factor: "Honeymoon phase",
      effect: "Reduced insulin needs",
      magnitude: "TDD reduced by ~50%",
    });
  }

  if (input.pubertyStage.includes("puberty") && input.pubertyStage !== "pre-puberty" && input.pubertyStage !== "post-puberty") {
    adjustments.push({
      factor: "Puberty",
      effect: "Increased insulin resistance",
      magnitude: `TDD increased by ${input.pubertyStage === "mid-puberty" ? "30%" : "10-20%"}`,
    });
  }

  if (input.recentHyposPerWeek > 2) {
    adjustments.push({
      factor: "Frequent hypoglycemia",
      effect: "Consider dose reduction",
      magnitude: "Reduce TDD by 10-20%",
    });
  }

  if (input.currentA1c !== undefined && input.currentA1c > 8.0) {
    adjustments.push({
      factor: "Elevated A1c",
      effect: "May need dose increase",
      magnitude: "Consider increasing TDD by 10-15%",
    });
  }

  // Safety checks
  const safetyChecks: SafetyCheck[] = [];

  // TDD per kg check
  if (tddPerKg > 1.5) {
    safetyChecks.push({
      check: "TDD per kg",
      status: "fail",
      message: `TDD of ${tddPerKg} U/kg is unusually high. Verify weight and consider insulin resistance workup.`,
    });
  } else if (tddPerKg > 1.0) {
    safetyChecks.push({
      check: "TDD per kg",
      status: "warning",
      message: `TDD of ${tddPerKg} U/kg is above typical range. Expected during puberty.`,
    });
  } else {
    safetyChecks.push({
      check: "TDD per kg",
      status: "pass",
      message: `TDD of ${tddPerKg} U/kg is within expected range for ${ageGroup}.`,
    });
  }

  // Minimum dose check for very young children
  if (ageGroup === "infant" && estimatedTDD > 10) {
    safetyChecks.push({
      check: "Infant dose limit",
      status: "warning",
      message: "TDD above 10 units is unusual for infants. Verify calculation.",
    });
  } else {
    safetyChecks.push({
      check: "Age-appropriate dose",
      status: "pass",
      message: `Estimated TDD of ${estimatedTDD}U is appropriate for ${ageGroup} weighing ${input.weightKg}kg.`,
    });
  }

  // ICR check
  if (icr < 5) {
    safetyChecks.push({
      check: "ICR safety",
      status: "warning",
      message: `ICR of 1:${icr} is very aggressive. High hypo risk with carb counting errors.`,
    });
  } else {
    safetyChecks.push({
      check: "ICR safety",
      status: "pass",
      message: `ICR of 1:${icr} is within expected range.`,
    });
  }

  // Hypo frequency
  if (input.recentHyposPerWeek > 3) {
    safetyChecks.push({
      check: "Hypoglycemia frequency",
      status: "fail",
      message: `${input.recentHyposPerWeek} hypos/week is too many. Reduce doses by 10-20%.`,
    });
  } else if (input.recentHyposPerWeek > 1) {
    safetyChecks.push({
      check: "Hypoglycemia frequency",
      status: "warning",
      message: `${input.recentHyposPerWeek} hypos/week — review patterns and consider dose adjustment.`,
    });
  } else {
    safetyChecks.push({
      check: "Hypoglycemia frequency",
      status: "pass",
      message: "Hypoglycemia frequency is acceptable.",
    });
  }

  // Guidance
  const guidance: string[] = [];

  guidance.push(`For a ${input.ageYears}-year-old ${ageGroup} weighing ${input.weightKg}kg, the estimated TDD is ${estimatedTDD} units.`);

  if (input.usePump) {
    guidance.push("Pump therapy allows more precise basal delivery and easier dose adjustments.");
    guidance.push(`Suggested basal rate: ${Math.round((basalDose / 24) * 100) / 100} U/hr (adjust by time of day).`);
  } else {
    guidance.push(`Suggested basal injection: ${basalDose} units once daily (long-acting insulin).`);
  }

  guidance.push(`Suggested bolus: ${bolusPerMeal} units per meal (adjust based on carb content using ICR 1:${icr}).`);
  guidance.push(`Correction factor: 1 unit lowers glucose by approximately ${isf} mmol/L (${isfMgdl} mg/dL).`);

  if (ageGroup === "toddler" || ageGroup === "infant") {
    guidance.push("Use half-unit pens or pump for precise dosing in young children.");
    guidance.push("Erratic eating patterns are normal — consider dosing after meals based on actual intake.");
  }

  // Warnings
  const warnings: string[] = [];
  if (safetyChecks.some((c) => c.status === "fail")) {
    warnings.push("Safety check failed — review doses with your diabetes team before making changes.");
  }
  if (input.ageYears < 2) {
    warnings.push("Dosing for children under 2 requires specialist pediatric endocrinology input.");
  }

  return {
    estimatedTDD,
    tddPerKg: Math.round(tddPerKg * 100) / 100,
    basalDose,
    basalPercent,
    bolusPerMeal,
    icr,
    isf,
    isfMgdl,
    ageGroup,
    adjustments,
    safetyChecks,
    guidance,
    warnings,
    disclaimer:
      "GluMira™ is an educational platform. The science of insulin, made visible. " +
      "Pediatric insulin doses must be determined by a qualified pediatric endocrinologist. " +
      "These estimates are starting points only.",
  };
}
