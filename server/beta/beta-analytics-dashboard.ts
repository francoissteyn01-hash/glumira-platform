/**
 * GluMira™ Beta Analytics Dashboard
 * Version: 7.0.0
 * Module: BETA-ANALYTICS-DASH
 *
 * Provides grant-ready analytics endpoints for the admin dashboard:
 *
 * GET  /api/beta/analytics/overview
 *   Real-time cohort overview (enrollment, onboarding funnel, engagement).
 *
 * GET  /api/beta/analytics/retention
 *   Retention curves: 7d, 14d, 30d, 60d, 90d.
 *
 * GET  /api/beta/analytics/feature-usage
 *   Feature utilization heatmap data.
 *
 * GET  /api/beta/analytics/clinical-outcomes
 *   TIR improvement, GMI trends, hypo frequency across the cohort.
 *
 * GET  /api/beta/analytics/nps
 *   Net Promoter Score breakdown.
 *
 * GET  /api/beta/analytics/export
 *   CSV export of all metrics for grant applications.
 *
 * These metrics are specifically designed to satisfy the evidence
 * requirements of Breakthrough T1D, Helmsley Charitable Trust,
 * and NIH SBIR/STTR grant applications.
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

import { Router, type Request, type Response } from "express";

export const betaAnalyticsRouter = Router();

// ─── Types ───────────────────────────────────────────────────

export interface CohortOverview {
  enrollment: {
    total: number;
    active: number;
    pending: number;
    inactive: number;
    churnRate: number;
  };
  onboardingFunnel: {
    enrolled: number;
    profileCreated: number;
    glucoseConfigured: number;
    insulinConfigured: number;
    cgmConnected: number;
    firstSyncComplete: number;
    fullyOnboarded: number;
    conversionRate: number;
  };
  engagement: {
    dau: number;
    wau: number;
    mau: number;
    dauWauRatio: number;
    avgSessionMinutes: number;
    avgEventsPerSession: number;
    totalEvents: number;
  };
  dataVolume: {
    totalGlucoseReadings: number;
    totalInsulinDoses: number;
    totalMeals: number;
    totalFeedback: number;
    totalAIQueries: number;
  };
  generatedAt: string;
}

export interface RetentionCurve {
  period: string;
  days: number;
  cohortSize: number;
  retained: number;
  retentionPercent: number;
}

export interface FeatureUsageItem {
  featureName: string;
  displayName: string;
  totalUses: number;
  uniqueUsers: number;
  avgUsesPerUser: number;
  percentOfActiveUsers: number;
}

export interface ClinicalOutcome {
  metric: string;
  baseline: number | null;
  current: number;
  delta: number | null;
  unit: string;
  direction: "improved" | "worsened" | "stable" | "insufficient_data";
  cohortSize: number;
}

export interface NPSBreakdown {
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
  npsScore: number;
  avgRating: number;
  ratingDistribution: Record<number, number>;
}

// ─── GET /api/beta/analytics/overview ────────────────────────

betaAnalyticsRouter.get("/overview", async (_req: Request, res: Response) => {
  try {
    // In production: query beta_cohort_summary view + telemetry_events
    // For now: return structured shape with placeholder data

    const overview: CohortOverview = {
      enrollment: {
        total: 0,
        active: 0,
        pending: 0,
        inactive: 0,
        churnRate: 0,
      },
      onboardingFunnel: {
        enrolled: 0,
        profileCreated: 0,
        glucoseConfigured: 0,
        insulinConfigured: 0,
        cgmConnected: 0,
        firstSyncComplete: 0,
        fullyOnboarded: 0,
        conversionRate: 0,
      },
      engagement: {
        dau: 0,
        wau: 0,
        mau: 0,
        dauWauRatio: 0,
        avgSessionMinutes: 0,
        avgEventsPerSession: 0,
        totalEvents: 0,
      },
      dataVolume: {
        totalGlucoseReadings: 0,
        totalInsulinDoses: 0,
        totalMeals: 0,
        totalFeedback: 0,
        totalAIQueries: 0,
      },
      generatedAt: new Date().toISOString(),
    };

    return res.status(200).json(overview);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to compute overview" });
  }
});

// ─── GET /api/beta/analytics/retention ───────────────────────

betaAnalyticsRouter.get("/retention", async (_req: Request, res: Response) => {
  try {
    // In production: compute from telemetry_events grouped by user join date
    const retentionCurves: RetentionCurve[] = [
      { period: "Day 1", days: 1, cohortSize: 0, retained: 0, retentionPercent: 0 },
      { period: "Day 7", days: 7, cohortSize: 0, retained: 0, retentionPercent: 0 },
      { period: "Day 14", days: 14, cohortSize: 0, retained: 0, retentionPercent: 0 },
      { period: "Day 30", days: 30, cohortSize: 0, retained: 0, retentionPercent: 0 },
      { period: "Day 60", days: 60, cohortSize: 0, retained: 0, retentionPercent: 0 },
      { period: "Day 90", days: 90, cohortSize: 0, retained: 0, retentionPercent: 0 },
    ];

    return res.status(200).json({
      curves: retentionCurves,
      benchmarks: {
        healthAppAvg90d: 4,
        diabetesAppAvg90d: 55,
        glumiraTarget90d: 50,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to compute retention" });
  }
});

// ─── GET /api/beta/analytics/feature-usage ───────────────────

betaAnalyticsRouter.get("/feature-usage", async (_req: Request, res: Response) => {
  try {
    // In production: aggregate from telemetry_events WHERE event_category = 'feature_use'
    const features: FeatureUsageItem[] = [
      { featureName: "iob_chart_viewed", displayName: "IOB Chart", totalUses: 0, uniqueUsers: 0, avgUsesPerUser: 0, percentOfActiveUsers: 0 },
      { featureName: "glucose_timeline_viewed", displayName: "Glucose Timeline", totalUses: 0, uniqueUsers: 0, avgUsesPerUser: 0, percentOfActiveUsers: 0 },
      { featureName: "stacking_chart_viewed", displayName: "Stacking Analysis", totalUses: 0, uniqueUsers: 0, avgUsesPerUser: 0, percentOfActiveUsers: 0 },
      { featureName: "bolus_calculator_used", displayName: "Bolus Calculator", totalUses: 0, uniqueUsers: 0, avgUsesPerUser: 0, percentOfActiveUsers: 0 },
      { featureName: "school_care_plan_generated", displayName: "School Care Plan", totalUses: 0, uniqueUsers: 0, avgUsesPerUser: 0, percentOfActiveUsers: 0 },
      { featureName: "ai_chat_message_sent", displayName: "AI Chat", totalUses: 0, uniqueUsers: 0, avgUsesPerUser: 0, percentOfActiveUsers: 0 },
      { featureName: "bernstein_qa_queried", displayName: "Bernstein QA", totalUses: 0, uniqueUsers: 0, avgUsesPerUser: 0, percentOfActiveUsers: 0 },
      { featureName: "report_exported", displayName: "Report Export", totalUses: 0, uniqueUsers: 0, avgUsesPerUser: 0, percentOfActiveUsers: 0 },
      { featureName: "pattern_card_viewed", displayName: "Pattern Recognition", totalUses: 0, uniqueUsers: 0, avgUsesPerUser: 0, percentOfActiveUsers: 0 },
      { featureName: "hypo_risk_card_viewed", displayName: "Hypo Risk Card", totalUses: 0, uniqueUsers: 0, avgUsesPerUser: 0, percentOfActiveUsers: 0 },
    ];

    return res.status(200).json({
      features,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to compute feature usage" });
  }
});

// ─── GET /api/beta/analytics/clinical-outcomes ───────────────

betaAnalyticsRouter.get("/clinical-outcomes", async (_req: Request, res: Response) => {
  try {
    // In production: compute from glucose_readings aggregated per patient
    const outcomes: ClinicalOutcome[] = [
      {
        metric: "Time in Range (70-180 mg/dL)",
        baseline: null,
        current: 0,
        delta: null,
        unit: "%",
        direction: "insufficient_data",
        cohortSize: 0,
      },
      {
        metric: "Glucose Management Indicator (GMI)",
        baseline: null,
        current: 0,
        delta: null,
        unit: "%",
        direction: "insufficient_data",
        cohortSize: 0,
      },
      {
        metric: "Coefficient of Variation (CV)",
        baseline: null,
        current: 0,
        delta: null,
        unit: "%",
        direction: "insufficient_data",
        cohortSize: 0,
      },
      {
        metric: "Time Below Range (<70 mg/dL)",
        baseline: null,
        current: 0,
        delta: null,
        unit: "%",
        direction: "insufficient_data",
        cohortSize: 0,
      },
      {
        metric: "Time Above Range (>180 mg/dL)",
        baseline: null,
        current: 0,
        delta: null,
        unit: "%",
        direction: "insufficient_data",
        cohortSize: 0,
      },
      {
        metric: "Hypoglycemic Events per Week",
        baseline: null,
        current: 0,
        delta: null,
        unit: "events/week",
        direction: "insufficient_data",
        cohortSize: 0,
      },
    ];

    return res.status(200).json({
      outcomes,
      note: "Clinical outcomes require minimum 14 days of data per participant. Baseline is computed from first 7 days; current from most recent 7 days.",
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to compute clinical outcomes" });
  }
});

// ─── GET /api/beta/analytics/nps ─────────────────────────────

betaAnalyticsRouter.get("/nps", async (_req: Request, res: Response) => {
  try {
    // In production: query beta_feedback WHERE nps_score IS NOT NULL
    const nps: NPSBreakdown = {
      promoters: 0,
      passives: 0,
      detractors: 0,
      totalResponses: 0,
      npsScore: 0,
      avgRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    return res.status(200).json({
      nps,
      benchmarks: {
        healthTechAvg: 30,
        diabetesAppAvg: 45,
        glumiraTarget: 50,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to compute NPS" });
  }
});

// ─── GET /api/beta/analytics/export ──────────────────────────

betaAnalyticsRouter.get("/export", async (_req: Request, res: Response) => {
  try {
    // In production: compile all metrics into CSV format
    const csvHeaders = [
      "date", "total_enrolled", "active_users", "dau", "wau", "mau",
      "avg_session_min", "total_events", "sync_count", "feedback_count",
      "ai_queries", "avg_tir", "avg_gmi", "avg_cv", "nps_score",
      "retention_7d", "retention_30d", "retention_90d",
    ].join(",");

    const csvData = `${csvHeaders}\n`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=glumira-beta-metrics.csv");
    return res.status(200).send(csvData);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to export metrics" });
  }
});
