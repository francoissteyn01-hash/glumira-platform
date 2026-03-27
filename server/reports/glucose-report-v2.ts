/**
 * GluMira™ — Enhanced Glucose Report Generator (V2)
 *
 * Generates patient-facing glucose reports with plain-language summaries,
 * daily breakdowns, meal-tag analysis, trend segments, and encouragement.
 *
 * Complements the existing glucose-report.ts (clinician-facing) with a
 * patient-friendly format.
 *
 * NOT a medical device. Educational purposes only.
 */

export interface TaggedReading {
  timestampUtc: string;
  glucoseMmol: number;
  mealTag?: "pre-meal" | "post-meal" | "fasting" | "bedtime" | "none";
}

export interface PatientReportInput {
  readings: TaggedReading[];
  targetLow: number;
  targetHigh: number;
  periodLabel?: string;
}

export interface DailyBreakdown {
  date: string;
  readingCount: number;
  mean: number;
  min: number;
  max: number;
  timeInRange: number;
}

export interface MealTagAnalysis {
  tag: string;
  count: number;
  mean: number;
  cv: number;
  inRangePercent: number;
}

export interface TrendSegment {
  label: string;
  direction: "improving" | "worsening" | "stable";
  meanGlucose: number;
  tir: number;
}

export interface PatientGlucoseReport {
  title: string;
  periodLabel: string;
  generatedAt: string;
  summary: {
    totalReadings: number;
    daysWithData: number;
    readingsPerDay: number;
    meanGlucose: number;
    medianGlucose: number;
    stdDev: number;
    cv: number;
    min: number;
    max: number;
    timeInRange: number;
    timeBelowRange: number;
    timeAboveRange: number;
    estimatedA1c: number;
  };
  dailyBreakdown: DailyBreakdown[];
  mealTagAnalysis: MealTagAnalysis[];
  trendAnalysis: TrendSegment[];
  insights: string[];
  encouragement: string;
  disclaimer: string;
}

/* ── helpers ─────────────────────────────────────────────────── */

function medianVal(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDevVal(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

function cvVal(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  if (m === 0) return 0;
  return Math.round((stdDevVal(arr) / m) * 100 * 10) / 10;
}

function estA1c(meanMmol: number): number {
  const mgdl = meanMmol * 18.018;
  return Math.round(((mgdl + 46.7) / 28.7) * 10) / 10;
}

function dateStr(ts: string): string {
  return ts.slice(0, 10);
}

/* ── main generator ──────────────────────────────────────────── */

export function generatePatientReport(input: PatientReportInput): PatientGlucoseReport {
  const { readings, targetLow, targetHigh } = input;
  const values = readings.map((r) => r.glucoseMmol);
  const totalReadings = values.length;

  const meanGlucose = totalReadings > 0
    ? Math.round((values.reduce((a, b) => a + b, 0) / totalReadings) * 10) / 10
    : 0;
  const medianGlucose = Math.round(medianVal(values) * 10) / 10;
  const sd = stdDevVal(values);
  const glucoseCV = cvVal(values);
  const minG = totalReadings > 0 ? Math.round(Math.min(...values) * 10) / 10 : 0;
  const maxG = totalReadings > 0 ? Math.round(Math.max(...values) * 10) / 10 : 0;

  const inRange = values.filter((g) => g >= targetLow && g <= targetHigh).length;
  const belowRange = values.filter((g) => g < targetLow).length;
  const aboveRange = values.filter((g) => g > targetHigh).length;

  const tir = totalReadings > 0 ? Math.round((inRange / totalReadings) * 100) : 0;
  const tbr = totalReadings > 0 ? Math.round((belowRange / totalReadings) * 100) : 0;
  const tar = totalReadings > 0 ? Math.round((aboveRange / totalReadings) * 100) : 0;

  // Daily breakdown
  const byDate = new Map<string, number[]>();
  readings.forEach((r) => {
    const d = dateStr(r.timestampUtc);
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(r.glucoseMmol);
  });

  const dailyBreakdown: DailyBreakdown[] = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      readingCount: vals.length,
      mean: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
      min: Math.round(Math.min(...vals) * 10) / 10,
      max: Math.round(Math.max(...vals) * 10) / 10,
      timeInRange: Math.round(
        (vals.filter((g) => g >= targetLow && g <= targetHigh).length / vals.length) * 100
      ),
    }));

  const daysWithData = dailyBreakdown.length;
  const readingsPerDay = daysWithData > 0
    ? Math.round((totalReadings / daysWithData) * 10) / 10
    : 0;

  // Meal tag analysis
  const byTag = new Map<string, number[]>();
  readings.forEach((r) => {
    const tag = r.mealTag ?? "none";
    if (!byTag.has(tag)) byTag.set(tag, []);
    byTag.get(tag)!.push(r.glucoseMmol);
  });

  const mealTagAnalysis: MealTagAnalysis[] = [...byTag.entries()]
    .filter(([tag]) => tag !== "none")
    .map(([tag, vals]) => ({
      tag,
      count: vals.length,
      mean: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
      cv: cvVal(vals),
      inRangePercent: Math.round(
        (vals.filter((g) => g >= targetLow && g <= targetHigh).length / vals.length) * 100
      ),
    }));

  // Trend analysis
  const trendAnalysis: TrendSegment[] = [];
  if (dailyBreakdown.length >= 4) {
    const mid = Math.floor(dailyBreakdown.length / 2);
    const firstHalf = dailyBreakdown.slice(0, mid);
    const secondHalf = dailyBreakdown.slice(mid);

    const firstMean = firstHalf.reduce((a, d) => a + d.mean, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, d) => a + d.mean, 0) / secondHalf.length;
    const firstTIR = firstHalf.reduce((a, d) => a + d.timeInRange, 0) / firstHalf.length;
    const secondTIR = secondHalf.reduce((a, d) => a + d.timeInRange, 0) / secondHalf.length;

    const diff = secondMean - firstMean;
    const tirDiff = secondTIR - firstTIR;

    let direction: "improving" | "worsening" | "stable" = "stable";
    if (tirDiff > 5 || diff < -0.5) direction = "improving";
    else if (tirDiff < -5 || diff > 0.5) direction = "worsening";

    trendAnalysis.push({
      label: `${firstHalf[0].date} to ${firstHalf[firstHalf.length - 1].date}`,
      direction: "stable",
      meanGlucose: Math.round(firstMean * 10) / 10,
      tir: Math.round(firstTIR),
    });
    trendAnalysis.push({
      label: `${secondHalf[0].date} to ${secondHalf[secondHalf.length - 1].date}`,
      direction,
      meanGlucose: Math.round(secondMean * 10) / 10,
      tir: Math.round(secondTIR),
    });
  }

  // Insights
  const insights: string[] = [];
  if (tir >= 70) {
    insights.push(`Your time in range is ${tir}% — this meets the recommended target of 70% or more. Well done!`);
  } else if (tir >= 50) {
    insights.push(`Your time in range is ${tir}%. The target is 70% — you're making progress.`);
  } else {
    insights.push(`Your time in range is ${tir}%. Working towards 70% will help reduce long-term complications.`);
  }

  if (tbr > 4) {
    insights.push(`${tbr}% of readings were below target — this means too many lows. Discuss with your team.`);
  }
  if (tar > 25) {
    insights.push(`${tar}% of readings were above target. Focus on pre-meal bolus timing and carb estimation.`);
  }
  if (glucoseCV > 36) {
    insights.push(`Your glucose variability (CV ${glucoseCV}%) is above the 36% target. More consistent meal timing and carb intake can help.`);
  }

  const postMeal = mealTagAnalysis.find((m) => m.tag === "post-meal");
  if (postMeal && postMeal.mean > targetHigh) {
    insights.push(`Post-meal readings average ${postMeal.mean} mmol/L — consider bolusing 10-15 minutes earlier.`);
  }

  const fasting = mealTagAnalysis.find((m) => m.tag === "fasting");
  if (fasting && fasting.mean > 7.0) {
    insights.push(`Fasting glucose averages ${fasting.mean} mmol/L — basal insulin may need adjustment.`);
  }

  if (trendAnalysis.length >= 2) {
    const latest = trendAnalysis[trendAnalysis.length - 1];
    if (latest.direction === "improving") {
      insights.push("Your glucose trend is improving — keep up the great work!");
    } else if (latest.direction === "worsening") {
      insights.push("Your glucose trend has worsened recently. Review any changes in routine, diet, or stress.");
    }
  }

  // Encouragement
  let encouragement = "Every reading is valuable data. Keep monitoring and learning!";
  if (tir >= 80) encouragement = "Outstanding glucose management! Your dedication is paying off.";
  else if (tir >= 70) encouragement = "Great job staying in range! Small improvements can make a big difference.";
  else if (tir >= 50) encouragement = "You're on the right track. Each day is a new opportunity to improve.";

  return {
    title: "GluMira™ Glucose Report",
    periodLabel: input.periodLabel ?? `${dailyBreakdown[0]?.date ?? "N/A"} to ${dailyBreakdown[dailyBreakdown.length - 1]?.date ?? "N/A"}`,
    generatedAt: new Date().toISOString(),
    summary: {
      totalReadings,
      daysWithData,
      readingsPerDay,
      meanGlucose,
      medianGlucose,
      stdDev: sd,
      cv: glucoseCV,
      min: minG,
      max: maxG,
      timeInRange: tir,
      timeBelowRange: tbr,
      timeAboveRange: tar,
      estimatedA1c: estA1c(meanGlucose),
    },
    dailyBreakdown,
    mealTagAnalysis,
    trendAnalysis,
    insights,
    encouragement,
    disclaimer:
      "GluMira™ is an educational platform. The science of insulin, made visible. " +
      "Always consult your healthcare team for medical decisions.",
  };
}
