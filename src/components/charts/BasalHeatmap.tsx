/**
 * GluMira™ V7 — Basal Heatmap
 * One horizontal bar per basal dose, colour intensity mapped to IOB at each time slice.
 */

import { useMemo } from "react";

interface BasalDose {
  id: string;
  event_time: string;
  insulin_type: string;
  dose_units: number;
}

interface HeatmapRow {
  label: string;
  /** 24-hour IOB values at 15-minute intervals (96 slots) */
  slots: { iob: number; pressure: string }[];
}

interface Props {
  doses: BasalDose[];
  /** Pre-computed IOB per dose per slot — pass from parent or compute via engine */
  rows: HeatmapRow[];
}

const PRESSURE_COLOURS: Record<string, string> = {
  light: "#22c55e",
  moderate: "#eab308",
  strong: "#f97316",
  overlap: "#ef4444",
};

function getColour(pressure: string, iob: number, maxIOB: number): string {
  if (iob <= 0 || maxIOB <= 0) return "var(--card-hover)";
  const base = PRESSURE_COLOURS[pressure] ?? "#22c55e";
  const opacity = Math.max(0.15, Math.min(1, iob / maxIOB));
  return `${base}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
}

export default function BasalHeatmap({ doses, rows }: Props) {
  const maxIOB = useMemo(() => {
    let m = 0;
    for (const row of rows) for (const s of row.slots) if (s.iob > m) m = s.iob;
    return m || 1;
  }, [rows]);

  // Hour labels for axis
  const hours = Array.from({ length: 25 }, (_, i) => i);

  if (rows.length === 0) {
    return (
      <div style={{
        background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)",
        padding: 32, textAlign: "center",
      }}>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          No basal doses recorded today.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 16 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
        Basal Dose Heatmap
      </h3>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 600 }}>
          {/* Hour axis */}
          <div style={{ display: "flex", marginBottom: 4, paddingLeft: 160 }}>
            {hours.filter((h) => h % 3 === 0).map((h) => (
              <span
                key={h}
                style={{
                  flex: "0 0 auto",
                  width: `${(3 / 24) * 100}%`,
                  fontSize: 10, color: "var(--text-secondary)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
              {/* Label */}
              <div style={{
                width: 160, flexShrink: 0, fontSize: 12, fontWeight: 600,
                color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif",
                paddingRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {row.label}
              </div>
              {/* Heat bar */}
              <div style={{ flex: 1, display: "flex", height: 24, borderRadius: 4, overflow: "hidden", border: "1px solid var(--border-divider)" }}>
                {row.slots.map((slot, si) => {
                  const hasOverlap = slot.pressure === "overlap" || slot.pressure === "strong";
                  return (
                    <div
                      key={si}
                      style={{
                        flex: 1,
                        background: getColour(slot.pressure, slot.iob, maxIOB),
                        position: "relative",
                      }}
                      title={`${(si * 15 / 60).toFixed(1)}h — IOB: ${slot.iob.toFixed(2)}U`}
                    >
                      {hasOverlap && slot.iob > maxIOB * 0.7 && (
                        <div style={{
                          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                          fontSize: 8, color: "#991b1b", fontWeight: 700,
                        }}>
                          !
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
