/**
 * GluMira™ — Glycemic Load Calculator Module
 *
 * Calculates glycemic load (GL) for foods and meals based on
 * glycemic index (GI) and carbohydrate content. Provides
 * meal-level GL assessment and recommendations.
 *
 * Clinical relevance:
 * - GL combines GI and carb quantity for practical meal planning
 * - Low GL meals help maintain stable blood sugar
 * - GL is more useful than GI alone for real-world portions
 *
 * NOT a medical device. Educational purposes only.
 */

export interface FoodItem {
  name: string;
  gi: number;              // glycemic index (0-100)
  carbsG: number;          // grams of carbs in the serving
  servingSize: string;     // e.g., "1 cup", "100g"
  fiberG?: number;
  proteinG?: number;
  fatG?: number;
}

export interface FoodGL {
  name: string;
  gl: number;
  glCategory: "low" | "medium" | "high";
  gi: number;
  giCategory: "low" | "medium" | "high";
  carbsG: number;
  netCarbsG: number;
}

export interface MealGLResult {
  foods: FoodGL[];
  totalGL: number;
  mealGLCategory: "low" | "medium" | "high";
  totalCarbsG: number;
  totalNetCarbsG: number;
  averageGI: number;
  recommendations: string[];
  swapSuggestions: string[];
  disclaimer: string;
}

/* ── GL classification ───────────────────────────────────────── */

function classifyGL(gl: number): "low" | "medium" | "high" {
  if (gl <= 10) return "low";
  if (gl <= 19) return "medium";
  return "high";
}

function classifyGI(gi: number): "low" | "medium" | "high" {
  if (gi <= 55) return "low";
  if (gi <= 69) return "medium";
  return "high";
}

/* ── Main calculator ─────────────────────────────────────────── */

export function calculateMealGL(foods: FoodItem[]): MealGLResult {
  if (foods.length === 0) {
    return {
      foods: [],
      totalGL: 0,
      mealGLCategory: "low",
      totalCarbsG: 0,
      totalNetCarbsG: 0,
      averageGI: 0,
      recommendations: ["Add foods to calculate glycemic load."],
      swapSuggestions: [],
      disclaimer: "GluMira™ is NOT a medical device.",
    };
  }

  const foodResults: FoodGL[] = foods.map((f) => {
    const netCarbs = Math.max(0, f.carbsG - (f.fiberG ?? 0));
    const gl = Math.round((f.gi * netCarbs) / 100 * 10) / 10;

    return {
      name: f.name,
      gl,
      glCategory: classifyGL(gl),
      gi: f.gi,
      giCategory: classifyGI(f.gi),
      carbsG: f.carbsG,
      netCarbsG: netCarbs,
    };
  });

  const totalGL = Math.round(foodResults.reduce((sum, f) => sum + f.gl, 0) * 10) / 10;
  const totalCarbsG = Math.round(foods.reduce((sum, f) => sum + f.carbsG, 0) * 10) / 10;
  const totalNetCarbsG = Math.round(foodResults.reduce((sum, f) => sum + f.netCarbsG, 0) * 10) / 10;

  // Weighted average GI
  const weightedGI = totalNetCarbsG > 0
    ? Math.round(foods.reduce((sum, f, i) => sum + f.gi * foodResults[i].netCarbsG, 0) / totalNetCarbsG)
    : 0;

  // Meal GL category (thresholds for full meals)
  let mealGLCategory: MealGLResult["mealGLCategory"];
  if (totalGL <= 15) mealGLCategory = "low";
  else if (totalGL <= 30) mealGLCategory = "medium";
  else mealGLCategory = "high";

  // Recommendations
  const recommendations: string[] = [];
  if (mealGLCategory === "high") {
    recommendations.push("This meal has a high glycemic load. Consider reducing portion sizes or swapping high-GI foods.");
  }
  if (mealGLCategory === "medium") {
    recommendations.push("Moderate glycemic load. Adding protein or healthy fats can further slow glucose absorption.");
  }
  if (mealGLCategory === "low") {
    recommendations.push("Great choice! This meal has a low glycemic load, which helps maintain stable blood sugar.");
  }

  const highGIFoods = foodResults.filter((f) => f.giCategory === "high");
  if (highGIFoods.length > 0) {
    recommendations.push(`High-GI foods in this meal: ${highGIFoods.map((f) => f.name).join(", ")}. Pair with protein/fat to slow absorption.`);
  }

  // Swap suggestions for high-GI foods
  const swapSuggestions: string[] = [];
  const swapMap: Record<string, string> = {
    "white rice": "brown rice or quinoa",
    "white bread": "whole grain bread",
    "potato": "sweet potato",
    "cornflakes": "oatmeal",
    "sugar": "cinnamon or stevia",
    "soda": "sparkling water with lemon",
  };

  highGIFoods.forEach((f) => {
    const key = f.name.toLowerCase();
    for (const [from, to] of Object.entries(swapMap)) {
      if (key.includes(from)) {
        swapSuggestions.push(`Swap ${f.name} for ${to} to reduce glycemic load.`);
      }
    }
  });

  return {
    foods: foodResults,
    totalGL,
    mealGLCategory,
    totalCarbsG,
    totalNetCarbsG,
    averageGI: weightedGI,
    recommendations,
    swapSuggestions,
    disclaimer:
      "GluMira™ is an educational platform. The science of insulin, made visible. " +
      "Glycemic load values are estimates based on published GI data.",
  };
}
