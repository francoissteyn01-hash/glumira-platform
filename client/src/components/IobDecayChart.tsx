/**
 * GluMira — IOB Decay Chart Component
 *
 * Renders a pure-SVG area chart showing insulin-on-board decay over time.
 * Supports multiple stacked doses with individual decay curves.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

"use client";

import { useMemo } from "react";

interface DoseEntry {
  units: number;
  administeredAt: string;
  type: "bolus" | "correction" | "basal";
}

interface IobDecayChartProps {
  doses: DoseEntry[];
  durationHours?: number;
  peakMinutes?: number;
  width?: number;
  height?: number;
}

const TYPE_COLOURS: Record<string, string> = {
  bolus: "#3b82f6",
  correction: "#f59e0b",
  basal: "#10b981",
};

function computeDecay(units: number, elapsedMin: number, peakMin: number, totalMin: number): number {
  if (elapsedMin < 0 || elapsedMin > totalMin) return 0;
  if (elapsedMin <= peakMin) {
    return units * (elapsedMin / peakMin);
  }
  const remaining = totalMin - peakMin;
  return units * (1 - (elapsedMin - peakMin) / remaining);
}

export default function IobDecayChart({
  doses,
  durationHours = 5,
  peakMinutes = 75,
  width = 600,
  height = 200,
}: IobDecayChartProps) {
  const totalMin = durationHours * 60;
  const padding = { top: 10, right: 20, bottom: 30, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const { points, maxIob, timeLabels } = useMemo(() => {
    const steps = 60;
    const stepMin = totalMin / steps;
    const now = Date.now();

    const seriesMap: Record<string, { x: number; y: number }[]> = {};
    let maxIob = 0;

    for (const dose of doses) {
      const doseTime = new Date(dose.administeredAt).getTime();
      const key = dose.type;
      if (!seriesMap[key]) seriesMap[key] = [];

      for (let i = 0; i <= steps; i++) {
        const t = i * stepMin;
        const elapsed = (now - doseTime) / 60000 + (totalMin - t);
        const iob = computeDecay(dose.units, elapsed, peakMinutes, totalMin);
        if (!seriesMap[key][i]) {
          seriesMap[key][i] = { x: (i / steps) * chartW, y: 0 };
        }
        seriesMap[key][i].y += Math.max(0, iob);
        if (seriesMap[key][i].y > maxIob) maxIob = seriesMap[key][i].y;
      }
    }

    const timeLabels: string[] = [];
    for (let i = 0; i <= 5; i++) {
      timeLabels.push(`${Math.round((i / 5) * durationHours)}h`);
    }

    return { points: seriesMap, maxIob: Math.max(maxIob, 1), timeLabels };
  }, [doses, totalMin, peakMinutes, chartW, chartH, durationHours]);

  const scaleY = (v: number) => chartH - (v / maxIob) * chartH;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Insulin On Board — Decay Curve</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" aria-label="IOB decay chart">
        <g transform={`translate(${padding.left},${padding.top})`}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
            <line
              key={frac}
              x1={0}
              y1={chartH * (1 - frac)}
              x2={chartW}
              y2={chartH * (1 - frac)}
              stroke="#e5e7eb"
              strokeWidth={0.5}
            />
          ))}

          {/* Y-axis labels */}
          {[0, 0.5, 1].map((frac) => (
            <text
              key={frac}
              x={-8}
              y={chartH * (1 - frac) + 4}
              textAnchor="end"
              className="text-[9px] fill-gray-400"
            >
              {(maxIob * frac).toFixed(1)}U
            </text>
          ))}

          {/* Area fills */}
          {Object.entries(points).map(([type, pts]) => {
            const path =
              `M ${pts[0].x} ${scaleY(pts[0].y)} ` +
              pts.slice(1).map((p) => `L ${p.x} ${scaleY(p.y)}`).join(" ") +
              ` L ${pts[pts.length - 1].x} ${chartH} L ${pts[0].x} ${chartH} Z`;
            return (
              <path
                key={type}
                d={path}
                fill={TYPE_COLOURS[type] || "#6b7280"}
                fillOpacity={0.25}
                stroke={TYPE_COLOURS[type] || "#6b7280"}
                strokeWidth={1.5}
              />
            );
          })}

          {/* X-axis labels */}
          {timeLabels.map((label, i) => (
            <text
              key={i}
              x={(i / (timeLabels.length - 1)) * chartW}
              y={chartH + 18}
              textAnchor="middle"
              className="text-[9px] fill-gray-400"
            >
              {label}
            </text>
          ))}
        </g>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 justify-center">
        {Object.entries(TYPE_COLOURS).map(([type, colour]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colour }} />
            <span className="text-xs text-gray-500 capitalize">{type}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-300 text-center mt-2">
        GluMira is an informational tool only. Not a medical device.
      </p>
    </div>
  );
}
