/**
 * GluMira™ — RegimeComparisonTable.tsx
 *
 * Displays a side-by-side comparison of insulin regime windows.
 * Highlights the winning regime with a trophy badge.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import React from "react";
import type { RegimeComparisonResult } from "@/hooks/useRegimeComparison";

// ─── Props ────────────────────────────────────────────────────────────────────

interface RegimeComparisonTableProps {
  result: RegimeComparisonResult;
  className?: string;
}

// ─── TIR colour helper ────────────────────────────────────────────────────────

function tirBg(colour: string): string {
  const map: Record<string, string> = {
    green:  "bg-emerald-50 text-emerald-700",
    amber:  "bg-amber-50 text-amber-700",
    red:    "bg-red-50 text-red-700",
  };
  return map[colour] ?? "bg-slate-50 text-slate-700";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RegimeComparisonTable({ result, className = "" }: RegimeComparisonTableProps) {
  const { windows } = result;

  if (!windows || windows.length === 0) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 ${className}`}>
        No comparison data available.
      </div>
    );
  }

  const metrics: { key: keyof typeof windows[0]; label: string; format: (v: unknown) => string }[] = [
    { key: "tirPercent",   label: "TIR",          format: (v) => `${(v as number).toFixed(1)}%` },
    { key: "hypoPercent",  label: "Time Below",   format: (v) => `${(v as number).toFixed(1)}%` },
    { key: "hyperPercent", label: "Time Above",   format: (v) => `${(v as number).toFixed(1)}%` },
    { key: "gmi",          label: "GMI",          format: (v) => `${(v as number).toFixed(1)}%` },
    { key: "cv",           label: "CV",           format: (v) => `${(v as number).toFixed(1)}%` },
    { key: "readingCount", label: "Readings",     format: (v) => String(v) },
    { key: "outcomeLabel", label: "Outcome",      format: (v) => String(v) },
  ];

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Metric
            </th>
            {windows.map((w, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div className="flex items-center gap-1.5">
                  {w.winner && (
                    <span title="Best regime" className="text-amber-500">🏆</span>
                  )}
                  {w.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {metrics.map(({ key, label, format }) => (
            <tr key={String(key)} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-slate-600">{label}</td>
              {windows.map((w, i) => {
                const val = w[key];
                const isTir = key === "tirPercent";
                const cellCls = isTir ? tirBg(w.tirColour) : "";
                return (
                  <td
                    key={i}
                    className={`px-4 py-3 font-medium ${cellCls} ${
                      w.winner && key === "tirPercent" ? "font-bold" : ""
                    }`}
                  >
                    {format(val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {result.bestLabel && (
        <div className="border-t border-slate-100 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
          Best regime: <strong>{result.bestLabel}</strong>
        </div>
      )}

      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-400">
        Generated {new Date(result.generatedAt).toLocaleString()} ·
        GluMira™ is an informational tool only. Not a medical device.
      </div>
    </div>
  );
}

export default RegimeComparisonTable;
