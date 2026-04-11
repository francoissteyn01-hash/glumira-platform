/**
 * GluMira™ V7 — IOB Hunter v7 · React hook
 *
 * Takes a list of doses and returns everything the chart + report need:
 *   - curve: 24h IOB pressure map points
 *   - kpis:  peak, trough, overlap hours, totals
 *   - markers: injection annotations
 *   - stackingAlerts: overlap risk windows
 *   - basalAnalysis: trough/floor integrity report
 *
 * Pure-client for now — no Supabase calls. Slice 2.2 will add a second
 * hook `useIOBHunterFromSupabase` that wraps this one.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useMemo } from "react";
import {
  INSULIN_PROFILES,
  analyzeBasalCoverage,
  calculateReportKPIs,
  detectStacking,
  generateInjectionMarkers,
  generateStackedCurve,
} from "@/iob-hunter";
import type {
  BasalCoverageAnalysis,
  InjectionMarker,
  InsulinDose,
  IOBCurvePoint,
  ReportKPIs,
  StackingAlert,
} from "@/iob-hunter";

export type UseIOBHunterOptions = {
  resolutionMinutes?: number;  // default 15
  cycles?: number;             // default 2 (today + yesterday)
  startHour?: number;          // default 0
  endHour?: number;            // default 24
}

export type UseIOBHunterResult = {
  curve: IOBCurvePoint[];
  kpis: ReportKPIs;
  markers: InjectionMarker[];
  stackingAlerts: StackingAlert[];
  basalAnalysis: BasalCoverageAnalysis;
  maxIOB: number;
}

export function useIOBHunter(
  doses: InsulinDose[],
  options: UseIOBHunterOptions = {},
): UseIOBHunterResult {
  const {
    resolutionMinutes = 15,
    cycles = 2,
    startHour = 0,
    endHour = 24,
  } = options;

  return useMemo(() => {
    const curve = generateStackedCurve(
      doses,
      INSULIN_PROFILES,
      startHour,
      endHour,
      resolutionMinutes,
      cycles,
    );

    const kpis = calculateReportKPIs(doses, INSULIN_PROFILES, 0.5, curve);
    const markers = generateInjectionMarkers(doses, INSULIN_PROFILES);
    const stackingAlerts = detectStacking(doses, INSULIN_PROFILES, 0.5, curve);

    const basalDoses = doses.filter((d) => d.dose_type === "basal_injection");
    const basalAnalysis = analyzeBasalCoverage(basalDoses, INSULIN_PROFILES);

    const maxIOB = curve.reduce((m, p) => Math.max(m, p.total_iob), 0);

    return { curve, kpis, markers, stackingAlerts, basalAnalysis, maxIOB };
  }, [doses, resolutionMinutes, cycles, startHour, endHour]);
}
