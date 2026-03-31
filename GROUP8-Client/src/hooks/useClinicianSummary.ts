/**
 * GluMira™ — useClinicianSummary.ts
 *
 * React hook for fetching a patient's progress report for clinician review.
 * Wraps POST /api/analytics/progress-report.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { PatientProgressReport, ReportPeriod } from "@/server/analytics/patient-progress-report";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseClinicianSummaryResult {
  report: PatientProgressReport | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useClinicianSummary(
  patientId: string | null,
  period: ReportPeriod = "14d"
): UseClinicianSummaryResult {
  const [report, setReport] = useState<PatientProgressReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!patientId) {
      setReport(null);
      setLoading(false);
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
        return res.json() as Promise<PatientProgressReport>;
      })
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load clinician summary");
        setLoading(false);
      });
  }, [patientId, period, refreshKey]);

  return { report, loading, error, refresh };
}

export default useClinicianSummary;
