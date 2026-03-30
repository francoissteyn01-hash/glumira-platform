/**
 * GluMira™ V7 — server/meals/carb-counter.ts
 * Food carb lookup, glycaemic load classification, and ICR dose recommendation.
 * GluMira™ is an educational platform, not a medical device.
 */

export interface FoodEntry {
  name: string;
  carbsPer100g: number;
  fibrePer100g: number;
  gi: number; // glycaemic index
  servingGrams: number;
}

export interface CarbEstimate {
  totalCarbs: number;
  netCarbs: number;
  fibre: number;
  glycaemicLoad: number;
}

// ── Mini food database (extend as needed) ─────────────────────────────────────
const FOOD_DB: FoodEntry[] = [
  { name: "white rice",    carbsPer100g: 28, fibrePer100g: 0.4, gi: 73, servingGrams: 150 },
  { name: "brown rice",    carbsPer100g: 23, fibrePer100g: 1.8, gi: 68, servingGrams: 150 },
  { name: "white bread",   carbsPer100g: 49, fibrePer100g: 2.7, gi: 75, servingGrams: 30 },
  { name: "banana",        carbsPer100g: 23, fibrePer100g: 2.6, gi: 51, servingGrams: 120 },
  { name: "apple",         carbsPer100g: 14, fibrePer100g: 2.4, gi: 36, servingGrams: 180 },
  { name: "potato",        carbsPer100g: 17, fibrePer100g: 2.2, gi: 78, servingGrams: 150 },
  { name: "sweet potato",  carbsPer100g: 20, fibrePer100g: 3.0, gi: 63, servingGrams: 150 },
  { name: "oats",          carbsPer100g: 66, fibrePer100g: 10.6, gi: 55, servingGrams: 40 },
  { name: "pasta",         carbsPer100g: 25, fibrePer100g: 1.8, gi: 49, servingGrams: 180 },
  { name: "milk",          carbsPer100g: 5,  fibrePer100g: 0,   gi: 39, servingGrams: 250 },
];

export function lookupFood(query: string): FoodEntry | null {
  const q = query.toLowerCase().trim();
  return FOOD_DB.find((f) => f.name.includes(q) || q.includes(f.name)) ?? null;
}

export function estimateCarbs(food: FoodEntry, grams: number): CarbEstimate {
  const factor = grams / 100;
  const totalCarbs = Math.round(food.carbsPer100g * factor * 10) / 10;
  const fibre = Math.round(food.fibrePer100g * factor * 10) / 10;
  const netCarbs = Math.round((totalCarbs - fibre) * 10) / 10;
  const glycaemicLoad = Math.round((netCarbs * food.gi) / 100 * 10) / 10;
  return { totalCarbs, netCarbs, fibre, glycaemicLoad };
}

export function classifyGlycaemicLoad(gl: number): "low" | "medium" | "high" {
  if (gl <= 10) return "low";
  if (gl <= 19) return "medium";
  return "high";
}

export function recommendIcrDose(totalCarbs: number, icr: number): { units: number; note: string } {
  const units = Math.round((totalCarbs / icr) * 10) / 10;
  return {
    units,
    note: `Based on ICR 1:${icr}. Discuss with your care team before adjusting doses.`,
  };
}
