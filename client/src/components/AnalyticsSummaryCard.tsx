/**
 * GluMira™ — AnalyticsSummaryCard.tsx
 *
 * Dashboard card displaying 7-day vs 14-day analytics comparison.
 * Shows TIR, GMI, CV with trend deltas and colour-coded status.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import React, { useState, useEffect } from "react";
import { tirStatusLabel, gmiCategory, tirColour } from "@/server/analytics/analytics-summary";
import type { AnalyticsSummary, PeriodSummary } from "@/server/analytics/analytics-summary";

// ─── Stat row ─────────────────────────────────────────────────────────────────

interface StatRowProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  valueClass?: string;
}

function StatRow({ label, value, delta, deltaLabel, valueClass = "" }: StatRowProps) {
  const deltaPositive = delta !== undefined && delta > 0;
  const deltaNegative = delta !== undefined && delta < 0;

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
        {delta !== undefined && delta !== 0 && (
          <span
            className={`text-xs font-medium ${
              deltaPositive ? "text-emerald-600" : deltaNegative ? "text-red-500" : "text-slate-400"
            }`}
          >
            {deltaPositive ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
            {deltaLabel ? ` ${deltaLabel}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Period column ────────────────────────────────────────────────────────────

interface PeriodColumnProps {
  period: PeriodSummary;
  label: string;
}

function PeriodColumn({ period, label }: PeriodColumnProps) {
  if (period.count === 0) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm text-slate-400">No data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-2xl font-bold ${tirColour(period.tirPercent)}`}>
        {period.tirPercent}%
      </p>
      <p className="text-xs text-slate-500">{tirStatusLabel(period.tirPercent)}</p>
      <div className="mt-2 flex flex-col gap-0.5 text-xs text-slate-600">
        <span>GMI: <strong>{period.gmi}%</strong> — {gmiCategory(period.gmi)}</span>
        <span>CV: <strong>{period.cv.toFixed(1)}%</strong></span>
        <span>Mean: <strong>{period.mean.toFixed(1)} mmol/L</strong></span>
        <span>{period.count} readings</span>
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function AnalyticsSummaryCard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/summary")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<{ ok: boolean; summary: AnalyticsSummary }>;
      })
      .then(({ summary: s }) => {
        setSummary(s);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load analytics");
        setLoading(false);
      });
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Glucose Analytics</h3>
        <span className="text-xs text-slate-400">Time in Range</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      {error && (
        <p className="py-4 text-center text-sm text-red-500">{error}</p>
      )}

      {summary && !loading && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <PeriodColumn period={summary.sevenDay} label="Last 7 days" />
            <PeriodColumn period={summary.fourteenDay} label="Last 14 days" />
          </div>

          {(summary.tirDelta !== 0 || summary.gmiDelta !== 0) && (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                7-day vs 14-day trend
              </p>
              <StatRow
                label="TIR change"
                value={`${summary.tirDelta > 0 ? "+" : ""}${summary.tirDelta.toFixed(1)}%`}
                valueClass={summary.tirDelta > 0 ? "text-emerald-600" : summary.tirDelta < 0 ? "text-red-500" : "text-slate-600"}
              />
              <StatRow
                label="GMI change"
                value={`${summary.gmiDelta > 0 ? "+" : ""}${summary.gmiDelta.toFixed(2)}%`}
                valueClass={summary.gmiDelta > 0 ? "text-emerald-600" : summary.gmiDelta < 0 ? "text-red-500" : "text-slate-600"}
              />
            </div>
          )}

          {summary.sevenDay.patterns.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Patterns detected
              </p>
              <ul className="flex flex-col gap-1">
                {summary.sevenDay.patterns.map((p, i) => (
                  <li key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-400 text-center">
            Educational only — not a clinical tool.
          </p>
        </>
      )}
    </div>
  );
}

export default AnalyticsSummaryCard;
