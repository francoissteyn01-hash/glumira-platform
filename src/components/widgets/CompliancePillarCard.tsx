/**
 * GluMira™ V7 — Compliance Pillar Card
 *
 * Single reusable card that renders one of the three compliance regimes
 * (HIPAA, GDPR, POPIA) returned by GET /api/compliance/status.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

type CheckItem = {
  id: string;
  label: string;
  state: "compliant" | "in-progress" | "not-applicable";
  source: string;
}

type PillarSummary = {
  total: number;
  compliant: number;
  inProgress: number;
}

type Props = {
  pillar: "HIPAA" | "GDPR" | "POPIA";
  items: CheckItem[];
  summary: PillarSummary;
}

const STATE_COLOUR: Record<CheckItem["state"], string> = {
  compliant:        "#22c55e",
  "in-progress":    "#f59e0b",
  "not-applicable": "#94a3b8",
};

const STATE_GLYPH: Record<CheckItem["state"], string> = {
  compliant:        "\u2713",
  "in-progress":    "\u26A0",
  "not-applicable": "\u2014",
};

export default function CompliancePillarCard({ pillar, items, summary }: Props) {
  const pct = summary.total > 0
    ? Math.round((summary.compliant / summary.total) * 100)
    : 0;
  const ringColour = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{
      background: "var(--bg-card)",
      borderRadius: 12,
      border: "1px solid var(--border-light)",
      padding: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <h3 style={{
          margin: 0, fontSize: 16, fontWeight: 700,
          color: "var(--text-primary)", fontFamily: "'Playfair Display', serif",
        }}>
          {pillar}
        </h3>
        <span style={{
          padding: "3px 10px",
          borderRadius: 999,
          background: ringColour + "1A",
          color: ringColour,
          fontSize: 11, fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 0.4,
        }}>
          {pct}%
        </span>
      </div>

      <p style={{
        margin: "0 0 10px", fontSize: 11, color: "var(--text-faint)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {summary.compliant} of {summary.total} controls compliant
        {summary.inProgress > 0 && ` · ${summary.inProgress} in progress`}
      </p>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item) => {
          const colour = STATE_COLOUR[item.state];
          return (
            <li key={item.id} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              fontSize: 12,
              color: "var(--text-secondary)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              lineHeight: 1.4,
            }}>
              <span style={{
                color: colour, fontWeight: 700, flexShrink: 0,
                fontSize: 13, lineHeight: 1.4,
              }} aria-hidden="true">
                {STATE_GLYPH[item.state]}
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{item.label}</span>
                <br />
                <span style={{ color: "var(--text-faint)", fontSize: 11 }}>{item.source}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
