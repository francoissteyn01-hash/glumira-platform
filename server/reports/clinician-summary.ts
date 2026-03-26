/**
 * GluMira™ — Clinician Summary Report Module
 *
 * Generates structured clinician-facing summary reports from patient data.
 * Designed to be concise and actionable — doctors have limited time.
 *
 * Output is a structured object that can be rendered as PDF, HTML, or JSON.
 *
 * NOT a medical device. Educational purposes only.
 */

export interface PatientProfile {
  name: string;
  dateOfBirth: string;        // YYYY-MM-DD
  diabetesType: "type1" | "type2" | "gestational" | "other";
  diagnosisYear: number;
  insulinRegimen: string;     // e.g. "MDI (Lantus + Novorapid)"
  basalDoseUnits: number;
  isfMmol: number;            // insulin sensitivity factor
  icrGrams: number;           // insulin-to-carb ratio
  diaHours: number;           // duration of insulin action
  targetRangeMmol: [number, number]; // e.g. [4.0, 10.0]
  comorbidities: string[];
  medications: string[];
}

export interface ReportPeriodData {
  startDate: string;
  endDate: string;
  glucoseReadings: { timestampUtc: string; glucoseMmol: number }[];
  insulinDoses: { timestampUtc: string; units: number; type: "basal" | "bolus" }[];
  meals: { timestampUtc: string; carbsGrams: number }[];
  hypoEvents: number;         // count of glucose < 3.9
  hyperEvents: number;        // count of glucose > 13.9
  dkaEvents: number;
  hospitalizations: number;
}

export interface ClinicianSummary {
  reportTitle: string;
  generatedAt: string;
  patient: {
    name: string;
    age: number;
    diabetesType: string;
    yearsSinceDiagnosis: number;
    regimen: string;
  };
  period: {
    startDate: string;
    endDate: string;
    daysIncluded: number;
  };
  glucoseMetrics: {
    meanGlucose: number;
    estimatedA1c: number;
    timeInRange: number;       // % 4.0-10.0
    timeBelowRange: number;    // % < 4.0
    timeAboveRange: number;    // % > 10.0
    glucoseCV: number;         // coefficient of variation %
    gmi: number;               // glucose management indicator
    readingsPerDay: number;
    totalReadings: number;
  };
  insulinMetrics: {
    totalDailyDose: number;
    basalPercentage: number;
    bolusPercentage: number;
    avgBolusPerMeal: number;
    avgCarbsPerDay: number;
  };
  safetyEvents: {
    hypoEvents: number;
    hyperEvents: number;
    dkaEvents: number;
    hospitalizations: number;
    hypoFrequencyPerWeek: number;
  };
  clinicalFlags: {
    flag: string;
    severity: "info" | "warning" | "critical";
    recommendation: string;
  }[];
  actionItems: string[];
  disclaimer: string;
}

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date("2026-03-26");
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function calcCV(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.round((Math.sqrt(variance) / mean) * 100 * 10) / 10;
}

function estimateA1c(meanGlucoseMmol: number): number {
  // ADAG formula: A1c = (meanGlucose_mgdl + 46.7) / 28.7
  const mgdl = meanGlucoseMmol * 18.018;
  return Math.round(((mgdl + 46.7) / 28.7) * 10) / 10;
}

function calcGMI(meanGlucoseMmol: number): number {
  // GMI = 3.31 + 0.02392 × mean glucose (mg/dL)
  const mgdl = meanGlucoseMmol * 18.018;
  return Math.round((3.31 + 0.02392 * mgdl) * 10) / 10;
}

export function generateClinicianSummary(
  profile: PatientProfile,
  data: ReportPeriodData
): ClinicianSummary {
  const glucoseValues = data.glucoseReadings.map((r) => r.glucoseMmol);
  const totalReadings = glucoseValues.length;

  // Glucose metrics
  const meanGlucose = totalReadings > 0
    ? Math.round((glucoseValues.reduce((a, b) => a + b, 0) / totalReadings) * 10) / 10
    : 0;

  const inRange = glucoseValues.filter(
    (g) => g >= profile.targetRangeMmol[0] && g <= profile.targetRangeMmol[1]
  ).length;
  const belowRange = glucoseValues.filter((g) => g < profile.targetRangeMmol[0]).length;
  const aboveRange = glucoseValues.filter((g) => g > profile.targetRangeMmol[1]).length;

  const timeInRange = totalReadings > 0 ? Math.round((inRange / totalReadings) * 100) : 0;
  const timeBelowRange = totalReadings > 0 ? Math.round((belowRange / totalReadings) * 100) : 0;
  const timeAboveRange = totalReadings > 0 ? Math.round((aboveRange / totalReadings) * 100) : 0;

  const glucoseCV = calcCV(glucoseValues);
  const estimatedA1c = estimateA1c(meanGlucose);
  const gmi = calcGMI(meanGlucose);

  // Period days
  const startMs = new Date(data.startDate).getTime();
  const endMs = new Date(data.endDate).getTime();
  const daysIncluded = Math.max(1, Math.round((endMs - startMs) / 86_400_000));
  const readingsPerDay = Math.round((totalReadings / daysIncluded) * 10) / 10;

  // Insulin metrics
  const basalDoses = data.insulinDoses.filter((d) => d.type === "basal");
  const bolusDoses = data.insulinDoses.filter((d) => d.type === "bolus");
  const totalBasal = basalDoses.reduce((a, d) => a + d.units, 0);
  const totalBolus = bolusDoses.reduce((a, d) => a + d.units, 0);
  const totalInsulin = totalBasal + totalBolus;
  const tdd = daysIncluded > 0 ? Math.round((totalInsulin / daysIncluded) * 10) / 10 : 0;
  const basalPct = totalInsulin > 0 ? Math.round((totalBasal / totalInsulin) * 100) : 0;
  const bolusPct = totalInsulin > 0 ? Math.round((totalBolus / totalInsulin) * 100) : 0;
  const avgBolusPerMeal = bolusDoses.length > 0
    ? Math.round((totalBolus / bolusDoses.length) * 10) / 10
    : 0;

  const totalCarbs = data.meals.reduce((a, m) => a + m.carbsGrams, 0);
  const avgCarbsPerDay = daysIncluded > 0 ? Math.round(totalCarbs / daysIncluded) : 0;

  // Safety
  const hypoFreqPerWeek = daysIncluded > 0
    ? Math.round((data.hypoEvents / daysIncluded) * 7 * 10) / 10
    : 0;

  // Clinical flags
  const flags: ClinicianSummary["clinicalFlags"] = [];

  if (timeInRange < 70) {
    flags.push({
      flag: `Time in range ${timeInRange}% (target ≥70%)`,
      severity: timeInRange < 50 ? "critical" : "warning",
      recommendation: "Review basal/bolus split, carb counting accuracy, and meal timing.",
    });
  }

  if (timeBelowRange > 4) {
    flags.push({
      flag: `Time below range ${timeBelowRange}% (target <4%)`,
      severity: timeBelowRange > 10 ? "critical" : "warning",
      recommendation: "Reduce basal or bolus doses. Review hypo patterns by time of day.",
    });
  }

  if (glucoseCV > 36) {
    flags.push({
      flag: `Glucose variability CV ${glucoseCV}% (target ≤36%)`,
      severity: glucoseCV > 50 ? "critical" : "warning",
      recommendation: "High variability suggests inconsistent carb intake or insulin timing.",
    });
  }

  if (estimatedA1c > 7.0) {
    flags.push({
      flag: `Estimated A1c ${estimatedA1c}% (target ≤7.0%)`,
      severity: estimatedA1c > 9.0 ? "critical" : "warning",
      recommendation: "Consider intensifying insulin therapy or adding adjunct medication.",
    });
  }

  if (data.hypoEvents > 0 && hypoFreqPerWeek > 2) {
    flags.push({
      flag: `Frequent hypoglycemia: ${hypoFreqPerWeek}/week`,
      severity: "critical",
      recommendation: "Urgent review of insulin doses. Consider CGM if not already in use.",
    });
  }

  if (data.dkaEvents > 0) {
    flags.push({
      flag: `DKA events: ${data.dkaEvents} in period`,
      severity: "critical",
      recommendation: "Investigate missed insulin doses, sick-day management, and pump failures.",
    });
  }

  if (basalPct > 65) {
    flags.push({
      flag: `High basal percentage: ${basalPct}% (typical 40-60%)`,
      severity: "info",
      recommendation: "Consider whether patient is under-bolusing for meals.",
    });
  }

  if (readingsPerDay < 4 && totalReadings > 0) {
    flags.push({
      flag: `Low monitoring frequency: ${readingsPerDay} readings/day`,
      severity: "warning",
      recommendation: "Encourage more frequent glucose monitoring or CGM use.",
    });
  }

  // Action items
  const actionItems: string[] = [];
  flags
    .filter((f) => f.severity === "critical")
    .forEach((f) => actionItems.push(f.recommendation));

  if (actionItems.length === 0) {
    flags
      .filter((f) => f.severity === "warning")
      .forEach((f) => actionItems.push(f.recommendation));
  }

  if (actionItems.length === 0) {
    actionItems.push("Continue current management. Schedule routine follow-up.");
  }

  return {
    reportTitle: "GluMira™ Clinician Summary Report",
    generatedAt: new Date().toISOString(),
    patient: {
      name: profile.name,
      age: calcAge(profile.dateOfBirth),
      diabetesType: profile.diabetesType,
      yearsSinceDiagnosis: 2026 - profile.diagnosisYear,
      regimen: profile.insulinRegimen,
    },
    period: {
      startDate: data.startDate,
      endDate: data.endDate,
      daysIncluded,
    },
    glucoseMetrics: {
      meanGlucose,
      estimatedA1c,
      timeInRange,
      timeBelowRange,
      timeAboveRange,
      glucoseCV,
      gmi,
      readingsPerDay,
      totalReadings,
    },
    insulinMetrics: {
      totalDailyDose: tdd,
      basalPercentage: basalPct,
      bolusPercentage: bolusPct,
      avgBolusPerMeal,
      avgCarbsPerDay,
    },
    safetyEvents: {
      hypoEvents: data.hypoEvents,
      hyperEvents: data.hyperEvents,
      dkaEvents: data.dkaEvents,
      hospitalizations: data.hospitalizations,
      hypoFrequencyPerWeek: hypoFreqPerWeek,
    },
    clinicalFlags: flags,
    actionItems,
    disclaimer:
      "GluMira™ is an informational and educational tool only. It is NOT a medical device. " +
      "All clinical decisions should be made by qualified healthcare professionals based on " +
      "comprehensive patient assessment. Data accuracy depends on user input quality.",
  };
}
