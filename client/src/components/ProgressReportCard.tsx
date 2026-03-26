/**
 * GluMira™ — ProgressReportCard.tsx
 *
 * Compact card showing a patient's progress report summary.
 * Uses useProgressReport hook.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import React from "react";
import { useProgressReport } from "@/hooks/useProgressReport";
import type { ReportPeriod } from "@/server/analytics/patient-progress-report";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProgressReportCardProps {
  patientId: string | null;
  period?: ReportPeriod;
  className?: string;
}

// ─── Status colour ────────────────────────────────────────────────────────────

function statusColour(status: string): string {
  const map: Record<string, string> = {
    excellent: "text-emerald-600 bg-emerald-50 border-emerald-200",
    good:      "text-teal-600 bg-teal-50 border-teal-200",
    fair:      "text-amber-600 bg-amber-50 border-amber-200",
    poor:      "text-red-600 bg-red-50 border-red-200",
  };
  return map[status] ?? "text-slate-600 bg-slate-50 border-slate-200";
}

// ─── Mini stat ────────────────────────────────────────────────────────────────

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProgressReportCard({
  patientId,
  period = "14d",
  className = "",
}: ProgressReportCardProps) {
  const { report, loading, error, refresh } = useProgressReport({ patientId, period });

  if (!patientId) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-400 ${className}`}>
        No patient selected.
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-slate-200 bg-white py-8 ${className}`}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 ${className}`}>
        {error}
        <button onClick={refresh} className="ml-2 underline">Retry</button>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">{report.patientName}</p>
          <p className="text-xs text-slate-400">{period} progress report</p>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${statusColour(report.overallStatus)}`}>
          {report.overallStatus}
        </span>
      </div>

      {/* Glucose stats */}
      <div className="mb-3 grid grid-cols-4 gap-2 rounded-lg bg-slate-50 p-3">
        <MiniStat label="TIR"   value={`${report.glucose.tirPercent.toFixed(0)}%`} />
        <MiniStat label="GMI"   value={`${report.glucose.gmi.toFixed(1)}%`} />
        <MiniStat label="CV"    value={`${report.glucose.cv.toFixed(0)}%`} />
        <MiniStat label="Avg"   value={`${report.glucose.avgGlucose.toFixed(1)}`} />
      </div>

      {/* Dose stats */}
      <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3">
        <MiniStat label="Doses"  value={String(report.doses.totalDoses)} />
        <MiniStat label="Bolus"  value={`${report.doses.bolusUnits.toFixed(0)} U`} />
        <MiniStat label="Daily"  value={`${report.doses.avgDailyUnits.toFixed(1)} U`} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Generated {new Date(report.generatedAt).toLocaleDateString()}
        </p>
        <button
          onClick={refresh}
          className="text-xs text-teal-600 hover:underline"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export default ProgressReportCard;
