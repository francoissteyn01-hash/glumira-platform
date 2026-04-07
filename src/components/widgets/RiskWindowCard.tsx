/**
 * GluMira™ V7 — Risk Window Card
 * Shows current stacking classification with colour badge.
 */

export type PressureClass = "light" | "moderate" | "strong" | "overlap";

interface Props { pressure: PressureClass }

const CFG: Record<PressureClass, { label: string; colour: string; bg: string }> = {
  light:    { label: "Low Risk",     colour: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  moderate: { label: "Moderate",     colour: "#eab308", bg: "rgba(234,179,8,0.1)" },
  strong:   { label: "High Risk",    colour: "#f97316", bg: "rgba(249,115,22,0.1)" },
  overlap:  { label: "Overlap Risk", colour: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

export default function RiskWindowCard({ pressure }: Props) {
  const c = CFG[pressure];
  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20 }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Stacking Risk</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <span style={{ width: 14, height: 14, borderRadius: "50%", background: c.colour, display: "inline-block" }} />
        <span style={{ fontSize: 20, fontWeight: 700, color: c.colour, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{c.label}</span>
      </div>
    </div>
  );
}
