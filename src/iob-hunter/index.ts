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
  InjectionRoute,
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
  getRegimenGraphWindow,
  predictiveHighAlert,
  predictiveLowAlert,
  resolveEffectiveDOA,
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

/* ─── Components ─────────────────────────────────────────────────────────── */
export { default as IOBHunterChart } from "@/iob-hunter/components/IOBHunterChart";
export type { IOBHunterChartProps } from "@/iob-hunter/components/IOBHunterChart";
export { default as IOBHunterKPIRow } from "@/iob-hunter/components/IOBHunterKPIRow";
export type { IOBHunterKPIRowProps } from "@/iob-hunter/components/IOBHunterKPIRow";
export { default as IOBHunterPharmaTable } from "@/iob-hunter/components/IOBHunterPharmaTable";
export type { IOBHunterPharmaTableProps } from "@/iob-hunter/components/IOBHunterPharmaTable";
export { default as IOBHunterReport } from "@/iob-hunter/components/IOBHunterReport";
export type { IOBHunterReportProps } from "@/iob-hunter/components/IOBHunterReport";
export { default as IOBHunterTierGate } from "@/iob-hunter/components/IOBHunterTierGate";
export type { IOBHunterTierGateProps } from "@/iob-hunter/components/IOBHunterTierGate";
export { default as IOBHunterWhatIf } from "@/iob-hunter/components/IOBHunterWhatIf";
export type { IOBHunterWhatIfProps, WhatIfMode } from "@/iob-hunter/components/IOBHunterWhatIf";
export { default as IOBHunterVisitorEntry } from "@/iob-hunter/components/IOBHunterVisitorEntry";
export type { IOBHunterVisitorEntryProps, VisitorMode } from "@/iob-hunter/components/IOBHunterVisitorEntry";

/* ─── Demo data ──────────────────────────────────────────────────────────── */
export {
  DEMO_PATIENT_A_V7,
  DEMO_PATIENT_A_V7_DOSES,
  getDemoPatientADoses,
} from "@/iob-hunter/data/demo-patient-a";
export type { DemoPatientAMeta } from "@/iob-hunter/data/demo-patient-a";

/* ─── Narrative generator ────────────────────────────────────────────────── */
export {
  basalCoverageSummary,
  clinicalSummary,
  kpiHeadline,
  stackingAlertNarratives,
  suggestedImprovements,
} from "@/iob-hunter/engine/narrative-generator";
export type { Improvement } from "@/iob-hunter/engine/narrative-generator";

/* ─── Hooks ──────────────────────────────────────────────────────────────── */
export { useIOBHunter } from "@/iob-hunter/hooks/useIOBHunter";
export type {
  UseIOBHunterOptions,
  UseIOBHunterResult,
} from "@/iob-hunter/hooks/useIOBHunter";
