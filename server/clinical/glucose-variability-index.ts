/**
 * GluMira™ — Glucose Variability Index Module
 *
 * Calculates comprehensive glucose variability metrics including
 * CV, MAGE, MODD, J-Index, and LBGI/HBGI risk indices.
 *
 * Clinical relevance:
 * - CV < 36% is the target for stable glucose
 * - MAGE measures amplitude of major excursions
 * - LBGI/HBGI predict hypo/hyper risk
 * - High variability is an independent risk factor for complications
 *
 * NOT a medical device. Educational purposes only.
 */

export interface GlucoseReading {
  timestampUtc: string;
  glucoseMmol: number;
}

export interface VariabilityMetrics {
  mean: number;
  sd: number;
  cv: number;                  // coefficient of variation (%)
  mage: number;                // mean amplitude of glycemic excursions
  modd: number;                // mean of daily differences
  jIndex: number;              // J-Index
  lbgi: number;                // low blood glucose index
  hbgi: number;                // high blood glucose index
  gri: number;                 // glycemic risk index
  iqr: number;                 // interquartile range
}

export interface VariabilityResult {
  metrics: VariabilityMetrics;
  readingCount: number;
  daysCovered: number;
  cvStatus: "excellent" | "good" | "target" | "above-target" | "high";
  overallStability: "very-stable" | "stable" | "moderate" | "unstable" | "very-unstable";
  hypoRiskLevel: "low" | "moderate" | "high";
  hyperRiskLevel: "low" | "moderate" | "high";
  interpretation: string[];
  recommendations: string[];
  disclaimer: string;
}

/* ── helpers ─────────────────────────────────────────────────── */

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

function sd(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((a, v) => a + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/* ── MAGE calculation ────────────────────────────────────────── */

function calculateMAGE(readings: number[], sdValue: number): number {
  if (readings.length < 3) return 0;

  // Find peaks and nadirs
  const excursions: number[] = [];
  let lastExtreme = readings[0];
  let direction: "up" | "down" | null = null;

  for (let i = 1; i < readings.length; i++) {
    const diff = readings[i] - lastExtreme;

    if (direction === null) {
      if (diff > sdValue) { direction = "up"; excursions.push(diff); lastExtreme = readings[i]; }
      else if (diff < -sdValue) { direction = "down"; excursions.push(Math.abs(diff)); lastExtreme = readings[i]; }
    } else if (direction === "up") {
      if (readings[i] > lastExtreme) { lastExtreme = readings[i]; }
      else if (lastExtreme - readings[i] > sdValue) {
        excursions.push(lastExtreme - readings[i]);
        lastExtreme = readings[i];
        direction = "down";
      }
    } else {
      if (readings[i] < lastExtreme) { lastExtreme = readings[i]; }
      else if (readings[i] - lastExtreme > sdValue) {
        excursions.push(readings[i] - lastExtreme);
        lastExtreme = readings[i];
        direction = "up";
      }
    }
  }

  return excursions.length > 0 ? Math.round(mean(excursions) * 10) / 10 : 0;
}

/* ── MODD calculation ────────────────────────────────────────── */

function calculateMODD(readings: GlucoseReading[]): number {
  if (readings.length < 48) return 0; // need at least 2 days of data

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestampUtc).getTime() - new Date(b.timestampUtc).getTime()
  );

  const diffs: number[] = [];
  const DAY_MS = 24 * 60 * 60 * 1000;

  for (let i = 0; i < sorted.length; i++) {
    const t1 = new Date(sorted[i].timestampUtc).getTime();
    // Find closest reading ~24h later
    let closestIdx = -1;
    let closestDiff = Infinity;
    for (let j = i + 1; j < sorted.length; j++) {
      const t2 = new Date(sorted[j].timestampUtc).getTime();
      const timeDiff = Math.abs(t2 - t1 - DAY_MS);
      if (timeDiff < closestDiff && timeDiff < 2 * 60 * 60 * 1000) { // within 2h of 24h
        closestDiff = timeDiff;
        closestIdx = j;
      }
    }
    if (closestIdx >= 0) {
      diffs.push(Math.abs(sorted[i].glucoseMmol - sorted[closestIdx].glucoseMmol));
    }
  }

  return diffs.length > 0 ? Math.round(mean(diffs) * 10) / 10 : 0;
}

/* ── LBGI / HBGI ─────────────────────────────────────────────── */

function bgTransform(glucoseMmol: number): number {
  const mgdl = glucoseMmol * 18.0182;
  return 1.509 * (Math.log(mgdl) ** 1.084 - 5.381);
}

function calculateLBGI(readings: number[]): number {
  if (readings.length === 0) return 0;
  const rl = readings.map((g) => {
    const f = bgTransform(g);
    return f < 0 ? 10 * f * f : 0;
  });
  return Math.round(mean(rl) * 10) / 10;
}

function calculateHBGI(readings: number[]): number {
  if (readings.length === 0) return 0;
  const rh = readings.map((g) => {
    const f = bgTransform(g);
    return f > 0 ? 10 * f * f : 0;
  });
  return Math.round(mean(rh) * 10) / 10;
}

/* ── Main function ───────────────────────────────────────────── */

export function calculateVariabilityIndex(readings: GlucoseReading[]): VariabilityResult {
  if (readings.length === 0) {
    return {
      metrics: { mean: 0, sd: 0, cv: 0, mage: 0, modd: 0, jIndex: 0, lbgi: 0, hbgi: 0, gri: 0, iqr: 0 },
      readingCount: 0,
      daysCovered: 0,
      cvStatus: "excellent",
      overallStability: "very-stable",
      hypoRiskLevel: "low",
      hyperRiskLevel: "low",
      interpretation: ["No readings provided."],
      recommendations: ["Upload CGM data to calculate variability metrics."],
      disclaimer: "GluMira™ is an educational platform. The science of insulin, made visible. ",
    };
  }

  const values = readings.map((r) => r.glucoseMmol);
  const sorted = [...values].sort((a, b) => a - b);

  const m = Math.round(mean(values) * 10) / 10;
  const s = Math.round(sd(values) * 10) / 10;
  const cv = m > 0 ? Math.round((s / m) * 100 * 10) / 10 : 0;
  const mage = calculateMAGE(values, s);
  const modd = calculateMODD(readings);
  const jIndex = Math.round(0.001 * (m + s) ** 2 * 1000) / 1000;
  const lbgi = calculateLBGI(values);
  const hbgi = calculateHBGI(values);
  const gri = Math.round(Math.min(100, (3.0 * lbgi + 1.6 * hbgi)) * 10) / 10;
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = Math.round((q3 - q1) * 10) / 10;

  // Days covered
  const timestamps = readings.map((r) => new Date(r.timestampUtc).getTime());
  const daysCovered = Math.max(1, Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / (24 * 60 * 60 * 1000)));

  // CV status
  let cvStatus: VariabilityResult["cvStatus"];
  if (cv <= 20) cvStatus = "excellent";
  else if (cv <= 30) cvStatus = "good";
  else if (cv <= 36) cvStatus = "target";
  else if (cv <= 45) cvStatus = "above-target";
  else cvStatus = "high";

  // Overall stability
  let overallStability: VariabilityResult["overallStability"];
  if (cv <= 20 && iqr <= 2.0) overallStability = "very-stable";
  else if (cv <= 36 && iqr <= 3.5) overallStability = "stable";
  else if (cv <= 45) overallStability = "moderate";
  else if (cv <= 55) overallStability = "unstable";
  else overallStability = "very-unstable";

  // Risk levels
  let hypoRiskLevel: VariabilityResult["hypoRiskLevel"] = "low";
  if (lbgi > 5.0) hypoRiskLevel = "high";
  else if (lbgi > 2.5) hypoRiskLevel = "moderate";

  let hyperRiskLevel: VariabilityResult["hyperRiskLevel"] = "low";
  if (hbgi > 9.0) hyperRiskLevel = "high";
  else if (hbgi > 4.5) hyperRiskLevel = "moderate";

  // Interpretation
  const interpretation: string[] = [];
  interpretation.push(`Mean glucose: ${m} mmol/L (${Math.round(m * 18)} mg/dL).`);
  interpretation.push(`CV: ${cv}% — ${cvStatus === "target" || cvStatus === "good" || cvStatus === "excellent" ? "within" : "above"} the recommended target of ≤36%.`);

  if (mage > 0) {
    interpretation.push(`MAGE: ${mage} mmol/L — ${mage > 4.0 ? "significant" : mage > 2.5 ? "moderate" : "low"} glycemic excursions.`);
  }

  if (lbgi > 2.5) {
    interpretation.push(`LBGI: ${lbgi} — elevated hypoglycemia risk.`);
  }
  if (hbgi > 4.5) {
    interpretation.push(`HBGI: ${hbgi} — elevated hyperglycemia risk.`);
  }

  // Recommendations
  const recommendations: string[] = [];
  if (cv > 36) {
    recommendations.push("CV is above 36% target. Focus on reducing glucose swings through consistent meal timing and carb counting.");
  }
  if (mage > 4.0) {
    recommendations.push("Large glucose excursions detected. Consider pre-bolusing and reviewing ICR settings.");
  }
  if (hypoRiskLevel !== "low") {
    recommendations.push("Elevated hypo risk. Review basal rates and correction factors with your team.");
  }
  if (hyperRiskLevel !== "low") {
    recommendations.push("Elevated hyper risk. Review meal boluses and consider tighter ICR.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Glucose variability is within target. Continue current management approach.");
  }

  return {
    metrics: { mean: m, sd: s, cv, mage, modd, jIndex, lbgi, hbgi, gri, iqr },
    readingCount: readings.length,
    daysCovered,
    cvStatus,
    overallStability,
    hypoRiskLevel,
    hyperRiskLevel,
    interpretation,
    recommendations,
    disclaimer:
      "GluMira™ is an educational platform. The science of insulin, made visible. " +
      "Discuss variability metrics with your healthcare team for clinical interpretation.",
  };
}
