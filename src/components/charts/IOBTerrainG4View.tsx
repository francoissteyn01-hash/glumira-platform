/**
 * GluMira™ V7 — IOBTerrainG4View
 * "Individual Curves" tab — renders each insulin dose as a separate area
 * series with tap-to-highlight interaction. Extracted from IOBTerrainChart.tsx.
 */

import { useState } from "react";
import {
  ComposedChart, Area, XAxis, YAxis,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { InsulinEntry, TerrainPoint } from "@/lib/pharmacokinetics";

type ChartPoint = { [key: string]: unknown } & TerrainPoint;

type EntryCurveItem = {
  entry: InsulinEntry;
  idx: number;
  colour: string;
  stackColour: string;
  curve: Array<{ minute: number; iob: number }>;
};

function minutesToLabel(min: number): string {
  const MINUTES_PER_DAY = 1440;
  const day = Math.floor(min / MINUTES_PER_DAY) + 1;
  const dm  = ((min % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hh  = String(Math.floor(dm / 60)).padStart(2, "0");
  const mm  = String(dm % 60).padStart(2, "0");
  return day > 1 ? `D${day} ${hh}:${mm}` : `${hh}:${mm}`;
}

export function G4DensityView({ entryCurves, enrichedPoints, totalMinutes, graphStartMinute, xTicks, compact }: {
  entryCurves: EntryCurveItem[];
  enrichedPoints: ChartPoint[];
  totalMinutes: number;
  graphStartMinute: number;
  xTicks: number[];
  compact: boolean;
}) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const chartHeight = compact ? 200 : 260;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 4px" }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}>
          Individual Curves
        </h4>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Tap a curve to highlight</span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 4px", marginBottom: 8 }}>
        {entryCurves.map(({ entry, colour }) => (
          <button key={entry.id} onClick={() => setHighlighted(highlighted === entry.id ? null : entry.id)}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 4, border: "1px solid",
              borderColor: highlighted === entry.id ? colour : "var(--border)",
              background: highlighted === entry.id ? colour + "20" : "transparent",
              fontSize: 10, fontWeight: 500, color: highlighted === entry.id ? colour : "var(--text-secondary)",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: colour }} />
            {entry.insulinName} {entry.dose}U
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart data={enrichedPoints} margin={{ top: 4, right: 8, left: compact ? -12 : 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} strokeWidth={0.75} vertical={false} />
          <XAxis dataKey="minute" type="number" domain={[graphStartMinute, totalMinutes]} ticks={xTicks} tickFormatter={minutesToLabel}
            tick={{ fontSize: 10, fill: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}
            axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}
            tickFormatter={(v: number) => `${v.toFixed(1)}`}
            axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />

          {entryCurves.map(({ entry, colour }) => {
            const isHighlighted = highlighted === null || highlighted === entry.id;
            return (
              <Area key={entry.id} type="monotone" dataKey={entry.id}
                stroke={colour} strokeWidth={isHighlighted ? 1.5 : 1}
                strokeOpacity={isHighlighted ? 0.9 : 0.15}
                fill={colour} fillOpacity={isHighlighted ? 0.15 : 0.02}
                dot={false} animationDuration={0}
                name={`${entry.insulinName} ${entry.dose}U`} />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
