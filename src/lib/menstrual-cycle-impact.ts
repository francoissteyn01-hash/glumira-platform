/**
 * GluMira™ — Menstrual Cycle Impact Analysis Module
 *
 * Analyses how menstrual cycle phases affect insulin sensitivity,
 * glucose patterns, and provides phase-specific management recommendations.
 *
 * Clinical basis:
 * - Follicular phase (days 1-14): Generally stable/increased insulin sensitivity
 * - Ovulation (days 12-16): Brief sensitivity increase
 * - Luteal phase (days 15-28): Progesterone causes insulin resistance
 * - Menstruation (days 1-5): Variable — some see hypos, others hypers
 * - Progesterone peaks in luteal phase → increased insulin resistance (10-40%)
 * - Estrogen peaks at ovulation → increased insulin sensitivity
 *
 * NOT a medical device. Educational purposes only.
 */

export interface CycleDay {
  date: string;               // YYYY-MM-DD
  cycleDay: number;           // 1-based day of cycle
  glucoseReadings: number[];  // mmol/L values for the day
  basalDoseUnits?: number;
  totalBolusUnits?: number;
  totalCarbsGrams?: number;
  symptoms?: string[];        // e.g. ["cramps", "bloating", "fatigue"]
  mood?: "good" | "neutral" | "low" | "irritable";
}

export interface CyclePhase {
  name: string;
  dayRange: [number, number];
  insulinSensitivityTrend: "increased" | "stable" | "decreased";
  typicalResistanceChangePercent: number;  // positive = more resistant
  description: string;
}

export interface CycleImpactResult {
  currentCycleDay: number;
  currentPhase: CyclePhase;
  cycleLength: number;
  phaseAnalysis: {
    phase: string;
    avgGlucose: number;
    glucoseVariability: number;  // CV%
    avgTotalInsulin: number;
    avgCarbs: number;
    readingCount: number;
  }[];
  insulinAdjustment: {
    basalChangePercent: number;
    bolusChangePercent: number;
    explanation: string;
  };
  predictedNextPhase: {
    name: string;
    startsInDays: number;
    expectedChange: string;
  };
  patternStrength: "strong" | "moderate" | "weak" | "insufficient-data";
  symptomCorrelations: {
    symptom: string;
    avgGlucoseWhenPresent: number;
    avgGlucoseWhenAbsent: number;
    glucoseImpact: "raises" | "lowers" | "neutral";
  }[];
  warnings: string[];
  recommendations: string[];
}

const CYCLE_PHASES: CyclePhase[] = [
  {
    name: "Menstruation",
    dayRange: [1, 5],
    insulinSensitivityTrend: "stable",
    typicalResistanceChangePercent: 0,
    description: "Hormone levels are low. Glucose may be variable as progesterone drops.",
  },
  {
    name: "Follicular",
    dayRange: [6, 13],
    insulinSensitivityTrend: "increased",
    typicalResistanceChangePercent: -5,
    description: "Rising estrogen increases insulin sensitivity. Lower insulin needs expected.",
  },
  {
    name: "Ovulation",
    dayRange: [14, 16],
    insulinSensitivityTrend: "increased",
    typicalResistanceChangePercent: -10,
    description: "Estrogen peaks. Highest insulin sensitivity of the cycle. Watch for hypos.",
  },
  {
    name: "Early Luteal",
    dayRange: [17, 21],
    insulinSensitivityTrend: "decreased",
    typicalResistanceChangePercent: 10,
    description: "Progesterone rises. Insulin resistance begins increasing.",
  },
  {
    name: "Late Luteal",
    dayRange: [22, 28],
    insulinSensitivityTrend: "decreased",
    typicalResistanceChangePercent: 20,
    description: "Peak progesterone. Highest insulin resistance. Increased basal may be needed.",
  },
];

function getPhase(cycleDay: number, cycleLength: number = 28): CyclePhase {
  // Adjust for non-standard cycle lengths
  const normalizedDay = Math.round((cycleDay / cycleLength) * 28);
  const clamped = Math.max(1, Math.min(28, normalizedDay));

  for (const phase of CYCLE_PHASES) {
    if (clamped >= phase.dayRange[0] && clamped <= phase.dayRange[1]) {
      return phase;
    }
  }
  return CYCLE_PHASES[CYCLE_PHASES.length - 1]; // Default to late luteal
}

function computeCV(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.round((Math.sqrt(variance) / mean) * 100 * 10) / 10;
}

export function analyzeCycleImpact(
  cycleDays: CycleDay[],
  cycleLength: number = 28
): CycleImpactResult {
  if (cycleDays.length === 0) {
    const phase = getPhase(1, cycleLength);
    return {
      currentCycleDay: 1,
      currentPhase: phase,
      cycleLength,
      phaseAnalysis: [],
      insulinAdjustment: {
        basalChangePercent: 0,
        bolusChangePercent: 0,
        explanation: "No cycle data provided.",
      },
      predictedNextPhase: {
        name: "Follicular",
        startsInDays: 5,
        expectedChange: "Insulin sensitivity may increase.",
      },
      patternStrength: "insufficient-data",
      symptomCorrelations: [],
      warnings: [],
      recommendations: ["Track cycle days alongside glucose for personalized insights."],
    };
  }

  const sorted = [...cycleDays].sort((a, b) => a.cycleDay - b.cycleDay);
  const currentDay = sorted[sorted.length - 1].cycleDay;
  const currentPhase = getPhase(currentDay, cycleLength);

  // Group days by phase
  const phaseGroups: Record<string, CycleDay[]> = {};
  for (const day of sorted) {
    const phase = getPhase(day.cycleDay, cycleLength);
    if (!phaseGroups[phase.name]) phaseGroups[phase.name] = [];
    phaseGroups[phase.name].push(day);
  }

  // Analyse each phase
  const phaseAnalysis = Object.entries(phaseGroups).map(([phaseName, days]) => {
    const allGlucose = days.flatMap((d) => d.glucoseReadings);
    const avgGlucose =
      allGlucose.length > 0
        ? Math.round((allGlucose.reduce((a, b) => a + b, 0) / allGlucose.length) * 10) / 10
        : 0;
    const cv = computeCV(allGlucose);

    const totalInsulinValues = days
      .filter((d) => d.basalDoseUnits !== undefined || d.totalBolusUnits !== undefined)
      .map((d) => (d.basalDoseUnits ?? 0) + (d.totalBolusUnits ?? 0));
    const avgTotalInsulin =
      totalInsulinValues.length > 0
        ? Math.round((totalInsulinValues.reduce((a, b) => a + b, 0) / totalInsulinValues.length) * 10) / 10
        : 0;

    const carbValues = days.filter((d) => d.totalCarbsGrams !== undefined).map((d) => d.totalCarbsGrams!);
    const avgCarbs =
      carbValues.length > 0
        ? Math.round(carbValues.reduce((a, b) => a + b, 0) / carbValues.length)
        : 0;

    return {
      phase: phaseName,
      avgGlucose,
      glucoseVariability: cv,
      avgTotalInsulin,
      avgCarbs,
      readingCount: allGlucose.length,
    };
  });

  // Insulin adjustment based on current phase
  const resistanceChange = currentPhase.typicalResistanceChangePercent;
  const basalChange = resistanceChange; // Positive = need more insulin
  const bolusChange = Math.round(resistanceChange * 0.7); // Bolus less affected

  let explanation = "";
  if (resistanceChange > 0) {
    explanation = `${currentPhase.name} phase: Progesterone-driven insulin resistance expected (~${resistanceChange}% increase). Consider increasing basal by ${resistanceChange}%.`;
  } else if (resistanceChange < 0) {
    explanation = `${currentPhase.name} phase: Estrogen-driven insulin sensitivity increase (~${Math.abs(resistanceChange)}%). Consider reducing basal by ${Math.abs(resistanceChange)}%. Watch for hypos.`;
  } else {
    explanation = `${currentPhase.name} phase: Hormone levels transitioning. Glucose may be variable. Monitor closely.`;
  }

  // Predict next phase
  const currentPhaseIndex = CYCLE_PHASES.findIndex((p) => p.name === currentPhase.name);
  const nextPhaseIndex = (currentPhaseIndex + 1) % CYCLE_PHASES.length;
  const nextPhase = CYCLE_PHASES[nextPhaseIndex];
  const daysUntilNext = Math.max(1, currentPhase.dayRange[1] - currentDay + 1);

  let expectedChange = "";
  if (nextPhase.typicalResistanceChangePercent > currentPhase.typicalResistanceChangePercent) {
    expectedChange = "Insulin resistance expected to increase. You may need more insulin.";
  } else if (nextPhase.typicalResistanceChangePercent < currentPhase.typicalResistanceChangePercent) {
    expectedChange = "Insulin sensitivity expected to improve. You may need less insulin.";
  } else {
    expectedChange = "Insulin needs expected to remain similar.";
  }

  // Pattern strength
  let patternStrength: "strong" | "moderate" | "weak" | "insufficient-data" = "insufficient-data";
  if (sorted.length >= 20) patternStrength = "strong";
  else if (sorted.length >= 10) patternStrength = "moderate";
  else if (sorted.length >= 5) patternStrength = "weak";

  // Symptom correlations
  const allSymptoms = new Set<string>();
  sorted.forEach((d) => d.symptoms?.forEach((s) => allSymptoms.add(s)));

  const symptomCorrelations = Array.from(allSymptoms).map((symptom) => {
    const withSymptom = sorted.filter((d) => d.symptoms?.includes(symptom));
    const withoutSymptom = sorted.filter((d) => !d.symptoms?.includes(symptom));

    const glucoseWith =
      withSymptom.flatMap((d) => d.glucoseReadings).length > 0
        ? Math.round(
            (withSymptom.flatMap((d) => d.glucoseReadings).reduce((a, b) => a + b, 0) /
              withSymptom.flatMap((d) => d.glucoseReadings).length) *
              10
          ) / 10
        : 0;

    const glucoseWithout =
      withoutSymptom.flatMap((d) => d.glucoseReadings).length > 0
        ? Math.round(
            (withoutSymptom.flatMap((d) => d.glucoseReadings).reduce((a, b) => a + b, 0) /
              withoutSymptom.flatMap((d) => d.glucoseReadings).length) *
              10
          ) / 10
        : 0;

    let impact: "raises" | "lowers" | "neutral" = "neutral";
    if (glucoseWith - glucoseWithout > 0.5) impact = "raises";
    else if (glucoseWith - glucoseWithout < -0.5) impact = "lowers";

    return {
      symptom,
      avgGlucoseWhenPresent: glucoseWith,
      avgGlucoseWhenAbsent: glucoseWithout,
      glucoseImpact: impact,
    };
  });

  // Warnings
  const warnings: string[] = [];

  if (currentPhase.name === "Late Luteal") {
    warnings.push("Late luteal phase: Expect higher glucose levels. Pre-menstrual insulin resistance is common.");
  }

  if (currentPhase.name === "Ovulation") {
    warnings.push("Ovulation phase: Increased hypo risk due to peak estrogen. Carry fast-acting glucose.");
  }

  const currentPhaseData = phaseAnalysis.find((p) => p.phase === currentPhase.name);
  if (currentPhaseData && currentPhaseData.glucoseVariability > 36) {
    warnings.push(`High glucose variability (CV ${currentPhaseData.glucoseVariability}%) in ${currentPhase.name} phase.`);
  }

  // Recommendations
  const recommendations: string[] = [];

  recommendations.push(`Current phase: ${currentPhase.name}. ${currentPhase.description}`);

  if (resistanceChange > 0) {
    recommendations.push("Consider a temporary basal increase during the luteal phase.");
    recommendations.push("Increase pre-meal bolus timing (dose 15-20 min before eating).");
  } else if (resistanceChange < 0) {
    recommendations.push("Watch for unexpected lows, especially during exercise.");
    recommendations.push("Consider reducing basal slightly during follicular/ovulation phases.");
  }

  recommendations.push(`Next phase (${nextPhase.name}) starts in ~${daysUntilNext} days. ${expectedChange}`);
  recommendations.push("Track symptoms alongside glucose to identify personal patterns.");

  return {
    currentCycleDay: currentDay,
    currentPhase,
    cycleLength,
    phaseAnalysis,
    insulinAdjustment: {
      basalChangePercent: basalChange,
      bolusChangePercent: bolusChange,
      explanation,
    },
    predictedNextPhase: {
      name: nextPhase.name,
      startsInDays: daysUntilNext,
      expectedChange,
    },
    patternStrength,
    symptomCorrelations,
    warnings,
    recommendations,
  };
}

export function getCyclePhases(): CyclePhase[] {
  return [...CYCLE_PHASES];
}

export function getCyclePhase(cycleDay: number, cycleLength: number = 28): CyclePhase {
  return getPhase(cycleDay, cycleLength);
}
