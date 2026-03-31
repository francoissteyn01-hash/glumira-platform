/**
 * GluMira™ — TimeInRangeChart.tsx
 *
 * Stacked horizontal bar chart for Time in Range (TIR) breakdown.
 * Pure SVG — no external chart library required.
 * Segments: Very Low | Low | In Range | High | Very High
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TirBreakdown {
  veryLow: number;   // %
  low: number;       // %
  inRange: number;   // %
  high: number;      // %
  veryHigh: number;  // %
}

interface TimeInRangeChartProps {
  tir: TirBreakdown;
  height?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEGMENTS = [
  { key: "veryLow",  label: "Very Low",  colour: "#EF4444", textColour: "#fff" },
  { key: "low",      label: "Low",       colour: "#F97316", textColour: "#fff" },
  { key: "inRange",  label: "In Range",  colour: "#22C55E", textColour: "#fff" },
  { key: "high",     label: "High",      colour: "#F59E0B", textColour: "#fff" },
  { key: "veryHigh", label: "Very High", colour: "#DC2626", textColour: "#fff" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimeInRangeChart({
  tir,
  height = 40,
  showLabels = true,
  showLegend = true,
  className = "",
}: TimeInRangeChartProps) {
  const total = Object.values(tir).reduce((a, b) => a + b, 0);
  const normalised = total > 0 ? total : 100;

  // Build segments with x offsets
  let xOffset = 0;
  const segments = SEGMENTS.map((seg) => {
    const pct = (tir[seg.key] / normalised) * 100;
    const x = xOffset;
    xOffset += pct;
    return { ...seg, pct, x };
  });

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Bar */}
      <div className="relative w-full overflow-hidden rounded-lg" style={{ height }}>
        <svg
          width="100%"
          height={height}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-label="Time in Range chart"
          role="img"
        >
          {segments.map((seg) =>
            seg.pct > 0 ? (
              <rect
                key={seg.key}
                x={seg.x}
                y={0}
                width={seg.pct}
                height={100}
                fill={seg.colour}
              />
            ) : null
          )}
        </svg>

        {/* Inline labels (only if segment >= 8%) */}
        {showLabels && (
          <div className="absolute inset-0 flex">
            {segments.map((seg) =>
              seg.pct >= 8 ? (
                <div
                  key={seg.key}
                  className="flex items-center justify-center text-white text-xs font-semibold overflow-hidden"
                  style={{ width: `${seg.pct}%`, backgroundColor: "transparent" }}
                >
                  {seg.pct.toFixed(0)}%
                </div>
              ) : (
                <div key={seg.key} style={{ width: `${seg.pct}%` }} />
              )
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {segments.map((seg) => (
            <div key={seg.key} className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: seg.colour }}
              />
              <span className="text-xs text-gray-600">
                {seg.label}: <span className="font-medium">{tir[seg.key].toFixed(1)}%</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Target annotation */}
      <p className="text-xs text-gray-400">
        Target: In Range ≥ 70% · Low &lt; 4% · Very Low &lt; 1%
      </p>
    </div>
  );
}
