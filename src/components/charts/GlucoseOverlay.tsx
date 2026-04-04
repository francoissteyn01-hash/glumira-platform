/**
 * GluMira™ V7 — Glucose Overlay Chart
 * Line chart with high/low zone bands. Supports mmol/L and mg/dL.
 */

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceArea, ReferenceLine,
} from "recharts";

export interface GlucosePoint {
  time: string;
  value: number; // always stored in mmol/L internally
}

interface Props {
  data: GlucosePoint[];
  units: "mmol" | "mg";
  targetLow?: number;  // mmol/L — default 3.9
  targetHigh?: number; // mmol/L — default 10.0
}

const MMOL_TO_MG = 18.0182;

function convert(mmol: number, units: "mmol" | "mg"): number {
  return units === "mg" ? Math.round(mmol * MMOL_TO_MG) : Math.round(mmol * 10) / 10;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function unitLabel(units: "mmol" | "mg"): string {
  return units === "mmol" ? "mmol/L" : "mg/dL";
}

export default function GlucoseOverlay({
  data,
  units,
  targetLow = 3.9,
  targetHigh = 10.0,
}: Props) {
  const displayData = data.map((d) => ({
    time: d.time,
    value: convert(d.value, units),
  }));

  const low = convert(targetLow, units);
  const high = convert(targetHigh, units);
  const yMax = units === "mg" ? 400 : 22;
  const yMin = 0;

  if (data.length === 0) {
    return (
      <div style={{
        background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6",
        padding: 32, textAlign: "center",
      }}>
        <p style={{ fontSize: 14, color: "#52667a", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          No glucose data available.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", padding: "16px 16px 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 4px" }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a2a5e", fontFamily: "'Playfair Display', serif" }}>
          Glucose ({unitLabel(units)})
        </h3>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#52667a" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#fef9c3", border: "1px solid #eab308", display: "inline-block" }} />High
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#52667a" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#22c55e", display: "inline-block" }} />In Range
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#52667a" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#fecaca", border: "1px solid #ef4444", display: "inline-block" }} />Low
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={displayData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />

          {/* Low zone background (red) */}
          <ReferenceArea y1={yMin} y2={low} fill="#fecaca" fillOpacity={0.35} />

          {/* High zone background (yellow) */}
          <ReferenceArea y1={high} y2={yMax} fill="#fef9c3" fillOpacity={0.4} />

          {/* Target range lines */}
          <ReferenceLine y={low} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} />
          <ReferenceLine y={high} stroke="#eab308" strokeDasharray="4 4" strokeWidth={1} />

          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            tick={{ fontSize: 11, fill: "#52667a" }}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            domain={[yMin, "auto"]}
            tick={{ fontSize: 11, fill: "#52667a" }}
            label={{ value: unitLabel(units), angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#52667a" }, offset: 20 }}
          />
          <Tooltip
            labelFormatter={(label: any) => formatTime(String(label))}
            formatter={(value: any) => [`${value} ${unitLabel(units)}`, "Glucose"]}
            contentStyle={{
              background: "#ffffff", border: "1px solid #dee2e6", borderRadius: 8,
              fontSize: 12, fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1a2a5e"
            strokeWidth={2}
            dot={{ fill: "#1a2a5e", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#2ab5c1" }}
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
