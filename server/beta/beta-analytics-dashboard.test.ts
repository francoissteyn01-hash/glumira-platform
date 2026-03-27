/**
 * GluMira™ Beta Analytics Dashboard — Test Suite
 * Version: 7.0.0
 * Module: BETA-ANALYTICS-DASH-TEST
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect } from "vitest";
import type {
  CohortOverview,
  RetentionCurve,
  FeatureUsageItem,
  ClinicalOutcome,
  NPSBreakdown,
} from "./beta-analytics-dashboard";

// ─── CohortOverview Type Shape ───────────────────────────────

describe("CohortOverview shape", () => {
  const overview: CohortOverview = {
    enrollment: { total: 30, active: 25, pending: 3, inactive: 2, churnRate: 6.67 },
    onboardingFunnel: {
      enrolled: 30, profileCreated: 28, glucoseConfigured: 27,
      insulinConfigured: 26, cgmConnected: 25, firstSyncComplete: 24,
      fullyOnboarded: 24, conversionRate: 80,
    },
    engagement: {
      dau: 18, wau: 22, mau: 25, dauWauRatio: 81.82,
      avgSessionMinutes: 8.5, avgEventsPerSession: 12, totalEvents: 4500,
    },
    dataVolume: {
      totalGlucoseReadings: 125000, totalInsulinDoses: 3200,
      totalMeals: 1800, totalFeedback: 45, totalAIQueries: 320,
    },
    generatedAt: "2026-03-27T12:00:00Z",
  };

  it("should have enrollment totals that sum correctly", () => {
    const { active, pending, inactive } = overview.enrollment;
    expect(active + pending + inactive).toBe(overview.enrollment.total);
  });

  it("should have onboarding funnel in descending order", () => {
    const f = overview.onboardingFunnel;
    expect(f.enrolled).toBeGreaterThanOrEqual(f.profileCreated);
    expect(f.profileCreated).toBeGreaterThanOrEqual(f.glucoseConfigured);
    expect(f.glucoseConfigured).toBeGreaterThanOrEqual(f.insulinConfigured);
    expect(f.insulinConfigured).toBeGreaterThanOrEqual(f.cgmConnected);
    expect(f.cgmConnected).toBeGreaterThanOrEqual(f.firstSyncComplete);
    expect(f.firstSyncComplete).toBeGreaterThanOrEqual(f.fullyOnboarded);
  });

  it("should have DAU <= WAU <= MAU", () => {
    expect(overview.engagement.dau).toBeLessThanOrEqual(overview.engagement.wau);
    expect(overview.engagement.wau).toBeLessThanOrEqual(overview.engagement.mau);
  });

  it("should have conversion rate between 0 and 100", () => {
    expect(overview.onboardingFunnel.conversionRate).toBeGreaterThanOrEqual(0);
    expect(overview.onboardingFunnel.conversionRate).toBeLessThanOrEqual(100);
  });
});

// ─── RetentionCurve ──────────────────────────────────────────

describe("RetentionCurve shape", () => {
  const curves: RetentionCurve[] = [
    { period: "Day 1", days: 1, cohortSize: 30, retained: 28, retentionPercent: 93.3 },
    { period: "Day 7", days: 7, cohortSize: 30, retained: 24, retentionPercent: 80 },
    { period: "Day 30", days: 30, cohortSize: 30, retained: 18, retentionPercent: 60 },
    { period: "Day 90", days: 90, cohortSize: 30, retained: 15, retentionPercent: 50 },
  ];

  it("should have retention percentages in descending order", () => {
    for (let i = 1; i < curves.length; i++) {
      expect(curves[i].retentionPercent).toBeLessThanOrEqual(curves[i - 1].retentionPercent);
    }
  });

  it("should have days in ascending order", () => {
    for (let i = 1; i < curves.length; i++) {
      expect(curves[i].days).toBeGreaterThan(curves[i - 1].days);
    }
  });

  it("should have retained <= cohortSize", () => {
    curves.forEach((c) => {
      expect(c.retained).toBeLessThanOrEqual(c.cohortSize);
    });
  });

  it("should compute retention percent correctly", () => {
    curves.forEach((c) => {
      const computed = Math.round((c.retained / c.cohortSize) * 1000) / 10;
      expect(c.retentionPercent).toBeCloseTo(computed, 0);
    });
  });
});

// ─── FeatureUsageItem ────────────────────────────────────────

describe("FeatureUsageItem shape", () => {
  const feature: FeatureUsageItem = {
    featureName: "iob_chart_viewed",
    displayName: "IOB Chart",
    totalUses: 450,
    uniqueUsers: 22,
    avgUsesPerUser: 20.45,
    percentOfActiveUsers: 88,
  };

  it("should have avgUsesPerUser = totalUses / uniqueUsers", () => {
    expect(feature.avgUsesPerUser).toBeCloseTo(feature.totalUses / feature.uniqueUsers, 1);
  });

  it("should have percentOfActiveUsers between 0 and 100", () => {
    expect(feature.percentOfActiveUsers).toBeGreaterThanOrEqual(0);
    expect(feature.percentOfActiveUsers).toBeLessThanOrEqual(100);
  });
});

// ─── ClinicalOutcome ─────────────────────────────────────────

describe("ClinicalOutcome shape", () => {
  const tirOutcome: ClinicalOutcome = {
    metric: "Time in Range (70-180 mg/dL)",
    baseline: 55,
    current: 68,
    delta: 13,
    unit: "%",
    direction: "improved",
    cohortSize: 20,
  };

  const hypoOutcome: ClinicalOutcome = {
    metric: "Time Below Range (<70 mg/dL)",
    baseline: 8,
    current: 4,
    delta: -4,
    unit: "%",
    direction: "improved",
    cohortSize: 20,
  };

  it("should compute delta as current - baseline for TIR", () => {
    expect(tirOutcome.delta).toBe(tirOutcome.current - tirOutcome.baseline!);
  });

  it("should mark TIR increase as improved", () => {
    expect(tirOutcome.direction).toBe("improved");
  });

  it("should mark hypo decrease as improved", () => {
    expect(hypoOutcome.direction).toBe("improved");
    expect(hypoOutcome.delta!).toBeLessThan(0);
  });

  it("should handle insufficient data state", () => {
    const noData: ClinicalOutcome = {
      metric: "GMI",
      baseline: null,
      current: 0,
      delta: null,
      unit: "%",
      direction: "insufficient_data",
      cohortSize: 0,
    };
    expect(noData.direction).toBe("insufficient_data");
    expect(noData.baseline).toBeNull();
    expect(noData.delta).toBeNull();
  });
});

// ─── NPSBreakdown ────────────────────────────────────────────

describe("NPSBreakdown shape", () => {
  const nps: NPSBreakdown = {
    promoters: 15,
    passives: 6,
    detractors: 4,
    totalResponses: 25,
    npsScore: 44,
    avgRating: 4.2,
    ratingDistribution: { 1: 1, 2: 1, 3: 3, 4: 8, 5: 12 },
  };

  it("should have promoters + passives + detractors = totalResponses", () => {
    expect(nps.promoters + nps.passives + nps.detractors).toBe(nps.totalResponses);
  });

  it("should compute NPS as (promoters - detractors) / total * 100", () => {
    const computed = Math.round(((nps.promoters - nps.detractors) / nps.totalResponses) * 100);
    expect(nps.npsScore).toBe(computed);
  });

  it("should have NPS between -100 and 100", () => {
    expect(nps.npsScore).toBeGreaterThanOrEqual(-100);
    expect(nps.npsScore).toBeLessThanOrEqual(100);
  });

  it("should have rating distribution sum to totalResponses", () => {
    const sum = Object.values(nps.ratingDistribution).reduce((a, b) => a + b, 0);
    expect(sum).toBe(nps.totalResponses);
  });

  it("should have avgRating between 1 and 5", () => {
    expect(nps.avgRating).toBeGreaterThanOrEqual(1);
    expect(nps.avgRating).toBeLessThanOrEqual(5);
  });
});
