/**
 * GluMira™ V7 — IOB Pressure Map (Recharts)
 *
 * Matches the Riley pressure-map design: orange stroke, teal fill,
 * injection markers with labels, heatmap bar, and summary stat cards.
 */

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
  Label,
} from "recharts";
import type { InsulinEntry } from "@/lib/pharmacokinetics";
import { generate24HourIOBCurve, type IOBCurvePoint } from "@/utils/insulinDensity";

/* ── Types ──────────────────────────────────────────────────────────────── */

interface PeakZone {
  startHour: number;
  endHour: number;
  label: string;
}

interface IOBMountainGraphProps {
  injections: InsulinEntry[];
  peakZone?: PeakZone;
}

/* ── Pressure-band colours (matches Riley screenshot) ───────────────────── */

const BAND = {
  light:    { bg: "#d1fae5", label: "Light <25%",       color: "#6ee7b7" },
  moderate: { bg: "#fef3c7", label: "Moderate 25–50%",  color: "#fbbf24" },
  strong:   { bg: "#fed7aa", label: "Strong 50–75%",    color: "#f97316" },
  overlap:  { bg: "#fecaca", label: "Overlap >75%",     color: "#ef4444" },
};

function pressureBand(ratio: number) {
  if (ratio >= 0.75) return BAND.overlap;
  if (ratio >= 0.50) return BAND.strong;
  if (ratio >= 0.25) return BAND.moderate;
  return BAND.light;
}

/* ── Tooltip ────────────────────────────────────────────────────────────── */

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: IOBCurvePoint = payload[0].payload;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        fontSize: 13,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div style={{ fontWeight: 600, color: "#1a2a5e" }}>{d.timeLabel}</div>
      <div style={{ marginTop: 4 }}>
        <strong>{d.totalIOB}U</strong> insulin pressure
      </div>
    </div>
  );
}

/* ── Heatmap bar ────────────────────────────────────────────────────────── */

function HeatmapBar({ data, maxIOB }: { data: IOBCurvePoint[]; maxIOB: number }) {
  // Sample every 10 min → 145 points across 24h
  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          display: "flex",
          height: 28,
          borderRadius: 6,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        {data.map((pt, i) => {
          const ratio = maxIOB > 0 ? pt.totalIOB / maxIOB : 0;
          const band = pressureBand(ratio);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: band.color,
                opacity: Math.max(ratio * 1.2, 0.15),
              }}
              title={`${pt.timeLabel}: ${pt.totalIOB}U`}
            />
          );
        })}
      </div>
      {/* Hour labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#6B7280" }}>
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:59</span>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */

export default function IOBMountainGraph({
  injections,
  peakZone,
}: IOBMountainGraphProps) {
  const data = useMemo(() => generate24HourIOBCurve(injections), [injections]);
  const maxIOB = Math.max(...data.map((d) => d.totalIOB), 1);

  // Compute summary stats
  const peakPoint = data.reduce((a, b) => (b.totalIOB > a.totalIOB ? b : a), data[0]);
  const lowestPoint = data.reduce((a, b) => (b.totalIOB < a.totalIOB ? b : a), data[0]);
  const strongHours = data.filter((d) => d.totalIOB / maxIOB >= 0.5).length / 6; // 10-min intervals → hours

  // Injection hour markers for reference lines
  const injHours = injections.map((inj) => {
    const [h, m] = inj.time.split(":").map(Number);
    return { hour: h + m / 60, label: `${inj.insulinName} ${inj.dose}U`, color: inj.type === "basal" ? "#2ab5c1" : "#e06666" };
  });

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "1px solid #e2e8f0", marginBottom: 24 }}>
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16, fontSize: 13 }}>
        {Object.values(BAND).map((b) => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: b.color }} />
            <span style={{ color: "#4B5563" }}>{b.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 30, right: 30, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="iobPressureFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2ab5c1" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#2ab5c1" stopOpacity={0.08} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

          <XAxis
            dataKey="hours"
            type="number"
            domain={[0, 24]}
            ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
            tickFormatter={(h: number) => {
              const hh = String(Math.floor(h)).padStart(2, "0");
              return `${hh}:00`;
            }}
            stroke="#9CA3AF"
            style={{ fontSize: 12 }}
          />

          <YAxis
            label={{
              value: "Insulin pressure (units)",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#6B7280", fontSize: 12 },
            }}
            tickFormatter={(v: number) => `${v}U`}
            domain={[0, Math.ceil(maxIOB + 1)]}
            stroke="#9CA3AF"
            style={{ fontSize: 12 }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Injection time markers */}
          {injHours.map((inj, i) => (
            <ReferenceLine
              key={i}
              x={inj.hour}
              stroke={inj.color}
              strokeDasharray="5 5"
              strokeWidth={1.5}
            >
              <Label
                value={inj.label}
                position="top"
                fill={inj.color}
                fontSize={11}
                fontWeight="600"
              />
            </ReferenceLine>
          ))}

          <Area
            type="monotone"
            dataKey="totalIOB"
            stroke="#f59e0b"
            strokeWidth={2.5}
            fill="url(#iobPressureFill)"
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Heatmap bar */}
      <HeatmapBar data={data} maxIOB={maxIOB} />

      {/* Summary stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 20 }}>
        <StatCard label="Peak pressure" value={`${peakPoint.totalIOB}U`} />
        <StatCard label="Peak window" value={peakPoint.timeLabel.replace(/ (AM|PM)/, "")} />
        <StatCard label="Lowest pressure" value={`${lowestPoint.totalIOB}U @ ${lowestPoint.timeLabel.replace(/ (AM|PM)/, "")}`} />
        <StatCard label="Hours in Strong/Overlap" value={`${Math.round(strongHours)}h`} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: "14px 16px",
    }}>
      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#1a2a5e" }}>{value}</div>
    </div>
  );
}
