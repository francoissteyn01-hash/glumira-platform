/**
 * GluMira™ V7 — StackingGauge
 * Semicircular 0–100 risk gauge. SVG, no external deps.
 * Timing-only language (Rule 10). Educational framing (Rule 27).
 */

import { useMemo } from "react";
import { BRAND, FONTS } from "@/lib/brand";

type Band = { max: number; label: string; color: string };

const BANDS: Band[] = [
  { max: 30,  label: "Low",        color: "#4CAF50" },
  { max: 55,  label: "Moderate",   color: BRAND.amber },
  { max: 75,  label: "Elevated",   color: "#F87171" },
  { max: 100, label: "High",       color: "#EF4444" },
];

function bandFor(score: number): Band {
  for (const b of BANDS) if (score <= b.max) return b;
  return BANDS[BANDS.length - 1];
}

type Props = {
  score: number;
  size?: number;
  caption?: string;
};

export default function StackingGauge({ score, size = 200, caption }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const band = bandFor(clamped);

  const r = size * 0.42;
  const cx = size / 2;
  const cy = size * 0.62;
  const stroke = Math.max(10, size * 0.08);

  const arc = useMemo(() => {
    const angle = Math.PI * (clamped / 100);
    const x = cx - r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    return { x, y };
  }, [clamped, cx, cy, r]);

  return (
    <div
      role="img"
      aria-label={`Stacking pressure score ${clamped} of 100, ${band.label}`}
      style={{ width: size, maxWidth: "100%" }}
    >
      <svg
        viewBox={`0 0 ${size} ${size * 0.76}`}
        width="100%"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="gaugeTrack" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#4CAF50" stopOpacity="0.85" />
            <stop offset="0.45" stopColor={BRAND.amber} stopOpacity="0.85" />
            <stop offset="0.75" stopColor="#F87171" stopOpacity="0.9" />
            <stop offset="1" stopColor="#EF4444" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          stroke="url(#gaugeTrack)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(Math.PI * r * clamped) / 100} ${Math.PI * r}`}
        />

        <line
          x1={cx}
          y1={cy}
          x2={arc.x}
          y2={arc.y}
          stroke={BRAND.white}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={5} fill={BRAND.white} />

        <text
          x={cx}
          y={cy - r * 0.38}
          textAnchor="middle"
          fontFamily={FONTS.mono}
          fontSize={size * 0.22}
          fontWeight={600}
          fill={BRAND.white}
        >
          {Math.round(clamped)}
        </text>
        <text
          x={cx}
          y={cy - r * 0.12}
          textAnchor="middle"
          fontFamily={FONTS.body}
          fontSize={size * 0.07}
          fontWeight={500}
          fill={band.color}
          letterSpacing="0.08em"
        >
          {band.label.toUpperCase()}
        </text>
      </svg>

      <p
        style={{
          margin: "6px 0 0",
          textAlign: "center",
          fontFamily: FONTS.body,
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        {caption ?? "Stacking pressure"}
      </p>
    </div>
  );
}
