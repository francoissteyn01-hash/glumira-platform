/**
 * GluMira™ — carb-counter.ts
 *
 * Carbohydrate estimation and insulin-to-carb ratio (ICR) utilities.
 * Used for meal bolus calculation and carb tracking.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FoodItem {
  name: string;
  servingGrams: number;
  carbsPer100g: number;
  fibrePer100g?: number;
  glycaemicIndex?: number;
}

export interface CarbEstimate {
  totalCarbs: number;
  netCarbs: number;
  glycaemicLoad: number;
  servingGrams: number;
}

export interface IcrRecommendation {
  icr: number;            // grams of carb per 1U insulin
  suggestedDose: number;  // units, rounded to 0.5U
  confidence: "high" | "medium" | "low";
  note?: string;
}

// ─── Common food database (subset) ───────────────────────────────────────────

export const FOOD_DB: FoodItem[] = [
  { name: "white bread",    servingGrams: 30,  carbsPer100g: 49, fibrePer100g: 2.7, glycaemicIndex: 75 },
  { name: "brown bread",    servingGrams: 30,  carbsPer100g: 42, fibrePer100g: 5.0, glycaemicIndex: 55 },
  { name: "white rice",     servingGrams: 150, carbsPer100g: 28, fibrePer100g: 0.4, glycaemicIndex: 72 },
  { name: "brown rice",     servingGrams: 150, carbsPer100g: 23, fibrePer100g: 1.8, glycaemicIndex: 50 },
  { name: "pasta",          servingGrams: 180, carbsPer100g: 25, fibrePer100g: 1.8, glycaemicIndex: 49 },
  { name: "oats",           servingGrams: 40,  carbsPer100g: 66, fibrePer100g: 10,  glycaemicIndex: 55 },
  { name: "apple",          servingGrams: 120, carbsPer100g: 14, fibrePer100g: 2.4, glycaemicIndex: 36 },
  { name: "banana",         servingGrams: 120, carbsPer100g: 23, fibrePer100g: 2.6, glycaemicIndex: 51 },
  { name: "orange juice",   servingGrams: 200, carbsPer100g: 10, fibrePer100g: 0.2, glycaemicIndex: 50 },
  { name: "full-fat milk",  servingGrams: 200, carbsPer100g: 4.7,fibrePer100g: 0,   glycaemicIndex: 31 },
  { name: "potato",         servingGrams: 150, carbsPer100g: 17, fibrePer100g: 2.2, glycaemicIndex: 78 },
  { name: "sweet potato",   servingGrams: 150, carbsPer100g: 20, fibrePer100g: 3.0, glycaemicIndex: 63 },
  { name: "lentils",        servingGrams: 150, carbsPer100g: 20, fibrePer100g: 7.9, glycaemicIndex: 32 },
  { name: "chickpeas",      servingGrams: 150, carbsPer100g: 27, fibrePer100g: 7.6, glycaemicIndex: 28 },
  { name: "cornflakes",     servingGrams: 30,  carbsPer100g: 84, fibrePer100g: 0.9, glycaemicIndex: 81 },
];

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Estimate carbohydrate content for a given food item and serving size.
 */
export function estimateCarbs(
  food: FoodItem,
  servingGrams?: number
): CarbEstimate {
  const grams = servingGrams ?? food.servingGrams;
  const totalCarbs = (food.carbsPer100g / 100) * grams;
  const fibre      = food.fibrePer100g ? (food.fibrePer100g / 100) * grams : 0;
  const netCarbs   = Math.max(0, totalCarbs - fibre);
  const gi         = food.glycaemicIndex ?? 55;
  const glycaemicLoad = (gi * netCarbs) / 100;

  return {
    totalCarbs:   Math.round(totalCarbs * 10) / 10,
    netCarbs:     Math.round(netCarbs * 10) / 10,
    glycaemicLoad: Math.round(glycaemicLoad * 10) / 10,
    servingGrams: grams,
  };
}

/**
 * Look up a food item by name (case-insensitive partial match).
 */
export function lookupFood(name: string): FoodItem | undefined {
  const q = name.toLowerCase().trim();
  return FOOD_DB.find((f) => f.name.toLowerCase().includes(q));
}

/**
 * Sum total carbs from multiple CarbEstimate objects.
 */
export function sumCarbs(estimates: CarbEstimate[]): number {
  return Math.round(
    estimates.reduce((acc, e) => acc + e.totalCarbs, 0) * 10
  ) / 10;
}

/**
 * Sum net carbs from multiple CarbEstimate objects.
 */
export function sumNetCarbs(estimates: CarbEstimate[]): number {
  return Math.round(
    estimates.reduce((acc, e) => acc + e.netCarbs, 0) * 10
  ) / 10;
}

/**
 * Compute the average glycaemic load across a meal.
 */
export function averageGlycaemicLoad(estimates: CarbEstimate[]): number {
  if (estimates.length === 0) return 0;
  const total = estimates.reduce((acc, e) => acc + e.glycaemicLoad, 0);
  return Math.round((total / estimates.length) * 10) / 10;
}

/**
 * Recommend a bolus dose based on carb count and insulin-to-carb ratio (ICR).
 *
 * @param carbsGrams    Total carbohydrates in the meal (grams)
 * @param icr           Grams of carb per 1U of insulin (e.g. 10 = 1U per 10g)
 * @param currentGlucose  Current blood glucose in mmol/L (optional)
 * @param targetGlucose   Target blood glucose in mmol/L (optional, default 6.0)
 * @param correctionFactor  mmol/L drop per 1U insulin (optional, default 2.5)
 */
export function recommendIcrDose(
  carbsGrams: number,
  icr: number,
  currentGlucose?: number,
  targetGlucose = 6.0,
  correctionFactor = 2.5
): IcrRecommendation {
  if (icr <= 0) throw new Error("ICR must be positive");
  if (carbsGrams < 0) throw new Error("carbsGrams must be non-negative");

  const carbDose = carbsGrams / icr;

  let correctionDose = 0;
  if (currentGlucose !== undefined) {
    const glucoseDelta = currentGlucose - targetGlucose;
    correctionDose = glucoseDelta / correctionFactor;
  }

  const rawDose = carbDose + correctionDose;
  const suggestedDose = Math.max(0, Math.round(rawDose * 2) / 2); // round to 0.5U

  const confidence: "high" | "medium" | "low" =
    icr >= 5 && icr <= 20 ? "high"
    : icr >= 3 && icr <= 30 ? "medium"
    : "low";

  const notes: string[] = [];
  if (correctionDose > 0) notes.push(`+${correctionDose.toFixed(1)}U correction`);
  if (correctionDose < 0) notes.push(`${correctionDose.toFixed(1)}U correction (glucose below target)`);
  if (suggestedDose === 0 && rawDose > 0) notes.push("Dose rounded to 0U — verify with clinician");

  return {
    icr,
    suggestedDose,
    confidence,
    ...(notes.length > 0 && { note: notes.join("; ") }),
  };
}

/**
 * Classify glycaemic load level.
 */
export function classifyGlycaemicLoad(gl: number): "low" | "medium" | "high" {
  if (gl < 10) return "low";
  if (gl < 20) return "medium";
  return "high";
}

/**
 * Convert grams of carbs to mmol/L estimated glucose rise (rough approximation).
 * Uses the rule: 1g carb ≈ 0.2 mmol/L rise (varies by ISF and body weight).
 */
export function carbsToGlucoseRise(
  carbsGrams: number,
  sensitivityFactor = 0.2
): number {
  return Math.round(carbsGrams * sensitivityFactor * 10) / 10;
}
