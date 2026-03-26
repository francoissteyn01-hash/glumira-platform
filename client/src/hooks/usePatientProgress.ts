/**
 * GluMira — usePatientProgress hook
 *
 * Fetches the patient progress report from POST /api/analytics/progress-report
 * and provides loading/error state.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useCallback } from "react";

export interface ProgressReport {
  glucoseSummary: {
    meanMmol: number;
    stdDev: number;
    cv: number;
    tir: number;
    tirBelow: number;
    tirAbove: number;
    gmi: number;
    readingCount: number;
  };
  doseSummary: {
    totalDailyDose: number;
    basalPercent: number;
    bolusPercent: number;
    correctionPercent: number;
    doseCount: number;
  };
  status: "excellent" | "good" | "needs-attention" | "concerning";
  statusLabel: string;
}

interface UsePatientProgressReturn {
  report: ProgressReport | null;
  loading: boolean;
  error: string | null;
  generate: (params: {
    readings: { mmol: number; timestamp: string }[];
    doses: { units: number; type: string; administeredAt: string }[];
    days?: number;
  }) => Promise<void>;
}

export function usePatientProgress(): UsePatientProgressReturn {
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (params: {
      readings: { mmol: number; timestamp: string }[];
      doses: { units: number; type: string; administeredAt: string }[];
      days?: number;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/analytics/progress-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to generate progress report");
        }
        const data: ProgressReport = await res.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { report, loading, error, generate };
}
