/**
 * GluMira™ V7 — Meal Regime Definitions
 * Module: MOD-SCHOOL (used by School Care Plan Generator)
 *
 * 20 meal regimes covering global dietary patterns.
 * Each regime defines meals with time windows, carb ranges,
 * and insulin timing guidance.
 *
 * NOT a medical device. Educational purposes only.
 */

export interface MealRegime {
  id: string;
  name: string;
  meals: {
    name: string;
    timeWindow: { start: string; end: string };
    carbRange: { min: number; max: number };
    insulinTiming: string;
    preBolusMinutes?: number;
    notes?: string;
  }[];
  culturalNotes?: string;
  fasting?: { type: string; fastingHours: number };
}

const MEAL_REGIMES: MealRegime[] = [
  {
    id: "full-carb-count",
    name: "Full Carb Count",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:30" }, carbRange: { min: 30, max: 60 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Morning Snack", timeWindow: { start: "10:00", end: "10:30" }, carbRange: { min: 10, max: 20 }, insulinTiming: "Bolus if >15g carbs" },
      { name: "Lunch", timeWindow: { start: "12:00", end: "13:00" }, carbRange: { min: 40, max: 70 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Afternoon Snack", timeWindow: { start: "15:00", end: "15:30" }, carbRange: { min: 10, max: 20 }, insulinTiming: "Bolus if >15g carbs" },
      { name: "Dinner", timeWindow: { start: "18:00", end: "19:00" }, carbRange: { min: 40, max: 70 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
    ],
  },
  {
    id: "bernstein",
    name: "Dr. Bernstein",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:00" }, carbRange: { min: 6, max: 12 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 20, notes: "Low-carb, high-protein" },
      { name: "Lunch", timeWindow: { start: "12:00", end: "13:00" }, carbRange: { min: 6, max: 12 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 20, notes: "Low-carb, high-protein" },
      { name: "Dinner", timeWindow: { start: "18:00", end: "19:00" }, carbRange: { min: 6, max: 12 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 20, notes: "Low-carb, high-protein" },
    ],
    culturalNotes: "Law of Small Numbers: small carb inputs = small insulin doses = small errors.",
  },
  {
    id: "low-carb",
    name: "Low Carb",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:30" }, carbRange: { min: 10, max: 25 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 10 },
      { name: "Lunch", timeWindow: { start: "12:00", end: "13:00" }, carbRange: { min: 15, max: 30 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 10 },
      { name: "Dinner", timeWindow: { start: "18:00", end: "19:00" }, carbRange: { min: 15, max: 30 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 10 },
    ],
  },
  {
    id: "mediterranean",
    name: "Mediterranean",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:30" }, carbRange: { min: 25, max: 45 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15, notes: "Whole grains, olive oil, fruit" },
      { name: "Lunch", timeWindow: { start: "12:30", end: "14:00" }, carbRange: { min: 40, max: 65 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15, notes: "Main meal of the day" },
      { name: "Afternoon Snack", timeWindow: { start: "16:00", end: "17:00" }, carbRange: { min: 10, max: 20 }, insulinTiming: "Bolus if >15g carbs" },
      { name: "Dinner", timeWindow: { start: "19:00", end: "20:30" }, carbRange: { min: 30, max: 50 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 10, notes: "Light dinner" },
    ],
    culturalNotes: "Emphasises whole grains, legumes, vegetables, olive oil, fish.",
  },
  {
    id: "keto",
    name: "Keto",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "09:00" }, carbRange: { min: 3, max: 10 }, insulinTiming: "Minimal or no bolus", notes: "High-fat, very low carb" },
      { name: "Lunch", timeWindow: { start: "12:00", end: "13:00" }, carbRange: { min: 5, max: 10 }, insulinTiming: "Minimal bolus if any", notes: "High-fat, very low carb" },
      { name: "Dinner", timeWindow: { start: "18:00", end: "19:00" }, carbRange: { min: 5, max: 10 }, insulinTiming: "Minimal bolus if any", notes: "High-fat, very low carb" },
    ],
    culturalNotes: "Total daily carbs typically <20-50g. Monitor ketones regularly.",
  },
  {
    id: "standard-ada",
    name: "Standard ADA",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:30" }, carbRange: { min: 30, max: 45 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Morning Snack", timeWindow: { start: "10:00", end: "10:30" }, carbRange: { min: 15, max: 20 }, insulinTiming: "Bolus if >15g carbs" },
      { name: "Lunch", timeWindow: { start: "12:00", end: "13:00" }, carbRange: { min: 45, max: 60 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Afternoon Snack", timeWindow: { start: "15:00", end: "15:30" }, carbRange: { min: 15, max: 20 }, insulinTiming: "Bolus if >15g carbs" },
      { name: "Dinner", timeWindow: { start: "18:00", end: "19:00" }, carbRange: { min: 45, max: 60 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Evening Snack", timeWindow: { start: "21:00", end: "21:30" }, carbRange: { min: 15, max: 20 }, insulinTiming: "Bolus if >15g carbs" },
    ],
  },
  {
    id: "south-asian",
    name: "South Asian",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:30" }, carbRange: { min: 35, max: 55 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15, notes: "Roti, paratha, idli, dosa" },
      { name: "Lunch", timeWindow: { start: "12:30", end: "13:30" }, carbRange: { min: 50, max: 80 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 20, notes: "Rice, dal, chapati" },
      { name: "Tea Time", timeWindow: { start: "16:00", end: "17:00" }, carbRange: { min: 15, max: 30 }, insulinTiming: "Bolus if >20g carbs", notes: "Chai, biscuits, samosa" },
      { name: "Dinner", timeWindow: { start: "19:30", end: "21:00" }, carbRange: { min: 45, max: 75 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15, notes: "Rice, curry, chapati" },
    ],
    culturalNotes: "Rice and chapati are staples. High glycaemic index — consider longer pre-bolus.",
  },
  {
    id: "vegetarian",
    name: "Vegetarian",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:30" }, carbRange: { min: 30, max: 50 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Lunch", timeWindow: { start: "12:00", end: "13:00" }, carbRange: { min: 40, max: 65 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Snack", timeWindow: { start: "15:30", end: "16:00" }, carbRange: { min: 15, max: 25 }, insulinTiming: "Bolus if >15g carbs" },
      { name: "Dinner", timeWindow: { start: "18:00", end: "19:30" }, carbRange: { min: 40, max: 65 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
    ],
  },
  {
    id: "vegan",
    name: "Vegan",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:30" }, carbRange: { min: 35, max: 55 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 10, notes: "Higher fibre slows absorption" },
      { name: "Lunch", timeWindow: { start: "12:00", end: "13:00" }, carbRange: { min: 45, max: 70 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 10 },
      { name: "Snack", timeWindow: { start: "15:30", end: "16:00" }, carbRange: { min: 15, max: 25 }, insulinTiming: "Bolus if >15g carbs" },
      { name: "Dinner", timeWindow: { start: "18:00", end: "19:30" }, carbRange: { min: 45, max: 70 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 10 },
    ],
    culturalNotes: "High-fibre plant-based diet may improve insulin sensitivity. Monitor B12 and iron.",
  },
  {
    id: "halal",
    name: "Halal",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:30" }, carbRange: { min: 30, max: 50 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Lunch", timeWindow: { start: "12:30", end: "13:30" }, carbRange: { min: 45, max: 70 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Dinner", timeWindow: { start: "19:00", end: "20:30" }, carbRange: { min: 45, max: 70 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
    ],
    culturalNotes: "Halal-certified foods only. No pork, no alcohol. Dates are common — ~7g carbs per date.",
  },
  {
    id: "kosher",
    name: "Kosher",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:30" }, carbRange: { min: 30, max: 50 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Lunch", timeWindow: { start: "12:00", end: "13:00" }, carbRange: { min: 40, max: 65 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Dinner", timeWindow: { start: "18:00", end: "19:30" }, carbRange: { min: 40, max: 65 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
    ],
    culturalNotes: "Kosher dietary laws. Separate dairy and meat meals — insulin timing unaffected.",
  },
  {
    id: "gluten-free",
    name: "Gluten-Free",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:30" }, carbRange: { min: 25, max: 45 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15, notes: "GF bread/cereal — check carb labels" },
      { name: "Lunch", timeWindow: { start: "12:00", end: "13:00" }, carbRange: { min: 35, max: 60 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Snack", timeWindow: { start: "15:00", end: "15:30" }, carbRange: { min: 10, max: 20 }, insulinTiming: "Bolus if >15g carbs" },
      { name: "Dinner", timeWindow: { start: "18:00", end: "19:00" }, carbRange: { min: 35, max: 60 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
    ],
    culturalNotes: "Coeliac disease is more common in T1D. GF substitutes often have different carb profiles.",
  },
  {
    id: "dash",
    name: "DASH",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:30" }, carbRange: { min: 30, max: 50 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Lunch", timeWindow: { start: "12:00", end: "13:00" }, carbRange: { min: 40, max: 60 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Snack", timeWindow: { start: "15:00", end: "15:30" }, carbRange: { min: 15, max: 25 }, insulinTiming: "Bolus if >15g carbs" },
      { name: "Dinner", timeWindow: { start: "18:00", end: "19:00" }, carbRange: { min: 40, max: 60 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
    ],
    culturalNotes: "Dietary Approaches to Stop Hypertension. Rich in vegetables, fruit, whole grains, lean protein.",
  },
  {
    id: "paleo",
    name: "Paleo",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:30" }, carbRange: { min: 10, max: 30 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 10, notes: "No grains or dairy" },
      { name: "Lunch", timeWindow: { start: "12:00", end: "13:00" }, carbRange: { min: 15, max: 35 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 10 },
      { name: "Dinner", timeWindow: { start: "18:00", end: "19:00" }, carbRange: { min: 15, max: 35 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 10 },
    ],
    culturalNotes: "No processed foods, grains, legumes, or dairy. Carbs from fruit and vegetables.",
  },
  {
    id: "carnivore",
    name: "Carnivore",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "09:00" }, carbRange: { min: 0, max: 5 }, insulinTiming: "Minimal or no bolus", notes: "Protein-only — gluconeogenesis may require small bolus" },
      { name: "Lunch", timeWindow: { start: "12:00", end: "13:00" }, carbRange: { min: 0, max: 5 }, insulinTiming: "Minimal or no bolus" },
      { name: "Dinner", timeWindow: { start: "18:00", end: "19:00" }, carbRange: { min: 0, max: 5 }, insulinTiming: "Minimal or no bolus" },
    ],
    culturalNotes: "Animal products only. Near-zero carbs but protein may require bolus via gluconeogenesis.",
  },
  {
    id: "if-16-8",
    name: "Intermittent Fasting 16:8",
    meals: [
      { name: "First Meal", timeWindow: { start: "12:00", end: "13:00" }, carbRange: { min: 40, max: 70 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15, notes: "Breaking fast" },
      { name: "Snack", timeWindow: { start: "15:00", end: "16:00" }, carbRange: { min: 15, max: 25 }, insulinTiming: "Bolus if >15g carbs" },
      { name: "Last Meal", timeWindow: { start: "19:00", end: "20:00" }, carbRange: { min: 40, max: 70 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15, notes: "Must finish by 20:00" },
    ],
    fasting: { type: "Time-restricted eating", fastingHours: 16 },
    culturalNotes: "16 hours fasting, 8 hours eating window. Basal insulin continues during fast. Monitor for fasting hypos.",
  },
  {
    id: "ramadan",
    name: "Ramadan Fasting",
    meals: [
      { name: "Suhoor (pre-dawn)", timeWindow: { start: "04:00", end: "05:00" }, carbRange: { min: 35, max: 55 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 10, notes: "Slow-release carbs preferred" },
      { name: "Iftar (sunset)", timeWindow: { start: "18:30", end: "19:30" }, carbRange: { min: 50, max: 80 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15, notes: "Dates + water first, then meal" },
      { name: "Late Meal", timeWindow: { start: "21:00", end: "22:00" }, carbRange: { min: 30, max: 50 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 10 },
    ],
    fasting: { type: "Ramadan", fastingHours: 14 },
    culturalNotes: "Dawn to sunset fasting. Reduce basal by 20-30% during fast. Break fast with dates (7g carbs each). Monitor closely.",
  },
  {
    id: "athletic",
    name: "Athletic / High-Carb",
    meals: [
      { name: "Breakfast", timeWindow: { start: "06:30", end: "07:30" }, carbRange: { min: 50, max: 80 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15, notes: "High-carb, moderate protein" },
      { name: "Pre-Exercise Snack", timeWindow: { start: "09:00", end: "09:30" }, carbRange: { min: 20, max: 40 }, insulinTiming: "Reduced bolus or none", notes: "Exercise imminent — reduce bolus" },
      { name: "Post-Exercise", timeWindow: { start: "11:00", end: "12:00" }, carbRange: { min: 30, max: 50 }, insulinTiming: "Reduced bolus", notes: "Post-exercise insulin sensitivity is high" },
      { name: "Lunch", timeWindow: { start: "13:00", end: "14:00" }, carbRange: { min: 50, max: 80 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
      { name: "Dinner", timeWindow: { start: "18:00", end: "19:30" }, carbRange: { min: 50, max: 80 }, insulinTiming: "Pre-meal bolus", preBolusMinutes: 15 },
    ],
    culturalNotes: "Athletes need higher carb intake. Reduce bolus 30-50% before and after exercise. Monitor for delayed hypos 6-12h post.",
  },
  {
    id: "tube-feeding",
    name: "Tube Feeding",
    meals: [
      { name: "Continuous Feed", timeWindow: { start: "00:00", end: "23:59" }, carbRange: { min: 150, max: 250 }, insulinTiming: "Continuous basal rate via pump or scheduled injections", notes: "Carb delivery is continuous — requires constant basal coverage" },
    ],
    culturalNotes: "Enteral nutrition. Carb rate depends on formula concentration. Coordinate with dietitian and endocrinologist.",
  },
  {
    id: "toddler-picky",
    name: "Toddler / Picky Eater",
    meals: [
      { name: "Breakfast", timeWindow: { start: "07:00", end: "08:00" }, carbRange: { min: 10, max: 25 }, insulinTiming: "Dose AFTER eating based on intake", notes: "Unpredictable eating — dose post-meal" },
      { name: "Morning Snack", timeWindow: { start: "09:30", end: "10:00" }, carbRange: { min: 5, max: 15 }, insulinTiming: "Dose after if >10g eaten" },
      { name: "Lunch", timeWindow: { start: "11:30", end: "12:30" }, carbRange: { min: 15, max: 30 }, insulinTiming: "Dose AFTER eating based on intake" },
      { name: "Afternoon Snack", timeWindow: { start: "14:30", end: "15:00" }, carbRange: { min: 5, max: 15 }, insulinTiming: "Dose after if >10g eaten" },
      { name: "Dinner", timeWindow: { start: "17:00", end: "18:00" }, carbRange: { min: 15, max: 30 }, insulinTiming: "Dose AFTER eating based on intake" },
    ],
    culturalNotes: "Young children eat unpredictably. Always dose AFTER the meal based on what was actually eaten. Use half-unit pens.",
  },
];

const REGIME_MAP = new Map(MEAL_REGIMES.map((r) => [r.id, r]));

/**
 * Look up a meal regime by ID.
 * Returns undefined if the ID is not found.
 */
export function getMealRegime(id: string): MealRegime | undefined {
  return REGIME_MAP.get(id);
}

/**
 * Get all available meal regimes.
 */
export function getAllMealRegimes(): MealRegime[] {
  return [...MEAL_REGIMES];
}
