/**
 * GluMira™ V7 — server/analytics/hypo-risk.ts
 * Hypoglycaemia risk assessment stub.
 * GluMira™ is an educational platform, not a medical device.
 */
export interface HypoRiskResult {
  riskLevel: "low" | "moderate" | "high";
  hypoCount: number;
  percentBelow: number;
  recommendations: string[];
}

export function assessHypoRisk(readings: Array<{ glucose: number; timestamp: string }>): HypoRiskResult {
  const values = readings.map((r) => r.glucose);
  const below = values.filter((v) => v < 3.9);
  const pct = values.length ? (below.length / values.length) * 100 : 0;
  const level = pct > 10 ? "high" : pct > 4 ? "moderate" : "low";
  return {
    riskLevel: level,
    hypoCount: below.length,
    percentBelow: Math.round(pct * 10) / 10,
    recommendations: level !== "low" ? ["Discuss hypo patterns with your care team."] : [],
  };
}
