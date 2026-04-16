/**
 * GluMira™ V7 — BasalActivityChart
 *
 * Per-dose activity-rate chart (U/h). Replaces the combined-IOB line
 * on the IOB Hunter page with the clinically-correct "soft hill per
 * dose" visualisation:
 *
 *   - Each dose renders as its own bell curve, overlaid (NOT summed).
 *   - Y-axis is U/h activity rate, fixed 0–1.5 with 0.2 gridlines.
 *   - X-axis is hourly, wrapping past midnight.
 *   - Older doses colour-ramp darker (navy → light blue).
 *   - Injection markers are dashed vertical lines with "HH:MM — NU"
 *     labels above the plot.
 *   - Optional context bands (e.g. gastro window) overlay as soft-hue
 *     shaded regions.
 *
 * Pure SVG, no Recharts/Chart.js — deterministic, zero library
 * surprises, testable via snapshot rendering.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useMemo, useRef, useState } from "react";
import type { PerDoseActivityCurve, RiskZone } from "@/iob-hunter";

/* ─── Types ──────────────────────────────────────────────────────────── */

export type ContextBand = {
  label: string;
  startHour: number;
  endHour: number;
  fill: string;          // e.g. "rgba(236, 72, 153, 0.08)"
  stroke?: string;       // optional top/bottom border
};

export type BasalActivityChartProps = {
  curves: PerDoseActivityCurve[];
  /**
   * Optional "before" curves rendered underneath the primary curves
   * with heavy fading. Used by the authenticated What-if mode so users
   * see the delta between their actual regimen (faded, behind) and the
   * what-if scenario (vivid, on top). Omit for single-state charts.
   */
  comparisonCurves?: PerDoseActivityCurve[];
  startHour: number;
  endHour: number;
  /** Max U/h on the Y axis. Fixed by default for cross-day comparison. */
  yMax?: number;
  /** Contextual overlays such as sleep window etc. */
  contextBands?: ContextBand[];
  /**
   * Stacking peaks and coverage gaps the engine has detected. The chart
   * renders them as pink (stacking) / amber (gap) shaded bands and — if
   * any are present — surfaces a "show this graph to your clinician"
   * callout below the chart (per founder's clinical spec).
   */
  riskZones?: RiskZone[];
  /**
   * Optional green "suggested schedule" line — a single series of
   * total combined activity under a proposed re-timed regimen. When
   * provided, renders as a solid green stroke over the per-dose fills.
   */
  suggestedLine?: Array<{ hour: number; rate_uph: number }>;
  /** Label for the legend row describing the suggested line. */
  suggestedLabel?: string;
  height?: number;
  title?: string;
};

/* ─── Layout constants ───────────────────────────────────────────────── */

/** Compact default margins — tight enough to fit a 375px mobile viewport
 *  without clipping y-labels or rotated x-labels. */
const MARGIN = { top: 44, right: 14, bottom: 40, left: 36 };
const DEFAULT_HEIGHT = 360;
const Y_MAX_DEFAULT = 1.5;
const Y_TICK_STEP = 0.2;
/** X-axis tick interval — 4 hours reads cleanly on narrow screens. */
const X_TICK_HOURS = 4;
/** Breakpoint below which we apply a more compact text/spacing variant. */
const MOBILE_BREAKPOINT = 500;

/**
 * Monochrome blue ramp. Index 0 is the oldest curve (darkest navy),
 * the last index is the newest (lightest blue). The ramp is applied
 * after chronological sorting in the engine.
 */
const BLUE_RAMP = [
  "#0D2149", // darkest navy
  "#14307a",
  "#1e4aa8",
  "#2a6fd4",
  "#4a8ee5",
  "#7bb3e8",
  "#a8cff0",
  "#cce2f7", // lightest
];

function _rampColour(index: number, total: number): string {
  if (total <= 1) return BLUE_RAMP[0];
  const position = index / (total - 1);
  const bucket = Math.min(
    BLUE_RAMP.length - 1,
    Math.round(position * (BLUE_RAMP.length - 1)),
  );
  return BLUE_RAMP[bucket];
}

/**
 * Per-dose accent colours used on the hover dots and the math-style
 * tooltip. Colours are assigned by administered_at time so that a
 * "morning dose" is the same colour whether it's today's occurrence or
 * yesterday's prior-cycle shadow.
 */
const DOSE_PALETTE = [
  "#F59E0B", // amber  — 1st dose of the day
  "#10B981", // emerald — 2nd
  "#8B5CF6", // violet — 3rd
  "#EC4899", // pink   — 4th
  "#06B6D4", // cyan   — 5th
  "#F97316", // orange — 6th
];

/* ─── Helpers ────────────────────────────────────────────────────────── */

/** Wrap a fractional hour into 0–23 and format as HH:MM. */
function formatHourLabel(h: number): string {
  const wrapped = ((Math.floor(h) % 24) + 24) % 24;
  const m = Math.round((h - Math.floor(h)) * 60);
  return `${String(wrapped).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Build an SVG stroke path (line only) from curve points. */
function _curveToPath(
  points: PerDoseActivityCurve["points"],
  xScale: (h: number) => number,
  yScale: (r: number) => number,
): string {
  if (points.length === 0) return "";
  const out: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const { hour, rate_uph } = points[i];
    const x = xScale(hour);
    const y = yScale(rate_uph);
    out.push(i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `L ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return out.join(" ");
}

/**
 * Build a closed SVG fill path for one curve — baseline → curve → baseline.
 * Two of these stacked with semi-transparent fill will natural-composite
 * to a darker shade where they overlap.
 */
function curveToFillPath(
  points: PerDoseActivityCurve["points"],
  xScale: (h: number) => number,
  yScale: (r: number) => number,
  yBaseline: number,
): string {
  if (points.length === 0) return "";
  const out: string[] = [];
  const x0 = xScale(points[0].hour);
  out.push(`M ${x0.toFixed(2)} ${yBaseline.toFixed(2)}`);
  for (const p of points) {
    out.push(`L ${xScale(p.hour).toFixed(2)} ${yScale(p.rate_uph).toFixed(2)}`);
  }
  const xN = xScale(points[points.length - 1].hour);
  out.push(`L ${xN.toFixed(2)} ${yBaseline.toFixed(2)} Z`);
  return out.join(" ");
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function BasalActivityChart(props: BasalActivityChartProps) {
  const {
    curves, comparisonCurves, startHour, endHour,
    yMax = Y_MAX_DEFAULT, contextBands = [], riskZones = [],
    suggestedLine, suggestedLabel = "Suggested (optimal coverage)",
    height = DEFAULT_HEIGHT, title,
  } = props;

  const svgRef = useRef<SVGSVGElement | null>(null);
  // Hover state includes both the snapped hour (for data) and the raw
  // cursor pixel position (for floating-tooltip placement).
  const [hover, setHover] = useState<{ hour: number; cx: number; cy: number } | null>(null);
  const hoverHour = hover?.hour ?? null;

  // Responsive width via container measurement, fallback to 960px.
  const [width, setWidth] = useState<number>(960);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // ResizeObserver, measured on mount + resize.
  useMemo(() => {
    if (typeof window === "undefined") return;
    if (!window.ResizeObserver) return;
    const ro = new window.ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const e of entries) setWidth(Math.max(320, e.contentRect.width));
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
   
  }, []);

  const chartWidth = width - MARGIN.left - MARGIN.right;
  const chartHeight = height - MARGIN.top - MARGIN.bottom;

  const xScale = (h: number) =>
    MARGIN.left + ((h - startHour) / (endHour - startHour)) * chartWidth;
  const yScale = (r: number) =>
    MARGIN.top + (1 - Math.min(r, yMax) / yMax) * chartHeight;

  /* Map unique administered_at times → dose accent colour. Morning dose
     keeps the same colour across today + prior cycles. */
  const doseColour = useMemo(() => {
    const seen = new Map<string, string>();
    const uniqueTimes = Array.from(new Set(curves.map((c) => c.administered_at)))
      .sort((a, b) => a.localeCompare(b));
    uniqueTimes.forEach((t, i) => {
      seen.set(t, DOSE_PALETTE[i % DOSE_PALETTE.length]);
    });
    return (c: PerDoseActivityCurve) => seen.get(c.administered_at) ?? DOSE_PALETTE[0];
  }, [curves]);

  /* X-axis ticks every 2 hours — aligned to the next even hour at or
     after startHour so labels land on whole-clock times (00, 02, 04…). */
  const hourTicks = useMemo(() => {
    const out: number[] = [];
    const first = Math.ceil(startHour);
    const firstEven = first + ((X_TICK_HOURS - (first % X_TICK_HOURS)) % X_TICK_HOURS);
    for (let h = firstEven; h <= endHour; h += X_TICK_HOURS) out.push(h);
    return out;
  }, [startHour, endHour]);

  const compact = width < MOBILE_BREAKPOINT;
  const xTickFontSize = compact ? 9 : 10;
  const yTickFontSize = compact ? 9 : 10;
  const injectionLabelFontSize = compact ? 9 : 10;

  /* Y-axis ticks at 0, 0.2, 0.4 ... yMax. */
  const yTicks = useMemo(() => {
    const out: number[] = [];
    for (let r = 0; r <= yMax + 1e-9; r += Y_TICK_STEP) {
      out.push(Math.round(r * 100) / 100);
    }
    return out;
  }, [yMax]);

  /* Injection markers = cycle_offset=0 doses (today's injections). */
  const injectionMarkers = useMemo(() => {
    return curves
      .filter((c) => c.cycle_offset === 0)
      .map((c) => {
        const [h, m] = c.administered_at.split(":").map(Number);
        const hour = h + m / 60;
        return {
          dose_id: c.dose_id,
          hour,
          label: `${c.administered_at} — ${c.dose_units}U`,
          colour: "#334155",
        };
      })
      .filter((mk) => mk.hour >= startHour && mk.hour <= endHour);
  }, [curves, startHour, endHour]);

  /* Hover readout: for each curve, find the closest point and return
     its rate + screen position for rendering a coloured dot + math row. */
  const hoverRows = useMemo(() => {
    if (hoverHour === null) return null;
    return curves.map((c) => {
      let best = c.points[0];
      let bestDist = Math.abs(c.points[0].hour - hoverHour);
      for (const p of c.points) {
        const d = Math.abs(p.hour - hoverHour);
        if (d < bestDist) { best = p; bestDist = d; }
      }
      return {
        dose_id: c.dose_id,
        label: c.label,
        rate: best.rate_uph,
        x: xScale(best.hour),
        y: yScale(best.rate_uph),
        colour: doseColour(c),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverHour, curves, doseColour]);

  const tooltip = useMemo(() => {
    if (hoverHour === null || hoverRows === null) return null;
    // Hide zero-activity doses — a dose contributing < 0.005 U/h would
    // just read as "0.00" and clutter the math equation + legend.
    const activeRows = hoverRows.filter((r) => r.rate >= 0.005);
    const total = activeRows.reduce((s, r) => s + r.rate, 0);
    return { hour: hoverHour, rows: activeRows, total };
  }, [hoverHour, hoverRows]);

  const onMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const x = cx - MARGIN.left;
    const ratio = x / chartWidth;
    const h = startHour + ratio * (endHour - startHour);
    if (h < startHour || h > endHour) { setHover(null); return; }
    setHover({
      hour: Math.round(h * 4) / 4,  // snap to 15-min grid
      cx,
      cy,
    });
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {title && (
        <p style={{
          margin: 0, padding: "8px 0",
          font: `600 ${compact ? 12 : 14}px 'DM Sans', system-ui, sans-serif`,
          color: "var(--text-primary, #0D2149)",
        }}>
          {title}
        </p>
      )}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", background: "var(--bg-card, #fff)", borderRadius: 12 }}
        role="img"
        aria-label="Per-dose insulin activity rate chart"
      >
        {/* Context bands (e.g. gastro window) */}
        {contextBands.map((b) => (
          <g key={`band-${b.label}`}>
            <rect
              x={xScale(Math.max(b.startHour, startHour))}
              y={MARGIN.top}
              width={xScale(Math.min(b.endHour, endHour)) - xScale(Math.max(b.startHour, startHour))}
              height={chartHeight}
              fill={b.fill}
              stroke={b.stroke ?? "none"}
              strokeWidth={0.5}
            />
            <text
              x={xScale((Math.max(b.startHour, startHour) + Math.min(b.endHour, endHour)) / 2)}
              y={MARGIN.top + 14}
              textAnchor="middle"
              style={{
                font: "500 10px 'DM Sans', system-ui, sans-serif",
                fill: "rgba(100,30,80,0.7)",
                letterSpacing: 0.5,
              }}
            >
              {b.label.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Risk zones (stacking + coverage gaps) — painted over context bands */}
        {riskZones.map((z, i) => {
          const isStacking = z.type === "stacking_peak";
          const fill = isStacking ? "rgba(232, 64, 64, 0.12)"   : "rgba(245, 158, 11, 0.12)";
          const stroke = isStacking ? "rgba(232, 64, 64, 0.55)" : "rgba(245, 158, 11, 0.55)";
          const labelFill = isStacking ? "rgba(160, 20, 20, 0.85)" : "rgba(146, 64, 14, 0.85)";
          const xStart = xScale(Math.max(z.startHour, startHour));
          const xEnd   = xScale(Math.min(z.endHour, endHour));
          if (xEnd <= xStart) return null;
          return (
            <g key={`risk-${i}`}>
              <rect
                x={xStart} y={MARGIN.top}
                width={xEnd - xStart} height={chartHeight}
                fill={fill} stroke={stroke} strokeWidth={0.75}
                strokeDasharray="4 3"
              />
              <text
                x={(xStart + xEnd) / 2}
                y={MARGIN.top + 12}
                textAnchor="middle"
                style={{
                  font: "600 9px 'DM Sans', system-ui, sans-serif",
                  fill: labelFill,
                  letterSpacing: 0.6,
                }}
              >
                {z.label}
              </text>
            </g>
          );
        })}

        {/* Y gridlines + labels */}
        {yTicks.map((r) => (
          <g key={`y-${r}`}>
            <line
              x1={MARGIN.left} x2={MARGIN.left + chartWidth}
              y1={yScale(r)} y2={yScale(r)}
              stroke="rgba(148,163,184,0.18)" strokeWidth={1}
            />
            <text
              x={MARGIN.left - 8} y={yScale(r) + 3}
              textAnchor="end"
              style={{ font: `${yTickFontSize}px 'DM Sans', system-ui, sans-serif`, fill: "#64748B" }}
            >
              {r.toFixed(1)}
            </text>
          </g>
        ))}
        <text
          x={MARGIN.left + 2} y={MARGIN.top - 4}
          style={{ font: `500 ${yTickFontSize}px 'DM Sans', system-ui, sans-serif`, fill: "#64748B" }}
        >
          U/h
        </text>

        {/* X hour ticks + labels */}
        {hourTicks.map((h) => (
          <g key={`x-${h}`}>
            <line
              x1={xScale(h)} x2={xScale(h)}
              y1={MARGIN.top + chartHeight} y2={MARGIN.top + chartHeight + 4}
              stroke="#94A3B8" strokeWidth={1}
            />
            <text
              x={xScale(h)} y={MARGIN.top + chartHeight + 16}
              textAnchor="middle"
              style={{ font: `${xTickFontSize}px 'DM Sans', system-ui, sans-serif`, fill: "#64748B" }}
            >
              {formatHourLabel(h)}
            </text>
          </g>
        ))}

        {/* Plot border */}
        <rect
          x={MARGIN.left} y={MARGIN.top}
          width={chartWidth} height={chartHeight}
          fill="none"
          stroke="rgba(148,163,184,0.35)" strokeWidth={1}
        />

        {/* Comparison "before" layer — heavy-faded actual-regimen curves
            rendered UNDER the primary curves. Active in what-if mode so
            the delta is visible. Omitted entirely when comparisonCurves
            is undefined (default state). */}
        {comparisonCurves && comparisonCurves.map((c) => (
          <g key={`cmp-${c.dose_id}`}>
            <path
              d={curveToFillPath(c.points, xScale, yScale, MARGIN.top + chartHeight)}
              fill="rgba(148, 163, 184, 0.18)"
              stroke="rgba(100, 116, 139, 0.45)"
              strokeWidth={1}
              strokeDasharray="4 3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Per-dose curves — uniform light-blue fill. Semi-transparent
            so overlapping regions alpha-composite into a darker blue
            naturally (deeper overlap = darker shade). Outline stroke is
            slightly darker for edge definition. */}
        {curves.map((c) => (
          <g key={c.dose_id}>
            <path
              d={curveToFillPath(c.points, xScale, yScale, MARGIN.top + chartHeight)}
              fill="rgba(59, 130, 246, 0.22)"
              stroke="rgba(30, 64, 175, 0.55)"
              strokeWidth={1.25}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Injection markers (today's doses) — horizontal label + downward triangle + dashed line */}
        {injectionMarkers.map((mk) => (
          <g key={`mk-${mk.dose_id}`}>
            {/* Label: horizontal, centred above chart */}
            <text
              x={xScale(mk.hour)} y={MARGIN.top - 10}
              textAnchor="middle"
              style={{ font: `500 ${injectionLabelFontSize}px 'DM Sans', system-ui, sans-serif`, fill: "#334155" }}
            >
              {mk.label}
            </text>
            {/* Downward triangle (▼): base at MARGIN.top - 6, tip at MARGIN.top */}
            <polygon
              points={`${xScale(mk.hour) - 3},${MARGIN.top - 6} ${xScale(mk.hour) + 3},${MARGIN.top - 6} ${xScale(mk.hour)},${MARGIN.top}`}
              fill="#334155"
            />
            {/* Dashed line from triangle tip down to baseline */}
            <line
              x1={xScale(mk.hour)} x2={xScale(mk.hour)}
              y1={MARGIN.top} y2={MARGIN.top + chartHeight}
              stroke="#334155" strokeWidth={1} strokeDasharray="4 3"
            />
          </g>
        ))}

        {/* Suggested schedule reference line — green stroke, no fill,
            sits on top of the per-dose fills but below the hover dots. */}
        {suggestedLine && suggestedLine.length > 0 && (
          <path
            d={(() => {
              const out: string[] = [];
              for (let i = 0; i < suggestedLine.length; i++) {
                const { hour, rate_uph } = suggestedLine[i];
                const x = xScale(hour).toFixed(2);
                const y = yScale(rate_uph).toFixed(2);
                out.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
              }
              return out.join(" ");
            })()}
            fill="none"
            stroke="#059669"
            strokeWidth={2.25}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="0"
            aria-label={suggestedLabel}
          />
        )}

        {/* Hover crosshair + per-curve coloured dots that drag along
            each curve as the cursor moves. */}
        {hoverHour !== null && (
          <line
            x1={xScale(hoverHour)} x2={xScale(hoverHour)}
            y1={MARGIN.top} y2={MARGIN.top + chartHeight}
            stroke="#0D2149" strokeWidth={1} strokeDasharray="2 3" opacity={0.6}
          />
        )}
        {hoverRows && hoverRows
          .filter((r) => r.rate >= 0.005)
          .map((r) => (
            <circle
              key={`dot-${r.dose_id}`}
              cx={r.x} cy={r.y} r={5}
              fill={r.colour}
              stroke="white"
              strokeWidth={1.5}
            />
          ))}

        {/* Invisible rect over plot area to capture mouse move */}
        <rect
          x={MARGIN.left} y={MARGIN.top}
          width={chartWidth} height={chartHeight}
          fill="transparent"
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>

      {/* Tooltip panel (flows below chart, not positioned absolutely to
          avoid clipping and keep the layout predictable). */}
      {tooltip && hover && (() => {
        // Floating tooltip: hover.cx/cy is cursor position relative to
        // the container's top-left. Offset +14px right / +14px down from
        // the cursor. Shrinks with the container so narrow layouts don't
        // spill — "compact not clip" per founder's spec. Flips to the
        // left of the cursor when a right-side tooltip would overflow.
        const TT_WIDTH_ESTIMATE = Math.min(280, width - 16);
        const TT_HEIGHT_ESTIMATE = 140;
        const flipLeft = hover.cx + TT_WIDTH_ESTIMATE + 24 > width;
        const left = flipLeft ? hover.cx - TT_WIDTH_ESTIMATE - 14 : hover.cx + 14;
        let top = hover.cy + 14;
        if (top + TT_HEIGHT_ESTIMATE > height - MARGIN.bottom)
          top = Math.max(0, hover.cy - TT_HEIGHT_ESTIMATE - 10);
        return (
        <div style={{
          position: "absolute",
          left: Math.max(4, left),
          top: Math.max(4, top),
          width: TT_WIDTH_ESTIMATE,
          padding: "14px 16px",
          background: "#fff",
          border: "1px solid rgba(148,163,184,0.35)",
          borderRadius: 10,
          boxShadow: "0 6px 20px rgba(15, 23, 42, 0.12)",
          font: "13px 'DM Sans', system-ui, sans-serif",
          color: "#0D2149",
          pointerEvents: "none",
          zIndex: 10,
        }}>
          <div style={{ fontSize: 11, color: "#64748B", letterSpacing: 0.4, marginBottom: 8 }}>
            AT {formatHourLabel(tooltip.hour)}
          </div>

          {/* Math-for-kids layout: colourful dots + addition sum.
              Reads left-to-right as "0.37 + 0.18 + 0.04 = 0.59 U/h". */}
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center",
            gap: 8,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 16, fontWeight: 600,
            color: "#0D2149",
          }}>
            {tooltip.rows.map((r, i) => (
              <span key={r.dose_id} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {i > 0 && <span style={{ color: "#94A3B8", fontWeight: 400 }}>+</span>}
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: 12, height: 12, borderRadius: "50%",
                    background: r.colour,
                    border: "2px solid white",
                    boxShadow: "0 0 0 1px rgba(15,23,42,0.15)",
                  }}
                />
                <span>{r.rate.toFixed(2)}</span>
              </span>
            ))}
            <span style={{ color: "#94A3B8", fontWeight: 400, margin: "0 4px" }}>=</span>
            <span style={{ color: "#0D2149", fontSize: 18 }}>
              {tooltip.total.toFixed(2)}
            </span>
            <span style={{ color: "#64748B", fontWeight: 400, fontSize: 13 }}>U/h</span>
            <span style={{
              marginLeft: 8, padding: "2px 8px",
              background: "rgba(13,33,73,0.08)", borderRadius: 999,
              fontSize: 11, fontWeight: 500, color: "#0D2149", fontFamily: "inherit",
            }}>
              IOB total
            </span>
          </div>

          {/* Dose legend: which colour is which dose. */}
          <div style={{
            marginTop: 10, display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gap: "4px 10px", fontSize: 11, color: "#475569",
          }}>
            {tooltip.rows.map((r) => (
              <div key={`lg-${r.dose_id}`} style={{ display: "contents" }}>
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: 10, height: 10, borderRadius: "50%",
                    background: r.colour,
                    alignSelf: "center",
                  }}
                />
                <span>{r.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#0D2149" }}>
                  {r.rate.toFixed(2)} U/h
                </span>
              </div>
            ))}
          </div>
        </div>
        );
      })()}
    </div>
  );
}
