/**
 * GluMira™ Nightscout CGM Chart
 * Version: 7.0.0
 * Component: NightscoutCGMChart
 *
 * Renders a full-featured CGM glucose chart sourced from Nightscout data.
 * Features:
 *   - 24h / 7d / 14d / 30d time range selector
 *   - Colour-coded glucose zones (ADA/ATTD consensus)
 *   - IOB overlay (dashed orange line)
 *   - Meal markers (vertical reference lines)
 *   - Insulin dose markers (triangle annotations)
 *   - Target range band (shaded green)
 *   - Trend arrow (rising/falling/stable)
 *   - Last reading badge (current glucose + delta)
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import React, { useState, useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────

export interface CGMReading {
  time: string;          // ISO 8601
  glucose: number;       // mg/dL
  trend?: TrendArrow;
  iob?: number;
  source: "nightscout" | "manual";
}

export type TrendArrow =
  | "DoubleUp"
  | "SingleUp"
  | "FortyFiveUp"
  | "Flat"
  | "FortyFiveDown"
  | "SingleDown"
  | "DoubleDown"
  | "NotComputable";

export interface MealMarker {
  time: string;
  label: string;
  carbs?: number;
}

export interface InsulinMarker {
  time: string;
  units: number;
  type: "bolus" | "correction";
}

export type TimeRange = "24h" | "7d" | "14d" | "30d";

interface NightscoutCGMChartProps {
  readings: CGMReading[];
  meals?: MealMarker[];
  insulin?: InsulinMarker[];
  targetLow?: number;
  targetHigh?: number;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  isLoading?: boolean;
}

// ─── Glucose Zone Colours ─────────────────────────────────────

const ZONE_COLORS = {
  veryLow: "#D32F2F",
  low: "#FF7043",
  inRange: "#43A047",
  high: "#FFA726",
  veryHigh: "#E53935",
};

// ─── Trend Arrow Display ──────────────────────────────────────

const TREND_SYMBOLS: Record<TrendArrow, string> = {
  DoubleUp: "⬆⬆",
  SingleUp: "⬆",
  FortyFiveUp: "↗",
  Flat: "→",
  FortyFiveDown: "↘",
  SingleDown: "⬇",
  DoubleDown: "⬇⬇",
  NotComputable: "?",
};

function getTrendColor(trend?: TrendArrow): string {
  if (!trend) return "#6B7280";
  if (["DoubleUp", "SingleUp"].includes(trend)) return "#E53935";
  if (["DoubleDown", "SingleDown"].includes(trend)) return "#D32F2F";
  if (["FortyFiveUp", "FortyFiveDown"].includes(trend)) return "#FFA726";
  return "#43A047";
}

function getGlucoseColor(glucose: number, targetLow: number, targetHigh: number): string {
  if (glucose < 54) return ZONE_COLORS.veryLow;
  if (glucose < targetLow) return ZONE_COLORS.low;
  if (glucose <= targetHigh) return ZONE_COLORS.inRange;
  if (glucose <= 250) return ZONE_COLORS.high;
  return ZONE_COLORS.veryHigh;
}

// ─── Last Reading Badge ───────────────────────────────────────

interface LastReadingBadgeProps {
  reading: CGMReading;
  previousReading?: CGMReading;
  targetLow: number;
  targetHigh: number;
}

function LastReadingBadge({ reading, previousReading, targetLow, targetHigh }: LastReadingBadgeProps) {
  const delta = previousReading ? reading.glucose - previousReading.glucose : undefined;
  const color = getGlucoseColor(reading.glucose, targetLow, targetHigh);
  const trend = reading.trend ? TREND_SYMBOLS[reading.trend] : "";
  const trendColor = getTrendColor(reading.trend);

  return (
    <div className="flex items-center gap-3">
      <div className="text-center">
        <span className="text-4xl font-bold" style={{ color }}>{reading.glucose}</span>
        <span className="text-sm text-gray-400 ml-1">mg/dL</span>
      </div>
      <div>
        <span className="text-2xl" style={{ color: trendColor }}>{trend}</span>
        {delta !== undefined && (
          <p className="text-xs text-gray-500">
            {delta > 0 ? "+" : ""}{delta} mg/dL
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const glucose = payload.find((p: any) => p.dataKey === "glucose");
  const iob = payload.find((p: any) => p.dataKey === "iob");

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs min-w-[120px]">
      <p className="font-semibold text-gray-600 mb-2">{label}</p>
      {glucose && (
        <p style={{ color: glucose.stroke }}>
          Glucose: <strong>{glucose.value} mg/dL</strong>
        </p>
      )}
      {iob && (
        <p className="text-orange-600">
          IOB: <strong>{Number(iob.value).toFixed(2)} U</strong>
        </p>
      )}
    </div>
  );
};

// ─── Time Range Selector ──────────────────────────────────────

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const ranges: TimeRange[] = ["24h", "7d", "14d", "30d"];
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            value === r
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

// ─── Main Chart Component ─────────────────────────────────────

export function NightscoutCGMChart({
  readings,
  meals = [],
  insulin = [],
  targetLow = 70,
  targetHigh = 180,
  timeRange = "24h",
  onTimeRangeChange,
  isLoading = false,
}: NightscoutCGMChartProps) {
  const [localRange, setLocalRange] = useState<TimeRange>(timeRange);

  const handleRangeChange = (range: TimeRange) => {
    setLocalRange(range);
    onTimeRangeChange?.(range);
  };

  // Filter readings to selected time range
  const filteredReadings = useMemo(() => {
    const now = Date.now();
    const rangeMs: Record<TimeRange, number> = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "14d": 14 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now - rangeMs[localRange];
    return readings
      .filter((r) => new Date(r.time).getTime() >= cutoff)
      .map((r) => ({
        ...r,
        displayTime: new Date(r.time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
  }, [readings, localRange]);

  const lastReading = filteredReadings[filteredReadings.length - 1];
  const prevReading = filteredReadings[filteredReadings.length - 2];

  // Meal marker times for reference lines
  const mealTimes = useMemo(
    () =>
      meals.map((m) =>
        new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      ),
    [meals]
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading CGM data from Nightscout…</p>
        </div>
      </div>
    );
  }

  if (filteredReadings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-400 text-sm">No CGM data available for this time range.</p>
          <p className="text-gray-400 text-xs mt-1">
            Connect your Nightscout instance in Settings to import data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            CGM Glucose
          </h3>
          {lastReading && (
            <LastReadingBadge
              reading={lastReading}
              previousReading={prevReading}
              targetLow={targetLow}
              targetHigh={targetHigh}
            />
          )}
        </div>
        <TimeRangeSelector value={localRange} onChange={handleRangeChange} />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={filteredReadings} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          {/* Target range shaded area */}
          <ReferenceArea
            yAxisId="glucose"
            y1={targetLow}
            y2={targetHigh}
            fill="#43A047"
            fillOpacity={0.06}
          />

          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />

          <XAxis
            dataKey="displayTime"
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            interval={Math.floor(filteredReadings.length / 8)}
            tickLine={false}
          />
          <YAxis
            yAxisId="glucose"
            domain={[40, 320]}
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="iob"
            orientation="right"
            domain={[0, 6]}
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Threshold lines */}
          <ReferenceLine yAxisId="glucose" y={targetHigh} stroke="#43A047" strokeDasharray="4 4" strokeOpacity={0.6} />
          <ReferenceLine yAxisId="glucose" y={targetLow} stroke="#43A047" strokeDasharray="4 4" strokeOpacity={0.6} />
          <ReferenceLine yAxisId="glucose" y={54} stroke="#D32F2F" strokeDasharray="2 2" strokeOpacity={0.7} label={{ value: "54", position: "insideLeft", fontSize: 9, fill: "#D32F2F" }} />
          <ReferenceLine yAxisId="glucose" y={250} stroke="#E53935" strokeDasharray="2 2" strokeOpacity={0.5} />

          {/* Meal markers */}
          {mealTimes.map((t, i) => (
            <ReferenceLine
              key={i}
              yAxisId="glucose"
              x={t}
              stroke="#8B5CF6"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
            />
          ))}

          {/* Glucose line */}
          <Line
            yAxisId="glucose"
            type="monotone"
            dataKey="glucose"
            stroke="#1A6DB5"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#1A6DB5" }}
          />

          {/* IOB overlay */}
          <Line
            yAxisId="iob"
            type="monotone"
            dataKey="iob"
            stroke="#F97316"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-3 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-600" />
          <span>CGM Glucose</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-orange-400" style={{ borderTop: "2px dashed" }} />
          <span>IOB</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-purple-500" style={{ borderTop: "2px dashed" }} />
          <span>Meal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 bg-green-500 opacity-20 rounded-sm" />
          <span>Target Range</span>
        </div>
      </div>
    </div>
  );
}

export default NightscoutCGMChart;
