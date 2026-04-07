/**
 * GluMira™ V7 — Daily Summary Widget
 * 4 observation bullets from the pattern engine.
 */

interface Pattern {
  observation: string;
  type: string;
  confidence: string;
}

interface Props {
  patterns: Pattern[];
}

export default function DailySummary({ patterns }: Props) {
  const bullets = patterns
    .filter((p) => p.observation)
    .slice(0, 4)
    .map((p) => p.observation);

  if (bullets.length === 0) {
    return (
      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
          Daily Summary
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          No observations yet. Log meals, insulin, and glucose to generate insights.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
        Daily Summary
      </h3>
      <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
