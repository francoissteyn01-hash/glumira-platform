/**
 * GluMira™ — Altitude Impact Analysis Module
 *
 * Analyses how altitude changes affect insulin sensitivity, glucose levels,
 * and provides recommendations for diabetes management at different elevations.
 *
 * Clinical basis:
 * - High altitude (>2,500m) increases glucose uptake and insulin sensitivity
 * - Very high altitude (>3,500m) can cause stress-induced hyperglycemia
 * - Altitude sickness symptoms overlap with hypoglycemia symptoms
 * - Cold exposure at altitude increases caloric needs and glucose consumption
 * - Reduced appetite at altitude can cause unexpected hypoglycemia
 *
 * NOT a medical device. Educational purposes only.
 */

export interface AltitudeReading {
  timestampUtc: string;          // ISO-8601
  altitudeMeters: number;        // elevation in meters
  glucoseMmol: number;           // glucose reading mmol/L
  heartRateBpm?: number;         // optional heart rate
  temperatureCelsius?: number;   // ambient temperature
  activityLevel?: "rest" | "light" | "moderate" | "intense";
}

export interface AltitudeZone {
  name: string;
  minMeters: number;
  maxMeters: number;
  insulinSensitivityChange: number;  // percentage change (positive = more sensitive)
  hypoRiskLevel: "low" | "moderate" | "high" | "very-high";
  hyperRiskLevel: "low" | "moderate" | "high";
  keyRisks: string[];
}

export interface AltitudeImpactResult {
  currentAltitude: number;
  currentZone: AltitudeZone;
  altitudeChange: number;           // meters gained/lost from baseline
  direction: "ascending" | "descending" | "stable";
  ascentRateMetersPerHour: number;
  glucoseAtAltitude: {
    mean: number;
    min: number;
    max: number;
    trend: "rising" | "falling" | "stable";
  };
  insulinAdjustment: {
    basalChangePercent: number;
    bolusChangePercent: number;
    explanation: string;
  };
  hydrationAdvice: {
    minimumLitersPerDay: number;
    explanation: string;
  };
  carbAdjustment: {
    additionalCarbsPerHour: number;
    explanation: string;
  };
  acclimatizationDays: number;
  monitoringFrequencyHours: number;
  warnings: string[];
  recommendations: string[];
}

const ALTITUDE_ZONES: AltitudeZone[] = [
  {
    name: "Low Altitude",
    minMeters: 0,
    maxMeters: 1500,
    insulinSensitivityChange: 0,
    hypoRiskLevel: "low",
    hyperRiskLevel: "low",
    keyRisks: [],
  },
  {
    name: "Moderate Altitude",
    minMeters: 1500,
    maxMeters: 2500,
    insulinSensitivityChange: 5,
    hypoRiskLevel: "moderate",
    hyperRiskLevel: "low",
    keyRisks: [
      "Mild increase in insulin sensitivity",
      "Increased physical exertion from reduced oxygen",
    ],
  },
  {
    name: "High Altitude",
    minMeters: 2500,
    maxMeters: 3500,
    insulinSensitivityChange: 10,
    hypoRiskLevel: "high",
    hyperRiskLevel: "moderate",
    keyRisks: [
      "Significant insulin sensitivity increase",
      "Altitude sickness symptoms mimic hypoglycemia",
      "Reduced appetite may cause unexpected hypos",
      "Increased glucose monitoring essential",
    ],
  },
  {
    name: "Very High Altitude",
    minMeters: 3500,
    maxMeters: 5500,
    insulinSensitivityChange: 15,
    hypoRiskLevel: "very-high",
    hyperRiskLevel: "high",
    keyRisks: [
      "Stress hormones may cause hyperglycemia",
      "Severe altitude sickness risk",
      "Insulin absorption may be unpredictable",
      "Glucose meter accuracy may decrease",
      "Cold exposure increases glucose consumption",
    ],
  },
  {
    name: "Extreme Altitude",
    minMeters: 5500,
    maxMeters: 9000,
    insulinSensitivityChange: 20,
    hypoRiskLevel: "very-high",
    hyperRiskLevel: "high",
    keyRisks: [
      "Life-threatening altitude sickness risk",
      "Unpredictable glucose swings",
      "Insulin may freeze in extreme cold",
      "Glucose meters may malfunction",
      "Medical evacuation may be necessary",
    ],
  },
];

function getZone(altitudeMeters: number): AltitudeZone {
  const clamped = Math.max(0, altitudeMeters);
  for (let i = ALTITUDE_ZONES.length - 1; i >= 0; i--) {
    if (clamped >= ALTITUDE_ZONES[i].minMeters) {
      return ALTITUDE_ZONES[i];
    }
  }
  return ALTITUDE_ZONES[0];
}

function computeGlucoseStats(readings: AltitudeReading[]): {
  mean: number;
  min: number;
  max: number;
  trend: "rising" | "falling" | "stable";
} {
  if (readings.length === 0) {
    return { mean: 0, min: 0, max: 0, trend: "stable" };
  }

  const values = readings.map((r) => r.glucoseMmol);
  const mean = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const min = Math.round(Math.min(...values) * 10) / 10;
  const max = Math.round(Math.max(...values) * 10) / 10;

  let trend: "rising" | "falling" | "stable" = "stable";
  if (readings.length >= 3) {
    const firstHalf = readings.slice(0, Math.floor(readings.length / 2));
    const secondHalf = readings.slice(Math.floor(readings.length / 2));
    const firstMean = firstHalf.reduce((a, b) => a + b.glucoseMmol, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, b) => a + b.glucoseMmol, 0) / secondHalf.length;
    const diff = secondMean - firstMean;
    if (diff > 0.5) trend = "rising";
    else if (diff < -0.5) trend = "falling";
  }

  return { mean, min, max, trend };
}

function computeAscentRate(readings: AltitudeReading[]): number {
  if (readings.length < 2) return 0;

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestampUtc).getTime() - new Date(b.timestampUtc).getTime()
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const hoursElapsed =
    (new Date(last.timestampUtc).getTime() - new Date(first.timestampUtc).getTime()) / 3_600_000;

  if (hoursElapsed <= 0) return 0;

  const altitudeGain = last.altitudeMeters - first.altitudeMeters;
  return Math.round(altitudeGain / hoursElapsed);
}

export function analyzeAltitudeImpact(
  readings: AltitudeReading[],
  baselineAltitude: number = 0
): AltitudeImpactResult {
  if (readings.length === 0) {
    const zone = getZone(baselineAltitude);
    return {
      currentAltitude: baselineAltitude,
      currentZone: zone,
      altitudeChange: 0,
      direction: "stable",
      ascentRateMetersPerHour: 0,
      glucoseAtAltitude: { mean: 0, min: 0, max: 0, trend: "stable" },
      insulinAdjustment: { basalChangePercent: 0, bolusChangePercent: 0, explanation: "No readings provided." },
      hydrationAdvice: { minimumLitersPerDay: 2, explanation: "Standard hydration recommendation." },
      carbAdjustment: { additionalCarbsPerHour: 0, explanation: "No altitude change detected." },
      acclimatizationDays: 0,
      monitoringFrequencyHours: 4,
      warnings: [],
      recommendations: ["Provide glucose readings with altitude data for personalized analysis."],
    };
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestampUtc).getTime() - new Date(b.timestampUtc).getTime()
  );

  const currentAltitude = sorted[sorted.length - 1].altitudeMeters;
  const currentZone = getZone(currentAltitude);
  const altitudeChange = currentAltitude - baselineAltitude;
  const ascentRate = computeAscentRate(sorted);

  let direction: "ascending" | "descending" | "stable" = "stable";
  if (altitudeChange > 200) direction = "ascending";
  else if (altitudeChange < -200) direction = "descending";

  const glucoseStats = computeGlucoseStats(sorted);

  // Insulin adjustment based on altitude zone
  const sensitivityChange = currentZone.insulinSensitivityChange;
  let basalChange = sensitivityChange === 0 ? 0 : -sensitivityChange; // More sensitive = reduce basal
  let bolusChange = sensitivityChange === 0 ? 0 : -sensitivityChange;

  // At very high altitude, stress hormones may counteract sensitivity
  if (currentAltitude >= 3500) {
    basalChange = Math.round(basalChange * 0.5); // Less reduction due to stress response
  }

  // Activity level adjustment
  const activeReadings = sorted.filter(
    (r) => r.activityLevel === "moderate" || r.activityLevel === "intense"
  );
  if (activeReadings.length > sorted.length * 0.5) {
    basalChange -= 5; // Additional reduction for active at altitude
    bolusChange -= 5;
  }

  let insulinExplanation = "";
  if (basalChange === 0) {
    insulinExplanation = "No insulin adjustment needed at current altitude.";
  } else if (basalChange < 0) {
    insulinExplanation = `Reduce basal by ~${Math.abs(basalChange)}% due to increased insulin sensitivity at ${currentZone.name.toLowerCase()}. Monitor closely for hypoglycemia.`;
  } else {
    insulinExplanation = `Consider increasing basal by ~${basalChange}% due to stress response at extreme altitude. Monitor for both hypo and hyperglycemia.`;
  }

  // Hydration
  let minLiters = 2;
  if (currentAltitude >= 2500) minLiters = 3;
  if (currentAltitude >= 3500) minLiters = 3.5;
  if (currentAltitude >= 5500) minLiters = 4;

  const coldReadings = sorted.filter((r) => r.temperatureCelsius !== undefined && r.temperatureCelsius < 5);
  if (coldReadings.length > 0) minLiters += 0.5;

  const hydrationExplanation =
    currentAltitude >= 2500
      ? `At ${currentZone.name.toLowerCase()}, dehydration risk is significantly increased. Drink at least ${minLiters}L/day. Dehydration worsens altitude sickness and affects glucose levels.`
      : "Standard hydration. Increase intake if exercising.";

  // Carb adjustment
  let additionalCarbs = 0;
  if (currentAltitude >= 2500 && direction === "ascending") additionalCarbs = 10;
  if (currentAltitude >= 3500) additionalCarbs = 15;
  if (activeReadings.length > 0) additionalCarbs += 10;

  const carbExplanation =
    additionalCarbs > 0
      ? `Consider an additional ${additionalCarbs}g carbs per hour of activity at altitude. Reduced appetite is common — set reminders to eat.`
      : "No additional carbohydrate adjustment needed at current altitude.";

  // Acclimatization
  let acclimatizationDays = 0;
  if (currentAltitude >= 2500) acclimatizationDays = 2;
  if (currentAltitude >= 3500) acclimatizationDays = 3;
  if (currentAltitude >= 4500) acclimatizationDays = 5;
  if (currentAltitude >= 5500) acclimatizationDays = 7;

  // Monitoring frequency
  let monitoringHours = 4;
  if (currentAltitude >= 1500) monitoringHours = 3;
  if (currentAltitude >= 2500) monitoringHours = 2;
  if (currentAltitude >= 3500) monitoringHours = 1;

  // Warnings
  const warnings: string[] = [];

  if (ascentRate > 500) {
    warnings.push("Ascent rate exceeds 500m/hour — high risk of altitude sickness. Slow down.");
  }

  if (currentAltitude >= 2500 && glucoseStats.min < 4.0) {
    warnings.push("Hypoglycemia detected at altitude — symptoms may be masked by altitude sickness.");
  }

  if (currentAltitude >= 3500 && glucoseStats.max > 15.0) {
    warnings.push("Hyperglycemia at high altitude — may indicate stress response or dehydration.");
  }

  if (currentAltitude >= 3500) {
    warnings.push("Altitude sickness symptoms (headache, nausea, dizziness) overlap with hypoglycemia — always check glucose first.");
  } else if (currentAltitude >= 2500) {
    warnings.push("Some altitude sickness symptoms may mimic hypoglycemia — always verify with a glucose check.");
  }

  if (coldReadings.length > sorted.length * 0.5) {
    warnings.push("Cold exposure detected — insulin may not absorb properly if injection site is cold.");
  }

  if (currentAltitude >= 5500) {
    warnings.push("EXTREME ALTITUDE: Ensure medical support is available. Carry emergency glucose and glucagon.");
  }

  // Recommendations
  const recommendations: string[] = [];

  recommendations.push(`Check glucose every ${monitoringHours} hours while at ${currentZone.name.toLowerCase()}.`);

  if (currentAltitude >= 2500) {
    recommendations.push("Carry fast-acting glucose at all times — at least 30g readily accessible.");
    recommendations.push("Inform travel companions about diabetes management and hypo treatment.");
    recommendations.push("Keep insulin and glucose meter close to body to prevent freezing.");
  }

  if (acclimatizationDays > 0) {
    recommendations.push(`Allow ${acclimatizationDays} days for acclimatization before strenuous activity.`);
  }

  if (direction === "ascending" && altitudeChange > 1000) {
    recommendations.push("Ascend gradually — no more than 300-500m of sleeping altitude gain per day above 2,500m.");
  }

  if (additionalCarbs > 0) {
    recommendations.push("Set meal reminders — appetite suppression is common at altitude.");
  }

  recommendations.push("Keep a written log of glucose, altitude, and symptoms for your diabetes team.");

  return {
    currentAltitude,
    currentZone,
    altitudeChange,
    direction,
    ascentRateMetersPerHour: ascentRate,
    glucoseAtAltitude: glucoseStats,
    insulinAdjustment: {
      basalChangePercent: basalChange,
      bolusChangePercent: bolusChange,
      explanation: insulinExplanation,
    },
    hydrationAdvice: {
      minimumLitersPerDay: minLiters,
      explanation: hydrationExplanation,
    },
    carbAdjustment: {
      additionalCarbsPerHour: additionalCarbs,
      explanation: carbExplanation,
    },
    acclimatizationDays,
    monitoringFrequencyHours: monitoringHours,
    warnings,
    recommendations,
  };
}

export function getAltitudeZone(altitudeMeters: number): AltitudeZone {
  return getZone(altitudeMeters);
}

export function getAltitudeZones(): AltitudeZone[] {
  return [...ALTITUDE_ZONES];
}
