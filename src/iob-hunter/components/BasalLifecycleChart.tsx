/**
 * GluMira™ V7 — BasalLifecycleChart (dual-panel)
 *
 * Two vertically-stacked panels sharing one x-axis:
 *   TOP    — ACTIVITY RATE (U/h)  · the flat-line view
 *   BOTTOM — IOB (U)              · units-remaining readout
 *
 * Driven entirely by the canonical engine:
 *   calculateActivityRate  → U/h
 *   calculateIOB           → U
 *
 * Graph-window rule (founder, 2026-04-13):
 *   Start = 1 h before yesterday's first injection
 *   End   = last dose + full DOA
 *   Charts never start from zero — steady-state.
 *
 * Fixed-DOA rule: same insulin type = same curve shape = same X footprint.
 * Only peak height scales with dose. Never let the activity path become
 * dose-dependent.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useMemo, useRef, useState } from "react";
import { calculateActivityRate, calculateIOB } from "@/iob-hunter";
import type { InsulinProfile } from "@/iob-hunter";

/* ─── Types ──────────────────────────────────────────────────────────── */

export type BasalLifecycleDose = {
  /** Hours relative to today's primary injection (t=0). Yesterday 06:00 = -24. */
  hour: number;
  units: number;
  label: string;
  day: -1 | 0 | 1;
  /** Optional per-dose profile. When set, this dose uses its own PK +
   *  its own `profile.colour` for the fill. Falls back to the chart's
   *  top-level `profile` prop when omitted. Enables multi-insulin
   *  rendering where each insulin type paints in its own vivid colour. */
  profile?: InsulinProfile;
};

export type BasalLifecycleChartProps = {
  profile: InsulinProfile;
  weightKg: number;
  doses: BasalLifecycleDose[];
  /** Today's primary injection time as HH:MM (default 06:00). */
  todayAnchor?: string;
  height?: number;
  title?: string;
};

/* ─── Layout constants ───────────────────────────────────────────────── */

const MARGIN = { top: 34, right: 14, bottom: 44, left: 40 };
const GAP = 22;             // vertical gap between the two panels
const DEFAULT_HEIGHT = 420;
const TOP_FRACTION = 0.55;  // activity rate gets a bit more height than IOB
const X_TICK_HOURS = 6;
const MOBILE_BREAKPOINT = 500;

/* ─── Helpers ────────────────────────────────────────────────────────── */

function parseAnchor(anchor: string): { h: number; m: number } {
  const [h, m] = anchor.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

function formatLifecycleTime(
  offsetHours: number,
  anchorHour: number,
  anchorMinute: number,
): string {
  const wallHours = offsetHours + anchorHour + anchorMinute / 60;
  const dayIndex = Math.floor(wallHours / 24);
  const inDay = ((wallHours % 24) + 24) % 24;
  const hh = Math.floor(inDay);
  const mm = Math.round((inDay - hh) * 60);
  const hhStr = String(hh).padStart(2, "0");
  const mmStr = String(mm).padStart(2, "0");
  const dayLabel =
    dayIndex === -1 ? " Y" :
    dayIndex === 0  ? "" :
    dayIndex === 1  ? " +1" :
    dayIndex === 2  ? " +2" :
                      ` ${dayIndex >= 0 ? "+" : ""}${dayIndex}`;
  return `${hhStr}:${mmStr}${dayLabel}`;
}

/** Resolve effective DOA for a single dose (Levemir dose-dependent; others fixed). */
function effectiveDoaHours(profile: InsulinProfile, units: number, weightKg: number): number {
  if (profile.decay_model === "albumin_bound" && profile.decay_parameters.dose_dependent_doa) {
    const anchors: Array<[number, number]> = [];
    const dp = profile.decay_parameters;
    (["doa_0_1", "doa_0_2", "doa_0_4", "doa_0_8", "doa_1_6"] as const).forEach((k, i) => {
      const uPerKg = [0.1, 0.2, 0.4, 0.8, 1.6][i];
      const doaMin = dp[k];
      if (typeof doaMin === "number") anchors.push([uPerKg, doaMin]);
    });
    if (anchors.length === 0) return profile.duration_minutes / 60;
    const ratio = units / weightKg;
    if (ratio <= anchors[0][0]) return anchors[0][1] / 60;
    if (ratio >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1] / 60;
    for (let i = 0; i < anchors.length - 1; i++) {
      const [x0, y0] = anchors[i];
      const [x1, y1] = anchors[i + 1];
      if (ratio >= x0 && ratio <= x1) {
        return (y0 + ((ratio - x0) / (x1 - x0)) * (y1 - y0)) / 60;
      }
    }
  }
  return profile.duration_minutes / 60;
}

/** Round a number up to a "nice" axis ceiling (0.2 / 0.5 / 1 / 2 / 5 / 10…). */
function niceCeil(v: number, min: number): number {
  const x = Math.max(v, min);
  const bands = [0.2, 0.5, 1, 1.5, 2, 3, 4, 5, 8, 10, 15, 20, 30, 50, 75, 100];
  for (const b of bands) if (b >= x) return b;
  return Math.ceil(x / 10) * 10;
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function BasalLifecycleChart(props: BasalLifecycleChartProps) {
  const {
    profile, weightKg, doses,
    todayAnchor = "06:00",
    height = DEFAULT_HEIGHT,
    title,
  } = props;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(960);
  const [hover, setHover] = useState<{ hour: number; cx: number; cy: number } | null>(null);
  // Depot-contents panel is hidden by default. Matches founder's educator
  // convention: activity-rate is the teaching chart; depot-contents is an
  // advanced / pro-tier view behind a toggle.
  const [showDepot, setShowDepot] = useState<boolean>(false);

  useMemo(() => {
    if (typeof window === "undefined" || !window.ResizeObserver) return;
    const ro = new window.ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const e of entries) setWidth(Math.max(320, e.contentRect.width));
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [height]);

  const anchor = parseAnchor(todayAnchor);

  /* ─── Compute window + both curves ──────────────────────────────── */
  const {
    startHour, endHour, samples, perDose,
    rateMax, iobMax,
    ratePeak, ratePeakHour,
    iobPeak,  iobPeakHour,
  } = useMemo(() => {
    if (doses.length === 0) {
      return {
        startHour: -24, endHour: 24, samples: [], perDose: [],
        rateMax: 1, iobMax: 1,
        ratePeak: 0, ratePeakHour: 0,
        iobPeak: 0, iobPeakHour: 0,
      };
    }

    const firstDoseHour = Math.min(...doses.map((d) => d.hour));
    const lastDoseHour  = Math.max(...doses.map((d) => d.hour));
    const maxUnits = Math.max(...doses.map((d) => d.units));
    const doaH = effectiveDoaHours(profile, maxUnits, weightKg);
    const start = firstDoseHour - 1;
    const end = Math.ceil(lastDoseHour + doaH);

    // Prior-cycle phantom doses — INSULIN_LOCK.md invariant #1 ("never
    // start at zero"). Replicate the first day's visible dose pattern
    // backwards by enough full days to cover the insulin's DOA, so the
    // chart opens at true steady state instead of adding a single extra
    // dose worth of activity to the first DOA window (which would spike
    // the leftmost peak above every other peak on the chart).
    //
    // Phantoms contribute to the curve + per-dose overlay but are NOT
    // rendered as injection markers and do NOT shift the window bounds.
    const sameDayDoses = doses.filter(
      (d) => d.hour - firstDoseHour < 24,
    );
    const priorDaysNeeded = Math.max(1, Math.ceil(doaH / 24));
    const priorPhantoms: BasalLifecycleDose[] = [];
    for (let k = 1; k <= priorDaysNeeded; k++) {
      for (const d of sameDayDoses) {
        priorPhantoms.push({
          hour: d.hour - 24 * k,
          units: d.units,
          label: `Prior cycle (D-${k + 1})`,
          day: -1,
        });
      }
    }
    const allDoses = [...priorPhantoms, ...doses];

    const stepMin = 10;
    const totalMin = (end - start) * 60;
    const pts: Array<{ hour: number; rate: number; iob: number; clock: string }> = [];
    // Per-dose points — one parallel array per dose (phantom first, then
    // visible doses in order). Each stores this dose's own contribution
    // at every sampled hour. Non-active doses contribute 0 before their
    // injection and after their DOA.
    const perDosePoints: Array<Array<{ hour: number; rate: number; iob: number }>> =
      allDoses.map(() => []);
    let rMax = 0, iMax = 0;
    let rPeakH = start, iPeakH = start;

    for (let m = 0; m <= totalMin; m += stepMin) {
      const hour = start + m / 60;
      let rate = 0;
      let iob  = 0;
      for (let di = 0; di < allDoses.length; di++) {
        const d = allDoses[di];
        let r = 0;
        let i = 0;
        if (hour >= d.hour) {
          const mSince = (hour - d.hour) * 60;
          // Per-dose profile override for multi-insulin graphs. When a
          // dose carries its own profile, use it so each insulin type's
          // DOA / decay model / peak shape drives its own contribution.
          const doseProfile = d.profile ?? profile;
          r = calculateActivityRate(d.units, doseProfile, mSince, weightKg);
          i = calculateIOB(d.units, doseProfile, mSince, weightKg);
        }
        perDosePoints[di].push({ hour, rate: r, iob: i });
        rate += r;
        iob  += i;
      }
      if (rate > rMax) { rMax = rate; rPeakH = hour; }
      if (iob  > iMax) { iMax = iob;  iPeakH = hour; }
      pts.push({ hour, rate, iob, clock: formatLifecycleTime(hour, anchor.h, anchor.m) });
    }

    const perDoseOut = allDoses.map((d, di) => ({ dose: d, points: perDosePoints[di] }));

    return {
      startHour: start, endHour: end, samples: pts, perDose: perDoseOut,
      rateMax: niceCeil(rMax * 1.15, 0.2),
      iobMax:  niceCeil(iMax * 1.15, 2),
      ratePeak: rMax, ratePeakHour: rPeakH,
      iobPeak: iMax,  iobPeakHour: iPeakH,
    };
  }, [profile, weightKg, doses, anchor.h, anchor.m]);

  const plotWidth = width - MARGIN.left - MARGIN.right;
  // When depot panel is hidden, collapse the chart height to just the
  // top panel's portion — a clean single-panel educator view. When
  // shown, use the full height split between the two panels with a gap.
  const effectiveHeight = showDepot
    ? height
    : Math.max(220, Math.round(height * TOP_FRACTION + MARGIN.top + MARGIN.bottom - 8));
  const totalPlotHeight = showDepot
    ? effectiveHeight - MARGIN.top - MARGIN.bottom - GAP
    : effectiveHeight - MARGIN.top - MARGIN.bottom;
  const topH = showDepot ? totalPlotHeight * TOP_FRACTION : totalPlotHeight;
  const botH = showDepot ? totalPlotHeight * (1 - TOP_FRACTION) : 0;

  const topY1 = MARGIN.top;
  const topY2 = topY1 + topH;
  const botY1 = topY2 + GAP;
  const botY2 = botY1 + botH;

  const xScale = (h: number) =>
    MARGIN.left + ((h - startHour) / (endHour - startHour)) * plotWidth;
  const yScaleRate = (v: number) =>
    topY1 + (1 - Math.min(v, rateMax) / rateMax) * topH;
  const yScaleIob = (v: number) =>
    botY1 + (1 - Math.min(v, iobMax) / iobMax) * botH;

  const compact = width < MOBILE_BREAKPOINT;
  const tickFS = compact ? 9 : 10;
  const labelFS = compact ? 9 : 10;

  /* X ticks — aligned to 6 h. */
  const xTicks = useMemo(() => {
    const out: number[] = [];
    const first = Math.ceil(startHour);
    const firstAligned = first + ((X_TICK_HOURS - (((first % X_TICK_HOURS) + X_TICK_HOURS) % X_TICK_HOURS)) % X_TICK_HOURS);
    for (let h = firstAligned; h <= endHour; h += X_TICK_HOURS) out.push(h);
    return out;
  }, [startHour, endHour]);

  /* Y ticks per panel — 5 values each. */
  const yTicksRate = useMemo(() => {
    const s = rateMax / 4;
    return [0, s, s * 2, s * 3, rateMax].map((v) => Math.round(v * 100) / 100);
  }, [rateMax]);
  const yTicksIob = useMemo(() => {
    const s = iobMax / 4;
    return [0, s, s * 2, s * 3, iobMax].map((v) => Math.round(v * 10) / 10);
  }, [iobMax]);

  /* Paths — top (rate) and bottom (iob). */
  const ratePath = useMemo(() => {
    if (samples.length === 0) return "";
    const out: string[] = [];
    samples.forEach((p, i) => {
      out.push(`${i === 0 ? "M" : "L"} ${xScale(p.hour).toFixed(2)} ${yScaleRate(p.rate).toFixed(2)}`);
    });
    return out.join(" ");
  }, [samples, width, height, rateMax, startHour, endHour]);

  const iobPath = useMemo(() => {
    if (samples.length === 0) return "";
    const out: string[] = [];
    samples.forEach((p, i) => {
      out.push(`${i === 0 ? "M" : "L"} ${xScale(p.hour).toFixed(2)} ${yScaleIob(p.iob).toFixed(2)}`);
    });
    return out.join(" ");
  }, [samples, width, height, iobMax, startHour, endHour]);

  /* Per-dose fills — one baseline→curve→baseline path per dose. Rendered
     semi-transparent so overlapping regions alpha-composite to a darker
     blue automatically. Matches the BasalActivityChart overlay pattern. */
  const perDoseRateFills = useMemo(() => {
    if (samples.length === 0) return [] as string[];
    return perDose.map((series) => {
      if (series.points.length === 0) return "";
      const out: string[] = [];
      out.push(`M ${xScale(series.points[0].hour).toFixed(2)} ${topY2.toFixed(2)}`);
      for (const p of series.points) {
        out.push(`L ${xScale(p.hour).toFixed(2)} ${yScaleRate(p.rate).toFixed(2)}`);
      }
      out.push(`L ${xScale(series.points[series.points.length - 1].hour).toFixed(2)} ${topY2.toFixed(2)} Z`);
      return out.join(" ");
    });
  }, [perDose, samples.length, width, height, rateMax, startHour, endHour]);

  const perDoseIobFills = useMemo(() => {
    if (samples.length === 0) return [] as string[];
    return perDose.map((series) => {
      if (series.points.length === 0) return "";
      const out: string[] = [];
      out.push(`M ${xScale(series.points[0].hour).toFixed(2)} ${botY2.toFixed(2)}`);
      for (const p of series.points) {
        out.push(`L ${xScale(p.hour).toFixed(2)} ${yScaleIob(p.iob).toFixed(2)}`);
      }
      out.push(`L ${xScale(series.points[series.points.length - 1].hour).toFixed(2)} ${botY2.toFixed(2)} Z`);
      return out.join(" ");
    });
  }, [perDose, samples.length, width, height, iobMax, startHour, endHour]);

  /* Hover readout. */
  const hoverPt = useMemo(() => {
    if (!hover) return null;
    let best = samples[0];
    let bestDist = Infinity;
    for (const p of samples) {
      const d = Math.abs(p.hour - hover.hour);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    return best ?? null;
  }, [hover, samples]);

  const onMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const x = cx - MARGIN.left;
    const ratio = x / plotWidth;
    const h = startHour + ratio * (endHour - startHour);
    if (h < startHour || h > endHour) { setHover(null); return; }
    setHover({ hour: h, cx, cy });
  };

  const insulinColour = profile.colour || "#1976D2";

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Top row — title + depot-contents toggle. Toggle is right-aligned,
          compact, read-only text button. Hidden when container is too
          narrow to avoid clash with the title. */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 0", gap: 12, flexWrap: "wrap",
      }}>
        {title ? (
          <p style={{
            margin: 0,
            font: `600 ${compact ? 12 : 14}px 'DM Sans', system-ui, sans-serif`,
            color: "#0D2149",
          }}>
            {title}
          </p>
        ) : <span />}
        <button
          type="button"
          onClick={() => setShowDepot((v) => !v)}
          aria-pressed={showDepot}
          style={{
            padding: "4px 10px",
            background: showDepot ? "#0D2149" : "#F1F5F9",
            color: showDepot ? "#fff" : "#0D2149",
            border: "1px solid rgba(148,163,184,0.35)",
            borderRadius: 999,
            cursor: "pointer",
            font: `500 ${compact ? 10 : 11}px 'DM Sans', system-ui, sans-serif`,
            letterSpacing: 0.3,
          }}
        >
          {showDepot ? "Hide depot contents" : "Show depot contents"}
        </button>
      </div>
      <svg
        ref={svgRef}
        width={width}
        height={effectiveHeight}
        viewBox={`0 0 ${width} ${effectiveHeight}`}
        style={{ display: "block", background: "#fff", borderRadius: 12 }}
        role="img"
        aria-label={
          showDepot
            ? `${profile.brand_name} lifecycle — activity rate and IOB`
            : `${profile.brand_name} lifecycle — activity rate`
        }
      >
        {/* Panel labels */}
        <text
          x={MARGIN.left} y={topY1 - 8}
          style={{ font: `600 ${labelFS}px 'DM Sans', system-ui, sans-serif`, fill: "#0D2149", letterSpacing: 0.4 }}
        >
          ACTIVITY RATE — U/h
        </text>
        {showDepot && (
          <text
            x={MARGIN.left} y={botY1 - 6}
            style={{ font: `600 ${labelFS}px 'DM Sans', system-ui, sans-serif`, fill: "#0D2149", letterSpacing: 0.4 }}
          >
            IOB — U (depot contents)
          </text>
        )}

        {/* Top panel — gridlines + y labels */}
        {yTicksRate.map((v) => (
          <g key={`yr-${v}`}>
            <line
              x1={MARGIN.left} x2={MARGIN.left + plotWidth}
              y1={yScaleRate(v)} y2={yScaleRate(v)}
              stroke="rgba(148,163,184,0.18)" strokeWidth={1}
            />
            <text
              x={MARGIN.left - 6} y={yScaleRate(v) + 3}
              textAnchor="end"
              style={{ font: `${tickFS}px 'JetBrains Mono', monospace`, fill: "#64748B" }}
            >
              {v.toFixed(2)}
            </text>
          </g>
        ))}
        <rect
          x={MARGIN.left} y={topY1}
          width={plotWidth} height={topH}
          fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth={1}
        />

        {/* Top panel — per-dose fills first (overlap darkens via alpha-compositing),
            then combined line on top. Each dose paints in its own profile
            colour so multi-insulin views show distinct hill colours. */}
        {perDoseRateFills.map((d, i) => {
          if (!d) return null;
          const doseColour = perDose[i]?.dose.profile?.colour ?? insulinColour;
          return (
            <g key={`rateDose-${i}`}>
              <path d={d} fill={doseColour} fillOpacity={0.22} stroke={doseColour} strokeOpacity={0.45} strokeWidth={0.75} />
            </g>
          );
        })}
        <path d={ratePath} fill="none" stroke={insulinColour} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Bottom panel — only when depot toggle is ON */}
        {showDepot && yTicksIob.map((v) => (
          <g key={`yi-${v}`}>
            <line
              x1={MARGIN.left} x2={MARGIN.left + plotWidth}
              y1={yScaleIob(v)} y2={yScaleIob(v)}
              stroke="rgba(148,163,184,0.18)" strokeWidth={1}
            />
            <text
              x={MARGIN.left - 6} y={yScaleIob(v) + 3}
              textAnchor="end"
              style={{ font: `${tickFS}px 'JetBrains Mono', monospace`, fill: "#64748B" }}
            >
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {showDepot && (
          <rect
            x={MARGIN.left} y={botY1}
            width={plotWidth} height={botH}
            fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth={1}
          />
        )}

        {/* Bottom panel per-dose IOB fills + combined line — toggle-gated.
            Each dose uses its own profile colour (multi-insulin). */}
        {showDepot && perDoseIobFills.map((d, i) => {
          if (!d) return null;
          const doseColour = perDose[i]?.dose.profile?.colour ?? insulinColour;
          return (
            <g key={`iobDose-${i}`}>
              <path d={d} fill={doseColour} fillOpacity={0.18} stroke={doseColour} strokeOpacity={0.40} strokeWidth={0.75} />
            </g>
          );
        })}
        {showDepot && (
          <path d={iobPath} fill="none" stroke={insulinColour} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 3" />
        )}

        {/* Today-anchor vertical (spans whichever panels are visible) */}
        <line
          x1={xScale(0)} x2={xScale(0)}
          y1={topY1} y2={showDepot ? botY2 : topY2}
          stroke="#0D2149" strokeWidth={1} strokeDasharray="3 3" opacity={0.3}
        />

        {/* Injection markers — dashed vertical line (per-insulin coloured)
            from chart top to marker-bottom, with a rotated −90° label
            sitting ON TOP of the line (reads bottom-to-top). Label format
            per spec: "HH:MM — NU" or "HH:MM NU — Brand" for multi-insulin. */}
        {doses.map((d) => {
          const markerBottom = showDepot ? botY2 : topY2;
          const doseColour = d.profile?.colour ?? insulinColour;
          const timeLabel = formatLifecycleTime(d.hour, anchor.h, anchor.m);
          const brand = d.profile?.brand_name ?? profile.brand_name;
          // Multi-insulin when any dose carries a profile different from
          // the component-level one; include brand in the label for clarity.
          const isMulti = doses.some((x) => x.profile && x.profile.brand_name !== profile.brand_name);
          const labelText = isMulti
            ? `${timeLabel}  ${d.units}U  ${brand}`
            : `${timeLabel}  ${d.units}U`;
          const lx = xScale(d.hour);
          // Label sits near the top of the vertical line, rotated −90°
          // so it reads bottom-to-top along the line, same convention as
          // the Y-axis title.
          const labelAnchorY = topY1 + 6;
          return (
            <g key={`inj-${d.hour}`}>
              <line
                x1={lx} x2={lx}
                y1={topY1} y2={markerBottom}
                stroke={doseColour} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.85}
              />
              <text
                x={lx} y={labelAnchorY}
                textAnchor="start"
                transform={`rotate(-90, ${lx}, ${labelAnchorY})`}
                style={{
                  font: `500 ${labelFS}px 'DM Sans', system-ui, sans-serif`,
                  fill: doseColour,
                  letterSpacing: 0.2,
                }}
              >
                {labelText}
              </text>
            </g>
          );
        })}

        {/* X ticks at the bottom of whichever panel is showing. */}
        {xTicks.map((h) => {
          const xAxisY = showDepot ? botY2 : topY2;
          return (
            <g key={`x-${h}`}>
              <line
                x1={xScale(h)} x2={xScale(h)}
                y1={xAxisY} y2={xAxisY + 4}
                stroke="#94A3B8" strokeWidth={1}
              />
              <text
                x={xScale(h)} y={xAxisY + 18}
                textAnchor="middle"
                style={{ font: `${tickFS}px 'JetBrains Mono', monospace`, fill: "#64748B" }}
              >
                {formatLifecycleTime(h, anchor.h, anchor.m)}
              </text>
            </g>
          );
        })}

        {/* Hover crosshair + dot(s). IOB dot only rendered when depot visible. */}
        {hover && hoverPt && (
          <>
            <line
              x1={xScale(hover.hour)} x2={xScale(hover.hour)}
              y1={topY1} y2={showDepot ? botY2 : topY2}
              stroke="#0D2149" strokeWidth={1} strokeDasharray="2 3" opacity={0.55}
            />
            <circle
              cx={xScale(hoverPt.hour)} cy={yScaleRate(hoverPt.rate)}
              r={4.5} fill={insulinColour} stroke="white" strokeWidth={1.5}
            />
            {showDepot && (
              <circle
                cx={xScale(hoverPt.hour)} cy={yScaleIob(hoverPt.iob)}
                r={4.5} fill={insulinColour} stroke="white" strokeWidth={1.5}
              />
            )}
          </>
        )}

        {/* Mouse capture — spans the active plot area. */}
        <rect
          x={MARGIN.left} y={topY1}
          width={plotWidth} height={(showDepot ? botY2 : topY2) - topY1}
          fill="transparent"
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>

      {/* Floating tooltip — shows both values */}
      {hover && hoverPt && (() => {
        const TT_WIDTH = Math.min(220, width - 16);
        const flipLeft = hover.cx + TT_WIDTH + 24 > width;
        const left = flipLeft ? hover.cx - TT_WIDTH - 14 : hover.cx + 14;
        let top = hover.cy + 14;
        if (top + 110 > height) top = Math.max(0, hover.cy - 120);
        return (
          <div style={{
            position: "absolute",
            left: Math.max(4, left),
            top: Math.max(4, top),
            width: TT_WIDTH,
            padding: "10px 12px",
            background: "#fff",
            border: "1px solid rgba(148,163,184,0.35)",
            borderRadius: 10,
            boxShadow: "0 6px 20px rgba(15, 23, 42, 0.12)",
            font: "12px 'DM Sans', system-ui, sans-serif",
            color: "#0D2149",
            pointerEvents: "none",
            zIndex: 10,
          }}>
            <div style={{ fontSize: 10, color: "#64748B", letterSpacing: 0.4, marginBottom: 6 }}>
              AT {hoverPt.clock}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 8px", fontFamily: "'JetBrains Mono', monospace" }}>
              <span style={{ fontSize: 10, color: "#64748B", fontFamily: "'DM Sans', system-ui, sans-serif" }}>rate</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{hoverPt.rate.toFixed(3)} U/h</span>
              {showDepot && (
                <>
                  <span style={{ fontSize: 10, color: "#64748B", fontFamily: "'DM Sans', system-ui, sans-serif" }}>iob</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{hoverPt.iob.toFixed(2)} U</span>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Footer — peaks for each visible panel. */}
      <div style={{
        marginTop: 6,
        display: "flex", flexWrap: "wrap", gap: 14,
        fontSize: 11, color: "#475569", fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <span>
          Rate peak <strong style={{ color: "#0D2149", fontFamily: "'JetBrains Mono', monospace" }}>
            {ratePeak.toFixed(3)} U/h
          </strong> at <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {formatLifecycleTime(ratePeakHour, anchor.h, anchor.m)}
          </span>
        </span>
        {showDepot && (
          <span>
            IOB peak <strong style={{ color: "#0D2149", fontFamily: "'JetBrains Mono', monospace" }}>
              {iobPeak.toFixed(2)} U
            </strong> at <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatLifecycleTime(iobPeakHour, anchor.h, anchor.m)}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
