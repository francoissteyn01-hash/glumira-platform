/**
 * GluMira™ V7 — Insulin Activity Curve
 * Individual bell curves per dose with gradient fills, smooth bezier interpolation.
 * Basal: teal (#2ab5c1) with gradient fill.
 * Bolus: navy (#1a2a5e) stroke, lighter fill.
 * Overlap/danger zones: red gradient fill.
 */

import {
  ComposedChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

export interface DoseCurve {
  id: string;
  label: string;
  type: "basal" | "bolus";
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
const BOLUS_COLOUR = "#1a2a5e";
const DANGER_COLOUR = "#EF4444";

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

function ChartSkeleton() {
  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)",
      padding: 16, minHeight: 300,
    }}>
      <div className="skeleton" style={{ width: 180, height: 20, marginBottom: 16 }} />
      <div style={{ position: "relative", height: 240 }}>
        <div className="skeleton" style={{ width: "100%", height: "100%", borderRadius: 8 }} />
        {/* Faint grid lines */}
        {[0.25, 0.5, 0.75].map(pct => (
          <div key={pct} style={{ position: "absolute", top: `${pct * 100}%`, left: 0, right: 0, height: 1, background: "var(--border)", opacity: 0.3 }} />
        ))}
      </div>
    </div>
  );
}

export { ChartSkeleton };

export default function InsulinActivityCurve({ curves }: Props) {
  const data = mergeData(curves);

  if (curves.length === 0) {
    return (
      <div style={{
        background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)",
        padding: 32, textAlign: "center", minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          No insulin activity to display.
        </p>
      </div>
    );
  }

  const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)",
      padding: "16px 16px 8px", minHeight: 300,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 4px" }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
          Insulin Activity Curves
        </h3>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-secondary)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: BASAL_COLOUR, display: "inline-block" }} />Basal
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-secondary)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: BOLUS_COLOUR, display: "inline-block" }} />Bolus
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-secondary)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: DANGER_COLOUR, display: "inline-block" }} />Overlap
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="basalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BASAL_COLOUR} stopOpacity={0.3} />
              <stop offset="100%" stopColor={BASAL_COLOUR} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="bolusGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BOLUS_COLOUR} stopOpacity={0.2} />
              <stop offset="100%" stopColor={BOLUS_COLOUR} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="overlapGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={DANGER_COLOUR} stopOpacity={0.2} />
              <stop offset="100%" stopColor={DANGER_COLOUR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            tick={{ fontSize: 12, fill: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
            interval="preserveStartEnd"
            minTickGap={60}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}
            tickFormatter={(v: number) => `${v.toFixed(1)}`}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={{ stroke: "var(--border)" }}
            label={{
              value: "IOB (Units)",
              angle: -90,
              position: "insideLeft",
              offset: 12,
              style: { fontSize: 11, fill: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" },
            }}
          />
          <Tooltip
            labelFormatter={(label: any) => formatTime(String(label))}
            formatter={(value: any, name: any) => [`${Number(value).toFixed(2)} U`, name]}
            contentStyle={{
              background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
              fontSize: 12, fontFamily: "'DM Sans', system-ui, sans-serif",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          {/* Overlap/danger zone */}
          <Area
            type="natural"
            dataKey="_overlap"
            stroke={DANGER_COLOUR}
            strokeWidth={1}
            strokeOpacity={0.4}
            fill="url(#overlapGradient)"
            name="Overlap"
            animationDuration={prefersReduced ? 0 : 800}
            dot={false}
          />
          {/* Individual dose curves */}
          {curves.map((curve) => (
            <Area
              key={curve.id}
              type="natural"
              dataKey={curve.id}
              stroke={curve.type === "basal" ? BASAL_COLOUR : BOLUS_COLOUR}
              strokeWidth={curve.type === "basal" ? 2 : 2.5}
              fill={curve.type === "basal" ? "url(#basalGradient)" : "url(#bolusGradient)"}
              name={curve.label}
              animationDuration={prefersReduced ? 0 : 800}
              dot={false}
              activeDot={{
                r: 4,
                stroke: curve.type === "basal" ? BASAL_COLOUR : BOLUS_COLOUR,
                strokeWidth: 2,
                fill: "var(--bg-card)",
              }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
