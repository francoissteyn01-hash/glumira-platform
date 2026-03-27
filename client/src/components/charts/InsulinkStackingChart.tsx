/**
 * GluMira™ Insulin Stacking Chart — InsulinkStackingChart
 * Version: 7.0.0
 *
 * Visualises combined IOB over time for multiple overlapping doses.
 * Uses Recharts AreaChart with per-dose stacked areas and a risk band overlay.
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import type { StackingAnalysisResult, StackingDose } from "../../../../server/iob/iob-stacking";

// ─── Types ────────────────────────────────────────────────────

interface InsulinkStackingChartProps {
  result: StackingAnalysisResult;
  /** Show the chart in compact mode (no legend, reduced height) */
  compact?: boolean;
}

// ─── Colour Palette ───────────────────────────────────────────

const DOSE_COLOURS = [
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
];

const RISK_COLOURS: Record<StackingAnalysisResult["riskTier"], string> = {
  low: "#10b981",
  moderate: "#f59e0b",
  high: "#ef4444",
  critical: "#7f1d1d",
};

const RISK_LABELS: Record<StackingAnalysisResult["riskTier"], string> = {
  low: "Low stacking risk",
  moderate: "Moderate stacking",
  high: "High stacking",
  critical: "Critical stacking",
};

// ─── Custom Tooltip ───────────────────────────────────────────

function StackingTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const totalIob = payload.reduce((sum: number, p: any) => sum + (p.value ?? 0), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">T+{label} min</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium text-gray-800">{p.value.toFixed(2)}U</span>
        </div>
      ))}
      <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between">
        <span className="text-gray-500">Combined IOB</span>
        <span className="font-bold text-gray-900">{totalIob.toFixed(2)}U</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function InsulinkStackingChart({ result, compact = false }: InsulinkStackingChartProps) {
  const { timeline, doses, peakIob, riskTier, riskScore, narrative } = result;

  // Build chart data — one row per timeline point
  const chartData = useMemo(
    () =>
      timeline.map((point) => ({
        t: point.minutesElapsed,
        ...Object.fromEntries(
          doses.map((d) => [d.id, point.perDose[d.id] ?? 0])
        ),
      })),
    [timeline, doses]
  );

  const riskColour = RISK_COLOURS[riskTier];
  const chartHeight = compact ? 160 : 260;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      {!compact && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Insulin Stacking Analysis</h3>
            <p className="text-xs text-gray-400 mt-0.5">Combined IOB across {doses.length} active dose{doses.length !== 1 ? "s" : ""}</p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: `${riskColour}20`, color: riskColour }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: riskColour }}
            />
            {RISK_LABELS[riskTier]} ({riskScore}/100)
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="px-4 pt-4 pb-2">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              {doses.map((dose, i) => (
                <linearGradient key={dose.id} id={`grad-${dose.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={DOSE_COLOURS[i % DOSE_COLOURS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={DOSE_COLOURS[i % DOSE_COLOURS.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="t"
              tickFormatter={(v) => `${v}m`}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              interval={compact ? 47 : 23}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}U`}
            />
            <Tooltip content={<StackingTooltip />} />
            {!compact && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {/* Peak IOB reference line */}
            <ReferenceLine
              y={peakIob}
              stroke={riskColour}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Peak ${peakIob.toFixed(1)}U`,
                position: "insideTopRight",
                fontSize: 10,
                fill: riskColour,
              }}
            />
            {/* Stacked areas per dose */}
            {doses.map((dose, i) => (
              <Area
                key={dose.id}
                type="monotone"
                dataKey={dose.id}
                name={`${dose.insulinType} ${dose.units}U`}
                stackId="iob"
                stroke={DOSE_COLOURS[i % DOSE_COLOURS.length]}
                fill={`url(#grad-${dose.id})`}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Narrative */}
      {!compact && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-600 leading-relaxed">{narrative}</p>
          <p className="text-xs text-gray-400 mt-2">
            GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice. Not a dosing tool.
          </p>
        </div>
      )}
    </div>
  );
}

export default InsulinkStackingChart;
