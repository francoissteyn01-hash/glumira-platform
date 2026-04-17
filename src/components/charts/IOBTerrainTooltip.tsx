/**
 * GluMira™ V7 — IOBTerrainTooltip
 * Recharts custom tooltip for the IOB Terrain chart.
 * No calculation logic — pure display.
 */

import type { InsulinEntry } from "@/lib/pharmacokinetics";
import type { TerrainPoint } from "@/lib/pharmacokinetics";

const PRESSURE_COLOURS = {
  light: "#4CAF50", moderate: "#F59E0B", strong: "#F87171", overlap: "#EF4444",
} as const;

const GLUCOSE_COLOUR = "#f59e0b";

type ChartPoint = { glucose?: number; [key: string]: unknown } & TerrainPoint;

type EntryCurve = {
  entry: InsulinEntry;
  colour: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function StackedTooltip({ active, payload, entryCurves }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as ChartPoint;
  const breakdown: { name: string; time: string; iob: number; colour: string }[] = [];
  if (entryCurves) {
    for (const { entry, colour } of (entryCurves as EntryCurve[])) {
      const iob = d[entry.id] as number | undefined;
      if (iob !== undefined && iob > 0.005) {
        breakdown.push({ name: entry.insulinName, time: entry.time, iob, colour });
      }
    }
  }
  breakdown.sort((a, b) => b.iob - a.iob);
  // Rule 53 audit — mobile tooltip overflow on 393px S23 FE. Cap at 4 rows.
  const MAX_ROWS = 4;
  const visible  = breakdown.slice(0, MAX_ROWS);
  const overflow = Math.max(0, breakdown.length - MAX_ROWS);

  return (
    <div style={{ background: "var(--bg-card, #fff)", border: "1px solid var(--border, #e2e8f0)", borderRadius: 10, padding: "12px 16px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontFamily: "'DM Sans', system-ui, sans-serif", minWidth: 200, maxWidth: 280 }}>
      <p style={{ fontSize: "clamp(12px, 3vw, 13px)", color: "var(--text-primary)", margin: "0 0 8px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
        {d.label} — Total IOB: {d.totalIOB.toFixed(2)}U
      </p>
      {visible.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
          {visible.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "clamp(10px, 2.8vw, 11px)", color: "var(--text-secondary)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: b.colour, flexShrink: 0 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {b.name} ({b.time}): {b.iob.toFixed(2)}U
              </span>
            </div>
          ))}
          {overflow > 0 && (
            <div style={{ fontSize: 10, color: "var(--text-secondary)", opacity: 0.7, fontStyle: "italic" }}>
              +{overflow} more
            </div>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
        <span style={{ color: PRESSURE_COLOURS[d.pressure], fontWeight: 600 }}>
          Pressure: {d.pressure === "overlap" ? "OVERLAP" : d.pressure.toUpperCase()}
        </span>
      </div>
      {d.glucose !== undefined && (
        <p style={{ fontSize: 12, color: GLUCOSE_COLOUR, margin: "6px 0 0", fontWeight: 600 }}>Glucose: {(d.glucose as number).toFixed(1)}</p>
      )}
    </div>
  );
}
