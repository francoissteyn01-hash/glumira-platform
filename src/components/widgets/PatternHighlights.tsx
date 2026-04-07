/**
 * GluMira™ V7 — Pattern Highlights Widget
 * Top 3 detected patterns as icon cards with confidence badges. Tap to expand.
 */

import { useState } from "react";

interface Pattern {
  id: string;
  category: string;
  type: string;
  confidence: "high" | "moderate" | "low";
  observation: string;
  suggestion: string;
}

interface Props {
  patterns: Pattern[];
}

const ICONS: Record<string, string> = {
  dose_compression: "\u{1F4CA}", stacked_rapid: "\u{1F4CA}", basal_overlap: "\u{1F4CA}",
  late_corrections: "\u23F0", overlapping_corrections: "\u23F0",
  dawn_rise: "\u{1F305}", overnight_drift: "\u{1F319}",
  post_meal_spike: "\u{1F4C8}", delayed_drop: "\u{1F4C9}", rebound: "\u{1F503}", rollercoaster: "\u{1F3A2}",
  repeated_lows: "\u26A0\uFE0F", rescue_clusters: "\u{1F6A8}", overnight_risk: "\u{1F6A8}",
  multi_low_band: "\u26A0\uFE0F", same_time_instability: "\u26A0\uFE0F",
  illness_resistance: "\u{1F912}", stress_variability: "\u{1F616}", travel_disruption: "\u2708\uFE0F",
  menstrual_resistance: "\u{1F319}", heat_sensitivity: "\u{1F321}\uFE0F", alarm_fatigue_deterioration: "\u{1F634}",
};

const CONFIDENCE_COLOURS: Record<string, { bg: string; text: string }> = {
  high: { bg: "rgba(239,68,68,0.1)", text: "#ef4444" },
  moderate: { bg: "rgba(234,179,8,0.1)", text: "#eab308" },
  low: { bg: "rgba(34,197,94,0.1)", text: "#22c55e" },
};

export default function PatternHighlights({ patterns }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const top3 = patterns.slice(0, 3);

  if (top3.length === 0) {
    return (
      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>No patterns detected yet. Keep logging to enable analysis.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 16 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
        Pattern Highlights
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {top3.map((p) => {
          const isOpen = expanded === p.id;
          const cc = CONFIDENCE_COLOURS[p.confidence];
          return (
            <div
              key={p.id}
              onClick={() => setExpanded(isOpen ? null : p.id)}
              style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border-light)", cursor: "pointer", transition: "background 0.15s", background: isOpen ? "var(--bg-primary)" : "var(--bg-card)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{ICONS[p.type] ?? "\u{1F50D}"}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif", textTransform: "capitalize" }}>
                  {p.type.replace(/_/g, " ")}
                </span>
                <span style={{ padding: "2px 8px", borderRadius: 4, background: cc.bg, color: cc.text, fontSize: 10, fontWeight: 700, textTransform: "uppercase", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  {p.confidence}
                </span>
              </div>
              {isOpen && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-divider)" }}>
                  <p style={{ fontSize: 12, color: "var(--text-primary)", margin: "0 0 6px", lineHeight: 1.5, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{p.observation}</p>
                  <p style={{ fontSize: 12, color: "var(--accent-teal)", margin: 0, lineHeight: 1.5, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600 }}>{p.suggestion}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
