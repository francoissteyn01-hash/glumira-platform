/**
 * GluMira™ — Insulin-to-Carb Ratio (ICR) Calculator Module
 *
 * Calculates ICR using validated rules (500, 450) and analyzes
 * meal bolus effectiveness from historical data.
 *
 * Clinical relevance:
 * - ICR determines how many grams of carbs 1 unit of insulin covers
 * - Accurate ICR is critical for meal boluses
 * - ICR varies by meal, time of day, and individual factors
 *
 * NOT a medical device. Educational purposes only.
 */

export interface ICRInput {
  tdd: number;
  insulinType: "rapid" | "regular";
  diabetesType: "type1" | "type2";
  weight?: number;
  mealHistory?: MealEvent[];
}

export interface MealEvent {
  timestampUtc: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  carbsG: number;
  bolusUnits: number;
  preGlucoseMmol: number;
  postGlucoseMmol: number;       // 2-4h post-meal
  hoursToPost: number;
}

export interface ICREstimate {
  method: string;
  icrValue: number;               // grams per unit
  formula: string;
}

export interface MealICR {
  mealType: string;
  empiricalICR: number;
  sampleSize: number;
  confidence: "high" | "moderate" | "low";
}

export interface ICRResult {
  estimates: ICREstimate[];
  bestEstimate: number;
  mealSpecificICR: MealICR[];
  timeOfDayFactors: { period: string; adjustment: string; reason: string }[];
  recommendations: string[];
  warnings: string[];
  disclaimer: string;
}

/* ── ICR formulas ────────────────────────────────────────────── */

function rule500(tdd: number): number {
  return tdd > 0 ? Math.round((500 / tdd) * 10) / 10 : 0;
}

function rule450(tdd: number): number {
  return tdd > 0 ? Math.round((450 / tdd) * 10) / 10 : 0;
}

/* ── Empirical ICR from meal history ─────────────────────────── */

function calculateMealICR(events: MealEvent[], mealType: string): MealICR | null {
  const meals = events.filter(
    (e) => e.mealType === mealType &&
      e.carbsG > 10 &&
      e.bolusUnits > 0 &&
      e.hoursToPost >= 2 &&
      e.hoursToPost <= 5
  );

  if (meals.length < 2) return null;

  // Good meals: post-meal glucose within 2 mmol of pre-meal
  const goodMeals = meals.filter(
    (m) => Math.abs(m.postGlucoseMmol - m.preGlucoseMmol) <= 3.0
  );

  if (goodMeals.length < 1) return null;

  const icrs = goodMeals.map((m) => m.carbsG / m.bolusUnits);
  const avg = Math.round((icrs.reduce((a, b) => a + b, 0) / icrs.length) * 10) / 10;

  let confidence: MealICR["confidence"] = "low";
  if (goodMeals.length >= 5) confidence = "high";
  else if (goodMeals.length >= 3) confidence = "moderate";

  return {
    mealType,
    empiricalICR: avg,
    sampleSize: goodMeals.length,
    confidence,
  };
}

/* ── Main function ───────────────────────────────────────────── */

export function calculateICR(input: ICRInput): ICRResult {
  const { tdd, insulinType, diabetesType, weight, mealHistory } = input;

  const warnings: string[] = [];

  if (tdd <= 0) {
    return {
      estimates: [],
      bestEstimate: 0,
      mealSpecificICR: [],
      timeOfDayFactors: [],
      recommendations: ["Enter your total daily dose (TDD) to calculate ICR."],
      warnings: ["TDD must be greater than 0."],
      disclaimer: "GluMira™ is an educational platform. The science of insulin, made visible.",
    };
  }

  // ── Formula estimates ──
  const estimates: ICREstimate[] = [];

  const icr500 = rule500(tdd);
  estimates.push({
    method: "500 Rule",
    icrValue: icr500,
    formula: "ICR = 500 / TDD",
  });

  if (insulinType === "regular") {
    const icr450 = rule450(tdd);
    estimates.push({
      method: "450 Rule",
      icrValue: icr450,
      formula: "ICR = 450 / TDD",
    });
  }

  const bestEstimate = insulinType === "rapid" ? icr500 : rule450(tdd);

  // ── Meal-specific ICR ──
  const mealSpecificICR: MealICR[] = [];
  if (mealHistory && mealHistory.length > 0) {
    for (const meal of ["breakfast", "lunch", "dinner", "snack"]) {
      const result = calculateMealICR(mealHistory, meal);
      if (result) mealSpecificICR.push(result);
    }
  }

  // ── Time of day factors ──
  const timeOfDayFactors = [
    { period: "Breakfast", adjustment: "May need lower ICR (more insulin per carb)", reason: "Cortisol and dawn phenomenon increase insulin resistance in the morning." },
    { period: "Lunch", adjustment: "Baseline ICR usually works well", reason: "Mid-day insulin sensitivity is typically moderate and predictable." },
    { period: "Dinner", adjustment: "May need slightly higher ICR (less insulin per carb)", reason: "Evening sensitivity tends to be higher, but activity level matters." },
    { period: "Late night snack", adjustment: "Higher ICR (less insulin per carb)", reason: "Nighttime sensitivity is typically highest. Be cautious to avoid nocturnal hypos." },
  ];

  // ── Recommendations ──
  const recommendations: string[] = [];

  if (mealSpecificICR.length > 0) {
    const breakfastICR = mealSpecificICR.find((m) => m.mealType === "breakfast");
    const dinnerICR = mealSpecificICR.find((m) => m.mealType === "dinner");
    if (breakfastICR && dinnerICR && breakfastICR.empiricalICR < dinnerICR.empiricalICR) {
      recommendations.push("Your breakfast ICR is lower than dinner — this is a common pattern due to morning insulin resistance.");
    }
  }

  if (diabetesType === "type2") {
    recommendations.push("Type 2 diabetes may require lower ICR values (more insulin per carb) due to insulin resistance.");
  }

  if (weight && weight > 100) {
    recommendations.push("Higher body weight may require lower ICR values.");
  }

  recommendations.push("Test your ICR by eating a measured carb meal and checking glucose 3-4 hours later (no corrections).");
  recommendations.push("Keep a food diary to build meal-specific ICR data over time.");

  // ── Warnings ──
  if (tdd < 10) {
    warnings.push("Very low TDD — ICR estimate may be unreliable.");
  }
  if (bestEstimate > 25) {
    warnings.push("Very high ICR — each unit covers many carbs. Small bolus errors have big effects.");
  }
  if (bestEstimate < 3) {
    warnings.push("Very low ICR — you need a lot of insulin per carb. Verify with your healthcare team.");
  }

  return {
    estimates,
    bestEstimate,
    mealSpecificICR,
    timeOfDayFactors,
    recommendations,
    warnings,
    disclaimer:
      "GluMira™ is an educational platform. The science of insulin, made visible. " +
      "Always verify ICR with your healthcare team before making dose changes.",
  };
}
