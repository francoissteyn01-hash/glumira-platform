/**
 * GluMira™ — WeeklySummaryCard component
 *
 * Displays the weekly summary with score, TIR trend, dose trend, and highlights.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useWeeklySummary, scoreLabelColour, trendArrow } from "@/hooks/useWeeklySummary";

// ─── Metric tile ──────────────────────────────────────────────────────────────

function MetricTile({
  label,
  value,
  unit,
  delta,
  trend,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta: number | null;
  trend: "up" | "down" | "stable" | "no-data";
}) {
  const arrow = trendArrow(trend);
  const deltaColour =
    trend === "up" ? "text-green-600"
    : trend === "down" ? "text-red-500"
    : "text-gray-400";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-sm text-gray-400 mb-0.5">{unit}</span>}
      </div>
      {delta !== null ? (
        <p className={`text-xs mt-1 font-medium ${deltaColour}`}>
          {arrow} {Math.abs(delta)}% vs last week
        </p>
      ) : (
        <p className="text-xs mt-1 text-gray-300">No previous data</p>
      )}
    </div>
  );
}

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const colour = scoreLabelColour(label as Parameters<typeof scoreLabelColour>[0]);
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${score} ${100 - score}`}
            className={colour}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
          {score}
        </span>
      </div>
      <div>
        <p className="text-xs text-gray-500">Week Score</p>
        <p className={`text-sm font-semibold capitalize ${colour}`}>{label.replace("-", " ")}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WeeklySummaryCard() {
  const { summary, loading, error } = useWeeklySummary();

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-40 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        {error ?? "Weekly summary unavailable"}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Weekly Summary</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {summary.weekStartDate} — {summary.weekEndDate}
          </p>
        </div>
        <ScoreBadge score={summary.score} label={summary.scoreLabel} />
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-3 gap-3">
        <MetricTile
          label="Time in Range"
          value={summary.glucose.current.tirPercent}
          unit="%"
          delta={summary.glucose.deltaPercent}
          trend={summary.glucose.trend}
        />
        <MetricTile
          label="Mean Glucose"
          value={summary.glucose.current.meanMmol}
          unit="mmol/L"
          delta={null}
          trend="no-data"
        />
        <MetricTile
          label="Daily Insulin"
          value={summary.doses.current.averageDailyUnits}
          unit="U/day"
          delta={summary.doses.deltaPercent}
          trend={summary.doses.trend}
        />
      </div>

      {/* Highlights */}
      {summary.highlights.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Highlights</p>
          <ul className="space-y-1">
            {summary.highlights.map((h, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-300">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
      </p>
    </div>
  );
}
