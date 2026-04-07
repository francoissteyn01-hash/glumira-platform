/**
 * GluMira™ V7 — Stacking Curve Chart
 * Full-width 24-hour AreaChart with gradient fill mapped to pressure thresholds.
 * Colour: green → yellow → orange → red
 */

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";

export interface StackingPoint {
  time: string;
  totalIOB: number;
  pressure: "light" | "moderate" | "strong" | "overlap";
}

interface Props {
  data: StackingPoint[];
  glucoseUnits?: "mmol" | "mg";
}

const PRESSURE_COLOURS: Record<string, string> = {
  light: "#22c55e",
  moderate: "#eab308",
  strong: "#f97316",
  overlap: "#ef4444",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as StackingPoint;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8,
      padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px" }}>{formatTime(d.time)}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px" }}>
        {d.totalIOB.toFixed(2)} U
      </p>
      <p style={{ fontSize: 12, color: PRESSURE_COLOURS[d.pressure], fontWeight: 600, margin: 0, textTransform: "capitalize" }}>
        {d.pressure === "overlap" ? "Overlap Risk" : d.pressure}
      </p>
    </div>
  );
}

export default function StackingCurve({ data }: Props) {
  // Build gradient stops from the data's pressure distribution
  const gradientId = "stackingGradient";

  // Assign colour per data point based on pressure
  const colouredData = useMemo(
    () => data.map((d) => ({ ...d, fill: PRESSURE_COLOURS[d.pressure] })),
    [data]
  );

  // Build gradient offset stops
  const gradientStops = useMemo(() => {
    if (data.length === 0) return [];
    const maxIOB = Math.max(...data.map((d) => d.totalIOB), 0.01);
    return [
      { offset: "0%", color: "#22c55e" },     // light
      { offset: "25%", color: "#eab308" },     // moderate
      { offset: "50%", color: "#f97316" },     // strong
      { offset: "75%", color: "#ef4444" },     // overlap
      { offset: "100%", color: "#ef4444" },
    ];
  }, [data]);

  if (data.length === 0) {
    return (
      <div style={{
        background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)",
        padding: 32, textAlign: "center",
      }}>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          No insulin data for today. Log a dose to see the stacking curve.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: "16px 16px 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 4px" }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
          Insulin Stacking Curve
        </h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {(["light", "moderate", "strong", "overlap"] as const).map((p) => (
            <span key={p} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: PRESSURE_COLOURS[p], display: "inline-block" }} />
              {p === "overlap" ? "Overlap Risk" : p.charAt(0).toUpperCase() + p.slice(1)}
            </span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={colouredData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
              {gradientStops.map((s, i) => (
                <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={0.7} />
              ))}
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-divider)" />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            tickFormatter={(v: number) => `${v.toFixed(1)}`}
            label={{ value: "IOB (U)", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "var(--text-secondary)" }, offset: 20 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="totalIOB"
            stroke="var(--text-primary)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
