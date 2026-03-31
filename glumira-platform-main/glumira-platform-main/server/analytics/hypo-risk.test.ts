/**
 * GluMira™ — hypo-risk.test.ts
 *
 * Unit tests for the hypoglycaemia risk scoring module.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  computeLbgi,
  computeHypoFrequency,
  computeNocturnalHypoPercent,
  computeIobContributionScore,
  computeCompositeHypoRisk,
  hypoRiskTier,
  hypoRiskTierLabel,
  generateHypoRecommendations,
  assessHypoRisk,
} from "./hypo-risk";

// ─── computeLbgi ──────────────────────────────────────────────────────────────

describe("computeLbgi", () => {
  it("returns 0 for empty readings", () => {
    expect(computeLbgi([])).toBe(0);
  });

  it("returns near-zero LBGI for in-range readings", () => {
    // Kovatchev formula can produce small positive values near 5 mmol/L;
    // in-range readings (5–8) should yield LBGI < 1
    const readings = [5.0, 6.0, 7.0, 8.0];
    expect(computeLbgi(readings)).toBeLessThan(1);
  });

  it("returns positive LBGI for hypoglycaemic readings", () => {
    const readings = [2.5, 3.0, 3.5, 6.0];
    expect(computeLbgi(readings)).toBeGreaterThan(0);
  });

  it("higher LBGI for lower glucose readings", () => {
    const low = computeLbgi([2.0, 2.5, 3.0]);
    const high = computeLbgi([3.5, 3.8, 3.9]);
    expect(low).toBeGreaterThan(high);
  });
});

// ─── computeHypoFrequency ─────────────────────────────────────────────────────

describe("computeHypoFrequency", () => {
  it("returns 0 when no hypo readings", () => {
    expect(computeHypoFrequency([5.0, 6.0, 7.0], 7)).toBe(0);
  });

  it("counts readings < 3.9 as hypo events", () => {
    const readings = [3.5, 3.8, 5.0, 6.0, 3.2]; // 3 hypo out of 5
    const freq = computeHypoFrequency(readings, 7);
    expect(freq).toBeCloseTo(3 / 7, 2);
  });

  it("does not count 3.9 as hypo", () => {
    expect(computeHypoFrequency([3.9, 4.0, 5.0], 7)).toBe(0);
  });
});

// ─── computeNocturnalHypoPercent ──────────────────────────────────────────────

describe("computeNocturnalHypoPercent", () => {
  it("returns 0 for empty nocturnal readings", () => {
    expect(computeNocturnalHypoPercent([])).toBe(0);
  });

  it("returns 0 when no nocturnal hypo", () => {
    expect(computeNocturnalHypoPercent([5.0, 6.0, 7.0])).toBe(0);
  });

  it("computes percent correctly", () => {
    const readings = [3.5, 6.0, 7.0, 3.8]; // 2 hypo out of 4
    expect(computeNocturnalHypoPercent(readings)).toBe(50.0);
  });
});

// ─── computeIobContributionScore ─────────────────────────────────────────────

describe("computeIobContributionScore", () => {
  it("returns 0 for empty IOB array", () => {
    expect(computeIobContributionScore([])).toBe(0);
  });

  it("returns 0 for zero IOB", () => {
    expect(computeIobContributionScore([0, 0, 0])).toBe(0);
  });

  it("returns 10 for very high IOB (>= 5U)", () => {
    expect(computeIobContributionScore([5.0, 6.0, 7.0])).toBe(10);
  });

  it("returns proportional score for moderate IOB", () => {
    const score = computeIobContributionScore([2.5]);
    expect(score).toBeCloseTo(5, 0);
  });
});

// ─── computeCompositeHypoRisk ─────────────────────────────────────────────────

describe("computeCompositeHypoRisk", () => {
  it("returns 0 for all-zero inputs", () => {
    expect(computeCompositeHypoRisk(0, 0, 0, 0)).toBe(0);
  });

  it("returns high score for severe inputs", () => {
    const score = computeCompositeHypoRisk(20, 3, 20, 10);
    expect(score).toBeGreaterThan(70);
  });

  it("score is between 0 and 100", () => {
    const score = computeCompositeHypoRisk(5, 0.5, 5, 3);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ─── hypoRiskTier ─────────────────────────────────────────────────────────────

describe("hypoRiskTier", () => {
  it("returns low for score < 20", () => {
    expect(hypoRiskTier(10)).toBe("low");
  });
  it("returns moderate for score 20–44", () => {
    expect(hypoRiskTier(30)).toBe("moderate");
  });
  it("returns high for score 45–69", () => {
    expect(hypoRiskTier(55)).toBe("high");
  });
  it("returns very-high for score >= 70", () => {
    expect(hypoRiskTier(75)).toBe("very-high");
  });
});

// ─── hypoRiskTierLabel ────────────────────────────────────────────────────────

describe("hypoRiskTierLabel", () => {
  it("labels low correctly", () => {
    expect(hypoRiskTierLabel("low")).toBe("Low Risk");
  });
  it("labels moderate correctly", () => {
    expect(hypoRiskTierLabel("moderate")).toBe("Moderate Risk");
  });
  it("labels high correctly", () => {
    expect(hypoRiskTierLabel("high")).toBe("High Risk");
  });
  it("labels very-high correctly", () => {
    expect(hypoRiskTierLabel("very-high")).toBe("Very High Risk");
  });
});

// ─── generateHypoRecommendations ─────────────────────────────────────────────

describe("generateHypoRecommendations", () => {
  it("returns at least one recommendation", () => {
    const recs = generateHypoRecommendations("low", 0, 0, 0);
    expect(recs.length).toBeGreaterThan(0);
  });

  it("recommends basal review for high risk", () => {
    const recs = generateHypoRecommendations("high", 10, 0, 0);
    expect(recs.some((r) => r.toLowerCase().includes("basal"))).toBe(true);
  });

  it("recommends bedtime snack for nocturnal hypo > 5%", () => {
    const recs = generateHypoRecommendations("moderate", 2, 10, 0.5);
    expect(recs.some((r) => r.toLowerCase().includes("nocturnal"))).toBe(true);
  });

  it("recommends carb ratio check for frequent hypo", () => {
    const recs = generateHypoRecommendations("moderate", 2, 0, 2);
    expect(recs.some((r) => r.toLowerCase().includes("carb ratio"))).toBe(true);
  });
});

// ─── assessHypoRisk ───────────────────────────────────────────────────────────

describe("assessHypoRisk", () => {
  it("returns a full HypoRiskResult", () => {
    const result = assessHypoRisk({
      readings: Array.from({ length: 100 }, (_, i) => (i % 10 === 0 ? 3.5 : 6.5)),
      nocturnalReadings: [6.0, 6.5, 3.8, 7.0],
      iobAtHypo: [1.5, 2.0],
      dayCount: 14,
    });

    expect(result.lbgi).toBeGreaterThanOrEqual(0);
    expect(result.hypoFrequencyPerDay).toBeGreaterThan(0);
    expect(result.compositeScore).toBeGreaterThanOrEqual(0);
    expect(result.compositeScore).toBeLessThanOrEqual(100);
    expect(["low", "moderate", "high", "very-high"]).toContain(result.tier);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("returns low risk for all in-range readings", () => {
    const result = assessHypoRisk({
      readings: Array.from({ length: 100 }, () => 6.5),
      nocturnalReadings: Array.from({ length: 20 }, () => 6.5),
      dayCount: 14,
    });
    expect(result.tier).toBe("low");
    expect(result.compositeScore).toBe(0);
  });

  it("uses default dayCount of 14", () => {
    const result = assessHypoRisk({
      readings: [3.5, 3.8, 6.0],
      nocturnalReadings: [],
    });
    expect(result.hypoFrequencyPerDay).toBeCloseTo(2 / 14, 2);
  });
});
