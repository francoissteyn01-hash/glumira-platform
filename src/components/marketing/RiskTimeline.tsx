/**
 * GluMira™ V7 — RiskTimeline
 * Horizontal strip. Timing-only language (Rule 10).
 * Never renders dose-volume advice (Rule 27).
 */

import { BRAND, FONTS } from "@/lib/brand";

export type RiskSegment = {
  from: string;
  to: string;
  level: "safe" | "watch" | "danger";
  note?: string;
};

type Props = {
  segments: RiskSegment[];
  nextSafeLabel?: string;
};

const COLOR: Record<RiskSegment["level"], string> = {
  safe:   "#4CAF50",
  watch:  BRAND.amber,
  danger: "#EF4444",
};

const SYMBOL: Record<RiskSegment["level"], string> = {
  safe:   "✓",
  watch:  "⚠",
  danger: "✕",
};

export default function RiskTimeline({ segments, nextSafeLabel }: Props) {
  if (!segments.length) return null;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "12px 14px",
        fontFamily: FONTS.body,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          rowGap: 8,
        }}
      >
        {segments.map((seg, i) => (
          <span
            key={`${seg.from}-${i}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${COLOR[seg.level]}55`,
              color: BRAND.white,
              fontSize: "clamp(11px, 2.6vw, 12px)",
              fontFamily: FONTS.mono,
              letterSpacing: "0.01em",
            }}
          >
            <span style={{ color: COLOR[seg.level] }} aria-hidden>{SYMBOL[seg.level]}</span>
            {seg.from} — {seg.to}
            {seg.note ? (
              <span style={{ color: "rgba(255,255,255,0.6)", marginLeft: 2 }}>· {seg.note}</span>
            ) : null}
          </span>
        ))}
      </div>

      {nextSafeLabel ? (
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 12,
            color: "rgba(255,255,255,0.65)",
            letterSpacing: "0.02em",
          }}
        >
          <span style={{ color: "#4CAF50", marginRight: 6 }}>●</span>
          {nextSafeLabel}
        </p>
      ) : null}

      <p
        style={{
          margin: "8px 0 0",
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.02em",
        }}
      >
        Timing guidance only — discuss any change with your clinician.
      </p>
    </div>
  );
}
