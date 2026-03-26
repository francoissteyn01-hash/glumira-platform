/**
 * GluMira™ — A1C Estimator Module
 *
 * Estimates HbA1c from CGM average glucose using multiple validated
 * formulas (ADAG, Nathan, Rohlfing) and provides clinical context.
 *
 * Clinical relevance:
 * - A1C reflects ~3 month average glucose
 * - CGM-based eA1C correlates well with lab A1C
 * - GMI (Glucose Management Indicator) is the CGM-specific metric
 *
 * NOT a medical device. Educational purposes only.
 */

export interface A1CInput {
  readings: { timestampUtc: string; glucoseMmol: number }[];
  labA1C?: number;           // most recent lab A1C for comparison
  diabetesType: "type1" | "type2" | "gestational" | "other";
  targetA1C?: number;
}

export interface A1CEstimate {
  method: string;
  estimatedA1C: number;
  formula: string;
}

export interface A1CResult {
  meanGlucoseMmol: number;
  meanGlucoseMgdl: number;
  gmi: number;                     // Glucose Management Indicator
  estimates: A1CEstimate[];
  bestEstimate: number;
  daysCovered: number;
  readingCount: number;
  dataQuality: "excellent" | "good" | "fair" | "poor";
  targetA1C: number;
  onTarget: boolean;
  labComparison: string | null;
  riskCategory: "low" | "moderate" | "high" | "very-high";
  interpretation: string[];
  recommendations: string[];
  disclaimer: string;
}

/* ── Conversion helpers ──────────────────────────────────────── */

function mmolToMgdl(mmol: number): number {
  return Math.round(mmol * 18.0182);
}

/* ── A1C formulas ────────────────────────────────────────────── */

/** ADAG formula: A1C = (meanMgdl + 46.7) / 28.7 */
function adagA1C(meanMgdl: number): number {
  return Math.round(((meanMgdl + 46.7) / 28.7) * 10) / 10;
}

/** Nathan formula: A1C = (meanMgdl + 77.3) / 35.6 */
function nathanA1C(meanMgdl: number): number {
  return Math.round(((meanMgdl + 77.3) / 35.6) * 10) / 10;
}

/** GMI formula: GMI = 3.31 + 0.02392 × meanMgdl */
function gmiFormula(meanMgdl: number): number {
  return Math.round((3.31 + 0.02392 * meanMgdl) * 10) / 10;
}

/* ── Main function ───────────────────────────────────────────── */

export function estimateA1C(input: A1CInput): A1CResult {
  const { readings, labA1C, diabetesType, targetA1C: userTarget } = input;

  if (readings.length === 0) {
    return {
      meanGlucoseMmol: 0,
      meanGlucoseMgdl: 0,
      gmi: 0,
      estimates: [],
      bestEstimate: 0,
      daysCovered: 0,
      readingCount: 0,
      dataQuality: "poor",
      targetA1C: userTarget ?? 7.0,
      onTarget: false,
      labComparison: null,
      riskCategory: "low",
      interpretation: ["No readings provided."],
      recommendations: ["Upload CGM data to estimate A1C."],
      disclaimer: "GluMira™ is NOT a medical device.",
    };
  }

  // ── Mean glucose ──
  const values = readings.map((r) => r.glucoseMmol);
  const meanMmol = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const meanMgdl = mmolToMgdl(meanMmol);

  // ── Days covered ──
  const timestamps = readings.map((r) => new Date(r.timestampUtc).getTime());
  const daysCovered = Math.max(1, Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / (24 * 60 * 60 * 1000)));

  // ── Data quality ──
  const readingsPerDay = readings.length / daysCovered;
  let dataQuality: A1CResult["dataQuality"];
  if (daysCovered >= 14 && readingsPerDay >= 70) dataQuality = "excellent";
  else if (daysCovered >= 10 && readingsPerDay >= 50) dataQuality = "good";
  else if (daysCovered >= 7 && readingsPerDay >= 20) dataQuality = "fair";
  else dataQuality = "poor";

  // ── Estimates ──
  const gmi = gmiFormula(meanMgdl);
  const estimates: A1CEstimate[] = [
    { method: "GMI", estimatedA1C: gmi, formula: "GMI = 3.31 + 0.02392 × mean glucose (mg/dL)" },
    { method: "ADAG", estimatedA1C: adagA1C(meanMgdl), formula: "A1C = (mean glucose + 46.7) / 28.7" },
    { method: "Nathan", estimatedA1C: nathanA1C(meanMgdl), formula: "A1C = (mean glucose + 77.3) / 35.6" },
  ];

  const bestEstimate = gmi; // GMI is the preferred CGM-based metric

  // ── Target ──
  let targetA1C = userTarget ?? 7.0;
  if (diabetesType === "gestational") targetA1C = userTarget ?? 6.0;
  const onTarget = bestEstimate <= targetA1C;

  // ── Lab comparison ──
  let labComparison: string | null = null;
  if (labA1C !== undefined) {
    const diff = Math.round((bestEstimate - labA1C) * 10) / 10;
    if (Math.abs(diff) <= 0.3) {
      labComparison = `GMI (${bestEstimate}%) closely matches your lab A1C (${labA1C}%).`;
    } else if (diff > 0) {
      labComparison = `GMI (${bestEstimate}%) is ${diff}% higher than your lab A1C (${labA1C}%). This may indicate recent glucose improvement not yet reflected in lab A1C.`;
    } else {
      labComparison = `GMI (${bestEstimate}%) is ${Math.abs(diff)}% lower than your lab A1C (${labA1C}%). CGM data may not capture all glucose patterns.`;
    }
  }

  // ── Risk category ──
  let riskCategory: A1CResult["riskCategory"];
  if (bestEstimate <= 6.5) riskCategory = "low";
  else if (bestEstimate <= 7.5) riskCategory = "moderate";
  else if (bestEstimate <= 9.0) riskCategory = "high";
  else riskCategory = "very-high";

  // ── Interpretation ──
  const interpretation: string[] = [];
  interpretation.push(`Mean glucose: ${meanMmol} mmol/L (${meanMgdl} mg/dL) over ${daysCovered} days.`);
  interpretation.push(`GMI: ${gmi}% — ${onTarget ? "within" : "above"} your target of ${targetA1C}%.`);

  if (dataQuality === "poor") {
    interpretation.push("Data quality is limited. More CGM data would improve accuracy.");
  }

  // ── Recommendations ──
  const recommendations: string[] = [];
  if (!onTarget) {
    const gap = Math.round((bestEstimate - targetA1C) * 10) / 10;
    recommendations.push(`GMI is ${gap}% above target. Focus on reducing post-meal spikes and overnight highs.`);
  }
  if (bestEstimate > 8.0) {
    recommendations.push("Consider reviewing insulin doses and carb ratios with your healthcare team.");
  }
  if (dataQuality === "poor" || dataQuality === "fair") {
    recommendations.push("Wear CGM for at least 14 days for a more reliable estimate.");
  }
  if (onTarget && dataQuality !== "poor") {
    recommendations.push("Great work! Your estimated A1C is within target. Continue current management.");
  }

  return {
    meanGlucoseMmol: meanMmol,
    meanGlucoseMgdl: meanMgdl,
    gmi,
    estimates,
    bestEstimate,
    daysCovered,
    readingCount: readings.length,
    dataQuality,
    targetA1C,
    onTarget,
    labComparison,
    riskCategory,
    interpretation,
    recommendations,
    disclaimer:
      "GluMira™ is an informational and educational tool only. It is NOT a medical device. " +
      "GMI is an estimate and may differ from lab-measured HbA1c.",
  };
}
