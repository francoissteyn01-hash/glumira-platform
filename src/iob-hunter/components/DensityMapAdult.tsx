/**
 * GluMira™ V7 — DensityMapAdult
 *
 * Adult-audience view of the IOB peak collision map.
 * Covers patients, caregivers, and parents — anyone who needs a
 * visually clear picture without the full clinical density.
 *
 * Flowing rainbow ribbon chart — each insulin rendered as a filled
 * hill/wave with transparency, overlapping where peaks coincide.
 *
 * Visual simplification (per design contract):
 *   – Smooth flowing fills instead of clinical line plots.
 *   – Named labels directly on each curve at its peak.
 *   – Day-context icons (☀ MORNING / ☁ NOON / 🌙 NIGHT) along the header.
 *   – Highest-overlap window annotated with a dashed red bracket.
 *   – Scheduling observations derived from detected risk zones.
 *
 * Language is NEVER simplified — clinical terminology throughout.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type { PerDoseActivityCurve, PerDoseActivityPoint } from "@/iob-hunter";
import type { DensityRiskZone } from "@/iob-hunter/engine/density-map";

/* ─── Props ──────────────────────────────────────────────────────────── */

export type DensityMapAdultProps = {
  curves: PerDoseActivityCurve[];
  riskZones: DensityRiskZone[];
  startHour: number;
  endHour: number;
  patientName?: string;
  patientMeta?: string;
};

/* ─── Layout constants ───────────────────────────────────────────────── */

const CW = 1020, CH = 240;
const PL = 20, PT = 60, PB = 44;
const VW = CW + PL + 20;
const VH = CH + PT + PB;

/* ─── Insulin colour map ─────────────────────────────────────────────── */

const COLOURS: Record<string, string> = {
  Levemir:   "#1a2a5e",
  Tresiba:   "#1565c0",
  Toujeo:    "#0277bd",
  Lantus:    "#4527a0",
  Basaglar:  "#6a1b9a",
  Fiasp:     "#c62828",
  NovoRapid: "#e64a19",
  Actrapid:  "#ef6c00",
  Humalog:   "#558b2f",
  Lyumjev:   "#ad1457",
  Apidra:    "#00695c",
  "Humulin N": "#6d4c41",
  Insulatard: "#37474f",
};

function colour(name: string): string {
  return COLOURS[name] ?? "#5b8fd4";
}

/* ─── Coordinate helpers ─────────────────────────────────────────────── */

function toX(h: number, s: number, e: number): number {
  return PL + ((h - s) / (e - s)) * CW;
}
function toY(r: number, max: number): number {
  return PT + CH - (r / max) * CH;
}
const BASE_Y = PT + CH;

/* ─── Build filled-area SVG path ─────────────────────────────────────── */

function areaPath(
  pts: PerDoseActivityPoint[],
  s: number,
  e: number,
  max: number,
): string {
  const vis = pts.filter((p) => p.hour >= s - 0.25 && p.hour <= e + 0.25);
  if (vis.length < 2) return "";

  const xs = (h: number) => toX(Math.max(s, Math.min(e, h)), s, e).toFixed(1);
  const ys = (r: number) => toY(r, max).toFixed(1);

  // Start at baseline
  let d = `M ${xs(vis[0].hour)} ${BASE_Y.toFixed(1)}`;
  d += ` L ${xs(vis[0].hour)} ${ys(vis[0].rate_uph)}`;

  // Use smooth cubic bezier through points for the flowing look
  for (let i = 1; i < vis.length; i++) {
    const prev = vis[i - 1];
    const curr = vis[i];
    const cpx = toX((prev.hour + curr.hour) / 2, s, e).toFixed(1);
    const cp1y = toY(prev.rate_uph, max).toFixed(1);
    const cp2y = toY(curr.rate_uph, max).toFixed(1);
    const cx   = toX(curr.hour, s, e).toFixed(1);
    const cy   = toY(curr.rate_uph, max).toFixed(1);
    d += ` C ${cpx} ${cp1y} ${cpx} ${cp2y} ${cx} ${cy}`;
  }

  d += ` L ${xs(vis[vis.length - 1].hour)} ${BASE_Y.toFixed(1)} Z`;
  return d;
}

/* ─── Find peak of a curve within the visible window ────────────────── */

function peakPoint(
  pts: PerDoseActivityPoint[],
  s: number,
  e: number,
): PerDoseActivityPoint | null {
  const vis = pts.filter((p) => p.hour >= s && p.hour <= e);
  if (!vis.length) return null;
  return vis.reduce((best, p) => (p.rate_uph > best.rate_uph ? p : best), vis[0]);
}

/* ─── Hour → HH:MM ───────────────────────────────────────────────────── */

function fmtH(h: number): string {
  const w = ((h % 24) + 24) % 24;
  return `${String(Math.floor(w)).padStart(2, "0")}:${String(Math.round((w % 1) * 60)).padStart(2, "0")}`;
}

/* ─── X-axis tick labels ─────────────────────────────────────────────── */

function xTicks(s: number, e: number): { h: number; label: string }[] {
  const out: { h: number; label: string }[] = [];
  for (let h = Math.ceil(s); h <= Math.floor(e); h++) {
    if ((h - Math.ceil(s)) % 3 === 0) {
      const w = ((h % 24) + 24) % 24;
      const suffix = w < 12 ? "AM" : w === 12 ? "PM" : "PM";
      const disp   = w === 0 ? "12 AM" : w === 12 ? "12 PM" : w < 12 ? `${w} AM` : `${w - 12} PM`;
      out.push({ h, label: disp });
      void suffix;
    }
  }
  return out;
}

/* ─── Day-context header icons ───────────────────────────────────────── */

const DAY_ICONS = [
  { hour: 6,  icon: "☀", label: "MORNING" },
  { hour: 12, icon: "☁", label: "NOON" },
  { hour: 18, icon: "🌅", label: "EVENING" },
  { hour: 24, icon: "🌙", label: "NIGHT" },
];

/* ─── Highest-overlap risk zone ──────────────────────────────────────── */

function highestZone(riskZones: DensityRiskZone[]): DensityRiskZone | null {
  const overlaps = riskZones.filter((z) => z.pressure === "overlap");
  if (overlaps.length) return overlaps[0];
  const strong  = riskZones.filter((z) => z.pressure === "strong");
  if (strong.length)   return strong[0];
  return null;
}

/* ─── Suggestions derived from risk zones ────────────────────────────── */

function suggestions(curves: PerDoseActivityCurve[], hz: DensityRiskZone | null): string[] {
  const out: string[] = [];
  if (hz) {
    out.push(`Review injection timing around ${fmtH(hz.start)} — peak collision window`);
  }
  // Find bolus insulins active at peak collision
  const bolusCurves = curves.filter((c) =>
    c.dose_type === "bolus" && peakPoint(c.points, hz?.start ?? 12, hz?.end ?? 15),
  );
  bolusCurves.slice(0, 2).forEach((c) => {
    out.push(`${c.insulin_name} bolus dose or timing adjustment may reduce stacking`);
  });
  if (out.length < 3) {
    out.push("Consider equal-spaced basal injections to smooth the activity floor");
  }
  return out.slice(0, 3);
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function DensityMapAdult({
  curves,
  riskZones,
  startHour,
  endHour,
  patientName,
  patientMeta,
}: DensityMapAdultProps) {
  if (!curves.length) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
        No activity curves to display.
      </div>
    );
  }

  const maxRate = Math.max(...curves.flatMap((c) => c.points.map((p) => p.rate_uph)), 0.5) * 1.15;
  const hz      = highestZone(riskZones);
  const sugg    = suggestions(curves, hz);

  // Numbered legend items (one per curve, grouped by insulin_name)
  const legendItems = Array.from(
    new Map(curves.map((c) => [c.insulin_name, c])).values(),
  );

  return (
    <div
      style={{
        background: "var(--bg-card, #fff)",
        border: "1px solid rgba(148,163,184,0.35)",
        borderRadius: 12,
        padding: "20px 20px 0",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ── Title bar ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: "#0D2149",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          IOB Hunter — Peak Collision Map
        </h3>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>
          Identifies where multiple insulin peaks align, potentially creating a glucose drop.
        </p>
      </div>

      {/* ── Patient badge ──────────────────────────────────────── */}
      {patientName && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              background: "#f59e0b",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              padding: "3px 12px",
              borderRadius: 999,
            }}
          >
            {patientName}
          </span>
          {patientMeta && (
            <span style={{ fontSize: 12, color: "#475569" }}>{patientMeta}</span>
          )}
        </div>
      )}

      {/* ── Ribbon chart ──────────────────────────────────────── */}
      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width: "100%", minWidth: 340, display: "block" }}
          aria-label="Peak collision map — ribbon chart"
        >
          {/* Day-context icons */}
          {DAY_ICONS.filter((d) => d.hour >= startHour && d.hour <= endHour).map((d) => (
            <g key={d.hour}>
              <text
                x={toX(d.hour, startHour, endHour)}
                y={22}
                textAnchor="middle"
                fontSize={16}
              >
                {d.icon}
              </text>
              <text
                x={toX(d.hour, startHour, endHour)}
                y={40}
                textAnchor="middle"
                fontSize={8}
                fill="#94a3b8"
                letterSpacing={0.8}
              >
                {d.label}
              </text>
            </g>
          ))}

          {/* Baseline */}
          <line
            x1={PL} y1={BASE_Y}
            x2={PL + CW} y2={BASE_Y}
            stroke="#e2e8f0"
            strokeWidth={1}
          />

          {/* X-axis gridlines + labels */}
          {xTicks(startHour, endHour).map(({ h, label }) => (
            <g key={h}>
              <line
                x1={toX(h, startHour, endHour)} y1={PT}
                x2={toX(h, startHour, endHour)} y2={BASE_Y}
                stroke="#f1f5f9"
                strokeWidth={1}
              />
              <text
                x={toX(h, startHour, endHour)}
                y={BASE_Y + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#94a3b8"
                fontFamily="'DM Sans', system-ui, sans-serif"
              >
                {label}
              </text>
            </g>
          ))}

          {/* Highest-overlap zone shading */}
          {hz && (
            <rect
              x={toX(hz.start, startHour, endHour)}
              y={PT}
              width={toX(hz.end, startHour, endHour) - toX(hz.start, startHour, endHour)}
              height={CH}
              fill="#fef2f2"
              opacity={0.7}
            />
          )}

          {/* Curve traces — solid strokes only, NO fill, so overlapping
              regions preserve each curve's identity (no colour mixing). */}
          {[...curves]
            .sort((a, b) =>
              a.dose_type === "basal_injection" ? -1 : b.dose_type === "basal_injection" ? 1 : 0,
            )
            .map((c, i) => {
              const d = areaPath(c.points, startHour, endHour, maxRate);
              if (!d) return null;
              const col = colour(c.insulin_name);
              return (
                <path
                  key={`${c.dose_id}-${i}`}
                  d={d}
                  fill="none"
                  stroke={col}
                  strokeWidth={c.dose_type === "basal_injection" ? 2 : 2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={c.dose_type === "basal_injection" ? "2 3" : undefined}
                  strokeOpacity={1}
                />
              );
            })}

          {/* Peak labels */}
          {curves.map((c, i) => {
            const pk = peakPoint(c.points, startHour, endHour);
            if (!pk || pk.rate_uph < maxRate * 0.12) return null;
            const x  = toX(pk.hour, startHour, endHour);
            const y  = toY(pk.rate_uph, maxRate) - 8;
            const col = colour(c.insulin_name);
            return (
              <text
                key={`lbl-${c.dose_id}-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fill={col}
                fontFamily="'DM Sans', system-ui, sans-serif"
              >
                {c.insulin_name}
              </text>
            );
          })}

          {/* Dose markers — vertical dashed lines at injection time */}
          {curves.map((c, i) => {
            const injectHour = c.points[0]?.hour;
            if (injectHour == null || injectHour < startHour || injectHour > endHour) return null;
            const x = toX(injectHour, startHour, endHour);
            return (
              <line
                key={`inj-${c.dose_id}-${i}`}
                x1={x} y1={PT}
                x2={x} y2={BASE_Y}
                stroke={colour(c.insulin_name)}
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.5}
              />
            );
          })}

          {/* Highest-overlap dashed bracket */}
          {hz && (() => {
            const x1  = toX(hz.start, startHour, endHour);
            const x2  = toX(hz.end, startHour, endHour);
            const mid = (x1 + x2) / 2;
            const bW  = Math.max(x2 - x1, 40);
            const bH  = CH;
            return (
              <g>
                <rect
                  x={x1}
                  y={PT}
                  width={bW}
                  height={bH}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  rx={6}
                  opacity={0.85}
                />
                {/* Label box */}
                <rect
                  x={mid - 72}
                  y={PT - 28}
                  width={144}
                  height={24}
                  rx={6}
                  fill="#ef4444"
                />
                <text
                  x={mid}
                  y={PT - 12}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill="#fff"
                  fontFamily="'DM Sans', system-ui, sans-serif"
                >
                  Highest Overlap  {fmtH(hz.start)}–{fmtH(hz.end)}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* ── Bottom panels ──────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: "12px 0 20px",
          borderTop: "1px solid #f1f5f9",
          marginTop: 4,
        }}
      >
        {/* Left: numbered legend */}
        <div>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 11,
              fontWeight: 700,
              color: "#0D2149",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Collision Zone — Multiple Insulin Effects
          </p>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "#64748b" }}>
            When 3+ effects overlap, glucose fall can occur.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px" }}>
            {legendItems.map((c, i) => (
              <div
                key={c.insulin_name}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: colour(c.insulin_name),
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                {c.insulin_name}
              </div>
            ))}
          </div>
        </div>

        {/* Right: suggestions */}
        <div>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 11,
              fontWeight: 700,
              color: "#0D2149",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Scheduling Considerations
          </p>
          <ol style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 5 }}>
            {sugg.map((s, i) => (
              <li key={i} style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
                {s}
              </li>
            ))}
          </ol>
          <p style={{ margin: "8px 0 0", fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>
            These observations may reduce insulin stacking. Consult your care team.
          </p>
        </div>
      </div>
    </div>
  );
}
