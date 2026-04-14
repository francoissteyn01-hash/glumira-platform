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
  computeGraphBounds,
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
  /**
   * Patient weight in kilograms. CRITICAL for albumin-bound insulins
   * (Levemir): the engine resolves dose-dependent DOA from Plank 2005
   * by U/kg. Omitting this defaults to 70kg, which silently collapses
   * Levemir DOA to ~5.7h for any dose under ~7U — making the chart
   * drop to zero between basal injections instead of showing the
   * correct sustained baseline.
   */
  patientWeightKg?: number;
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
    cycles: cyclesOpt,
    startHour: startHourOpt,
    endHour: endHourOpt,
    patientWeightKg,
  } = options;

  return useMemo(() => {
    // Dynamic window — only fires when the caller hasn't pinned bounds.
    // This is what eliminates the empty whitespace on the right of the
    // chart when the longest-DOA insulin is Levemir (~12h), not Tresiba.
    const anyBoundMissing =
      startHourOpt === undefined || endHourOpt === undefined || cyclesOpt === undefined;
    const auto = anyBoundMissing
      ? computeGraphBounds(doses, INSULIN_PROFILES, patientWeightKg)
      : null;

    const startHour = startHourOpt ?? auto?.startHour ?? 0;
    const endHour   = endHourOpt   ?? auto?.endHour   ?? 24;
    const cycles    = cyclesOpt    ?? auto?.cycles    ?? 2;

    const curve = generateStackedCurve(
      doses,
      INSULIN_PROFILES,
      startHour,
      endHour,
      resolutionMinutes,
      cycles,
      patientWeightKg,
    );

    const kpis = calculateReportKPIs(doses, INSULIN_PROFILES, 0.5, curve);
    const markers = generateInjectionMarkers(doses, INSULIN_PROFILES);
    const stackingAlerts = detectStacking(doses, INSULIN_PROFILES, 0.5, curve);

    const basalDoses = doses.filter((d) => d.dose_type === "basal_injection");
    const basalAnalysis = analyzeBasalCoverage(basalDoses, INSULIN_PROFILES);

    const maxIOB = curve.reduce((m, p) => Math.max(m, p.total_iob), 0);

    return { curve, kpis, markers, stackingAlerts, basalAnalysis, maxIOB };
  }, [doses, resolutionMinutes, cyclesOpt, startHourOpt, endHourOpt, patientWeightKg]);
}
