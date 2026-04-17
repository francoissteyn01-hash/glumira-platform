/**
 * GluMira™ V7 — IOBTerrainLegend
 * Display-only sub-components: LegendDot, PressureLegend, SummaryStats,
 * DangerWindowBadges. Extracted from IOBTerrainChart.tsx for focus.
 * No calculation logic.
 */

import type { DangerWindow } from "@/lib/pharmacokinetics";

function minutesToTime(min: number): string {
  const MINUTES_PER_DAY = 1440;
  const dm = ((min % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${String(Math.floor(dm / 60)).padStart(2, "0")}:${String(dm % 60).padStart(2, "0")}`;
}

export function LegendDot({ colour, label }: { colour: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: colour, display: "inline-block" }} />{label}
    </span>
  );
}

export function PressureLegend() {
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", padding: "6px 0 2px", fontSize: 10, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "transparent", border: "1px solid var(--border)" }} /> Light</span>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#F59E0B", opacity: 0.3 }} /> Moderate</span>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#F87171", opacity: 0.4 }} /> Strong</span>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#EF4444", opacity: 0.5 }} /> Overlap</span>
    </div>
  );
}

export function SummaryStats({ peakIOB, peakTime, lowestIOB, lowestTime, strongOverlapHours, totalBasal, totalBolus }: {
  peakIOB: number; peakTime: string; lowestIOB: number; lowestTime: string;
  strongOverlapHours: number; totalBasal: number; totalBolus: number;
}) {
  const stats = [
    { label: "Peak IOB",          value: `${peakIOB.toFixed(1)}U`,   sub: `at ${peakTime}` },
    { label: "Lowest pressure",   value: `${lowestIOB.toFixed(1)}U`, sub: `@ ${lowestTime}` },
    { label: "Strong / Overlap",  value: `${strongOverlapHours}h`,   sub: "" },
    { label: "Daily totals",      value: `${totalBasal.toFixed(1)}U basal`, sub: `${totalBolus.toFixed(1)}U bolus` },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16, padding: "0 4px" }}>
      {stats.map((s, i) => (
        <div key={i} style={{ textAlign: "center", padding: "12px 8px", borderRadius: 8, background: "var(--bg-primary, #f8fafc)", border: "1px solid var(--border)" }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</p>
          <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
          {s.sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}

export function DangerWindowBadges({ dangerWindows }: { dangerWindows: DangerWindow[] }) {
  if (dangerWindows.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 4px", marginBottom: 8 }}>
      {dangerWindows.map((w, i) => {
        const isOverlap = w.pressure === "overlap";
        const colour = isOverlap ? "#EF4444" : "#F87171";
        const bg     = isOverlap ? "rgba(239,68,68,0.08)" : "rgba(248,113,113,0.08)";
        const label  = isOverlap ? "Danger" : "Watch";
        return (
          <span key={`dw-${i}`} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 6,
            background: bg, border: `1px solid ${colour}30`,
            fontSize: 11, fontWeight: 600, color: colour,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: colour }} />
            {label}: {minutesToTime(w.startMinute)} – {minutesToTime(w.endMinute)}
          </span>
        );
      })}
    </div>
  );
}
