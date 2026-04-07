/**
 * GluMira™ V7 — Sensor Confidence Card
 * Data completeness % (readings count / expected count).
 */

interface Props { readingsCount: number; expectedCount: number }

export default function SensorConfidenceCard({ readingsCount, expectedCount }: Props) {
  const pct = expectedCount > 0 ? Math.min(100, Math.round((readingsCount / expectedCount) * 100)) : 0;
  const colour = pct >= 80 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20 }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Data Completeness</p>
      <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 700, color: colour, fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</p>
      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{readingsCount} of {expectedCount} expected readings</p>
    </div>
  );
}
