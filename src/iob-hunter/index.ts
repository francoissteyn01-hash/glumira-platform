/**
 * GluMira™ V7 — IOB Hunter v7 · Module Exports
 *
 * Single import surface for the IOB Hunter v7 module. Consumers should
 * always import from `@/iob-hunter` (not from deep subpaths) so the
 * module shape is stable as it evolves.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

/* ─── Types ──────────────────────────────────────────────────────────────── */
export type {
  AlertSeverity,
  BasalCoverageAnalysis,
  DecayModel,
  DoseType,
  InjectionMarker,
  InsulinCategory,
  InsulinDose,
  InsulinProfile,
  InsulinRegionalName,
  IOBAlertType,
  IOBCurvePoint,
  PredictiveAlert,
  RegionCode,
  RegionalStatus,
  ReportKPIs,
  StackingAlert,
  Tier,
  TierLimits,
  WhatIfResult,
  WhatIfScenario,
} from "@/iob-hunter/types";

/* ─── Engine ─────────────────────────────────────────────────────────────── */
export {
  analyzeBasalCoverage,
  applyWhatIfScenario,
  calculateIOB,
  calculateReportKPIs,
  calculateTotalIOB,
  detectStacking,
  generateDecayCurve,
  generateInjectionMarkers,
  generateStackedCurve,
  getHistoryWindow,
  predictiveHighAlert,
  predictiveLowAlert,
  TIER_CONFIG,
} from "@/iob-hunter/engine/iob-engine";

/* ─── Profiles ───────────────────────────────────────────────────────────── */
export {
  findProfile,
  getAllProfiles,
  INSULIN_PROFILES,
} from "@/iob-hunter/engine/insulin-profiles";

/* ─── Regional resolver ──────────────────────────────────────────────────── */
export {
  INSULIN_REGIONAL_NAMES,
  listAllRegionalNames,
  listRegionalNames,
  resolveInsulinName,
} from "@/iob-hunter/engine/insulin-regions";
