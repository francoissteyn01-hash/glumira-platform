/**
 * GluMira™ V7 — Mountain View (Kids IOB Landscape)
 *
 * Renders the same IOB data as the clinical terrain chart but as a
 * mountain landscape with sky, sun/moon, Mira owl, and kid-friendly
 * labels and tooltips.
 *
 * Same data shape as IOBTerrainChart — just a different visual layer.
 */

import React, { useMemo, useState, useRef, useCallback } from "react";
import type { TerrainPoint, PressureClass, InsulinEntry } from "@/lib/pharmacokinetics";
import { computeEntryCurve } from "@/lib/pharmacokinetics";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface EntryCurvePoint {
  minute: number;
  iob: number;
}

interface EntryCurve {
  entry: InsulinEntry;
  colour: string;
  curve: EntryCurvePoint[];
}

export interface MountainViewProps {
  points: TerrainPoint[];
  entryCurves: EntryCurve[];
  peakIOB: number;
  totalMinutes: number;
  entries: InsulinEntry[];
  patientName?: string;
  compact?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MOUNTAIN_FILL_BOTTOM = "#1A2A5E";
const MOUNTAIN_FILL_TOP = "#2AB5C1";
const SKY_TOP = "#E8F4F8";
const SKY_BOTTOM = "#FFFFFF";
const GROUND_COLOUR = "#5D7A3A";
const SUN_COLOUR = "#D4A229";
const MOON_COLOUR = "#D4A229";

const PRESSURE_SKY: Record<PressureClass, string> = {
  light: "transparent",
  moderate: "#FFC10720",
  strong: "#FF980030",
  overlap: "#F4433625",
};

const PRESSURE_KIDS: Record<PressureClass, string> = {
  light: "small hill",
  moderate: "medium mountain",
  strong: "big mountain",
  overlap: "huge mountain",
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHHMM(min: number): string {
  const dm = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(dm / 60)).padStart(2, "0")}:${String(dm % 60).padStart(2, "0")}`;
}

/** Build a smooth SVG path from IOB data using monotone cubic interpolation. */
function buildMountainPath(
  data: { minute: number; iob: number }[],
  width: number,
  height: number,
  maxIOB: number,
  groundY: number,
): string {
  if (data.length < 2) return "";
  const totalMin = data[data.length - 1].minute;
  const toX = (min: number) => (min / totalMin) * width;
  const toY = (iob: number) => groundY - (iob / (maxIOB * 1.15)) * (groundY - 30);

  const pts = data.map((d) => ({ x: toX(d.minute), y: toY(d.iob) }));

  // Build path with smooth curves (catmull-rom → bezier)
  let path = `M ${pts[0].x},${groundY} L ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  path += ` L ${pts[pts.length - 1].x},${groundY} Z`;
  return path;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sun / Moon                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CelestialBody({ totalMinutes, width }: { totalMinutes: number; width: number }) {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const isSun = currentMin >= 360 && currentMin < 1080; // 06:00–18:00
  const x = (currentMin / 1440) * width;
  const y = 28;
  const r = 14;

  return (
    <g>
      {/* Glow */}
      <circle cx={x} cy={y} r={r + 10} fill={isSun ? SUN_COLOUR : MOON_COLOUR} opacity={0.15} />
      <circle cx={x} cy={y} r={r + 5} fill={isSun ? SUN_COLOUR : MOON_COLOUR} opacity={0.25} />
      {/* Body */}
      <circle cx={x} cy={y} r={r} fill={isSun ? SUN_COLOUR : "#C0C0C0"} opacity={0.9} />
      {!isSun && (
        /* Moon crescent shadow */
        <circle cx={x + 4} cy={y - 2} r={r - 2} fill={SKY_TOP} opacity={0.7} />
      )}
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mira Owl                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MiraOwl({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 6}, ${y - 16})`}>
      {/* Body */}
      <ellipse cx={6} cy={10} rx={5} ry={6} fill="#1A2A5E" />
      {/* Head */}
      <circle cx={6} cy={4} r={4} fill="#1A2A5E" />
      {/* Ears */}
      <polygon points="2,1 3,4 1,3" fill="#1A2A5E" />
      <polygon points="10,1 9,4 11,3" fill="#1A2A5E" />
      {/* Eyes */}
      <circle cx={4.5} cy={4} r={1.2} fill="#2AB5C1" />
      <circle cx={7.5} cy={4} r={1.2} fill="#2AB5C1" />
      <circle cx={4.5} cy={4} r={0.5} fill="#fff" />
      <circle cx={7.5} cy={4} r={0.5} fill="#fff" />
      {/* Beak */}
      <polygon points="5.5,5.5 6,6.5 6.5,5.5" fill={SUN_COLOUR} />
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tooltip                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface TooltipData {
  x: number;
  y: number;
  time: string;
  iob: number;
  pressure: PressureClass;
  contributors: string[];
}

function MountainTooltip({ data }: { data: TooltipData | null }) {
  if (!data) return null;
  const sizeWord = PRESSURE_KIDS[data.pressure];
  return (
    <div
      style={{
        position: "absolute",
        left: data.x,
        top: data.y - 100,
        transform: "translateX(-50%)",
        background: "#1A2A5E",
        color: "#fff",
        borderRadius: 12,
        padding: "10px 14px",
        fontSize: 13,
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        pointerEvents: "none",
        whiteSpace: "nowrap",
        zIndex: 10,
        minWidth: 180,
      }}
    >
      <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
        At {data.time}: {data.iob.toFixed(1)} units of insulin are working
      </p>
      <p style={{ margin: "0 0 4px", color: "#2AB5C1" }}>
        That's like a {sizeWord}
      </p>
      {data.contributors.length > 0 && (
        <p style={{ margin: 0, fontSize: 11, color: "#C8D6E5" }}>
          {data.contributors.map((c) => `Your ${c} is making this mountain`).join(". ")}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function MountainView({
  points,
  entryCurves,
  peakIOB,
  totalMinutes,
  entries,
  patientName,
  compact = false,
}: MountainViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const WIDTH = 800;
  const HEIGHT = compact ? 260 : 340;
  const GROUND_Y = HEIGHT - 30;

  // Build per-entry mountain paths
  const mountains = useMemo(() => {
    return entryCurves.map(({ entry, colour, curve }, idx) => {
      const path = buildMountainPath(curve, WIDTH, HEIGHT, peakIOB, GROUND_Y);
      return { entry, colour, path, idx };
    });
  }, [entryCurves, peakIOB, HEIGHT, GROUND_Y]);

  // Find peak point for Mira owl placement
  const peakPoint = useMemo(() => {
    let best = { minute: 0, iob: 0 };
    for (const pt of points) {
      if (pt.totalIOB > best.iob) best = { minute: pt.minute, iob: pt.totalIOB };
    }
    return best;
  }, [points]);

  const owlX = (peakPoint.minute / totalMinutes) * WIDTH;
  const owlY = GROUND_Y - (peakPoint.iob / (peakIOB * 1.15)) * (GROUND_Y - 30);

  // Danger sky overlays
  const dangerOverlays = useMemo(() => {
    const overlays: { x1: number; x2: number; colour: string }[] = [];
    let currentPressure: PressureClass | null = null;
    let startMin = 0;
    for (const pt of points) {
      if (pt.pressure === "strong" || pt.pressure === "overlap") {
        if (currentPressure !== pt.pressure) {
          if (currentPressure) {
            overlays.push({
              x1: (startMin / totalMinutes) * WIDTH,
              x2: (pt.minute / totalMinutes) * WIDTH,
              colour: PRESSURE_SKY[currentPressure],
            });
          }
          currentPressure = pt.pressure;
          startMin = pt.minute;
        }
      } else if (currentPressure) {
        overlays.push({
          x1: (startMin / totalMinutes) * WIDTH,
          x2: (pt.minute / totalMinutes) * WIDTH,
          colour: PRESSURE_SKY[currentPressure],
        });
        currentPressure = null;
      }
    }
    if (currentPressure) {
      overlays.push({
        x1: (startMin / totalMinutes) * WIDTH,
        x2: WIDTH,
        colour: PRESSURE_SKY[currentPressure],
      });
    }
    return overlays;
  }, [points, totalMinutes]);

  // X-axis time labels with emoji
  const timeLabels = useMemo(() => {
    const labels: { x: number; text: string }[] = [];
    const step = 360; // every 6 hours
    for (let m = 0; m <= totalMinutes; m += step) {
      const dm = m % 1440;
      let emoji = "";
      if (dm === 360) emoji = "🌅 ";
      else if (dm === 720) emoji = "☀️ ";
      else if (dm === 1080) emoji = "🌇 ";
      else if (dm === 0) emoji = "🌙 ";
      labels.push({
        x: (m / totalMinutes) * WIDTH,
        text: `${emoji}${minutesToHHMM(m)}`,
      });
    }
    return labels;
  }, [totalMinutes]);

  // Dose flags
  const doseFlags = useMemo(() => {
    const flags: { x: number; y: number; label: string }[] = [];
    for (const entry of entries) {
      const min = timeToMinutes(entry.time);
      // Find IOB at dose time from the combined points
      const pt = points.find((p) => p.minute === min) || points.find((p) => Math.abs(p.minute - min) <= 5);
      const iob = pt?.totalIOB ?? 0;
      const x = (min / totalMinutes) * WIDTH;
      const y = GROUND_Y - (iob / (peakIOB * 1.15)) * (GROUND_Y - 30);
      flags.push({
        x,
        y: Math.min(y, GROUND_Y - 5),
        label: `${entry.dose}U at ${entry.time}`,
      });
    }
    return flags;
  }, [entries, points, totalMinutes, peakIOB, GROUND_Y]);

  // Touch/hover handler
  const handleInteraction = useCallback(
    (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const relX = ((clientX - rect.left) / rect.width) * WIDTH;
      const minute = Math.round((relX / WIDTH) * totalMinutes);

      // Find nearest point
      const pt = points.reduce((best, p) =>
        Math.abs(p.minute - minute) < Math.abs(best.minute - minute) ? p : best
      );

      // Find contributing insulins
      const contributors: string[] = [];
      for (const { entry, curve } of entryCurves) {
        const cp = curve.find((c) => Math.abs(c.minute - pt.minute) <= 5);
        if (cp && cp.iob > 0.05) contributors.push(entry.insulinName);
      }

      setTooltip({
        x: ((pt.minute / totalMinutes) * rect.width) + rect.left - (containerRef.current?.getBoundingClientRect().left ?? 0),
        y: GROUND_Y - (pt.totalIOB / (peakIOB * 1.15)) * (GROUND_Y - 30),
        time: minutesToHHMM(pt.minute),
        iob: pt.totalIOB,
        pressure: pt.pressure,
        contributors,
      });
    },
    [points, entryCurves, totalMinutes, peakIOB, GROUND_Y],
  );

  // Y-axis labels
  const yTicks = useMemo(() => {
    const ticks: { y: number; label: string }[] = [];
    const max = peakIOB * 1.15;
    const step = max > 6 ? 2 : max > 3 ? 1 : 0.5;
    for (let v = 0; v <= max; v += step) {
      const y = GROUND_Y - (v / max) * (GROUND_Y - 30);
      ticks.push({ y, label: v.toFixed(1) });
    }
    return ticks;
  }, [peakIOB, GROUND_Y]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <MountainTooltip data={tooltip} />

      {/* Y-axis label */}
      <div style={{
        position: "absolute", left: 0, top: "50%", transform: "rotate(-90deg) translateX(-50%)",
        fontSize: 10, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500, whiteSpace: "nowrap", transformOrigin: "0 0",
      }}>
        How much insulin is working
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        style={{ display: "block", cursor: "crosshair" }}
        onMouseMove={handleInteraction}
        onTouchMove={handleInteraction}
        onMouseLeave={() => setTooltip(null)}
        onTouchEnd={() => setTooltip(null)}
      >
        <defs>
          {/* Sky gradient */}
          <linearGradient id="mountain-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SKY_TOP} />
            <stop offset="100%" stopColor={SKY_BOTTOM} />
          </linearGradient>
          {/* Mountain gradients per entry */}
          {entryCurves.map(({ entry }, idx) => (
            <linearGradient key={`mtn-grad-${entry.id}`} id={`mtn-grad-${entry.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MOUNTAIN_FILL_TOP} stopOpacity={0.85 - idx * 0.1} />
              <stop offset="100%" stopColor={MOUNTAIN_FILL_BOTTOM} stopOpacity={0.95} />
            </linearGradient>
          ))}
          {/* Ground gradient */}
          <linearGradient id="mountain-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GROUND_COLOUR} />
            <stop offset="100%" stopColor="#3D5A2A" />
          </linearGradient>
        </defs>

        {/* Sky background */}
        <rect x={0} y={0} width={WIDTH} height={GROUND_Y} fill="url(#mountain-sky)" />

        {/* Danger sky overlays (warm sunset / stormy) */}
        {dangerOverlays.map((ov, i) => (
          <rect key={`danger-sky-${i}`} x={ov.x1} y={0} width={ov.x2 - ov.x1} height={GROUND_Y} fill={ov.colour} />
        ))}

        {/* Sun or moon */}
        <CelestialBody totalMinutes={totalMinutes} width={WIDTH} />

        {/* Mountain silhouettes (back to front, each semi-transparent) */}
        {mountains.map(({ entry, path, idx }) => (
          <path
            key={`mtn-${entry.id}`}
            d={path}
            fill={`url(#mtn-grad-${entry.id})`}
            stroke={MOUNTAIN_FILL_TOP}
            strokeWidth={1.5}
            strokeOpacity={0.4}
            opacity={0.7 + idx * 0.05}
            style={{ transition: "d 0.6s ease-in-out" }}
          />
        ))}

        {/* Ground strip */}
        <rect x={0} y={GROUND_Y} width={WIDTH} height={HEIGHT - GROUND_Y} fill="url(#mountain-ground)" rx={0} />

        {/* Meadow texture dots (light pressure = safe valley) */}
        {Array.from({ length: 20 }).map((_, i) => (
          <circle
            key={`meadow-${i}`}
            cx={i * (WIDTH / 20) + 15}
            cy={GROUND_Y + 8 + Math.sin(i) * 4}
            r={2}
            fill="#7DA34B"
            opacity={0.5}
          />
        ))}

        {/* Y-axis ticks */}
        {yTicks.map((t, i) => (
          <g key={`ytick-${i}`}>
            <line x1={40} y1={t.y} x2={WIDTH} y2={t.y} stroke="#1A2A5E" strokeOpacity={0.08} strokeDasharray="4 4" />
            <text x={36} y={t.y + 4} textAnchor="end" fontSize={10} fill="#1A2A5E" opacity={0.5} fontFamily="'DM Sans', sans-serif">
              {t.label}
            </text>
          </g>
        ))}

        {/* X-axis time labels */}
        {timeLabels.map((t, i) => (
          <text
            key={`xlabel-${i}`}
            x={t.x}
            y={HEIGHT - 4}
            textAnchor="middle"
            fontSize={10}
            fill="#1A2A5E"
            opacity={0.6}
            fontFamily="'DM Sans', sans-serif"
          >
            {t.text}
          </text>
        ))}

        {/* Dose flags */}
        {doseFlags.map((f, i) => (
          <g key={`flag-${i}`}>
            <line x1={f.x} y1={f.y} x2={f.x} y2={GROUND_Y} stroke="#D4A229" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
            <text x={f.x + 3} y={f.y - 4} fontSize={9} fill="#D4A229" fontFamily="'DM Sans', sans-serif" fontWeight={600}>
              🚩 {f.label}
            </text>
          </g>
        ))}

        {/* Mira owl on highest peak */}
        <MiraOwl x={owlX} y={owlY} />

        {/* Peak label */}
        <text
          x={owlX}
          y={owlY - 22}
          textAnchor="middle"
          fontSize={9}
          fill="#2AB5C1"
          fontFamily="'DM Sans', sans-serif"
          fontWeight={600}
        >
          Biggest mountain = most insulin working
        </text>
      </svg>

      {/* X-axis label */}
      <div style={{
        textAlign: "center", fontSize: 11, color: "var(--text-secondary)",
        fontFamily: "'DM Sans', sans-serif", marginTop: 2, fontWeight: 500,
      }}>
        Time of day
      </div>
    </div>
  );
}
