/**
 * GluMira™ — useProgressReport.ts
 *
 * React hook for fetching a patient's progress report.
 * Wraps POST /api/analytics/progress-report.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReportPeriod } from "@/server/analytics/patient-progress-report";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlucoseSummary {
  readingCount: number;
  avgGlucose: number;
  stdDev: number;
  cv: number;
  tirPercent: number;
  timeAbove: number;
  timeBelow: number;
  gmi: number;
  glucoseStatus: string;
}

export interface DoseSummary {
  totalDoses: number;
  bolusUnits: number;
  basalUnits: number;
  correctionUnits: number;
  avgDailyUnits: number;
  doseStatus: string;
}

export interface ProgressReport {
  patientId: string;
  patientName: string;
  clinicianName: string;
  period: ReportPeriod;
  generatedAt: string;
  glucose: GlucoseSummary;
  doses: DoseSummary;
  overallStatus: string;
  disclaimer: string;
}

interface UseProgressReportOptions {
  patientId: string | null;
  period?: ReportPeriod;
}

interface UseProgressReportResult {
  report: ProgressReport | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProgressReport({
  patientId,
  period = "14d",
}: UseProgressReportOptions): UseProgressReportResult {
  const [report, setReport]   = useState<ProgressReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!patientId) {
      setReport(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch("/api/analytics/progress-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, period }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<ProgressReport>;
      })
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load progress report");
        setLoading(false);
      });
  }, [patientId, period, refreshKey]);

  return { report, loading, error, refresh };
}

export default useProgressReport;
