/**
 * GluMira™ V7 — Hidden IOB (Quiet Tail) Widget
 * Shows residual IOB from long-acting / previous-day insulin with a declining waveform icon.
 */

interface Props {
  quietTailIOB: number;
}

/** Simple SVG declining waveform icon */
function WaveformIcon() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" style={{ display: "block" }}>
      <path
        d="M2 10 Q5 2, 8 10 Q11 18, 14 10 Q16.5 4, 19 10 Q21 14, 23 10 Q24.5 8, 26 10"
        stroke="#2ab5c1"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M2 10 Q5 2, 8 10 Q11 18, 14 10 Q16.5 4, 19 10 Q21 14, 23 10 Q24.5 8, 26 10"
        stroke="#2ab5c1"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
        strokeDasharray="2 3"
      />
    </svg>
  );
}

export default function HiddenIOBWidget({ quietTailIOB }: Props) {
  const isNegligible = quietTailIOB < 0.1;

  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)",
      padding: 20, display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 10,
        background: "rgba(42,181,193,0.08)", display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <WaveformIcon />
      </div>
      <div>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
          textTransform: "uppercase", letterSpacing: 0.5,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          Quiet Tail
        </p>
        <p style={{
          margin: "2px 0 0", fontSize: 24, fontWeight: 700,
          color: isNegligible ? "var(--text-faint)" : "var(--text-primary)",
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {quietTailIOB.toFixed(1)}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 4 }}>U</span>
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {isNegligible ? "No residual insulin detected" : "Hidden residual from long-acting insulin"}
        </p>
      </div>
    </div>
  );
}
