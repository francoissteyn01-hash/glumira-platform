/**
 * GluMira™ V7 — Glucose Chart Page (Block 17)
 * Full-page 24-hour glucose chart with colour-coded ranges, statistics,
 * and hypo event tracking. Uses inline SVG — no chart library dependency.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { formatGlucose, getUnitLabel } from "@/utils/glucose-units";
import { DISCLAIMER } from "@/lib/constants";
import { API } from "@/lib/api";
import { generateHypoAlert, checkHypoPattern, type HypoAlert } from "@/lib/hypo-alert";
import HypoAlertBanner from "@/components/HypoAlertBanner";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface GlucoseReading {
  glucose: number; // mmol/L
  time: string;
}

type DateRangeLabel = "Today" | "3D" | "7D" | "14D" | "30D";

const RANGE_DAYS: Record<DateRangeLabel, number> = {
  Today: 1, "3D": 3, "7D": 7, "14D": 14, "30D": 30,
};

/* ─── Chart constants ────────────────────────────────────────────────────── */

const SVG_W = 900;
const SVG_H = 380;
const PAD = { top: 20, right: 20, bottom: 40, left: 52 };
const PLOT_W = SVG_W - PAD.left - PAD.right;
const PLOT_H = SVG_H - PAD.top - PAD.bottom;

const Y_MAX_MMOL = 22;
const Y_MAX_MG = 400;

// Colour band boundaries in mmol/L
const BANDS = [
  { from: 0, to: 3.9, fill: "rgba(239,68,68,0.1)" },
  { from: 3.9, to: 10.0, fill: "rgba(34,197,94,0.1)" },
  { from: 10.0, to: 13.9, fill: "rgba(234,179,8,0.1)" },
  { from: 13.9, to: 22, fill: "rgba(239,68,68,0.1)" },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function getDateRange(label: DateRangeLabel) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const start = new Date(end.getTime() - RANGE_DAYS[label] * 24 * 60 * 60_000);
  return { from: start.toISOString(), to: end.toISOString() };
}

function yScale(mmol: number, maxY: number): number {
  return PAD.top + PLOT_H - (mmol / maxY) * PLOT_H;
}

function xScale(date: Date, from: Date, to: Date): number {
  const total = to.getTime() - from.getTime();
  const elapsed = date.getTime() - from.getTime();
  return PAD.left + (elapsed / total) * PLOT_W;
}

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function GlucoseChartPage() {
  const { session } = useAuth();
  const { units } = useGlucoseUnits();

  const [range, setRange] = useState<DateRangeLabel>("Today");
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAlert, setActiveAlert] = useState<HypoAlert | null>(null);

  /* ── Fetch ─────────────────────────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { from, to } = getDateRange(range);
        const input = encodeURIComponent(JSON.stringify({ json: { from, to } }));
        const res = await API.get(`/trpc/glucoseLog.getByDateRange?input=${input}`, session);
        const data: GlucoseReading[] = res?.result?.data?.json ?? [];
        if (!cancelled) setReadings(data);
      } catch {
        if (!cancelled) setReadings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [range, session]);

  /* ── Check for latest hypo alert ───────────────────────────────────────── */

  useEffect(() => {
    if (readings.length === 0) return;
    const latest = readings[readings.length - 1];
    const alert = generateHypoAlert(latest.glucose, "mmol", latest.time);
    setActiveAlert(alert);
  }, [readings]);

  /* ── Derived statistics ────────────────────────────────────────────────── */

  const glucoseValues = readings.map((r) => r.glucose);
  const avg = mean(glucoseValues);
  const sd = stddev(glucoseValues);
  const cv = avg > 0 ? (sd / avg) * 100 : 0;
  const estimatedA1C = glucoseValues.length > 0 ? (avg + 2.59) / 1.59 : 0;

  const inRange = glucoseValues.filter((v) => v >= 3.9 && v <= 10.0).length;
  const belowRange = glucoseValues.filter((v) => v < 3.9).length;
  const aboveRange = glucoseValues.filter((v) => v > 10.0).length;
  const total = glucoseValues.length || 1;
  const tirPct = (inRange / total) * 100;
  const tbrPct = (belowRange / total) * 100;
  const tarPct = (aboveRange / total) * 100;

  // Hypo events
  const hypoPattern = checkHypoPattern(
    readings.map((r) => ({ value: r.glucose, time: r.time })),
    RANGE_DAYS[range] * 24,
    "mmol",
  );

  /* ── Chart axes ────────────────────────────────────────────────────────── */

  const maxY = units === "mg" ? Y_MAX_MG : Y_MAX_MMOL;
  const { from, to } = getDateRange(range);
  const fromDate = new Date(from);
  const toDate = new Date(to);

  // Y-axis ticks
  const yTicks = units === "mg"
    ? [0, 70, 180, 250, 400]
    : [0, 3.9, 10, 13.9, 22];

  // X-axis ticks (hours for Today, dates for multi-day)
  const xTicks: { label: string; x: number }[] = [];
  if (range === "Today") {
    for (let h = 0; h <= 24; h += 4) {
      const d = new Date(fromDate.getTime() + h * 60 * 60_000);
      xTicks.push({ label: `${String(h).padStart(2, "0")}:00`, x: xScale(d, fromDate, toDate) });
    }
  } else {
    const days = RANGE_DAYS[range];
    const step = Math.max(1, Math.floor(days / 6));
    for (let d = 0; d <= days; d += step) {
      const dt = new Date(fromDate.getTime() + d * 24 * 60 * 60_000);
      xTicks.push({
        label: dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        x: xScale(dt, fromDate, toDate),
      });
    }
  }

  // Convert bands to pixel rects
  const bandRects = BANDS.map((b) => {
    const fromMmol = units === "mg" ? b.from * 18.0182 : b.from;
    const toMmol = units === "mg" ? b.to * 18.0182 : b.to;
    const capTo = Math.min(toMmol, maxY);
    const y1 = yScale(capTo, maxY);
    const y2 = yScale(fromMmol, maxY);
    return { y: y1, height: y2 - y1, fill: b.fill };
  });

  // Polyline points
  const polyPoints = readings
    .map((r) => {
      const gVal = units === "mg" ? r.glucose * 18.0182 : r.glucose;
      const x = xScale(new Date(r.time), fromDate, toDate);
      const y = yScale(gVal, maxY);
      return { x, y, raw: r };
    })
    .filter((p) => p.x >= PAD.left && p.x <= PAD.left + PLOT_W);

  const polyline = polyPoints.map((p) => `${p.x},${p.y}`).join(" ");

  /* ── Render ────────────────────────────────────────────────────────────── */

  const statCard = (label: string, value: string) => (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        borderRadius: 10,
        padding: "14px 18px",
        flex: "1 1 140px",
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {label}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: "var(--bg-primary)",
        minHeight: "100vh",
        maxWidth: 960,
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 32px)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Page title */}
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(24px, 4vw, 36px)",
          fontWeight: 700,
          margin: "0 0 24px",
        }}
      >
        Glucose Chart
      </h1>

      {/* Hypo alert banner */}
      <HypoAlertBanner alert={activeAlert} onDismiss={() => setActiveAlert(null)} />

      {/* Date range selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {(Object.keys(RANGE_DAYS) as DateRangeLabel[]).map((label) => (
          <button
            key={label}
            onClick={() => setRange(label)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: range === label ? "2px solid var(--border-light)" : "1px solid var(--border-light)",
              background: range === label ? "var(--bg-card)" : "transparent",
              fontWeight: range === label ? 700 : 400,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 14,
              cursor: "pointer",
              opacity: range === label ? 1 : 0.7,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart card */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: 14,
          padding: 20,
          marginBottom: 24,
          overflowX: "auto",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, opacity: 0.5 }}>Loading glucose data...</div>
        ) : readings.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, opacity: 0.5 }}>
            No glucose data for this period.
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            width="100%"
            style={{ display: "block" }}
            role="img"
            aria-label={`Glucose chart showing ${readings.length} readings`}
          >
            {/* Colour bands */}
            {bandRects.map((b, i) => (
              <rect
                key={i}
                x={PAD.left}
                y={b.y}
                width={PLOT_W}
                height={Math.max(0, b.height)}
                fill={b.fill}
              />
            ))}

            {/* Grid lines & Y-axis labels */}
            {yTicks.map((tick, i) => {
              const y = yScale(tick, maxY);
              return (
                <g key={`y-${i}`}>
                  <line
                    x1={PAD.left}
                    y1={y}
                    x2={PAD.left + PLOT_W}
                    y2={y}
                    stroke="var(--border-light)"
                    strokeWidth={0.5}
                    strokeDasharray="4,4"
                  />
                  <text
                    x={PAD.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={11}
                    fontFamily="'JetBrains Mono', monospace"
                    fill="currentColor"
                    opacity={0.55}
                  >
                    {units === "mg" ? Math.round(tick) : tick}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            {xTicks.map((tick, i) => (
              <text
                key={`x-${i}`}
                x={tick.x}
                y={SVG_H - 8}
                textAnchor="middle"
                fontSize={11}
                fontFamily="'JetBrains Mono', monospace"
                fill="currentColor"
                opacity={0.55}
              >
                {tick.label}
              </text>
            ))}

            {/* Axes */}
            <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke="var(--border-light)" strokeWidth={1} />
            <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="var(--border-light)" strokeWidth={1} />

            {/* Glucose polyline */}
            {polyPoints.length > 1 && (
              <polyline
                points={polyline}
                fill="none"
                stroke="#2ab5c1"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* Data dots */}
            {polyPoints.map((p, i) => {
              const isHypo = p.raw.glucose < 3.9;
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={isHypo ? 4 : 2.5}
                  fill={isHypo ? "#ef4444" : "#2ab5c1"}
                  stroke={isHypo ? "#991b1b" : "none"}
                  strokeWidth={isHypo ? 1 : 0}
                >
                  <title>
                    {formatGlucose(p.raw.glucose, units)} {getUnitLabel(units)} — {new Date(p.raw.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </title>
                </circle>
              );
            })}

            {/* Unit label */}
            <text
              x={14}
              y={PAD.top + PLOT_H / 2}
              textAnchor="middle"
              fontSize={12}
              fontFamily="'DM Sans', system-ui, sans-serif"
              fill="currentColor"
              opacity={0.5}
              transform={`rotate(-90, 14, ${PAD.top + PLOT_H / 2})`}
            >
              {getUnitLabel(units)}
            </text>
          </svg>
        )}
      </div>

      {/* Statistics panel */}
      {readings.length > 0 && (
        <>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20,
              fontWeight: 600,
              margin: "0 0 14px",
            }}
          >
            Statistics
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 28,
            }}
          >
            {statCard("Average Glucose", `${formatGlucose(avg, units)} ${getUnitLabel(units)}`)}
            {statCard("Time in Range", `${tirPct.toFixed(1)}%`)}
            {statCard("Below Range", `${tbrPct.toFixed(1)}%`)}
            {statCard("Above Range", `${tarPct.toFixed(1)}%`)}
            {statCard("Est. A1C", `${estimatedA1C.toFixed(1)}%`)}
            {statCard("Std Deviation", `${formatGlucose(sd, units)} ${getUnitLabel(units)}`)}
            {statCard("CV%", `${cv.toFixed(1)}%`)}
          </div>
        </>
      )}

      {/* Hypo events list */}
      {hypoPattern.events.length > 0 && (
        <>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20,
              fontWeight: 600,
              margin: "0 0 14px",
            }}
          >
            Hypo Events
          </h2>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              borderRadius: 14,
              overflow: "hidden",
              marginBottom: 28,
            }}
          >
            {hypoPattern.events.map((evt, i) => {
              const sevColor =
                evt.severity === "severe" ? "#ef4444" : evt.severity === "moderate" ? "#f97316" : "#eab308";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 18px",
                    borderBottom:
                      i < hypoPattern.events.length - 1 ? "1px solid var(--border-light)" : "none",
                  }}
                >
                  {/* Red flag indicator */}
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: sevColor,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                      fontSize: 15,
                      minWidth: 70,
                    }}
                  >
                    {formatGlucose(evt.value, units)}
                  </span>
                  <span style={{ fontSize: 13, opacity: 0.6 }}>
                    {getUnitLabel(units)}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: sevColor,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {evt.severity}
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: 13, opacity: 0.5, fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(evt.time).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
          {hypoPattern.isRecurring && (
            <div
              style={{
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 13,
                lineHeight: 1.5,
                marginBottom: 28,
              }}
            >
              {hypoPattern.summary}
            </div>
          )}
        </>
      )}

      {/* Disclaimer */}
      <p style={{ fontSize: 11, opacity: 0.45, lineHeight: 1.5, marginTop: 20 }}>
        {DISCLAIMER}
      </p>
    </div>
  );
}
