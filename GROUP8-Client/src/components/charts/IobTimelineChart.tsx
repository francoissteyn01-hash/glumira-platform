/**
 * GluMira™ IOB Timeline Chart
 * Version: 7.0.0
 *
 * Renders a stacked area chart of insulin-on-board (IOB) over a 6-hour window.
 * Each insulin type is rendered as a separate stacked layer with its own colour.
 * Uses SVG for zero-dependency rendering (no recharts/chart.js required).
 *
 * Props:
 *  - doses: array of logged doses (insulinType, units, administeredAt)
 *  - windowHours: number of hours to display (default 6)
 *  - height: SVG height in px (default 200)
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────

export interface IobDose {
  id: string;
  insulinType: string;
  units: number;
  administeredAt: string; // ISO string
}

interface Props {
  doses: IobDose[];
  windowHours?: number;
  height?: number;
}

// ─── Biexponential IOB model ──────────────────────────────────
// Same constants as iob-stacking.ts — kept local to avoid server imports

interface InsulinProfile {
  alpha: number;
  beta: number;
  peakMin: number;
  diaMin: number;
}

const PROFILES: Record<string, InsulinProfile> = {
  NovoRapid: { alpha: 0.0116, beta: 0.0173, peakMin: 75,  diaMin: 240 },
  Humalog:   { alpha: 0.0116, beta: 0.0173, peakMin: 75,  diaMin: 240 },
  Apidra:    { alpha: 0.0130, beta: 0.0190, peakMin: 65,  diaMin: 210 },
  Fiasp:     { alpha: 0.0150, beta: 0.0210, peakMin: 55,  diaMin: 180 },
  Tresiba:   { alpha: 0.0005, beta: 0.0008, peakMin: 480, diaMin: 2400 },
  Lantus:    { alpha: 0.0006, beta: 0.0009, peakMin: 420, diaMin: 1800 },
};

function iobAtMinute(units: number, insulinType: string, minutesElapsed: number): number {
  const p = PROFILES[insulinType] ?? PROFILES.NovoRapid;
  if (minutesElapsed <= 0) return units;
  if (minutesElapsed >= p.diaMin) return 0;
  const raw = units * (Math.exp(-p.alpha * minutesElapsed) - Math.exp(-p.beta * minutesElapsed));
  return Math.max(0, raw);
}

// ─── Colours ──────────────────────────────────────────────────

const INSULIN_COLOURS: Record<string, { fill: string; stroke: string }> = {
  NovoRapid: { fill: "rgba(59,130,246,0.25)",  stroke: "#3B82F6" },
  Humalog:   { fill: "rgba(168,85,247,0.25)",  stroke: "#A855F7" },
  Apidra:    { fill: "rgba(34,197,94,0.25)",   stroke: "#22C55E" },
  Fiasp:     { fill: "rgba(249,115,22,0.25)",  stroke: "#F97316" },
  Tresiba:   { fill: "rgba(100,116,139,0.25)", stroke: "#64748B" },
  Lantus:    { fill: "rgba(107,114,128,0.25)", stroke: "#6B7280" },
};

const DEFAULT_COLOUR = { fill: "rgba(20,184,166,0.25)", stroke: "#14B8A6" };

// ─── Chart ────────────────────────────────────────────────────

const PADDING = { top: 12, right: 16, bottom: 32, left: 40 };
const TICK_COUNT = 7; // one per hour for 6h window

export function IobTimelineChart({ doses, windowHours = 6, height = 200 }: Props) {
  const now = Date.now();
  const windowMs = windowHours * 60 * 60 * 1000;
  const startMs = now - windowMs;

  // Build time points: one per minute across the window
  const STEPS = windowHours * 60; // e.g. 360 for 6h

  // Get unique insulin types present in doses
  const insulinTypes = useMemo(
    () => [...new Set(doses.map((d) => d.insulinType))],
    [doses]
  );

  // Compute per-type IOB at each step
  const series = useMemo(() => {
    return insulinTypes.map((insulinType) => {
      const typeDoses = doses.filter((d) => d.insulinType === insulinType);
      const values: number[] = [];
      for (let step = 0; step <= STEPS; step++) {
        const tMs = startMs + (step / STEPS) * windowMs;
        let iob = 0;
        for (const dose of typeDoses) {
          const doseMs = new Date(dose.administeredAt).getTime();
          const elapsed = (tMs - doseMs) / 60000; // minutes
          iob += iobAtMinute(dose.units, insulinType, elapsed);
        }
        values.push(iob);
      }
      return { insulinType, values };
    });
  }, [doses, insulinTypes, startMs, windowMs, STEPS]);

  // Compute stacked totals for y-axis scaling
  const totals = useMemo(() => {
    const arr = new Array(STEPS + 1).fill(0);
    for (const s of series) {
      for (let i = 0; i <= STEPS; i++) arr[i] += s.values[i];
    }
    return arr;
  }, [series, STEPS]);

  const maxIob = Math.max(...totals, 0.5);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = height;
  const chartW = svgWidth - PADDING.left - PADDING.right;
  const chartH = svgHeight - PADDING.top - PADDING.bottom;

  // Coordinate helpers
  const xOf = (step: number) => PADDING.left + (step / STEPS) * chartW;
  const yOf = (iob: number) => PADDING.top + chartH - (iob / maxIob) * chartH;

  // Build stacked area paths
  const paths = useMemo(() => {
    const stackedPaths: Array<{ insulinType: string; d: string }> = [];
    const stackBase = new Array(STEPS + 1).fill(0);

    for (const { insulinType, values } of series) {
      const topPoints: string[] = [];
      const bottomPoints: string[] = [];

      for (let i = 0; i <= STEPS; i++) {
        const base = stackBase[i];
        const top = base + values[i];
        topPoints.push(`${xOf(i).toFixed(1)},${yOf(top).toFixed(1)}`);
        bottomPoints.push(`${xOf(i).toFixed(1)},${yOf(base).toFixed(1)}`);
        stackBase[i] = top;
      }

      const d =
        `M ${topPoints[0]} ` +
        topPoints.slice(1).map((p) => `L ${p}`).join(" ") +
        " " +
        bottomPoints.reverse().map((p) => `L ${p}`).join(" ") +
        " Z";

      stackedPaths.push({ insulinType, d });
    }

    return stackedPaths;
  }, [series, STEPS, xOf, yOf]);

  // Total IOB line
  const totalLine = useMemo(() => {
    return totals
      .map((v, i) => `${i === 0 ? "M" : "L"} ${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`)
      .join(" ");
  }, [totals, xOf, yOf]);

  // Y-axis ticks
  const yTicks = [0, maxIob * 0.25, maxIob * 0.5, maxIob * 0.75, maxIob].map((v) => ({
    label: v.toFixed(1),
    y: yOf(v),
  }));

  // X-axis ticks (hourly)
  const xTicks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const step = Math.round((i / (TICK_COUNT - 1)) * STEPS);
    const tMs = startMs + (step / STEPS) * windowMs;
    const d = new Date(tMs);
    const label = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return { step, label, x: xOf(step) };
  });

  const currentTotalIob = totals[STEPS];

  return (
    <div className="w-full space-y-3">
      {/* Current IOB badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">IOB Timeline ({windowHours}h)</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Current IOB:</span>
          <span
            className={`text-sm font-bold ${
              currentTotalIob >= 8
                ? "text-red-600"
                : currentTotalIob >= 5
                ? "text-amber-600"
                : currentTotalIob >= 2
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {currentTotalIob.toFixed(2)}U
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full"
          style={{ minWidth: 300 }}
          aria-label="IOB Timeline Chart"
        >
          {/* Grid lines */}
          {yTicks.map(({ y, label }) => (
            <g key={label}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={svgWidth - PADDING.right}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
              <text x={PADDING.left - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">
                {label}
              </text>
            </g>
          ))}

          {/* Stacked area fills */}
          {paths.map(({ insulinType, d }) => {
            const c = INSULIN_COLOURS[insulinType] ?? DEFAULT_COLOUR;
            return <path key={insulinType} d={d} fill={c.fill} />;
          })}

          {/* Total IOB line */}
          <path d={totalLine} fill="none" stroke="#0F766E" strokeWidth={2} strokeLinejoin="round" />

          {/* X-axis ticks */}
          {xTicks.map(({ label, x, step }) => (
            <g key={step}>
              <line x1={x} y1={PADDING.top + chartH} x2={x} y2={PADDING.top + chartH + 4} stroke="#D1D5DB" strokeWidth={1} />
              <text x={x} y={PADDING.top + chartH + 14} textAnchor="middle" fontSize={9} fill="#9CA3AF">
                {label}
              </text>
            </g>
          ))}

          {/* Y-axis label */}
          <text
            x={10}
            y={PADDING.top + chartH / 2}
            textAnchor="middle"
            fontSize={9}
            fill="#9CA3AF"
            transform={`rotate(-90, 10, ${PADDING.top + chartH / 2})`}
          >
            IOB (U)
          </text>
        </svg>
      </div>

      {/* Legend */}
      {insulinTypes.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {insulinTypes.map((t) => {
            const c = INSULIN_COLOURS[t] ?? DEFAULT_COLOUR;
            return (
              <div key={t} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: c.stroke, opacity: 0.8 }}
                />
                {t}
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-3 h-1 flex-shrink-0 rounded-full" style={{ backgroundColor: "#0F766E" }} />
            Total
          </div>
        </div>
      )}

      {doses.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">
          No doses logged in the last {windowHours} hours.
        </p>
      )}
    </div>
  );
}

export default IobTimelineChart;
