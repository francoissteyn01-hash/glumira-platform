/**
 * GluMira™ V7 — IOB Hunter v7 · KPI Row
 *
 * 4-card summary strip below the pressure map:
 *   1. Peak pressure (U)
 *   2. Peak window (time)
 *   3. Lowest pressure (U @ time)
 *   4. Hours in strong/overlap band
 *
 * Responsive: 4 columns on desktop, 2 × 2 on tablet, 1 column on mobile.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type { ReportKPIs } from "@/iob-hunter/types";

function formatHour(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export type IOBHunterKPIRowProps = {
  kpis: ReportKPIs;
}

export default function IOBHunterKPIRow({ kpis }: IOBHunterKPIRowProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginTop: 16,
        marginBottom: 16,
      }}
    >
      <KPICard label="Peak pressure"      value={`${kpis.peak_iob.toFixed(1)}U`} />
      <KPICard label="Peak window"        value={formatHour(kpis.peak_hour)} />
      <KPICard label="Lowest pressure"    value={`${kpis.trough_iob.toFixed(1)}U @ ${formatHour(kpis.trough_hour)}`} />
      <KPICard label="Strong / overlap"   value={`${kpis.hours_strong_or_overlap}h`} />
    </div>
  );
}

function KPICard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 10,
          fontWeight: 600,
          color: "var(--text-faint)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "6px 0 0",
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </p>
    </div>
  );
}
