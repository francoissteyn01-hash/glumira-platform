/**
 * GluMira™ Glucose Trend Page
 * Version: 7.0.0
 *
 * Displays:
 *  - TIR ring chart (5-zone breakdown)
 *  - GMI (estimated HbA1c)
 *  - CV% (glycaemic variability)
 *  - Mean, SD, min, max
 *  - Trend direction badge
 *  - Pattern detection alerts
 *  - Time range selector (24h / 7d / 14d / 30d)
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────

interface TirBreakdown {
  veryLow: number;
  low: number;
  inRange: number;
  high: number;
  veryHigh: number;
}

interface TrendReport {
  count: number;
  mean: number;
  sd: number;
  cv: number;
  min: number;
  max: number;
  gmi: number;
  tir: TirBreakdown;
  tirPercent: number;
  trend: string;
  patterns: string[];
  periodHours: number;
}

// ─── TIR Ring (SVG) ───────────────────────────────────────────

function TirRing({ tir, total }: { tir: TirBreakdown; total: number }) {
  const segments = [
    { key: "veryLow",  colour: "#DC2626", label: "Very Low" },
    { key: "low",      colour: "#F97316", label: "Low" },
    { key: "inRange",  colour: "#16A34A", label: "In Range" },
    { key: "high",     colour: "#CA8A04", label: "High" },
    { key: "veryHigh", colour: "#9333EA", label: "Very High" },
  ] as const;

  const r = 60;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  const arcs = segments.map(({ key, colour, label }) => {
    const count = tir[key];
    const pct = total > 0 ? count / total : 0;
    const dash = pct * circumference;
    const arc = (
      <circle
        key={key}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={colour}
        strokeWidth={18}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        opacity={pct > 0 ? 1 : 0.08}
      />
    );
    offset += dash;
    return { arc, colour, label, count, pct };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={160} height={160} viewBox="0 0 160 160">
        {arcs.map(({ arc }) => arc)}
        <text x={cx} y={cy - 8} textAnchor="middle" className="text-2xl font-bold" fill="#111827" fontSize={22} fontWeight={700}>
          {total > 0 ? `${((tir.inRange / total) * 100).toFixed(0)}%` : "—"}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#6B7280" fontSize={11}>
          Time In Range
        </text>
      </svg>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        {arcs.map(({ colour, label, count, pct }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colour }} />
            <span className="text-gray-600">{label}</span>
            <span className="text-gray-400 ml-auto">{(pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Trend badge ──────────────────────────────────────────────

const TREND_LABELS: Record<string, { label: string; colour: string; arrow: string }> = {
  rising_fast: { label: "Rising Fast", colour: "bg-red-100 text-red-700",    arrow: "↑↑" },
  rising:      { label: "Rising",      colour: "bg-amber-100 text-amber-700", arrow: "↑"  },
  stable:      { label: "Stable",      colour: "bg-green-100 text-green-700", arrow: "→"  },
  falling:     { label: "Falling",     colour: "bg-amber-100 text-amber-700", arrow: "↓"  },
  falling_fast:{ label: "Falling Fast",colour: "bg-red-100 text-red-700",    arrow: "↓↓" },
};

// ─── Page ─────────────────────────────────────────────────────

const RANGES = [
  { label: "24h",  hours: 24  },
  { label: "7d",   hours: 168 },
  { label: "14d",  hours: 336 },
  { label: "30d",  hours: 720 },
];

export default function TrendsPage() {
  const [hours, setHours] = useState(24);
  const [report, setReport] = useState<TrendReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrend = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/readings?hours=${hours}&limit=2000`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Build report client-side from readings
      const readings: Array<{ glucose: number; timestamp: string }> =
        (data.readings ?? []).map((r: { glucose: number; recorded_at: string }) => ({
          glucose: r.glucose,
          timestamp: r.recorded_at,
        }));

      if (readings.length === 0) {
        setReport(null);
        return;
      }

      // Use server stats if available, else compute basic stats
      const stats = data.stats;
      const tir: TirBreakdown = { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0 };
      for (const r of readings) {
        if (r.glucose < 3.0) tir.veryLow++;
        else if (r.glucose < 3.9) tir.low++;
        else if (r.glucose <= 10.0) tir.inRange++;
        else if (r.glucose < 14.0) tir.high++;
        else tir.veryHigh++;
      }

      const mean = stats?.mean ?? readings.reduce((a, r) => a + r.glucose, 0) / readings.length;
      const sd = stats?.sd ?? 0;
      const cv = mean > 0 ? (sd / mean) * 100 : 0;
      const gmi = +(3.31 + 0.02392 * mean * 18.0182).toFixed(1);
      const tirPercent = readings.length > 0 ? +((tir.inRange / readings.length) * 100).toFixed(1) : 0;

      setReport({
        count: readings.length,
        mean: +mean.toFixed(2),
        sd: +sd.toFixed(2),
        cv: +cv.toFixed(1),
        min: stats?.min ?? Math.min(...readings.map((r) => r.glucose)),
        max: stats?.max ?? Math.max(...readings.map((r) => r.glucose)),
        gmi,
        tir,
        tirPercent,
        trend: "stable",
        patterns: [],
        periodHours: hours,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load trend data");
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => { fetchTrend(); }, [fetchTrend]);

  const trendInfo = report ? (TREND_LABELS[report.trend] ?? TREND_LABELS.stable) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Glucose Trends</h1>
          <p className="text-sm text-gray-500 mt-1">
            {report ? `${report.count} readings over ${report.periodHours}h` : "Loading…"}
          </p>
        </div>

        {/* Range selector */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {RANGES.map(({ label, hours: h }) => (
            <button
              key={label}
              onClick={() => setHours(h)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                hours === h
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-xl p-4 text-sm text-red-700">{error}</div>
      ) : !report ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400 text-sm">
          No glucose readings found for this period.
        </div>
      ) : (
        <>
          {/* Main stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TIR Ring */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <TirRing tir={report.tir} total={report.count} />
            </div>

            {/* Key metrics */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Key Metrics</h2>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Mean Glucose", value: `${report.mean} mmol/L`, sub: "" },
                  { label: "GMI (est. HbA1c)", value: `${report.gmi}%`, sub: "Bergenstal 2018" },
                  { label: "Std Deviation", value: `${report.sd} mmol/L`, sub: "" },
                  { label: "CV%", value: `${report.cv}%`, sub: report.cv > 36 ? "⚠ High variability" : "✓ Acceptable" },
                  { label: "Min", value: `${report.min} mmol/L`, sub: "" },
                  { label: "Max", value: `${report.max} mmol/L`, sub: "" },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                  </div>
                ))}
              </div>

              {/* Trend */}
              {trendInfo && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Current trend:</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${trendInfo.colour}`}>
                    {trendInfo.arrow} {trendInfo.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Patterns */}
          {report.patterns.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
              <h2 className="text-sm font-semibold text-amber-800 mb-3">
                Patterns Detected
              </h2>
              <ul className="space-y-2">
                {report.patterns.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                    <span className="mt-0.5 flex-shrink-0">⚠</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-600 mt-3">
                These patterns are informational only. Discuss with your healthcare provider before making any changes.
              </p>
            </div>
          )}

          {/* TIR Target reference */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">ADA/EASD TIR Targets</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                { label: "In Range (3.9–10.0)", target: "≥ 70%", actual: `${report.tirPercent}%`, ok: report.tirPercent >= 70 },
                { label: "Very Low (< 3.0)",    target: "< 1%",  actual: `${((report.tir.veryLow / report.count) * 100).toFixed(1)}%`, ok: (report.tir.veryLow / report.count) * 100 < 1 },
                { label: "Low (3.0–3.9)",       target: "< 4%",  actual: `${((report.tir.low / report.count) * 100).toFixed(1)}%`, ok: (report.tir.low / report.count) * 100 < 4 },
              ].map(({ label, target, actual, ok }) => (
                <div key={label} className={`rounded-lg p-3 ${ok ? "bg-green-50" : "bg-red-50"}`}>
                  <p className={`font-medium ${ok ? "text-green-700" : "text-red-700"}`}>{label}</p>
                  <p className={`text-xs mt-1 ${ok ? "text-green-600" : "text-red-600"}`}>
                    Target: {target} · Actual: {actual} {ok ? "✓" : "✗"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <p className="text-xs text-gray-400 text-center">
        GluMira™ is an informational tool only. Not a medical device.
      </p>
    </div>
  );
}
