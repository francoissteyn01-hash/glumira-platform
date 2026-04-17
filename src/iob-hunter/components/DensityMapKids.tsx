/**
 * GluMira™ V7 — DensityMapKids
 *
 * Kids-audience view of the IOB Hunter density map.
 * Matching the reference design:
 *   • Rainbow mountain chart — each insulin = a coloured filled peak,
 *     overlapping where effects coincide (the "collision" zone).
 *   • Labels directly on the chart at each peak.
 *   • "Highest Overlap" bracket with time window.
 *   • Insulin Sources legend (left sidebar list).
 *   • Risk Zone Summary panel (below-left).
 *   • Heatmap strip (below-centre) — colour cells LOW→MODERATE→HIGH→EXTREME.
 *   • Key Insight bullets (below-right).
 *   • "What the Map Shows" narrative bar (bottom).
 *
 * Visual simplification, clinical language intact.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type { PerDoseActivityCurve, PerDoseActivityPoint } from "@/iob-hunter";
import type { DensityMap, DensityRiskZone } from "@/iob-hunter/engine/density-map";

/* ─── Props ──────────────────────────────────────────────────────────── */

export type DensityMapKidsProps = {
  curves: PerDoseActivityCurve[];
  densityMap: DensityMap;
  riskZones: DensityRiskZone[];
  startHour: number;
  endHour: number;
  patientName?: string;
  patientMeta?: string;
};

/* ─── Layout constants ───────────────────────────────────────────────── */

const CW = 860, CH = 220;
const PL = 10, PT = 50, PB = 40;
const VW = CW + PL + 10;
const VH = CH + PT + PB;

/* ─── Insulin colour palette — vibrant for kids view ────────────────── */

const COLOURS: Record<string, string> = {
  Levemir:    "#1565c0",
  Tresiba:    "#1976d2",
  Toujeo:     "#0288d1",
  Lantus:     "#512da8",
  Basaglar:   "#7b1fa2",
  Fiasp:      "#c62828",
  NovoRapid:  "#e64a19",
  Actrapid:   "#f57c00",
  Humalog:    "#2e7d32",
  Lyumjev:    "#ad1457",
  Apidra:     "#00796b",
  "Humulin N": "#5d4037",
  Insulatard: "#37474f",
};
const FALLBACK_PALETTE = [
  "#1565c0","#e64a19","#f9a825","#2e7d32",
  "#c62828","#6a1b9a","#0277bd","#558b2f",
];

function colour(name: string, idx: number): string {
  return COLOURS[name] ?? FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
}

/* ─── Coordinate helpers ─────────────────────────────────────────────── */

function toX(h: number, s: number, e: number): number {
  return PL + ((h - s) / (e - s)) * CW;
}
function toY(r: number, max: number): number {
  return PT + CH - (r / max) * CH;
}
const BASE_Y = PT + CH;

/* ─── Build filled mountain path ─────────────────────────────────────── */

function mountainPath(
  pts: PerDoseActivityPoint[],
  s: number,
  e: number,
  max: number,
): string {
  const vis = pts.filter((p) => p.hour >= s - 0.25 && p.hour <= e + 0.25);
  if (vis.length < 2) return "";

  const xs = (h: number) => toX(Math.max(s, Math.min(e, h)), s, e).toFixed(1);
  const ys = (r: number) => toY(r, max).toFixed(1);

  let d = `M ${xs(vis[0].hour)} ${BASE_Y.toFixed(1)}`;
  d += ` L ${xs(vis[0].hour)} ${ys(vis[0].rate_uph)}`;

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

/* ─── Find peak within window ────────────────────────────────────────── */

function peakPt(pts: PerDoseActivityPoint[], s: number, e: number): PerDoseActivityPoint | null {
  const vis = pts.filter((p) => p.hour >= s && p.hour <= e);
  if (!vis.length) return null;
  return vis.reduce((best, p) => (p.rate_uph > best.rate_uph ? p : best), vis[0]);
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function fmtH(h: number): string {
  const w = ((h % 24) + 24) % 24;
  return `${String(Math.floor(w)).padStart(2, "0")}:${String(Math.round((w % 1) * 60)).padStart(2, "0")}`;
}

function fmtHour12(h: number): string {
  const w = ((h % 24) + 24) % 24;
  const suffix = w < 12 ? "AM" : "PM";
  const disp   = w === 0 ? 12 : w <= 12 ? w : w - 12;
  return `${disp} ${suffix}`;
}

/* ─── Heatmap cell colour ────────────────────────────────────────────── */

const HEAT_COLOURS: Record<string, string> = {
  light:    "#60a5fa",
  moderate: "#34d399",
  strong:   "#f59e0b",
  overlap:  "#ef4444",
};
const HEAT_LABEL: Record<string, string> = {
  light: "LOW", moderate: "MODERATE", strong: "HIGH", overlap: "EXTREME",
};

/* ─── X-axis ticks ───────────────────────────────────────────────────── */

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

export default function DensityMapKids({
  curves,
  densityMap,
  riskZones,
  startHour,
  endHour,
  patientName,
  patientMeta,
}: DensityMapKidsProps) {
  if (!curves.length) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
        No activity data.
      </div>
    );
  }

  const maxRate = Math.max(...curves.flatMap((c) => c.points.map((p) => p.rate_uph)), 0.5) * 1.15;

  // Unique insulins for legend
  const sources = Array.from(new Map(curves.map((c, i) => [c.insulin_name, { c, i }])).values());

  // Highest overlap zone
  const hz =
    riskZones.find((z) => z.pressure === "overlap") ??
    riskZones.find((z) => z.pressure === "strong") ??
    null;

  // Moderate zones
  const modZone = riskZones.find((z) => z.pressure === "moderate") ?? null;

  const { highestOverlapWindow: ow } = densityMap;

  // Key insights
  const insightWindow = ow.end > ow.start ? `${fmtH(ow.start)} – ${fmtH(ow.end)}` : null;

  return (
    <div
      style={{
        background: "#f0f4ff",
        border: "1px solid rgba(148,163,184,0.3)",
        borderRadius: 14,
        padding: 0,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          padding: "16px 20px 12px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 700,
            color: "#0D2149",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          IOB Hunter — Insulin Density Map
        </h3>
        <p style={{ margin: "3px 0 8px", fontSize: 12, color: "#475569" }}>
          Shows where insulin activity is most concentrated, creating a{" "}
          <strong>higher risk of glucose drop.</strong>
        </p>
        {patientName && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
      </div>

      {/* ── Main body: sidebar + chart ────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 0,
        }}
      >
        {/* Insulin sources sidebar */}
        <div
          style={{
            background: "#fff",
            borderRight: "1px solid #e2e8f0",
            padding: "14px 14px",
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 11,
              fontWeight: 700,
              color: "#0D2149",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Insulin Sources
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {sources.map(({ c, i }) => {
              const pk = peakPt(c.points, startHour, endHour);
              return (
                <div key={c.insulin_name} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: 2,
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: colour(c.insulin_name, i),
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#1e293b", lineHeight: 1.4 }}>
                    <strong>{c.insulin_name}</strong>
                    {pk && pk.rate_uph > 0.05 && (
                      <> — Peak {fmtH(pk.hour)}</>
                    )}
                    {c.dose_units > 0 && (
                      <> ({c.dose_units} U)</>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mountain chart */}
        <div style={{ padding: "0", background: "#f8faff", overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            style={{ width: "100%", minWidth: 320, display: "block" }}
            aria-label="Insulin density mountain chart"
          >
            {/* Baseline */}
            <line
              x1={PL} y1={BASE_Y}
              x2={PL + CW} y2={BASE_Y}
              stroke="#e2e8f0"
              strokeWidth={1}
            />

            {/* X-axis gridlines */}
            {xTicks(startHour, endHour).map(({ h }) => (
              <line
                key={`grid-${h}`}
                x1={toX(h, startHour, endHour)} y1={PT}
                x2={toX(h, startHour, endHour)} y2={BASE_Y}
                stroke="#e8edf5"
                strokeWidth={1}
              />
            ))}

            {/* Highest overlap zone background */}
            {hz && (
              <rect
                x={toX(hz.start, startHour, endHour)}
                y={PT}
                width={toX(hz.end, startHour, endHour) - toX(hz.start, startHour, endHour)}
                height={CH}
                fill="#fef2f2"
                opacity={0.8}
              />
            )}

            {/* Mountain fills — basal behind bolus */}
            {[...curves]
              .sort((a, b) =>
                a.dose_type === "basal_injection" ? -1 : b.dose_type === "basal_injection" ? 1 : 0,
              )
              .map((c, i) => {
                const d = mountainPath(c.points, startHour, endHour, maxRate);
                if (!d) return null;
                const col = colour(c.insulin_name, i);
                return (
                  <path
                    key={`m-${c.dose_id}-${i}`}
                    d={d}
                    fill={col}
                    fillOpacity={c.dose_type === "basal_injection" ? 0.45 : 0.65}
                    stroke={col}
                    strokeWidth={1.5}
                    strokeOpacity={0.8}
                  />
                );
              })}

            {/* Curve name labels at peak */}
            {curves.map((c, i) => {
              const pk = peakPt(c.points, startHour, endHour);
              if (!pk || pk.rate_uph < maxRate * 0.1) return null;
              const x   = toX(pk.hour, startHour, endHour);
              const y   = toY(pk.rate_uph, maxRate) - 10;
              const col = colour(c.insulin_name, i);
              return (
                <text
                  key={`lbl-${c.dose_id}-${i}`}
                  x={x}
                  y={Math.max(y, PT + 12)}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill={col}
                  fontFamily="'DM Sans', system-ui, sans-serif"
                >
                  {c.insulin_name}
                </text>
              );
            })}

            {/* Highest overlap bracket */}
            {hz && (() => {
              const x1  = toX(hz.start, startHour, endHour);
              const x2  = toX(hz.end, startHour, endHour);
              const mid = (x1 + x2) / 2;
              const bW  = Math.max(x2 - x1, 36);
              return (
                <g>
                  <rect
                    x={x1} y={PT}
                    width={bW} height={CH}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    strokeDasharray="7 4"
                    rx={5}
                    opacity={0.9}
                  />
                  <rect
                    x={mid - 68} y={PT - 26}
                    width={136} height={22}
                    rx={5} fill="#ef4444"
                  />
                  <text
                    x={mid} y={PT - 10}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={700}
                    fill="#fff"
                    fontFamily="'DM Sans', system-ui, sans-serif"
                  >
                    Highest Overlap  {fmtH(hz.start)}–{fmtH(hz.end)}
                  </text>
                </g>
              );
            })()}

            {/* X-axis labels */}
            {xTicks(startHour, endHour).map(({ h, label }) => (
              <text
                key={`lbl-${h}`}
                x={toX(h, startHour, endHour)}
                y={BASE_Y + 18}
                textAnchor="middle"
                fontSize={9}
                fill="#94a3b8"
                fontFamily="'DM Sans', system-ui, sans-serif"
              >
                {label}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* ── Bottom panels ─────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.6fr 1fr",
          gap: 0,
          borderTop: "1px solid #e2e8f0",
          background: "#fff",
        }}
      >
        {/* Risk zone summary */}
        <div style={{ padding: "14px 14px", borderRight: "1px solid #f1f5f9" }}>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 11,
              fontWeight: 700,
              color: "#0D2149",
            }}
          >
            Risk Zone Summary
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {modZone && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>🔥</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>
                    Moderate Overlap
                  </span>
                </div>
                <p style={{ margin: "0 0 4px", fontSize: 10, color: "#92400e" }}>
                  {fmtH(modZone.start)} – {fmtH(modZone.end)}
                </p>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: "#f59e0b",
                    width: "100%",
                  }}
                />
              </div>
            )}
            {hz && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>🔴</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#7f1d1d" }}>
                    Highest Overlap
                  </span>
                </div>
                <p style={{ margin: "0 0 2px", fontSize: 10, color: "#7f1d1d" }}>
                  {fmtH(hz.start)} – {fmtH(hz.end)}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 600, color: "#ef4444" }}>
                  Main Risk Window
                </p>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: "#ef4444",
                    width: "100%",
                  }}
                />
              </div>
            )}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>🌙</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1e40af" }}>
                  Low Activity
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 10, color: "#475569" }}>
                Evening &amp; Night
              </p>
            </div>
          </div>
        </div>

        {/* Heatmap strip */}
        <div style={{ padding: "14px 14px", borderRight: "1px solid #f1f5f9" }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 11,
              fontWeight: 700,
              color: "#0D2149",
            }}
          >
            Insulin Density ({fmtH(startHour)} → {fmtH(endHour > 24 ? endHour - 24 : endHour)})
          </p>

          {/* Heatmap strip SVG */}
          <div style={{ position: "relative" }}>
            <svg
              viewBox={`0 0 500 48`}
              style={{ width: "100%", display: "block", borderRadius: 6, overflow: "hidden" }}
              aria-label="Insulin density heatmap"
            >
              {/* Red dashed highlight for overlap window */}
              {ow.end > ow.start && (() => {
                const s24 = startHour, e24 = startHour + 24;
                const owX1 = ((ow.start - s24) / (e24 - s24)) * 500;
                const owX2 = ((ow.end - s24) / (e24 - s24)) * 500;
                return (
                  <rect
                    x={owX1} y={2}
                    width={Math.max(owX2 - owX1, 8)} height={44}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    rx={3}
                  />
                );
              })()}

              {densityMap.points.map((pt, i) => {
                const next = densityMap.points[i + 1];
                if (!next) return null;
                const s24 = startHour, e24 = startHour + 24;
                const x1 = ((pt.timeHours - s24) / (e24 - s24)) * 500;
                const x2 = ((next.timeHours - s24) / (e24 - s24)) * 500;
                if (x2 <= 0 || x1 >= 500) return null;
                return (
                  <rect
                    key={`cell-${i}`}
                    x={Math.max(0, x1).toFixed(1)}
                    y={0}
                    width={(Math.min(500, x2) - Math.max(0, x1)).toFixed(1)}
                    height={40}
                    fill={HEAT_COLOURS[pt.pressure] ?? "#60a5fa"}
                    opacity={0.85}
                  />
                );
              })}
            </svg>

            {/* X-axis labels for heatmap */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 2,
              }}
            >
              {[startHour, startHour + 6, startHour + 12, startHour + 18, startHour + 24].map((h) => (
                <span
                  key={h}
                  style={{ fontSize: 9, color: "#94a3b8" }}
                >
                  {fmtH(h)}
                </span>
              ))}
            </div>
          </div>

          {/* Heat legend */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            {Object.entries(HEAT_COLOURS).map(([key, col]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 9,
                  color: "#64748b",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 10,
                    borderRadius: 2,
                    background: col,
                    opacity: 0.85,
                  }}
                />
                {HEAT_LABEL[key]}
              </div>
            ))}
          </div>
        </div>

        {/* Key insight */}
        <div style={{ padding: "14px 14px" }}>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 11,
              fontWeight: 700,
              color: "#0D2149",
            }}
          >
            Key Insight
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {insightWindow && (
              <div style={{ display: "flex", gap: 7 }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#1a2a5e",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  ●
                </span>
                <span style={{ fontSize: 11, color: "#1e293b", lineHeight: 1.4 }}>
                  Peak collision occurs{" "}
                  <strong>{insightWindow}</strong>
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: 7 }}>
              <span style={{ flexShrink: 0, fontSize: 14 }}>✓</span>
              <span style={{ fontSize: 11, color: "#1e293b", lineHeight: 1.4 }}>
                Several insulin effects overlap
              </span>
            </div>
            {densityMap.riskZones.filter((z) => z.pressure === "overlap").length > 0 && (
              <div style={{ display: "flex", gap: 7 }}>
                <span style={{ flexShrink: 0, fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 11, color: "#1e293b", lineHeight: 1.4 }}>
                  This matches repeated glucose drop time
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: 7 }}>
              <span style={{ flexShrink: 0, fontSize: 14 }}>⚡</span>
              <span style={{ fontSize: 11, color: "#1e293b", lineHeight: 1.4 }}>
                Physical activity may intensify effect
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── What the Map Shows narrative bar ─────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 0,
          borderTop: "1px solid #e2e8f0",
          background: "#f8faff",
        }}
      >
        {[
          { icon: "✓", text: "Insulin builds through the morning" },
          { icon: "✓", text: "Stacks highest early afternoon" },
          { icon: "✓", text: "Drops back to low evening" },
          { icon: "✓", text: "Pattern repeats most days" },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              padding: "10px 14px",
              borderRight: i < 3 ? "1px solid #e2e8f0" : "none",
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
            }}
          >
            <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              {item.icon}
            </span>
            <span style={{ fontSize: 11, color: "#374151", lineHeight: 1.45 }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
