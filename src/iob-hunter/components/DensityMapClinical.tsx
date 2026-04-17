/**
 * GluMira™ V7 — DensityMapClinical
 *
 * Clinical-audience view of the IOB peak collision map.
 * GlucoGuard-style per-dose horizontal heatmap strips:
 *   – One strip per dose, 24 h x-axis.
 *   – Cells coloured by pressure: Light / Moderate / Strong / Overlap.
 *   – Strip label: "HH:MM InsulinName X U" on the left.
 *   – Total IOB polyline overlaid above all strips.
 *   – Red dot at global peak.
 *   – KPI row: Peak IOB · Peak time · Trough · Strong+Overlap hours.
 *   – Risk zone annotations: time range + pressure badge.
 *
 * Props accept PerDoseActivityCurve[] + DensityMap for the overlay.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type { PerDoseActivityCurve, PerDoseActivityPoint } from "@/iob-hunter";
import type { DensityMap, DensityRiskZone } from "@/iob-hunter/engine/density-map";

/* ─── Props ──────────────────────────────────────────────────────────── */

export type DensityMapClinicalProps = {
  curves: PerDoseActivityCurve[];
  densityMap: DensityMap;
  riskZones: DensityRiskZone[];
  startHour: number;
  endHour: number;
};

/* ─── Layout ─────────────────────────────────────────────────────────── */

const LABEL_W  = 140;
const STRIP_H  = 28;
const STRIP_GAP = 4;
const CHART_W  = 900;
const PAD_T    = 48;  // space above strips for IOB line
const PAD_B    = 36;
const IOB_H    = 80;  // IOB line chart height above strips

/* ─── Zone colours ───────────────────────────────────────────────────── */

const ZONE_FILL: Record<string, string> = {
  light:    "#bfdbfe",
  moderate: "#fde68a",
  strong:   "#fdba74",
  overlap:  "#fca5a5",
};
const ZONE_LABEL: Record<string, string> = {
  light: "Light", moderate: "Moderate", strong: "Strong", overlap: "Overlap",
};

/* ─── Insulin colour dots ────────────────────────────────────────────── */

const DOT_COLOURS: Record<string, string> = {
  Levemir:    "#1a2a5e",
  Tresiba:    "#1565c0",
  Toujeo:     "#0277bd",
  Lantus:     "#4527a0",
  Basaglar:   "#6a1b9a",
  Fiasp:      "#c62828",
  NovoRapid:  "#e64a19",
  Actrapid:   "#ef6c00",
  Humalog:    "#558b2f",
  Lyumjev:    "#ad1457",
  Apidra:     "#00695c",
  "Humulin N": "#6d4c41",
  Insulatard: "#37474f",
};

function dotColour(name: string): string {
  return DOT_COLOURS[name] ?? "#5b8fd4";
}

/* ─── Coordinate helpers ─────────────────────────────────────────────── */

function toX(h: number, s: number, e: number): number {
  return LABEL_W + ((h - s) / (e - s)) * CHART_W;
}

function fmtH(h: number): string {
  const w = ((h % 24) + 24) % 24;
  return `${String(Math.floor(w)).padStart(2, "0")}:${String(Math.round((w % 1) * 60)).padStart(2, "0")}`;
}

function fmtHour12(h: number): string {
  const w = ((h % 24) + 24) % 24;
  if (w === 0) return "12 AM";
  if (w === 12) return "12 PM";
  return w < 12 ? `${w} AM` : `${w - 12} PM`;
}

/* ─── Per-strip cell builder ─────────────────────────────────────────── */

function stripCells(
  curve: PerDoseActivityCurve,
  allCurves: PerDoseActivityCurve[],
  startHour: number,
  endHour: number,
  y: number,
): React.ReactNode[] {
  const cells: React.ReactNode[] = [];
  const step = (endHour - startHour) / 96; // quarter-hour resolution
  const maxRate = Math.max(...allCurves.flatMap((c) => c.points.map((p) => p.rate_uph)), 0.01);

  for (let i = 0; i < 96; i++) {
    const h     = startHour + i * step;
    const hNext = startHour + (i + 1) * step;

    // Interpolate this curve's rate at h
    const rate = interpolateRate(curve.points, h);

    // Classify pressure by fraction of max
    const frac = rate / maxRate;
    let pressure = "light";
    if (frac > 0.75) pressure = "overlap";
    else if (frac > 0.5) pressure = "strong";
    else if (frac > 0.2) pressure = "moderate";
    // light = < 0.2 — still colour lightly

    if (rate < 0.01) {
      // Inactive — transparent
      continue;
    }

    const x1 = toX(h, startHour, endHour);
    const x2 = toX(hNext, startHour, endHour);
    cells.push(
      <rect
        key={`cell-${i}`}
        x={x1.toFixed(1)}
        y={y}
        width={(x2 - x1).toFixed(1)}
        height={STRIP_H}
        fill={ZONE_FILL[pressure]}
        opacity={0.85}
      />,
    );
  }
  return cells;
}

function interpolateRate(pts: PerDoseActivityPoint[], h: number): number {
  if (!pts.length) return 0;
  // Find bracketing points
  let lo = pts[0], hi = pts[pts.length - 1];
  for (const p of pts) {
    if (p.hour <= h) lo = p;
    if (p.hour >= h && (hi === pts[pts.length - 1] || p.hour < hi.hour)) hi = p;
  }
  if (lo.hour === hi.hour) return lo.rate_uph;
  const t = (h - lo.hour) / (hi.hour - lo.hour);
  return lo.rate_uph + t * (hi.rate_uph - lo.rate_uph);
}

/* ─── X-axis tick config ─────────────────────────────────────────────── */

function xTicks(s: number, e: number): { h: number; label: string }[] {
  const out: { h: number; label: string }[] = [];
  for (let h = Math.ceil(s); h <= Math.floor(e); h++) {
    if ((h - Math.ceil(s)) % 3 === 0) {
      out.push({ h, label: fmtHour12(h) });
    }
  }
  return out;
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function DensityMapClinical({
  curves,
  densityMap,
  riskZones,
  startHour,
  endHour,
}: DensityMapClinicalProps) {
  if (!curves.length) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
        No activity data to display.
      </div>
    );
  }

  const maxIOB    = Math.max(...densityMap.points.map((p) => p.iobTotal), 0);
  const totalH    = PAD_T + IOB_H + curves.length * (STRIP_H + STRIP_GAP) + PAD_B;
  const viewW     = LABEL_W + CHART_W + 20;
  const strips_Y0 = PAD_T + IOB_H + 8;

  // IOB polyline
  const iobPts = densityMap.points
    .filter((p) => p.timeHours >= startHour && p.timeHours <= endHour)
    .map((p) => {
      const x = toX(p.timeHours, startHour, endHour);
      const y = maxIOB > 0
        ? PAD_T + IOB_H - (p.iobTotal / maxIOB) * IOB_H
        : PAD_T + IOB_H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // IOB filled area
  const iobArea = densityMap.points
    .filter((p) => p.timeHours >= startHour && p.timeHours <= endHour);
  let iobFillD = "";
  if (iobArea.length >= 2) {
    const firstX = toX(iobArea[0].timeHours, startHour, endHour).toFixed(1);
    const lastX  = toX(iobArea[iobArea.length - 1].timeHours, startHour, endHour).toFixed(1);
    const baseY  = (PAD_T + IOB_H).toFixed(1);
    iobFillD = `M ${firstX} ${baseY} ` +
      iobArea.map((p) => `L ${toX(p.timeHours, startHour, endHour).toFixed(1)} ${maxIOB > 0 ? (PAD_T + IOB_H - (p.iobTotal / maxIOB) * IOB_H).toFixed(1) : baseY}`).join(" ") +
      ` L ${lastX} ${baseY} Z`;
  }

  const ticks = xTicks(startHour, endHour);

  return (
    <div
      style={{
        background: "var(--bg-card, #fff)",
        border: "1px solid rgba(148,163,184,0.35)",
        borderRadius: 12,
        padding: "20px 20px 16px",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
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
        <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>
          Per-dose activity heatmap — identifies insulin peak collisions.
        </p>
      </div>

      {/* Risk zone badges */}
      {riskZones.filter((z) => z.pressure === "overlap" || z.pressure === "strong").length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {riskZones
            .filter((z) => z.pressure === "overlap" || z.pressure === "strong")
            .map((z, i) => (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: z.pressure === "overlap" ? "#fef2f2" : "#fff7ed",
                  border: `1px solid ${z.pressure === "overlap" ? "#fca5a5" : "#fdba74"}`,
                  fontSize: 11,
                  color: z.pressure === "overlap" ? "#7f1d1d" : "#7c2d12",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: z.pressure === "overlap" ? "#ef4444" : "#f97316",
                  }}
                />
                {ZONE_LABEL[z.pressure]}  {fmtH(z.start)}–{fmtH(z.end)}
              </span>
            ))}
        </div>
      )}

      {/* Main SVG chart */}
      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${viewW} ${totalH}`}
          style={{ width: "100%", minWidth: 380, display: "block" }}
          aria-label="Per-dose activity heatmap"
        >
          {/* IOB area fill */}
          {iobFillD && (
            <path d={iobFillD} fill="#1a2a5e" fillOpacity={0.08} />
          )}

          {/* IOB Y-axis label */}
          <text
            x={LABEL_W - 6}
            y={PAD_T + 6}
            textAnchor="end"
            fontSize={9}
            fill="#64748b"
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            Total IOB
          </text>

          {/* IOB baseline */}
          <line
            x1={LABEL_W} y1={PAD_T + IOB_H}
            x2={LABEL_W + CHART_W} y2={PAD_T + IOB_H}
            stroke="#e2e8f0"
            strokeWidth={1}
          />

          {/* IOB polyline */}
          {iobPts && (
            <polyline
              points={iobPts}
              fill="none"
              stroke="#1a2a5e"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}

          {/* Peak dot */}
          {maxIOB > 0 && (
            <circle
              cx={toX(densityMap.peakTime, startHour, endHour).toFixed(1)}
              cy={(PAD_T + IOB_H - (densityMap.peakIOB / maxIOB) * IOB_H).toFixed(1)}
              r={5}
              fill="#ef4444"
            />
          )}

          {/* Peak label */}
          {maxIOB > 0 && (
            <text
              x={toX(densityMap.peakTime, startHour, endHour)}
              y={PAD_T + IOB_H - (densityMap.peakIOB / maxIOB) * IOB_H - 9}
              textAnchor="middle"
              fontSize={9}
              fill="#ef4444"
              fontWeight={600}
              fontFamily="'DM Sans', system-ui, sans-serif"
            >
              {densityMap.peakIOB.toFixed(1)} U @ {fmtH(densityMap.peakTime)}
            </text>
          )}

          {/* Gridlines */}
          {ticks.map(({ h }) => (
            <line
              key={`gl-${h}`}
              x1={toX(h, startHour, endHour)} y1={PAD_T}
              x2={toX(h, startHour, endHour)} y2={strips_Y0 + curves.length * (STRIP_H + STRIP_GAP)}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
          ))}

          {/* Per-dose strips */}
          {curves.map((curve, idx) => {
            const y = strips_Y0 + idx * (STRIP_H + STRIP_GAP);

            return (
              <g key={`strip-${curve.dose_id}`}>
                {/* Strip background */}
                <rect
                  x={LABEL_W}
                  y={y}
                  width={CHART_W}
                  height={STRIP_H}
                  fill="#f8fafc"
                  rx={3}
                />

                {/* Activity cells */}
                {stripCells(curve, curves, startHour, endHour, y)}

                {/* Left label */}
                <rect
                  x={0}
                  y={y}
                  width={LABEL_W - 4}
                  height={STRIP_H}
                  fill="#f0f4ff"
                  rx={3}
                />
                {/* Colour dot */}
                <circle
                  cx={10}
                  cy={y + STRIP_H / 2}
                  r={5}
                  fill={dotColour(curve.insulin_name)}
                />
                <text
                  x={20}
                  y={y + STRIP_H / 2 - 4}
                  fontSize={9}
                  fontWeight={700}
                  fill="#0D2149"
                  fontFamily="'DM Sans', system-ui, sans-serif"
                >
                  {curve.insulin_name}
                </text>
                <text
                  x={20}
                  y={y + STRIP_H / 2 + 8}
                  fontSize={8}
                  fill="#64748b"
                  fontFamily="'DM Sans', system-ui, sans-serif"
                >
                  {curve.administered_at.length === 5 ? curve.administered_at : fmtH(parseFloat(curve.administered_at) || 0)} · {curve.dose_units} U
                </text>

                {/* Right border */}
                <line
                  x1={LABEL_W + CHART_W}
                  y1={y}
                  x2={LABEL_W + CHART_W}
                  y2={y + STRIP_H}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
              </g>
            );
          })}

          {/* X-axis tick labels */}
          {ticks.map(({ h, label }) => (
            <text
              key={`lbl-${h}`}
              x={toX(h, startHour, endHour)}
              y={strips_Y0 + curves.length * (STRIP_H + STRIP_GAP) + 16}
              textAnchor="middle"
              fontSize={9}
              fill="#94a3b8"
              fontFamily="'DM Sans', system-ui, sans-serif"
            >
              {label}
            </text>
          ))}

          {/* Highest-overlap window annotation */}
          {riskZones
            .filter((z) => z.pressure === "overlap")
            .slice(0, 1)
            .map((z, i) => {
              const x1   = toX(z.start, startHour, endHour);
              const x2   = toX(z.end, startHour, endHour);
              const yTop = PAD_T;
              const yBot = strips_Y0 + curves.length * (STRIP_H + STRIP_GAP);
              return (
                <g key={`hz-${i}`}>
                  <rect
                    x={x1} y={yTop}
                    width={x2 - x1} height={yBot - yTop}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    opacity={0.7}
                  />
                </g>
              );
            })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
        {Object.entries(ZONE_FILL).map(([key, fill]) => (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: "#64748b",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 12,
                borderRadius: 2,
                background: fill,
                border: "1px solid rgba(0,0,0,0.07)",
                flexShrink: 0,
              }}
            />
            {ZONE_LABEL[key]}
          </div>
        ))}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            color: "#64748b",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 2,
              background: "#1a2a5e",
              flexShrink: 0,
            }}
          />
          Total IOB (U)
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            color: "#64748b",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ef4444",
              flexShrink: 0,
            }}
          />
          Peak IOB
        </div>
      </div>
    </div>
  );
}
