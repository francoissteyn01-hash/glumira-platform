/**
 * GluMira™ — hypo-risk.ts
 *
 * Hypoglycaemia risk scoring module.
 * Computes a composite hypo risk score from glucose readings, IOB, and meal data.
 * Supports: LBGI, hypo frequency, nocturnal hypo rate, and composite risk tier.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type HypoRiskTier = "low" | "moderate" | "high" | "very-high";

export interface HypoRiskInput {
  readings: number[];           // glucose readings in mmol/L
  nocturnalReadings: number[];  // subset of readings taken 22:00–06:00
  iobAtHypo?: number[];         // IOB (units) at time of each hypo event
  dayCount?: number;            // number of days covered (default 14)
}

export interface HypoRiskResult {
  lbgi: number;                 // Low Blood Glucose Index
  hypoFrequencyPerDay: number;  // hypo events per day (< 3.9 mmol/L)
  nocturnalHypoPercent: number; // % of nocturnal readings < 3.9
  iobContributionScore: number; // 0–10 — elevated IOB contribution
  compositeScore: number;       // 0–100
  tier: HypoRiskTier;
  tierLabel: string;
  recommendations: string[];
}

// ─── LBGI Computation ─────────────────────────────────────────────────────────

/**
 * Low Blood Glucose Index (LBGI) — Kovatchev formula.
 * Readings in mmol/L.
 */
export function computeLbgi(readings: number[]): number {
  if (readings.length === 0) return 0;

  const f = (bg: number) => {
    // Convert to mg/dL for the standard formula
    const bgMg = bg * 18.018;
    const transformed = 1.509 * (Math.log(bgMg) ** 1.084 - 5.381);
    return transformed < 0 ? 10 * transformed ** 2 : 0;
  };

  const sum = readings.reduce((acc, r) => acc + f(r), 0);
  return Math.round((sum / readings.length) * 100) / 100;
}

// ─── Hypo Frequency ───────────────────────────────────────────────────────────

export function computeHypoFrequency(readings: number[], dayCount = 14): number {
  const hypoCount = readings.filter((r) => r < 3.9).length;
  return Math.round((hypoCount / dayCount) * 100) / 100;
}

// ─── Nocturnal Hypo Rate ──────────────────────────────────────────────────────

export function computeNocturnalHypoPercent(nocturnalReadings: number[]): number {
  if (nocturnalReadings.length === 0) return 0;
  const hypo = nocturnalReadings.filter((r) => r < 3.9).length;
  return Math.round((hypo / nocturnalReadings.length) * 100 * 10) / 10;
}

// ─── IOB Contribution Score ───────────────────────────────────────────────────

export function computeIobContributionScore(iobAtHypo: number[]): number {
  if (iobAtHypo.length === 0) return 0;
  const meanIob = iobAtHypo.reduce((a, b) => a + b, 0) / iobAtHypo.length;
  // Score 0–10: 0 = no IOB, 10 = very high IOB (>= 5U)
  return Math.min(10, Math.round((meanIob / 5) * 10 * 10) / 10);
}

// ─── Composite Risk Score ─────────────────────────────────────────────────────

export function computeCompositeHypoRisk(
  lbgi: number,
  hypoFreqPerDay: number,
  nocturnalHypoPercent: number,
  iobScore: number
): number {
  // Weighted composite:
  // LBGI (max ~20 → 40 pts), hypo freq (max 3/day → 25 pts),
  // nocturnal (max 20% → 25 pts), IOB (max 10 → 10 pts)
  const lbgiScore = Math.min(40, (lbgi / 20) * 40);
  const freqScore = Math.min(25, (hypoFreqPerDay / 3) * 25);
  const noctScore = Math.min(25, (nocturnalHypoPercent / 20) * 25);
  const iobContrib = Math.min(10, iobScore);

  return Math.round(lbgiScore + freqScore + noctScore + iobContrib);
}

// ─── Risk Tier ────────────────────────────────────────────────────────────────

export function hypoRiskTier(score: number): HypoRiskTier {
  if (score >= 70) return "very-high";
  if (score >= 45) return "high";
  if (score >= 20) return "moderate";
  return "low";
}

export function hypoRiskTierLabel(tier: HypoRiskTier): string {
  switch (tier) {
    case "very-high": return "Very High Risk";
    case "high":      return "High Risk";
    case "moderate":  return "Moderate Risk";
    default:          return "Low Risk";
  }
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export function generateHypoRecommendations(
  tier: HypoRiskTier,
  lbgi: number,
  nocturnalHypoPercent: number,
  hypoFreqPerDay: number
): string[] {
  const recs: string[] = [];

  if (tier === "very-high" || tier === "high") {
    recs.push("Review basal insulin dose with your diabetes care team");
  }

  if (nocturnalHypoPercent > 5) {
    recs.push("Consider a bedtime snack or basal reduction to address nocturnal hypoglycaemia");
  }

  if (hypoFreqPerDay > 1) {
    recs.push("Frequent hypoglycaemia detected — check carb ratio and correction factor accuracy");
  }

  if (lbgi > 5) {
    recs.push("LBGI is elevated — consider increasing glucose target range");
  }

  if (recs.length === 0) {
    recs.push("Hypo risk is within acceptable range — continue current management");
  }

  return recs;
}

// ─── Full Risk Assessment ─────────────────────────────────────────────────────

export function assessHypoRisk(input: HypoRiskInput): HypoRiskResult {
  const { readings, nocturnalReadings, iobAtHypo = [], dayCount = 14 } = input;

  const lbgi = computeLbgi(readings);
  const hypoFrequencyPerDay = computeHypoFrequency(readings, dayCount);
  const nocturnalHypoPercent = computeNocturnalHypoPercent(nocturnalReadings);
  const iobContributionScore = computeIobContributionScore(iobAtHypo);

  const compositeScore = computeCompositeHypoRisk(
    lbgi,
    hypoFrequencyPerDay,
    nocturnalHypoPercent,
    iobContributionScore
  );

  const tier = hypoRiskTier(compositeScore);
  const tierLabel = hypoRiskTierLabel(tier);
  const recommendations = generateHypoRecommendations(
    tier,
    lbgi,
    nocturnalHypoPercent,
    hypoFrequencyPerDay
  );

  return {
    lbgi,
    hypoFrequencyPerDay,
    nocturnalHypoPercent,
    iobContributionScore,
    compositeScore,
    tier,
    tierLabel,
    recommendations,
  };
}
