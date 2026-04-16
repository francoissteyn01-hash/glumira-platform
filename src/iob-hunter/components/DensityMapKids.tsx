import React from "react";
import type { DensityMap } from "@/iob-hunter/engine/density-map";

interface Props {
  densityMap: DensityMap;
}

const CHART_W = 1100, CHART_H = 300, PADDING_L = 50, PADDING_T = 70;

function toX(h: number): number {
  return (h / 24) * CHART_W + PADDING_L;
}

function toY(iob: number, maxIOB: number): number {
  return maxIOB <= 0 ? PADDING_T + CHART_H : PADDING_T + CHART_H - (iob / maxIOB) * CHART_H;
}

function fmtHour(h: number): string {
  const hh = Math.floor(((h % 24) + 24) % 24);
  const mm = Math.round(((h % 1) + 1) % 1 * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

const SEGMENT_COLOURS: Record<string, string> = {
  light: "#3b82f6",
  moderate: "#f59e0b",
  strong: "#ef5350",
  overlap: "#dc2626",
};

export default function DensityMapKids({ densityMap }: Props) {
  const maxIOB = Math.max(...densityMap.points.map(p => p.iobTotal), 0);
  const { highestOverlapWindow: ow } = densityMap;
  const overlapX1 = toX(ow.start);
  const overlapX2 = toX(ow.end);
  const overlapW = Math.max(overlapX2 - overlapX1, 4);
  const overlapLabelX = overlapX1 + overlapW / 2;

  return (
    <div style={{
      background: "var(--bg-card, #fff)",
      border: "1px solid rgba(148,163,184,0.35)",
      borderRadius: 12,
      padding: "20px 24px",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ marginBottom: 4 }}>
        <h3 style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: "#0D2149",
          fontFamily: "'Playfair Display', serif",
        }}>
          Insulin Density Map
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748B" }}>
          Shows where insulin activity is most concentrated, creating a higher risk of glucose drop.
        </p>
      </div>

      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <svg
          viewBox={`0 0 ${CHART_W + PADDING_L + 20} 410`}
          style={{ width: "100%", minWidth: 320, display: "block" }}
          aria-label="IOB density terrain chart"
        >
          {/* Filled segments — one column per point pair */}
          {densityMap.points.map((point, i) => {
            const next = densityMap.points[i + 1];
            if (!next) return null;
            const x1 = toX(point.timeHours);
            const x2 = toX(next.timeHours);
            const y1 = toY(point.iobTotal, maxIOB);
            const y2 = toY(next.iobTotal, maxIOB);
            const base = PADDING_T + CHART_H;
            const colour = SEGMENT_COLOURS[point.pressure] ?? "#3b82f6";
            return (
              <path
                key={`seg-${i}`}
                d={`M ${x1.toFixed(1)} ${base} L ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} L ${x2.toFixed(1)} ${base} Z`}
                fill={colour}
                opacity={0.75}
              />
            );
          })}

          {/* Highest overlap band */}
          {ow.end > ow.start && (
            <g>
              <rect
                x={overlapX1}
                y={20}
                width={overlapW}
                height={36}
                fill="#dc2626"
                rx={4}
              />
              <text
                x={overlapLabelX}
                y={43}
                textAnchor="middle"
                fill="white"
                fontSize={12}
                fontWeight="bold"
                fontFamily="'DM Sans', system-ui, sans-serif"
              >
                Highest Overlap
              </text>
            </g>
          )}

          {/* X-axis labels (24hr) */}
          {[0, 6, 12, 18, 24].map((h) => (
            <text
              key={`lbl-${h}`}
              x={toX(h)}
              y={390}
              textAnchor="middle"
              fontSize={11}
              fill="#94a3b8"
            >
              {String(h).padStart(2, "0")}:00
            </text>
          ))}
        </svg>
      </div>

      {/* Key insight */}
      {ow.end > ow.start && (
        <div style={{
          marginTop: 12,
          padding: "10px 14px",
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          borderRadius: 8,
          fontSize: 12,
          color: "#7c2d12",
        }}>
          <strong>🔍 Key Insight:</strong> Peak collision occurs{" "}
          {fmtHour(ow.start)} – {fmtHour(ow.end)}.{" "}
          Several insulin effects overlap here.
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
        {[
          { label: "Light Activity", color: "#3b82f6" },
          { label: "Moderate", color: "#f59e0b" },
          { label: "High Activity", color: "#ef5350" },
          { label: "Overlap", color: "#dc2626" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "#64748B",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                borderRadius: 3,
                background: item.color,
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
