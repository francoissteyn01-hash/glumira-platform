/**
 * GluMira™ — Glucose Trend Page
 *
 * Displays 14-day glucose trend analysis including TIR, GMI, CV,
 * detected patterns, and regime comparison.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import React, { useState } from "react";
import { AnalyticsSummaryCard } from "@/components/AnalyticsSummaryCard";
import { RegimeComparisonTable } from "@/components/RegimeComparisonTable";
import { ExportButton } from "@/components/ExportButton";

// ─── TIR gauge (SVG arc) ──────────────────────────────────────────────────────

function TirGauge({ tir, label }: { tir: number; label: string }) {
  const radius = 40;
  const cx = 56, cy = 56;
  const circumference = 2 * Math.PI * radius;
  const dash = (tir / 100) * circumference;

  const colour =
    tir >= 70 ? "#14b8a6"
    : tir >= 50 ? "#f59e0b"
    : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg width={112} height={112} viewBox="0 0 112 112">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={10} />
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={colour}
          strokeWidth={10}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="16" fontWeight="bold" fill={colour}>
          {tir.toFixed(0)}%
        </text>
      </svg>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

// ─── Pattern pill ─────────────────────────────────────────────────────────────

function PatternPill({ pattern }: { pattern: string }) {
  const colour =
    pattern.toLowerCase().includes("hypo") ? "bg-red-50 text-red-700 border-red-200"
    : pattern.toLowerCase().includes("nocturnal") ? "bg-indigo-50 text-indigo-700 border-indigo-200"
    : pattern.toLowerCase().includes("post") ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${colour}`}>
      {pattern}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GlucoseTrendPage() {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Glucose Trend Analysis</h1>
          <p className="text-sm text-slate-400">14-day rolling window · updated every 30 minutes</p>
        </div>
        <ExportButton />
      </div>

      {/* Analytics summary card (fetches /api/analytics/summary) */}
      <AnalyticsSummaryCard />

      {/* TIR breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Time-in-Range Breakdown</h2>
        <div className="flex flex-wrap justify-around gap-4">
          <TirGauge tir={70} label="In Range (3.9–10)" />
          <TirGauge tir={12} label="Above Range" />
          <TirGauge tir={4}  label="Below Range" />
          <TirGauge tir={14} label="Very High (>13.9)" />
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">
          Target: ≥70% time in range · &lt;4% time below range
        </p>
      </div>

      {/* Regime comparison toggle */}
      <div>
        <button
          onClick={() => setShowComparison((v) => !v)}
          className="mb-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100 transition-colors"
        >
          {showComparison ? "Hide" : "Show"} Regime Comparison
        </button>
        {showComparison && <RegimeComparisonTable />}
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-slate-400">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice. Always consult your healthcare provider.
      </p>
    </div>
  );
}
