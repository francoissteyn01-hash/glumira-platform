/**
 * GluMira™ V7 — Active Insulin Card
 * Shows current total IOB with pressure indicator bar.
 */

export type PressureClass = "light" | "moderate" | "strong" | "overlap";

interface Props {
  totalIOB: number;
  pressure: PressureClass;
}

const PRESSURE_CONFIG: Record<PressureClass, { label: string; colour: string; bg: string }> = {
  light:    { label: "Low",      colour: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  moderate: { label: "Moderate", colour: "#eab308", bg: "rgba(234,179,8,0.12)" },
  strong:   { label: "High",    colour: "#f97316", bg: "rgba(249,115,22,0.12)" },
  overlap:  { label: "Overlap",  colour: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

export default function ActiveInsulinCard({ totalIOB, pressure }: Props) {
  const cfg = PRESSURE_CONFIG[pressure];

  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)",
      padding: 20, display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Active Insulin (IOB)
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
            {totalIOB.toFixed(1)}<span style={{ fontSize: 16, fontWeight: 500, marginLeft: 4 }}>U</span>
          </p>
        </div>
        <div style={{
          padding: "4px 10px", borderRadius: 6,
          background: cfg.bg, fontSize: 12, fontWeight: 700,
          color: cfg.colour, fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {cfg.label}
        </div>
      </div>

      {/* Pressure bar */}
      <div style={{ height: 8, borderRadius: 4, background: "var(--border-divider)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 4,
            background: cfg.colour,
            width:
              pressure === "light" ? "25%" :
              pressure === "moderate" ? "50%" :
              pressure === "strong" ? "75%" : "100%",
            transition: "width 0.4s ease, background 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
