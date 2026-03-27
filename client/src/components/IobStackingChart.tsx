/**
 * GluMira™ — IobStackingChart.tsx
 *
 * Renders an IOB stacking chart using SVG (no external chart library).
 * Shows total IOB over time with bolus/basal/correction breakdown.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import React, { useMemo } from "react";
import { useIobHistory, type IobPoint } from "@/hooks/useIobHistory";

// ─── Props ────────────────────────────────────────────────────────────────────

interface IobStackingChartProps {
  windowHours?: number;
  intervalMins?: number;
  height?: number;
  className?: string;
}

// ─── SVG chart helpers ────────────────────────────────────────────────────────

const PADDING = { top: 16, right: 16, bottom: 28, left: 40 };

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
}

function buildArea(
  points: { x: number; y: number }[],
  chartHeight: number
): string {
  if (points.length === 0) return "";
  const line = buildPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x.toFixed(1)} ${chartHeight} L ${first.x.toFixed(1)} ${chartHeight} Z`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IobStackingChart({
  windowHours = 6,
  intervalMins = 15,
  height = 180,
  className = "",
}: IobStackingChartProps) {
  const { data, loading, error, refresh } = useIobHistory({ windowHours, intervalMins });

  const chartData = useMemo(() => {
    if (!data || data.points.length === 0) return null;

    const points = data.points;
    const maxIob = Math.max(...points.map((p) => p.totalIob), 0.1);
    const chartW = 600;
    const chartH = height - PADDING.top - PADDING.bottom;
    const innerW = chartW - PADDING.left - PADDING.right;

    const toX = (i: number) => PADDING.left + (i / (points.length - 1)) * innerW;
    const toY = (v: number) => PADDING.top + chartH - (v / maxIob) * chartH;

    const totalPts  = points.map((p, i) => ({ x: toX(i), y: toY(p.totalIob)  }));
    const bolusPts  = points.map((p, i) => ({ x: toX(i), y: toY(p.bolusIob)  }));
    const basalPts  = points.map((p, i) => ({ x: toX(i), y: toY(p.basalIob)  }));

    // Y-axis ticks
    const tickCount = 4;
    const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
      const v = (maxIob / tickCount) * i;
      return { v, y: toY(v) };
    });

    // X-axis labels (every hour)
    const xLabels: { label: string; x: number }[] = [];
    points.forEach((p, i) => {
      const d = new Date(p.timestamp);
      if (d.getMinutes() === 0) {
        xLabels.push({
          label: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          x: toX(i),
        });
      }
    });

    return {
      totalPts, bolusPts, basalPts,
      yTicks, xLabels,
      chartH, chartW,
      maxIob,
    };
  }, [data, height]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-slate-200 bg-white ${className}`} style={{ height }}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-red-200 bg-red-50 text-xs text-red-600 ${className}`} style={{ height }}>
        {error}
        <button onClick={refresh} className="ml-2 underline">Retry</button>
      </div>
    );
  }

  if (!chartData || !data) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-slate-200 bg-white text-xs text-slate-400 ${className}`} style={{ height }}>
        No IOB data available.
      </div>
    );
  }

  const { totalPts, bolusPts, basalPts, yTicks, xLabels, chartH, chartW } = chartData;
  const innerH = chartH;

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-700">IOB Stacking — {windowHours}h window</p>
          <p className="text-xs text-slate-400">
            Current: <strong className="text-teal-600">{data.currentIob.toFixed(2)} U</strong>
            {" · "}Peak: <strong>{data.peakIob.toFixed(2)} U</strong>
            {" · "}Avg: <strong>{data.avgIob.toFixed(2)} U</strong>
          </p>
        </div>
        <button onClick={refresh} className="text-xs text-slate-400 hover:text-slate-600">↻</button>
      </div>

      {/* Legend */}
      <div className="mb-2 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-teal-500/80" /> Total</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-blue-400/60" /> Bolus</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-4 rounded bg-amber-400/60" /> Basal</span>
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${chartW} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        {/* Y-axis gridlines + labels */}
        {yTicks.map(({ v, y }) => (
          <g key={v}>
            <line x1={PADDING.left} y1={y} x2={chartW - PADDING.right} y2={y}
              stroke="#e2e8f0" strokeWidth="1" />
            <text x={PADDING.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Basal area */}
        <path d={buildArea(basalPts, PADDING.top + innerH)} fill="rgba(251,191,36,0.25)" />
        <path d={buildPath(basalPts)} fill="none" stroke="rgba(251,191,36,0.8)" strokeWidth="1.5" />

        {/* Bolus area */}
        <path d={buildArea(bolusPts, PADDING.top + innerH)} fill="rgba(96,165,250,0.25)" />
        <path d={buildPath(bolusPts)} fill="none" stroke="rgba(96,165,250,0.8)" strokeWidth="1.5" />

        {/* Total line */}
        <path d={buildPath(totalPts)} fill="none" stroke="rgba(20,184,166,0.9)" strokeWidth="2" />

        {/* X-axis labels */}
        {xLabels.map(({ label, x }) => (
          <text key={label} x={x} y={height - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">
            {label}
          </text>
        ))}
      </svg>

      <p className="mt-1 text-center text-xs text-slate-400">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
      </p>
    </div>
  );
}

export default IobStackingChart;
