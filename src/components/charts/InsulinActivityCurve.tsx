/**
 * GluMira™ V7 — Insulin Activity Curve
 * Individual bell curves per dose.
 * Basal: teal (#2ab5c1), wide and flat.
 * Bolus: orange (#f59e0b), tall and narrow.
 * Overlap zones: purple (#7c3aed).
 */

import {
  ComposedChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

export interface DoseCurve {
  id: string;
  label: string; // e.g. "08:00 NovoRapid 5U"
  type: "basal" | "bolus";
  /** Array of { time, iob } at 5-min intervals */
  points: { time: string; iob: number }[];
}

interface ActivityPoint {
  time: string;
  [doseId: string]: number | string;
}

interface Props {
  curves: DoseCurve[];
}

const BASAL_COLOUR = "#2ab5c1";
const BOLUS_COLOUR = "#f59e0b";
const OVERLAP_COLOUR = "#7c3aed";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function mergeData(curves: DoseCurve[]): ActivityPoint[] {
  const map = new Map<string, ActivityPoint>();

  for (const curve of curves) {
    for (const p of curve.points) {
      if (!map.has(p.time)) {
        map.set(p.time, { time: p.time });
      }
      map.get(p.time)![curve.id] = p.iob;
    }
  }

  // Add overlap computation
  const entries = Array.from(map.values()).sort((a, b) => a.time.localeCompare(b.time));
  for (const entry of entries) {
    let basalTotal = 0;
    let bolusTotal = 0;
    for (const curve of curves) {
      const val = (entry[curve.id] as number) ?? 0;
      if (curve.type === "basal") basalTotal += val;
      else bolusTotal += val;
    }
    entry._overlap = Math.min(basalTotal, bolusTotal);
  }

  return entries;
}

export default function InsulinActivityCurve({ curves }: Props) {
  const data = mergeData(curves);

  if (curves.length === 0) {
    return (
      <div style={{
        background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6",
        padding: 32, textAlign: "center",
      }}>
        <p style={{ fontSize: 14, color: "#52667a", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          No insulin activity to display.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", padding: "16px 16px 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 4px" }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a2a5e", fontFamily: "'Playfair Display', serif" }}>
          Insulin Activity Curves
        </h3>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#52667a" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: BASAL_COLOUR, display: "inline-block" }} />Basal
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#52667a" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: BOLUS_COLOUR, display: "inline-block" }} />Bolus
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#52667a" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: OVERLAP_COLOUR, display: "inline-block" }} />Overlap
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            tick={{ fontSize: 11, fill: "#52667a" }}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#52667a" }}
            tickFormatter={(v: number) => `${v.toFixed(1)}`}
          />
          <Tooltip
            labelFormatter={formatTime}
            formatter={(value: number, name: string) => [`${value.toFixed(2)} U`, name]}
            contentStyle={{
              background: "#ffffff", border: "1px solid #dee2e6", borderRadius: 8,
              fontSize: 12, fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          />
          {/* Overlap zone (rendered first, behind) */}
          <Area
            type="monotone"
            dataKey="_overlap"
            stroke="none"
            fill={OVERLAP_COLOUR}
            fillOpacity={0.25}
            name="Overlap"
            animationDuration={400}
          />
          {/* Individual dose curves */}
          {curves.map((curve) => (
            <Area
              key={curve.id}
              type="monotone"
              dataKey={curve.id}
              stroke={curve.type === "basal" ? BASAL_COLOUR : BOLUS_COLOUR}
              strokeWidth={curve.type === "basal" ? 1.5 : 2}
              fill={curve.type === "basal" ? BASAL_COLOUR : BOLUS_COLOUR}
              fillOpacity={0.12}
              name={curve.label}
              animationDuration={400}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
