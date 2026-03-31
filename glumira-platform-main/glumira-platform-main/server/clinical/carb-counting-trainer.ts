/**
 * GluMira™ — Carb Counting Trainer Module
 *
 * Educational tool that helps users improve carb estimation skills
 * by comparing their estimates with reference values and tracking
 * accuracy over time.
 *
 * Clinical relevance:
 * - Accurate carb counting is essential for insulin dosing
 * - Most people underestimate carbs by 20-50%
 * - Training improves accuracy and glycemic outcomes
 *
 * NOT a medical device. Educational purposes only.
 */

export interface FoodItem {
  name: string;
  portionDescription: string;
  actualCarbsG: number;
  category: "grain" | "fruit" | "dairy" | "vegetable" | "protein" | "mixed" | "snack" | "beverage";
}

export interface CarbEstimate {
  foodItem: FoodItem;
  userEstimateG: number;
  timestamp: string;
}

export interface EstimateResult {
  foodName: string;
  userEstimate: number;
  actualCarbs: number;
  differenceG: number;
  differencePercent: number;
  accuracy: "excellent" | "good" | "fair" | "poor";
  feedback: string;
}

export interface TrainingSessionResult {
  estimates: EstimateResult[];
  sessionScore: number;            // 0-100
  averageAccuracy: string;
  totalEstimated: number;
  totalActual: number;
  overestimateCount: number;
  underestimateCount: number;
  accurateCount: number;
  worstCategory: string | null;
  bestCategory: string | null;
  tips: string[];
  encouragement: string;
}

/* ── Accuracy classification ─────────────────────────────────── */

function classifyAccuracy(diffPercent: number): EstimateResult["accuracy"] {
  const abs = Math.abs(diffPercent);
  if (abs <= 10) return "excellent";
  if (abs <= 20) return "good";
  if (abs <= 40) return "fair";
  return "poor";
}

function generateFeedback(result: Omit<EstimateResult, "feedback">): string {
  const { foodName, accuracy, differenceG, differencePercent } = result;
  const direction = differenceG > 0 ? "overestimated" : "underestimated";
  const abs = Math.abs(differenceG);

  switch (accuracy) {
    case "excellent":
      return `Great job! Your estimate for ${foodName} was within 10% of the actual value.`;
    case "good":
      return `Good estimate for ${foodName}! You ${direction} by ${abs}g (${Math.abs(differencePercent)}%).`;
    case "fair":
      return `${foodName}: You ${direction} by ${abs}g (${Math.abs(differencePercent)}%). Try using a food scale for reference.`;
    case "poor":
      return `${foodName}: You ${direction} by ${abs}g (${Math.abs(differencePercent)}%). This could significantly affect your insulin dose.`;
  }
}

/* ── Main trainer ────────────────────────────────────────────── */

export function evaluateCarbEstimates(estimates: CarbEstimate[]): TrainingSessionResult {
  if (estimates.length === 0) {
    return {
      estimates: [],
      sessionScore: 0,
      averageAccuracy: "N/A",
      totalEstimated: 0,
      totalActual: 0,
      overestimateCount: 0,
      underestimateCount: 0,
      accurateCount: 0,
      worstCategory: null,
      bestCategory: null,
      tips: ["Start a training session to practice carb counting!"],
      encouragement: "Ready to practice? Let's improve your carb counting skills!",
    };
  }

  const results: EstimateResult[] = estimates.map((e) => {
    const differenceG = Math.round(e.userEstimateG - e.foodItem.actualCarbsG);
    const differencePercent = e.foodItem.actualCarbsG > 0
      ? Math.round((differenceG / e.foodItem.actualCarbsG) * 100)
      : 0;
    const accuracy = classifyAccuracy(differencePercent);

    const partial = {
      foodName: e.foodItem.name,
      userEstimate: e.userEstimateG,
      actualCarbs: e.foodItem.actualCarbsG,
      differenceG,
      differencePercent,
      accuracy,
    };

    return {
      ...partial,
      feedback: generateFeedback(partial),
    };
  });

  // Scoring: 100 = perfect, lose points for inaccuracy
  const accuracyScores = results.map((r) => {
    const abs = Math.abs(r.differencePercent);
    if (abs <= 10) return 100;
    if (abs <= 20) return 80;
    if (abs <= 40) return 50;
    return 20;
  });
  const sessionScore = Math.round(accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length);

  // Category analysis
  const categoryErrors = new Map<string, number[]>();
  estimates.forEach((e, i) => {
    const cat = e.foodItem.category;
    if (!categoryErrors.has(cat)) categoryErrors.set(cat, []);
    categoryErrors.get(cat)!.push(Math.abs(results[i].differencePercent));
  });

  let worstCategory: string | null = null;
  let bestCategory: string | null = null;
  let worstError = 0;
  let bestError = Infinity;

  categoryErrors.forEach((errors, cat) => {
    const avg = errors.reduce((a, b) => a + b, 0) / errors.length;
    if (avg > worstError) { worstError = avg; worstCategory = cat; }
    if (avg < bestError) { bestError = avg; bestCategory = cat; }
  });

  // Counts
  const overestimateCount = results.filter((r) => r.differenceG > 5).length;
  const underestimateCount = results.filter((r) => r.differenceG < -5).length;
  const accurateCount = results.filter((r) => Math.abs(r.differenceG) <= 5).length;

  const totalEstimated = Math.round(estimates.reduce((a, e) => a + e.userEstimateG, 0));
  const totalActual = Math.round(estimates.reduce((a, e) => a + e.foodItem.actualCarbsG, 0));

  // Average accuracy label
  let averageAccuracy = "poor";
  if (sessionScore >= 90) averageAccuracy = "excellent";
  else if (sessionScore >= 70) averageAccuracy = "good";
  else if (sessionScore >= 50) averageAccuracy = "fair";

  // Tips
  const tips: string[] = [];
  if (underestimateCount > overestimateCount) {
    tips.push("You tend to underestimate carbs. This could lead to under-dosing insulin and high glucose after meals.");
  }
  if (overestimateCount > underestimateCount) {
    tips.push("You tend to overestimate carbs. This could lead to over-dosing insulin and hypoglycemia.");
  }
  if (worstCategory) {
    tips.push(`Focus on improving estimates for ${worstCategory} foods — this is your weakest category.`);
  }
  tips.push("Use a food scale at home to calibrate your visual estimates.");
  tips.push("Practice with common meals you eat regularly to build muscle memory.");

  // Encouragement
  let encouragement = "Keep practicing! Carb counting improves with experience.";
  if (sessionScore >= 90) encouragement = "Outstanding! Your carb counting skills are excellent. Keep it up!";
  else if (sessionScore >= 70) encouragement = "Good work! You're getting better at estimating carbs.";
  else if (sessionScore >= 50) encouragement = "You're making progress! Regular practice will improve your accuracy.";

  return {
    estimates: results,
    sessionScore,
    averageAccuracy,
    totalEstimated,
    totalActual,
    overestimateCount,
    underestimateCount,
    accurateCount,
    worstCategory,
    bestCategory,
    tips,
    encouragement,
  };
}

/* ── Reference food database ─────────────────────────────────── */

export const REFERENCE_FOODS: FoodItem[] = [
  { name: "White rice (1 cup cooked)", portionDescription: "1 cup (200g)", actualCarbsG: 45, category: "grain" },
  { name: "Pasta (1 cup cooked)", portionDescription: "1 cup (140g)", actualCarbsG: 43, category: "grain" },
  { name: "Slice of bread", portionDescription: "1 slice (30g)", actualCarbsG: 15, category: "grain" },
  { name: "Medium banana", portionDescription: "1 medium (120g)", actualCarbsG: 27, category: "fruit" },
  { name: "Medium apple", portionDescription: "1 medium (180g)", actualCarbsG: 25, category: "fruit" },
  { name: "Orange juice (250ml)", portionDescription: "1 glass (250ml)", actualCarbsG: 26, category: "beverage" },
  { name: "Milk (250ml)", portionDescription: "1 glass (250ml)", actualCarbsG: 12, category: "dairy" },
  { name: "Yogurt (150g)", portionDescription: "1 small tub (150g)", actualCarbsG: 20, category: "dairy" },
  { name: "Medium potato (baked)", portionDescription: "1 medium (150g)", actualCarbsG: 33, category: "vegetable" },
  { name: "Corn on the cob", portionDescription: "1 medium ear", actualCarbsG: 19, category: "vegetable" },
  { name: "Chocolate bar (50g)", portionDescription: "1 bar (50g)", actualCarbsG: 30, category: "snack" },
  { name: "Packet of crisps (30g)", portionDescription: "1 small packet (30g)", actualCarbsG: 16, category: "snack" },
  { name: "Chicken breast (150g)", portionDescription: "1 breast (150g)", actualCarbsG: 0, category: "protein" },
  { name: "Pizza slice (large)", portionDescription: "1 large slice", actualCarbsG: 36, category: "mixed" },
  { name: "Burger with bun", portionDescription: "1 standard burger", actualCarbsG: 35, category: "mixed" },
  { name: "Sushi (6 pieces)", portionDescription: "6 pieces", actualCarbsG: 40, category: "mixed" },
  { name: "Bowl of cereal (40g)", portionDescription: "1 bowl (40g dry)", actualCarbsG: 32, category: "grain" },
  { name: "Soft drink (330ml)", portionDescription: "1 can (330ml)", actualCarbsG: 35, category: "beverage" },
  { name: "Grapes (150g)", portionDescription: "1 cup (150g)", actualCarbsG: 27, category: "fruit" },
  { name: "Ice cream (100g)", portionDescription: "1 scoop (100g)", actualCarbsG: 24, category: "snack" },
];
