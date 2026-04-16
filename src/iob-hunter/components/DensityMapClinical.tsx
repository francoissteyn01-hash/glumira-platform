/**
 * GluMira™ V7 — IOB Hunter v7 · Density Map — Clinical View
 *
 * Peak Collision Map: 24h IOB pressure curve with coloured risk-zone bands,
 * a peak marker, and an overlap-window callout. Observatory design tokens —
 * deep navy, no CSS modules.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import React from "react";
import type { DensityMap } from "@/iob-hunter/engine/density-map";

interface Props {
  densityMap: DensityMap;
}

const CHART_W = 1100;
const CHART_H = 300;
const PADDING_L = 50;
const PADDING_T = 50;
const BOTTOM_LABEL_Y = 380;

function toX(hour: number): number {
  return (hour / 24) * CHART_W + PADDING_L;
}

function toY(iob: number, maxIOB: number): number {
  if (maxIOB <= 0) return PADDING_T + CHART_H;
  return PADDING_T + CHART_H - (iob / maxIOB) * CHART_H;
}

function fmtHour(h: number): string {
  const hh = Math.floor(((h % 24) + 24) % 24);
  const mm = Math.round(((h % 1) + 1) % 1 * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

const ZONE_COLOURS: Record<string, string> = {
  light:    "transparent",
  moderate: "#fef3c7",
  strong:   "#fed7aa",
  overlap:  "#fecaca",
};

const LEGEND_ITEMS: Array<{ label: string; color: string }> = [
  { label: "Light",    color: "#e5e7eb" },
  { label: "Moderate", color: "#fef3c7" },
  { label: "Strong",   color: "#fed7aa" },
  { label: "Overlap",  color: "#fecaca" },
];

export default function DensityMapClinical({ densityMap }: Props) {
  const maxIOB = densityMap.points.reduce((m, p) => Math.max(m, p.iobTotal), 0);
  const { highestOverlapWindow: ow } = densityMap;
  const hasOverlap = ow.end > ow.start;

  const polylinePoints = densityMap.points
    .map((p) => `${toX(p.timeHours).toFixed(1)},${toY(p.iobTotal, maxIOB).toFixed(1)}`)
    .join(" ");

  return (
    <div
      style={{
        background: "var(--bg-card, #fff)",
        border: "1px solid rgba(148,163,184,0.35)",
        borderRadius: 12,
        padding: "20px 24px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: "#0D2149",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Peak Collision Map
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748B" }}>
          Identifies where multiple insulin peaks align, potentially creating a glucose drop.
        </p>
      </div>

      {/* Chart */}
      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <svg
          viewBox={`0 0 ${CHART_W + PADDING_L + 20} ${BOTTOM_LABEL_Y + 10}`}
          style={{ width: "100%", minWidth: 320, display: "block" }}
          aria-label="IOB density chart"
        >
          {/* Pressure zone backgrounds */}
          {densityMap.riskZones.map((zone, i) => (
            <rect
              key={`zone-${i}`}
              x={toX(zone.start)}
              y={PADDING_T}
              width={toX(zone.end) - toX(zone.start)}
              height={CHART_H}
              fill={ZONE_COLOURS[zone.pressure] ?? "transparent"}
              opacity={0.4}
            />
          ))}

          {/* Vertical grid lines */}
          {[0, 6, 12, 18, 24].map((h) => (
            <line
              key={`grid-${h}`}
              x1={toX(h)}
              y1={PADDING_T}
              x2={toX(h)}
              y2={PADDING_T + CHART_H}
              stroke="#e5e7eb"
              strokeDasharray="4 3"
              strokeWidth={1}
            />
          ))}

          {/* IOB curve */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#1a2a5e"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Peak marker */}
          {maxIOB > 0 && (
            <circle
              cx={toX(densityMap.peakTime)}
              cy={toY(densityMap.peakIOB, maxIOB)}
              r={5}
              fill="#ef4444"
            />
          )}

          {/* X-axis labels */}
          {[0, 6, 12, 18, 24].map((h) => (
            <text
              key={`lbl-${h}`}
              x={toX(h)}
              y={BOTTOM_LABEL_Y - 10}
              textAnchor="middle"
              fontSize={11}
              fill="#94a3b8"
            >
              {String(h).padStart(2, "0")}:00
            </text>
          ))}
        </svg>
      </div>

      {/* Overlap callout */}
      {hasOverlap && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            fontSize: 12,
            color: "#7f1d1d",
          }}
        >
          <strong>Highest Overlap:</strong>{" "}
          {fmtHour(ow.start)} – {fmtHour(ow.end)}
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 12,
          flexWrap: "wrap",
        }}
      >
        {LEGEND_ITEMS.map((item) => (
          <div
            key={item.label}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748B" }}
          >
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                borderRadius: 3,
                background: item.color,
                border: "1px solid rgba(0,0,0,0.08)",
                flexShrink: 0,
              }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
