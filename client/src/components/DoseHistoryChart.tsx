/**
 * GluMira™ — DoseHistoryChart.tsx
 *
 * Stacked bar chart showing daily insulin dose breakdown
 * (bolus / correction / basal) over a configurable number of days.
 *
 * Uses the useDoseHistory hook and renders with Chart.js via
 * react-chartjs-2 (already a project dependency).
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import React, { useMemo } from "react";
import { useDoseHistory } from "@/hooks/useDoseHistory";

// ─── Colour palette ───────────────────────────────────────────────────────────

const COLOURS = {
  bolus:      { bg: "rgba(20, 184, 166, 0.75)",  border: "rgb(20, 184, 166)" },   // teal-500
  correction: { bg: "rgba(245, 158, 11, 0.75)",  border: "rgb(245, 158, 11)" },   // amber-500
  basal:      { bg: "rgba(99, 102, 241, 0.75)",  border: "rgb(99, 102, 241)" },   // indigo-500
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface DoseHistoryChartProps {
  days?: 7 | 14 | 30;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DoseHistoryChart({ days = 7, className }: DoseHistoryChartProps) {
  const { data, loading, error } = useDoseHistory(days);

  const chartData = useMemo(() => {
    if (!data) return null;
    const sorted = [...data.groups].sort((a, b) => a.date.localeCompare(b.date));
    return {
      labels: sorted.map((g) =>
        new Date(g.date + "T12:00:00").toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      ),
      bolus:      sorted.map((g) => g.bolusUnits),
      correction: sorted.map((g) => g.correctionUnits),
      basal:      sorted.map((g) => g.basalUnits),
    };
  }, [data]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className ?? ""}`}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 ${className ?? ""}`}>
        {error}
      </div>
    );
  }

  if (!chartData || data!.totalDoses === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 text-center ${className ?? ""}`}>
        <p className="text-sm text-slate-500">No dose data for the last {days} days.</p>
      </div>
    );
  }

  // Render as a simple HTML table chart (no external chart lib dependency)
  const maxUnits = Math.max(
    ...data!.groups.map((g) => g.totalUnits),
    1
  );

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className ?? ""}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          Daily Insulin — Last {days} Days
        </h3>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-teal-500" />
            Bolus
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
            Correction
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-500" />
            Basal
          </span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {chartData.labels.map((label, i) => {
          const total = chartData.bolus[i] + chartData.correction[i] + chartData.basal[i];
          const heightPct = (total / maxUnits) * 100;
          const bolusH = total > 0 ? (chartData.bolus[i] / total) * heightPct : 0;
          const corrH  = total > 0 ? (chartData.correction[i] / total) * heightPct : 0;
          const basalH = total > 0 ? (chartData.basal[i] / total) * heightPct : 0;

          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-0.5">
              <div
                className="w-full flex flex-col justify-end rounded-t overflow-hidden"
                style={{ height: 96 }}
                title={`${label}: ${total.toFixed(1)} U total`}
              >
                {/* Stacked segments */}
                <div style={{ height: `${basalH}%` }} className="w-full bg-indigo-400" />
                <div style={{ height: `${corrH}%` }}  className="w-full bg-amber-400" />
                <div style={{ height: `${bolusH}%` }} className="w-full bg-teal-400" />
              </div>
              <span className="text-[10px] text-slate-400 truncate w-full text-center">
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>{data!.totalDoses} doses</span>
        <span>{data!.totalUnits.toFixed(1)} U total</span>
      </div>

      <p className="mt-2 text-[10px] text-slate-400">
        GluMira™ is an informational tool only. Not a medical device.
      </p>
    </div>
  );
}

export default DoseHistoryChart;
