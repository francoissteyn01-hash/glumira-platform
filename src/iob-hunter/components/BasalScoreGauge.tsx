/**
 * GluMira™ V7 — Basal Score Gauge
 *
 * Semicircular "rev counter" gauge showing 0–10 basal coverage score.
 * Derived from BasalCoverageAnalysis + ReportKPIs — purely display,
 * no engine modification.
 *
 * Scoring rubric (deterministic, cited from engine output):
 *   Start at 10.
 *   floor_integrity === "gapped"       → −4  (coverage breaks mean hypo risk)
 *   floor_integrity === "overlapping"  → −1  (minor stacking but floor intact)
 *   overlap_windows.length × 1        → −1 each, max −2
 *   trough_value < 0.3 U              → −2  (floor near zero)
 *   trough_value 0.3–0.8 U            → −1
 *   hours_strong_or_overlap > 8 h     → −2
 *   hours_strong_or_overlap 4–8 h     → −1
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type { BasalCoverageAnalysis, ReportKPIs } from "@/iob-hunter/types";

/* ─── Types ──────────────────────────────────────────────────────────── */

export type BasalScoreGaugeProps = {
  basalAnalysis: BasalCoverageAnalysis | null;
  kpis: ReportKPIs | null;
  /** Compact = smaller footprint for side panels. Default: false. */
  compact?: boolean;
};

/* ─── Score computation ──────────────────────────────────────────────── */

function computeScore(
  analysis: BasalCoverageAnalysis,
  kpis: ReportKPIs,
): number {
  let score = 10;

  if (analysis.floor_integrity === "gapped")       score -= 4;
  else if (analysis.floor_integrity === "overlapping") score -= 1;

  score -= Math.min(analysis.overlap_windows.length, 2);

  if (analysis.trough_value !== null) {
    if (analysis.trough_value < 0.3)      score -= 2;
    else if (analysis.trough_value < 0.8) score -= 1;
  }

  if (kpis.hours_strong_or_overlap > 8)      score -= 2;
  else if (kpis.hours_strong_or_overlap > 4) score -= 1;

  return Math.max(0, Math.min(10, score));
}

function scoreBullets(
  analysis: BasalCoverageAnalysis,
  kpis: ReportKPIs,
  score: number,
): { ok: boolean; text: string }[] {
  const bullets: { ok: boolean; text: string }[] = [];

  if (analysis.floor_integrity === "continuous") {
    bullets.push({ ok: true,  text: "Coverage unbroken 24 h" });
  } else if (analysis.floor_integrity === "gapped") {
    bullets.push({ ok: false, text: "Basal gap detected — coverage breaks" });
  } else {
    bullets.push({ ok: false, text: "Basal overlap — stacking pressure present" });
  }

  if (analysis.overlap_windows.length === 0) {
    bullets.push({ ok: true,  text: "No stacking windows" });
  } else {
    bullets.push({ ok: false, text: `${analysis.overlap_windows.length} stacking window${analysis.overlap_windows.length > 1 ? "s" : ""}` });
  }

  const tv = analysis.trough_value;
  if (tv !== null && tv >= 0.8) {
    bullets.push({ ok: true,  text: "Basal floor stable" });
  } else if (tv !== null) {
    bullets.push({ ok: false, text: `Trough at ${tv.toFixed(1)} U — low floor` });
  }

  if (kpis.hours_strong_or_overlap < 4) {
    bullets.push({ ok: true,  text: "Strong-pressure window < 4 h" });
  } else {
    bullets.push({ ok: false, text: `Strong pressure ${kpis.hours_strong_or_overlap.toFixed(1)} h` });
  }

  if (score >= 8) {
    bullets.push({ ok: true,  text: "Regimen structurally sound" });
  } else if (score >= 5) {
    bullets.push({ ok: false, text: "Regimen review recommended" });
  } else {
    bullets.push({ ok: false, text: "Regimen requires attention" });
  }

  return bullets;
}

/* ─── Gauge colour ramp ──────────────────────────────────────────────── */

function gaugeColour(score: number): string {
  if (score >= 8) return "#16a34a"; // green
  if (score >= 5) return "#f59e0b"; // amber
  return "#ef4444";                  // red
}

/* ─── SVG semicircle helpers ─────────────────────────────────────────── */

const CX = 80, CY = 80, R = 62;
const START_DEG = 180, END_DEG = 0; // left → right, sweeping top

function polarPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Arc path for a fraction (0–1) of the semicircle, left-to-right. */
function arcPath(fraction: number): string {
  // 180° = left, 0° = right; we travel clockwise through the top.
  // degree for current fraction, going from 180° down to 0°.
  const endDeg = START_DEG - fraction * (START_DEG - END_DEG);
  const start  = polarPoint(CX, CY, R, START_DEG);
  const end    = polarPoint(CX, CY, R, endDeg);
  const large  = fraction > 0.5 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/* ─── Tick marks ─────────────────────────────────────────────────────── */

function ticks(): React.ReactNode[] {
  return Array.from({ length: 11 }, (_, i) => {
    const deg = START_DEG - i * (START_DEG - END_DEG) / 10;
    const inner = polarPoint(CX, CY, R - 7, deg);
    const outer = polarPoint(CX, CY, R + 2, deg);
    return (
      <line
        key={i}
        x1={inner.x.toFixed(2)} y1={inner.y.toFixed(2)}
        x2={outer.x.toFixed(2)} y2={outer.y.toFixed(2)}
        stroke="#cbd5e1"
        strokeWidth={i % 5 === 0 ? 2 : 1}
      />
    );
  });
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function BasalScoreGauge({ basalAnalysis, kpis, compact = false }: BasalScoreGaugeProps) {
  if (!basalAnalysis || !kpis) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
        Calculating…
      </div>
    );
  }

  const score   = computeScore(basalAnalysis, kpis);
  const bullets = scoreBullets(basalAnalysis, kpis, score);
  const colour  = gaugeColour(score);
  const fill    = score / 10;

  const label =
    score >= 8 ? "Structurally sound"
    : score >= 5 ? "Review recommended"
    : "Attention required";

  const svgH = compact ? 90 : 100;

  return (
    <div
      style={{
        background: "var(--bg-card, #fff)",
        border: "1px solid rgba(148,163,184,0.35)",
        borderRadius: 12,
        padding: compact ? "16px 16px 12px" : "20px 24px 16px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          fontSize: compact ? 13 : 15,
          fontWeight: 700,
          color: "#0D2149",
          fontFamily: "'Playfair Display', serif",
        }}
      >
        Basal Coverage Score
      </p>

      {/* Gauge SVG */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg
          viewBox="0 0 160 90"
          style={{ width: compact ? 140 : 160, height: svgH }}
          aria-label={`Basal score ${score} out of 10`}
        >
          {/* Track */}
          <path
            d={arcPath(1)}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={10}
            strokeLinecap="round"
          />
          {/* Fill */}
          {fill > 0 && (
            <path
              d={arcPath(fill)}
              fill="none"
              stroke={colour}
              strokeWidth={10}
              strokeLinecap="round"
            />
          )}
          {/* Ticks */}
          {ticks()}
          {/* Score text */}
          <text
            x={CX} y={CY - 4}
            textAnchor="middle"
            fontSize={28}
            fontWeight={700}
            fill={colour}
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            {score.toFixed(1)}
          </text>
          <text
            x={CX} y={CY + 14}
            textAnchor="middle"
            fontSize={10}
            fill="#64748b"
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            / 10
          </text>
          {/* Min / Max labels */}
          <text x={14} y={85} fontSize={9} fill="#94a3b8" textAnchor="middle">0</text>
          <text x={146} y={85} fontSize={9} fill="#94a3b8" textAnchor="middle">10</text>
        </svg>
      </div>

      {/* Status label */}
      <p
        style={{
          textAlign: "center",
          margin: "4px 0 12px",
          fontSize: 12,
          fontWeight: 600,
          color: colour,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>

      {/* Evaluation bullets */}
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        {bullets.map((b, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 7,
              fontSize: compact ? 11 : 12,
              color: b.ok ? "#166534" : "#991b1b",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: b.ok ? "#dcfce7" : "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 700,
                color: b.ok ? "#16a34a" : "#ef4444",
                marginTop: 1,
              }}
            >
              {b.ok ? "✓" : "!"}
            </span>
            <span>{b.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
