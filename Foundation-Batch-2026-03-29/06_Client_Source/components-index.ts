/**
 * GluMira™ V7 — client/src/components/index.ts
 *
 * React component barrel export.
 * All components cleaned for Vite + React (no Next.js App Router directives).
 *
 * Changes from uploaded originals (04.2.71–79):
 *   - Removed "use client" directive (Next.js only — Vite doesn't need it)
 *   - Changed @/ path aliases → relative imports (configure vite.config.ts alias if preferred)
 *   - NightscoutCGMChart: recharts import stays (recharts works in Vite)
 *
 * Version: v1.0 · 2026-03-29
 */

export { WeeklySummaryCard }       from "./WeeklySummaryCard";
export { default as TimeInRangeChart } from "./TimeInRangeChart";
export { RegimeComparisonTable }   from "./RegimeComparisonTable";
export { PatternRecognitionCard }  from "./PatternRecognitionCard";
export { OnboardingGate }          from "./OnboardingGate";
export { NotificationsPanel }      from "./NotificationsPanel";
export { NightscoutCGMChart }      from "./NightscoutCGMChart";
export { MealTimingInsights }      from "./MealTimingInsights";
export { HypoRiskCard }            from "./HypoRiskCard";

// Types re-exported for consumer convenience
export type { TirBreakdown }       from "./TimeInRangeChart";
export type { HypoRiskResult, HypoRiskTier } from "./HypoRiskCard";
