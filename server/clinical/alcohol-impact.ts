/**
 * GluMira™ — Alcohol Impact Analysis Module
 *
 * Analyses how alcohol consumption affects glucose levels and provides
 * safety guidance for diabetes management when drinking.
 *
 * Clinical basis:
 * - Alcohol inhibits hepatic gluconeogenesis → delayed hypoglycemia (up to 24h)
 * - Initial glucose rise from carb-containing drinks (beer, cocktails)
 * - Liver prioritizes alcohol metabolism over glucose regulation
 * - Symptoms of intoxication mimic hypoglycemia
 * - Glucagon may be less effective after alcohol consumption
 * - Risk increases with amount consumed and empty stomach
 *
 * NOT a medical device. Educational purposes only.
 */

export type DrinkType = "beer" | "wine" | "spirits" | "cocktail" | "cider" | "low-carb-beer";

export interface DrinkEntry {
  type: DrinkType;
  volumeMl: number;
  alcoholPercent: number;
  carbsGrams?: number;
  timestampUtc: string;
}

export interface AlcoholInput {
  drinks: DrinkEntry[];
  diabetesType: "type1" | "type2";
  currentGlucoseMmol: number;
  basalDoseUnits: number;
  lastMealHoursAgo: number;
  weightKg: number;
  isFemale: boolean;
}

export interface AlcoholImpactResult {
  totalStandardDrinks: number;
  totalCarbsFromDrinks: number;
  estimatedBAC: number;
  riskLevel: "low" | "moderate" | "high" | "very-high";
  hypoRiskWindow: {
    startHoursFromNow: number;
    endHoursFromNow: number;
    peakRiskHoursFromNow: number;
  };
  glucoseExpectation: {
    immediate: "rise" | "stable" | "fall";
    delayed: "rise" | "stable" | "fall";
    explanation: string;
  };
  insulinGuidance: {
    basalChangePercent: number;
    skipBolus: boolean;
    explanation: string;
  };
  carbGuidance: {
    eatBeforeDrinking: boolean;
    snackBeforeBed: boolean;
    recommendedCarbsGrams: number;
    explanation: string;
  };
  monitoringAdvice: {
    checkBeforeBed: boolean;
    setAlarmForNightCheck: boolean;
    nightCheckHour: number;
    nextMorningCheck: boolean;
    frequencyHours: number;
  };
  warnings: string[];
  recommendations: string[];
}

const DRINK_CARBS: Record<DrinkType, number> = {
  beer: 13,           // per 330ml standard
  wine: 4,            // per 150ml glass
  spirits: 0,         // per 30ml shot
  cocktail: 25,       // per serving (varies widely)
  cider: 18,          // per 330ml
  "low-carb-beer": 3, // per 330ml
};

function calcStandardDrinks(drink: DrinkEntry): number {
  // 1 standard drink = 10g pure alcohol
  const pureAlcoholMl = (drink.volumeMl * drink.alcoholPercent) / 100;
  const pureAlcoholGrams = pureAlcoholMl * 0.789; // density of ethanol
  return Math.round((pureAlcoholGrams / 10) * 10) / 10;
}

function estimateBAC(totalAlcoholGrams: number, weightKg: number, isFemale: boolean, hoursElapsed: number): number {
  // Widmark formula
  const r = isFemale ? 0.55 : 0.68; // body water constant
  const bac = (totalAlcoholGrams / (weightKg * r * 1000)) * 100;
  const metabolized = hoursElapsed * 0.015; // ~0.015% per hour
  return Math.max(0, Math.round((bac - metabolized) * 1000) / 1000);
}

export function analyzeAlcoholImpact(input: AlcoholInput): AlcoholImpactResult {
  // Calculate totals
  const drinkDetails = input.drinks.map((d) => ({
    standardDrinks: calcStandardDrinks(d),
    carbs: d.carbsGrams ?? DRINK_CARBS[d.type] ?? 0,
    alcoholGrams: ((d.volumeMl * d.alcoholPercent) / 100) * 0.789,
  }));

  const totalStandardDrinks = Math.round(drinkDetails.reduce((a, d) => a + d.standardDrinks, 0) * 10) / 10;
  const totalCarbs = Math.round(drinkDetails.reduce((a, d) => a + d.carbs, 0));
  const totalAlcoholGrams = drinkDetails.reduce((a, d) => a + d.alcoholGrams, 0);

  // Estimate BAC (assume drinks consumed over last 1-2 hours)
  const bac = estimateBAC(totalAlcoholGrams, input.weightKg, input.isFemale, 1);

  // Risk assessment
  let riskScore = 0;
  if (totalStandardDrinks >= 4) riskScore += 3;
  else if (totalStandardDrinks >= 2) riskScore += 1;

  if (input.diabetesType === "type1") riskScore += 1;
  if (input.currentGlucoseMmol < 5.0) riskScore += 2;
  if (input.lastMealHoursAgo > 3) riskScore += 2;

  let riskLevel: "low" | "moderate" | "high" | "very-high" = "low";
  if (riskScore >= 6) riskLevel = "very-high";
  else if (riskScore >= 4) riskLevel = "high";
  else if (riskScore >= 2) riskLevel = "moderate";

  // Hypo risk window
  const peakRisk = totalStandardDrinks >= 3 ? 8 : 6;
  const hypoWindow = {
    startHoursFromNow: 2,
    endHoursFromNow: totalStandardDrinks >= 3 ? 24 : 12,
    peakRiskHoursFromNow: peakRisk,
  };

  // Glucose expectation
  let immediate: "rise" | "stable" | "fall" = "stable";
  let delayed: "rise" | "stable" | "fall" = "fall";

  if (totalCarbs > 20) immediate = "rise";
  if (totalStandardDrinks < 1) delayed = "stable";

  const glucoseExplanation = totalCarbs > 20
    ? `Expect initial glucose rise from ${totalCarbs}g carbs in drinks, followed by delayed fall as liver processes alcohol.`
    : `Minimal carbs in drinks. Expect delayed glucose fall as liver prioritizes alcohol metabolism over gluconeogenesis.`;

  // Insulin guidance
  let basalChange = 0;
  let skipBolus = false;

  if (totalStandardDrinks >= 3) {
    basalChange = -20;
  } else if (totalStandardDrinks >= 2) {
    basalChange = -10;
  }

  if (totalStandardDrinks >= 2 && totalCarbs < 15) {
    skipBolus = true;
  }

  const insulinExplanation = skipBolus
    ? "Skip bolus for alcohol — low carb content and high hypo risk. Reduce basal to prevent delayed hypo."
    : totalStandardDrinks >= 2
    ? `Reduce basal by ${Math.abs(basalChange)}% tonight. If bolusing for carbs in drinks, reduce by 30-50%.`
    : "Minimal adjustment needed for light drinking. Monitor glucose before bed.";

  // Carb guidance
  const eatFirst = input.lastMealHoursAgo > 2;
  const snackBeforeBed = totalStandardDrinks >= 2;
  const recommendedCarbs = snackBeforeBed ? (totalStandardDrinks >= 3 ? 30 : 20) : 0;

  const carbExplanation = eatFirst
    ? "Eat a meal with complex carbs before or while drinking to slow alcohol absorption and provide glucose buffer."
    : snackBeforeBed
    ? `Have a ${recommendedCarbs}g carb snack before bed to prevent overnight hypoglycemia.`
    : "Light drinking with recent meal — standard monitoring should suffice.";

  // Monitoring
  const checkBeforeBed = totalStandardDrinks >= 1;
  const nightAlarm = totalStandardDrinks >= 2;
  const nightCheckHour = 3; // 3 AM check
  const morningCheck = totalStandardDrinks >= 1;
  const freq = riskLevel === "high" || riskLevel === "very-high" ? 2 : 3;

  // Warnings
  const warnings: string[] = [];

  if (totalStandardDrinks >= 4) {
    warnings.push("Heavy drinking detected. Very high risk of severe delayed hypoglycemia.");
  }

  if (input.currentGlucoseMmol < 5.0) {
    warnings.push(`Current glucose is ${input.currentGlucoseMmol} mmol/L — already low. Eat carbs before drinking.`);
  }

  if (input.lastMealHoursAgo > 3) {
    warnings.push("Drinking on an empty stomach significantly increases hypo risk. Eat first.");
  }

  warnings.push("Alcohol intoxication symptoms (confusion, slurred speech, unsteadiness) mimic hypoglycemia — always check glucose.");

  if (totalStandardDrinks >= 2) {
    warnings.push("Glucagon may be less effective after alcohol. Inform companions about this.");
  }

  // Recommendations
  const recommendations: string[] = [];

  recommendations.push("Always eat before or while drinking alcohol.");
  recommendations.push("Wear diabetes identification (medical alert bracelet/card).");
  recommendations.push("Inform drinking companions about your diabetes and hypo treatment.");

  if (checkBeforeBed) {
    recommendations.push("Check glucose before bed. If below 7.0 mmol/L, eat a 15-20g carb snack.");
  }

  if (nightAlarm) {
    recommendations.push("Set an alarm for 3 AM glucose check — peak delayed hypo risk window.");
  }

  if (morningCheck) {
    recommendations.push("Check glucose first thing in the morning — delayed hypo risk continues.");
  }

  recommendations.push("Limit to 1-2 standard drinks when possible.");
  recommendations.push("Choose lower-carb options (dry wine, spirits with sugar-free mixer) to reduce glucose spikes.");

  return {
    totalStandardDrinks,
    totalCarbsFromDrinks: totalCarbs,
    estimatedBAC: bac,
    riskLevel,
    hypoRiskWindow: hypoWindow,
    glucoseExpectation: {
      immediate,
      delayed,
      explanation: glucoseExplanation,
    },
    insulinGuidance: {
      basalChangePercent: basalChange,
      skipBolus,
      explanation: insulinExplanation,
    },
    carbGuidance: {
      eatBeforeDrinking: eatFirst,
      snackBeforeBed,
      recommendedCarbsGrams: recommendedCarbs,
      explanation: carbExplanation,
    },
    monitoringAdvice: {
      checkBeforeBed,
      setAlarmForNightCheck: nightAlarm,
      nightCheckHour,
      nextMorningCheck: morningCheck,
      frequencyHours: freq,
    },
    warnings,
    recommendations,
  };
}
