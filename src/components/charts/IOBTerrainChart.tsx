/**
 * GluMira™ V7 — IOB Terrain Chart (Master Chart Component)
 *
 * Renders multi-cycle insulin terrain with:
 * - Pressure map background shading (light/moderate/strong/overlap)
 * - Stacked area chart: per-insulin layers with combined IOB outline
 * - Danger/Watch window brackets above graph
 * - Upgraded dose markers with arrow + abbreviation
 * - Current time marker
 * - Dynamic subtitle with live stats
 * - G4 individual curves density view (tab)
 * - Clinical view only (mountains/kids removed)
 * - Density bar + 60-second insight panel + What-if panel
 *
 * Uses Recharts for rendering (Canvas upgrade planned for Phase 2).
 */

import { useMemo, useState, useCallback } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, ReferenceArea,
} from "recharts";
import {
  buildTerrainTimeline,
  generateInsight,
  computeEntryCurve,
  type InsulinPharmacology,
  type InsulinEntry,
  type PressureClass,
  type TerrainPoint,
  type DangerWindow,
} from "@/lib/pharmacokinetics";

import IOBDensityBar from "@/components/charts/IOBDensityBar";
import SixtySecondInsight from "@/components/charts/SixtySecondInsight";
import WhatIfTiming from "@/components/charts/WhatIfTiming";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

type BasalEntry = { insulinName: string; dose: number; time: string; pharmacology: InsulinPharmacology; }
type BolusEntry = { insulinName: string; dose: number; time: string; mealType?: string; pharmacology: InsulinPharmacology; }
type GlucosePoint = { time: string; value: number; unit: "mmol/L" | "mg/dL"; }
type ProfileInfo = { name: string; caregiver?: string; age?: number; sex?: string; country: string; glucoseUnit: "mmol/L" | "mg/dL"; }

/** v7 engine curve data — when provided, bypasses the legacy pharmacokinetics engine entirely */
export type V7ChartData = {
  /** IOB curve points from generateStackedCurve (v7 engine, cited PK models) */
  curve: Array<{ hours: number; time_label: string; total_iob: number; breakdown: Record<string, number> }>;
  /** Dose metadata for legend/markers */
  doses: Array<{ id: string; insulin_name: string; dose_units: number; administered_at: string; dose_type: string }>;
  /** Peak IOB from the curve */
  maxIOB: number;
}

export type IOBTerrainChartProps = {
  profile: ProfileInfo;
  basalEntries: BasalEntry[];
  bolusEntries: BolusEntry[];
  glucoseData?: GlucosePoint[];
  cycles?: number;
  showInsight?: boolean;
  showDensityBar?: boolean;
  showWhatIf?: boolean;
  compact?: boolean;
  tier?: "free" | "pro" | "ai" | "clinical";
  /** When provided, uses v7 cited PK engine instead of legacy Bateman model */
  v7Data?: V7ChartData;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MINUTES_PER_DAY = 1440;

const PRESSURE_COLOURS: Record<PressureClass, string> = {
  light: "#4CAF50", moderate: "#F59E0B", strong: "#F87171", overlap: "#EF4444",
};

// Rule 50 audit — pressure bands were invisible at mobile (0.08/0.12/0.18).
// Bumped to stay legible at 393px and to make strong/overlap visibly distinct.
const PRESSURE_OPACITY: Record<PressureClass, number> = {
  light: 0, moderate: 0.22, strong: 0.32, overlap: 0.44,
};

// Rule 50 audit — basal blues (#5B8FD4 vs #7F77DD vs #378ADD vs #5BA3CF) were
// perceptually adjacent on navy. Spread hues to distinguish stacked layers.
const BASAL_STACK_COLOURS = ["#5B8FD4", "#9E7FDD", "#2E86AB", "#7FB3D3"];
const BOLUS_STACK_COLOURS: Record<string, string> = {
  "ultra-rapid": "#2AB5C1",
  "rapid": "#2AB5C1",
  "short": "#E8A838",
};
const BOLUS_STACK_DEFAULT = "#2AB5C1";

// Per-insulin colours — high contrast, multi-colour (reference images)
const BASAL_COLOURS = ["#5B8FD4", "#9E7FDD", "#2E86AB", "#7FB3D3"];
const BOLUS_COLOURS = ["#2AB5C1", "#E8A838", "#E06B55", "#D4537E"];
const GLUCOSE_COLOUR = "#f59e0b";

// Abbreviations for dose markers
const INSULIN_ABBREV: Record<string, string> = {
  "Levemir": "Lev", "Detemir": "Lev", "Lantus": "Lan", "Basaglar": "Lan",
  "Tresiba": "Tre", "Degludec": "Tre", "Toujeo": "Tou", "NPH": "NPH",
  "Fiasp": "Fia", "Lyumjev": "Lyu", "NovoRapid": "NR", "Aspart": "NR",
  "Humalog": "Hum", "Lispro": "Hum", "Apidra": "Api", "Glulisine": "Api",
  "Actrapid": "Act", "Regular": "Act", "Humulin": "Hum",
};

function getAbbrev(name: string): string {
  for (const [key, abbr] of Object.entries(INSULIN_ABBREV)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return abbr;
  }
  return name.slice(0, 3);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToLabel(min: number): string {
  const day = Math.floor(min / MINUTES_PER_DAY) + 1;
  const dm = ((min % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hh = String(Math.floor(dm / 60)).padStart(2, "0");
  const mm = String(dm % 60).padStart(2, "0");
  return day > 1 ? `D${day} ${hh}:${mm}` : `${hh}:${mm}`;
}

function minutesToTime(min: number): string {
  const dm = ((min % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${String(Math.floor(dm / 60)).padStart(2, "0")}:${String(dm % 60).padStart(2, "0")}`;
}

function toInsulinEntries(basalEntries: BasalEntry[], bolusEntries: BolusEntry[]): InsulinEntry[] {
  const entries: InsulinEntry[] = [];
  basalEntries.forEach((e, i) => entries.push({ id: `basal_${i}_${e.time}`, insulinName: e.insulinName, dose: e.dose, time: e.time, type: "basal", pharmacology: e.pharmacology }));
  bolusEntries.forEach((e, i) => entries.push({ id: `bolus_${i}_${e.time}`, insulinName: e.insulinName, dose: e.dose, time: e.time, type: "bolus", pharmacology: e.pharmacology, mealType: e.mealType }));
  return entries;
}

type ChartPoint = {
  glucose?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
} & TerrainPoint

function attachGlucose(points: TerrainPoint[], glucoseData: GlucosePoint[] | undefined, cycles: number): ChartPoint[] {
  if (!glucoseData || glucoseData.length === 0) return points;
  const glucoseMap = new Map<number, number>();
  for (const gp of glucoseData) {
    const min = timeToMinutes(gp.time);
    const bucket = Math.round(min / 5) * 5;
    glucoseMap.set(bucket, gp.value);
    for (let c = 1; c < cycles; c++) glucoseMap.set(bucket + c * MINUTES_PER_DAY, gp.value);
  }
  return points.map((pt) => ({ ...pt, glucose: glucoseMap.get(pt.minute) }));
}

/** Merge adjacent timepoints with same pressure into contiguous bands */
function buildPressureBands(points: TerrainPoint[]): Array<{ start: number; end: number; pressure: PressureClass }> {
  if (points.length === 0) return [];
  const bands: Array<{ start: number; end: number; pressure: PressureClass }> = [];
  let current = { start: points[0].minute, end: points[0].minute, pressure: points[0].pressure };
  for (let i = 1; i < points.length; i++) {
    if (points[i].pressure === current.pressure) {
      current.end = points[i].minute;
    } else {
      bands.push({ ...current });
      current = { start: points[i].minute, end: points[i].minute, pressure: points[i].pressure };
    }
  }
  bands.push(current);
  return bands;
}

function getCurrentMinute(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StackedTooltip({ active, payload, entryCurves }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as ChartPoint;
  const breakdown: { name: string; time: string; iob: number; colour: string }[] = [];
  if (entryCurves) {
    for (const { entry, colour } of entryCurves) {
      const iob = d[entry.id];
      if (iob !== undefined && iob > 0.005) {
        breakdown.push({ name: entry.insulinName, time: entry.time, iob, colour });
      }
    }
  }
  breakdown.sort((a, b) => b.iob - a.iob);
  // Rule 53 audit — mobile tooltip overflow on 393px S23 FE. Cap at 4 rows.
  const MAX_ROWS = 4;
  const visible = breakdown.slice(0, MAX_ROWS);
  const overflow = Math.max(0, breakdown.length - MAX_ROWS);

  return (
    <div style={{ background: "var(--bg-card, #fff)", border: "1px solid var(--border, #e2e8f0)", borderRadius: 10, padding: "12px 16px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontFamily: "'DM Sans', system-ui, sans-serif", minWidth: 200, maxWidth: 280 }}>
      <p style={{ fontSize: "clamp(12px, 3vw, 13px)", color: "var(--text-primary)", margin: "0 0 8px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
        {d.label} — Total IOB: {d.totalIOB.toFixed(2)}U
      </p>
      {visible.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
          {visible.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "clamp(10px, 2.8vw, 11px)", color: "var(--text-secondary)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: b.colour, flexShrink: 0 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {b.name} ({b.time}): {b.iob.toFixed(2)}U
              </span>
            </div>
          ))}
          {overflow > 0 && (
            <div style={{ fontSize: 10, color: "var(--text-secondary)", opacity: 0.7, fontStyle: "italic" }}>
              +{overflow} more
            </div>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
        <span style={{ color: PRESSURE_COLOURS[d.pressure], fontWeight: 600 }}>
          Pressure: {d.pressure === "overlap" ? "OVERLAP" : d.pressure.toUpperCase()}
        </span>
      </div>
      {d.glucose !== undefined && (
        <p style={{ fontSize: 12, color: GLUCOSE_COLOUR, margin: "6px 0 0", fontWeight: 600 }}>Glucose: {d.glucose.toFixed(1)}</p>
      )}
    </div>
  );
}

function LegendDot({ colour, label }: { colour: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: colour, display: "inline-block" }} />{label}
    </span>
  );
}

function PressureLegend() {
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", padding: "6px 0 2px", fontSize: 10, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "transparent", border: "1px solid var(--border)" }} /> Light</span>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#F59E0B", opacity: 0.3 }} /> Moderate</span>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#F87171", opacity: 0.4 }} /> Strong</span>
      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#EF4444", opacity: 0.5 }} /> Overlap</span>
    </div>
  );
}

function SummaryStats({ peakIOB, peakTime, lowestIOB, lowestTime, strongOverlapHours, totalBasal, totalBolus }: {
  peakIOB: number; peakTime: string; lowestIOB: number; lowestTime: string; strongOverlapHours: number; totalBasal: number; totalBolus: number;
}) {
  const stats = [
    { label: "Peak IOB", value: `${peakIOB.toFixed(1)}U`, sub: `at ${peakTime}` },
    { label: "Lowest pressure", value: `${lowestIOB.toFixed(1)}U`, sub: `@ ${lowestTime}` },
    { label: "Strong / Overlap", value: `${strongOverlapHours}h`, sub: "" },
    { label: "Daily totals", value: `${totalBasal.toFixed(1)}U basal`, sub: `${totalBolus.toFixed(1)}U bolus` },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16, padding: "0 4px" }}>
      {stats.map((s, i) => (
        <div key={i} style={{ textAlign: "center", padding: "12px 8px", borderRadius: 8, background: "var(--bg-primary, #f8fafc)", border: "1px solid var(--border)" }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</p>
          <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}>{s.value}</p>
          {s.sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}

function DangerWindowBadges({ dangerWindows }: { dangerWindows: DangerWindow[] }) {
  if (dangerWindows.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 4px", marginBottom: 8 }}>
      {dangerWindows.map((w, i) => {
        const isOverlap = w.pressure === "overlap";
        const colour = isOverlap ? "#EF4444" : "#F87171";
        const bg = isOverlap ? "rgba(239,68,68,0.08)" : "rgba(248,113,113,0.08)";
        const label = isOverlap ? "Danger" : "Watch";
        return (
          <span key={`dw-${i}`} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 6,
            background: bg, border: `1px solid ${colour}30`,
            fontSize: 11, fontWeight: 600, color: colour,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: colour }} />
            {label}: {minutesToTime(w.startMinute)} – {minutesToTime(w.endMinute)}
          </span>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  G4 Individual Curves View                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function G4DensityView({ entryCurves, enrichedPoints, totalMinutes, graphStartMinute, xTicks, compact }: {
  entryCurves: Array<{ entry: InsulinEntry; idx: number; colour: string; stackColour: string; curve: Array<{ minute: number; iob: number }> }>;
  enrichedPoints: ChartPoint[];
  totalMinutes: number;
  graphStartMinute: number;
  xTicks: number[];
  compact: boolean;
}) {
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const chartHeight = compact ? 200 : 260;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 4px" }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}>
          Individual Curves
        </h4>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Tap a curve to highlight</span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 4px", marginBottom: 8 }}>
        {entryCurves.map(({ entry, colour }) => (
          <button key={entry.id} onClick={() => setHighlighted(highlighted === entry.id ? null : entry.id)}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 4, border: "1px solid",
              borderColor: highlighted === entry.id ? colour : "var(--border)",
              background: highlighted === entry.id ? colour + "20" : "transparent",
              fontSize: 10, fontWeight: 500, color: highlighted === entry.id ? colour : "var(--text-secondary)",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: colour }} />
            {entry.insulinName} {entry.dose}U
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart data={enrichedPoints} margin={{ top: 4, right: 8, left: compact ? -12 : 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} strokeWidth={0.75} vertical={false} />
          <XAxis dataKey="minute" type="number" domain={[graphStartMinute, totalMinutes]} ticks={xTicks} tickFormatter={minutesToLabel}
            tick={{ fontSize: 10, fill: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}
            axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
          <YAxis tick={{ fontSize: 10, fill: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}
            tickFormatter={(v: number) => `${v.toFixed(1)}`}
            axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />

          {entryCurves.map(({ entry, colour }) => {
            const isHighlighted = highlighted === null || highlighted === entry.id;
            return (
              <Area key={entry.id} type="monotone" dataKey={entry.id}
                stroke={colour} strokeWidth={isHighlighted ? 1.5 : 1}
                strokeOpacity={isHighlighted ? 0.9 : 0.15}
                fill={colour} fillOpacity={isHighlighted ? 0.15 : 0.02}
                dot={false} animationDuration={0}
                name={`${entry.insulinName} ${entry.dose}U`} />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function IOBTerrainChart({
  profile, basalEntries, bolusEntries, glucoseData,
  cycles = 2, showInsight = true, showDensityBar = true, showWhatIf = false, compact = false, tier = "free",
  v7Data,
}: IOBTerrainChartProps) {
  const safeCycles = Math.max(2, cycles);
  const useV7 = v7Data != null;

  const view = "clinical" as const;

  const [activeTab, setActiveTab] = useState<"stacked" | "basal" | "bolus" | "individual">("stacked");

  const [whatIfBasal, setWhatIfBasal] = useState(basalEntries);
  const [whatIfBolus, setWhatIfBolus] = useState(bolusEntries);
  const isModified = !useV7 && (JSON.stringify(whatIfBasal) !== JSON.stringify(basalEntries) || JSON.stringify(whatIfBolus) !== JSON.stringify(bolusEntries));
  const activeBasal = isModified ? whatIfBasal : basalEntries;
  const activeBolus = isModified ? whatIfBolus : bolusEntries;

  // ═══════════════════════════════════════════════════════════════════
  // DATA PIPELINE — v7 engine (cited PK) when available, legacy fallback
  // ═══════════════════════════════════════════════════════════════════

  const entries = useMemo(() => toInsulinEntries(activeBasal, activeBolus), [activeBasal, activeBolus]);

  // --- v7 path: convert IOBCurvePoint[] → chart-ready data ---
  const v7Derived = useMemo(() => {
    if (!v7Data) return null;
    const { curve, doses, maxIOB } = v7Data;
    if (curve.length === 0) return null;

    // Build unique dose list with colours
    let bIdx = 0;
    let rIdx = 0;
    const doseColours: Array<{ id: string; name: string; dose: number; type: string; colour: string; stackColour: string }> = doses.map((d) => {
      const isBasal = d.dose_type === "basal_injection";
      const colour = isBasal ? BASAL_COLOURS[bIdx % BASAL_COLOURS.length] : BOLUS_COLOURS[rIdx % BOLUS_COLOURS.length];
      const stackColour = isBasal ? BASAL_STACK_COLOURS[bIdx % BASAL_STACK_COLOURS.length] : BOLUS_STACK_DEFAULT;
      if (isBasal) bIdx++; else rIdx++;
      return { id: d.id, name: d.insulin_name, dose: d.dose_units, type: isBasal ? "basal" : "bolus", colour, stackColour };
    });

    // Convert curve points to chart format (minute-based)
    const points: ChartPoint[] = curve.map((pt) => {
      const minute = Math.round(pt.hours * 60);
      const totalIOB = pt.total_iob;
      // Pressure classification
      const ratio = maxIOB > 0 ? totalIOB / maxIOB : 0;
      const pressure: PressureClass = ratio >= 0.75 ? "overlap" : ratio >= 0.5 ? "strong" : ratio >= 0.25 ? "moderate" : "light";
      // Per-dose IOB values
      const perDose: Record<string, number> = {};
      for (const [key, val] of Object.entries(pt.breakdown)) {
        perDose[key] = val;
      }
      return { minute, hour: pt.hours, totalIOB, basalIOB: 0, bolusIOB: 0, overlap: 0, pressure, label: pt.time_label, ...perDose };
    });

    // Danger windows (>= 75% of peak for >= 15 min)
    const dangerWindows: DangerWindow[] = [];
    let dwStart: number | null = null;
    let dwPeak = 0;
    for (const pt of points) {
      if (pt.pressure === "overlap" || pt.pressure === "strong") {
        if (dwStart === null) dwStart = pt.minute;
        if (pt.totalIOB > dwPeak) dwPeak = pt.totalIOB;
      } else if (dwStart !== null) {
        if (pt.minute - dwStart >= 15) {
          dangerWindows.push({ startMinute: dwStart, endMinute: pt.minute, peakIOB: dwPeak, pressure: points.find(p => p.minute === dwStart)!.pressure });
        }
        dwStart = null;
        dwPeak = 0;
      }
    }
    if (dwStart !== null && points[points.length - 1].minute - dwStart >= 15) {
      dangerWindows.push({ startMinute: dwStart, endMinute: points[points.length - 1].minute, peakIOB: dwPeak, pressure: "overlap" });
    }

    const worstPressure: PressureClass = points.some(p => p.pressure === "overlap") ? "overlap"
      : points.some(p => p.pressure === "strong") ? "strong"
      : points.some(p => p.pressure === "moderate") ? "moderate" : "light";

    // Build entryCurves-compatible structure for the chart layers
    const entryCurvesV7 = doseColours.map((dc, idx) => {
      // Collect all breakdown keys that match this dose (including cycle variants like "id_c-1")
      const matchingKeys = new Set<string>();
      for (const pt of curve) {
        for (const key of Object.keys(pt.breakdown)) {
          if (key === dc.id || key.startsWith(dc.id + "_c")) matchingKeys.add(key);
        }
      }
      const curveData = points.map((pt) => {
        let iob = 0;
        for (const key of matchingKeys) {
          iob += (pt[key] as number) || 0;
        }
        return { minute: pt.minute, iob };
      });
      // Merge all matching keys into a single key for this dose in enrichedPoints
      const mergedKey = dc.id;
      return {
        entry: { id: mergedKey, insulinName: dc.name, dose: dc.dose, time: doses.find(d => d.id === dc.id)?.administered_at ?? "", type: dc.type, pharmacology: {} as InsulinPharmacology, mealType: undefined } as InsulinEntry,
        idx, colour: dc.colour, stackColour: dc.stackColour, curve: curveData,
      };
    });

    // Rebuild enrichedPoints with merged per-dose keys
    const enriched = points.map((pt) => {
      const merged: Record<string, number> = {};
      for (const ec of entryCurvesV7) {
        let iob = 0;
        for (const key of Object.keys(pt)) {
          if (key === ec.entry.id || (typeof key === "string" && key.startsWith(ec.entry.id + "_c"))) {
            iob += (pt[key] as number) || 0;
          }
        }
        merged[ec.entry.id] = iob;
      }
      return { ...pt, ...merged };
    });

    return { points: enriched, rawPoints: points, peakIOB: maxIOB, dangerWindows, worstPressure, entryCurves: entryCurvesV7 };
  }, [v7Data]);

  // --- Legacy path (fallback when v7Data not provided) ---
  const legacyDerived = useMemo(() => {
    if (useV7) return null;
    const { points: rp, peakIOB: pk, dangerWindows: dw, worstPressure: wp } = buildTerrainTimeline(entries, safeCycles);
    const pts = attachGlucose(rp, glucoseData, safeCycles);
    const totalMinutes = safeCycles * MINUTES_PER_DAY;
    let basalIdx = 0;
    let _bolusIdx = 0;
    const ec = entries.map((entry, idx) => {
      let colour: string;
      let stackColour: string;
      if (entry.type === "basal") {
        colour = BASAL_COLOURS[idx % BASAL_COLOURS.length];
        stackColour = BASAL_STACK_COLOURS[basalIdx % BASAL_STACK_COLOURS.length];
        basalIdx++;
      } else {
        colour = BOLUS_COLOURS[idx % BOLUS_COLOURS.length];
        stackColour = BOLUS_STACK_COLOURS[entry.pharmacology.category] || BOLUS_STACK_DEFAULT;
        _bolusIdx++;
      }
      return { entry, idx, colour, stackColour, curve: computeEntryCurve(entry, totalMinutes, safeCycles) };
    });
    const lookup = new Map<number, Record<string, number>>();
    for (const { entry, curve } of ec) {
      for (const pt of curve) {
        if (!lookup.has(pt.minute)) lookup.set(pt.minute, {});
        lookup.get(pt.minute)![entry.id] = pt.iob;
      }
    }
    const enriched = pts.map((pt) => ({ ...pt, ...(lookup.get(pt.minute) || {}) }));
    return { points: enriched, rawPoints: rp, peakIOB: pk, dangerWindows: dw, worstPressure: wp, entryCurves: ec };
  }, [useV7, entries, safeCycles, glucoseData]);

  // --- Unified variables for the rest of the component ---
  const derived = v7Derived ?? legacyDerived!;
  const { rawPoints, peakIOB, dangerWindows, worstPressure, entryCurves } = derived;
  const enrichedPoints = derived.points;

  const basalOnlyCurves = useMemo(() => entryCurves.filter(({ entry }) => entry.type === "basal"), [entryCurves]);
  const bolusOnlyCurves = useMemo(() => entryCurves.filter(({ entry }) => entry.type === "bolus"), [entryCurves]);

  // What-if comparison (legacy only)
  const originalEntries = useMemo(() => toInsulinEntries(basalEntries, bolusEntries), [basalEntries, bolusEntries]);
  const { points: originalPoints } = useMemo(() => useV7 ? { points: [] as TerrainPoint[] } : buildTerrainTimeline(originalEntries, safeCycles), [useV7, originalEntries, safeCycles]);

  const pressureBands = useMemo(() => buildPressureBands(rawPoints), [rawPoints]);

  const peakPoint = useMemo(() => {
    if (rawPoints.length === 0) return rawPoints[0];
    let best = rawPoints[0];
    for (const pt of rawPoints) { if (pt.totalIOB > best.totalIOB) best = pt; }
    return best;
  }, [rawPoints]);

  const lowestPoint = useMemo(() => {
    if (rawPoints.length === 0) return undefined;
    let best = rawPoints[0];
    for (const pt of rawPoints) { if (pt.totalIOB < best.totalIOB) best = pt; }
    return best;
  }, [rawPoints]);

  const lowestIOB = lowestPoint?.totalIOB ?? 0;

  const strongOverlapHours = useMemo(() => {
    const strongOrOverlap = rawPoints.filter((p) => p.pressure === "strong" || p.pressure === "overlap");
    return Math.round((strongOrOverlap.length * 5) / 60);
  }, [rawPoints]);

  const totalBasalDose = useMemo(() => basalEntries.reduce((sum, e) => sum + e.dose, 0), [basalEntries]);
  const totalBolusDose = useMemo(() => bolusEntries.reduce((sum, e) => sum + e.dose, 0), [bolusEntries]);

  const insight = useMemo(() => generateInsight(entries, dangerWindows, peakIOB, worstPressure),
  [entries, dangerWindows, peakIOB, worstPressure]);

  const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const chartHeight = compact ? 260 : 340;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasGlucose = enrichedPoints.some((p) => (p as unknown as any).glucose !== undefined);
  const totalDoses = entries.length;
  const currentMinute = getCurrentMinute();

  const totalMinutes = safeCycles * MINUTES_PER_DAY;

  // Graph starts at the earliest injection time (not 00:00) — Rule 17
  const earliestInjectionMinute = useMemo(() => {
    if (entries.length === 0) return 0;
    return Math.min(...entries.map((e) => timeToMinutes(e.time)));
  }, [entries]);
  const graphStartMinute = earliestInjectionMinute;

  const xTicks: number[] = [];
  // Ticks from graph start, every 3 hours
  const firstTick = Math.floor(graphStartMinute / 180) * 180;
  for (let m = firstTick; m <= totalMinutes; m += 180) xTicks.push(m);
  const dayBoundaries: number[] = [];
  for (let d = 1; d < safeCycles; d++) dayBoundaries.push(d * MINUTES_PER_DAY);

  const subtitleText = useMemo(() => {
    const activeCount = entries.length;
    const peakTime = minutesToTime(peakPoint?.minute || 0);
    const peakVal = peakIOB.toFixed(1);
    const currentPressure = (() => {
      const cp = rawPoints.find((p) => p.minute >= currentMinute);
      return cp?.pressure || "light";
    })();
    return `${activeCount} insulin${activeCount !== 1 ? "s" : ""} active | Peak at ${peakTime} (${peakVal}U) | ${currentPressure.toUpperCase()} pressure now`;
  }, [entries.length, peakPoint, peakIOB, rawPoints, currentMinute]);

  const doseMarkers = useMemo(() => {
    const markers = entries.flatMap((entry, idx) => {
      const colour = entry.type === "basal" ? BASAL_COLOURS[idx % BASAL_COLOURS.length] : BOLUS_COLOURS[idx % BOLUS_COLOURS.length];
      const result = [];
      for (let c = 0; c < safeCycles; c++) {
        result.push({ entry, min: timeToMinutes(entry.time) + c * MINUTES_PER_DAY, colour, offset: 0 });
      }
      return result;
    });
    markers.sort((a, b) => a.min - b.min);
    for (let i = 1; i < markers.length; i++) {
      if (markers[i].min - markers[i - 1].min < 30) {
        markers[i - 1].offset = -1;
        markers[i].offset = 1;
      }
    }
    return markers;
  }, [entries, safeCycles]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipContent = useCallback((props: any) => (
    <StackedTooltip {...props} entryCurves={entryCurves} />
  ), [entryCurves]);

  const _marginLeft = compact ? 36 : 48;

  if (totalDoses === 0) {
    return (
      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: 48, textAlign: "center" }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>No doses to visualise</p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Add basal and bolus entries to see the IOB terrain.</p>
      </div>
    );
  }

  const handleTimingChange = (type: "basal" | "bolus", index: number, newTime: string) => {
    if (type === "basal") {
      const updated = [...whatIfBasal];
      updated[index] = { ...updated[index], time: newTime };
      setWhatIfBasal(updated);
    } else {
      const updated = [...whatIfBolus];
      updated[index] = { ...updated[index], time: newTime };
      setWhatIfBolus(updated);
    }
  };
  const handleDoseChange = (type: "basal" | "bolus", index: number, newDose: number) => {
    if (type === "basal") {
      const updated = [...whatIfBasal];
      updated[index] = { ...updated[index], dose: newDose };
      setWhatIfBasal(updated);
    } else {
      const updated = [...whatIfBolus];
      updated[index] = { ...updated[index], dose: newDose };
      setWhatIfBolus(updated);
    }
  };
  const handleReset = () => { setWhatIfBasal(basalEntries); setWhatIfBolus(bolusEntries); };

  return (
    <div className="page-transition">
      {isModified && (
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-15deg)", fontSize: 48, fontWeight: 800, color: "var(--text-primary)", opacity: 0.04, pointerEvents: "none", whiteSpace: "nowrap", zIndex: 1 }}>
            EDUCATIONAL EXPLORATION
          </div>
        </div>
      )}

      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: compact ? "12px 12px 4px" : "16px 16px 8px", position: "relative" }}>
        {/* Title + dynamic subtitle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, padding: "0 4px", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: compact ? 14 : 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
              Live IOB Curve
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#52667A", fontFamily: "'DM Sans', sans-serif" }}>
              {subtitleText}
            </p>
            <p style={{ margin: "1px 0 0", fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
              {profile.name}{profile.caregiver ? ` (managed by ${profile.caregiver})` : ""} · {safeCycles}-cycle view
              {isModified && <span style={{ color: "#FFC107", fontWeight: 600 }}> · WHAT-IF MODE</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", borderRadius: 6, border: "1px solid var(--border)", overflow: "hidden" }}>
              {(["stacked", "basal", "bolus", "individual"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: "4px 10px", fontSize: 10, fontWeight: 500, border: "none", cursor: "pointer",
                  background: activeTab === tab ? "var(--text-primary)" : "transparent",
                  color: activeTab === tab ? "var(--bg-card)" : "var(--text-secondary)",
                  fontFamily: "'DM Sans', sans-serif",
                  minHeight: 36,
                }}>
                  {tab === "stacked" ? "Combined" : tab === "basal" ? "Basal" : tab === "bolus" ? "Bolus" : "Individual"}
                </button>
              ))}
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: PRESSURE_COLOURS[worstPressure] + "18", fontSize: 11, fontWeight: 600, color: PRESSURE_COLOURS[worstPressure], fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRESSURE_COLOURS[worstPressure] }} />
              {worstPressure === "overlap" ? "Overlap Risk" : worstPressure} · Peak {peakIOB.toFixed(1)}U
            </span>
          </div>
        </div>

        {dangerWindows.length === 0 && (
          <div style={{ margin: "0 4px 8px", padding: "8px 14px", borderRadius: 8, background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)", fontSize: 12, fontWeight: 500, color: "#4CAF50", fontFamily: "'DM Sans', sans-serif" }}>
            No insulin stacking detected — steady coverage
          </div>
        )}

        {/* Legend */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "0 4px", marginBottom: 8 }}>
          {entryCurves.map(({ entry, colour }) => (
            <LegendDot key={entry.id} colour={colour} label={`${entry.insulinName} ${entry.dose}U`} />
          ))}
          {hasGlucose && <LegendDot colour={GLUCOSE_COLOUR} label="Glucose" />}
        </div>

        {activeTab === "individual" ? (
          <G4DensityView entryCurves={entryCurves} enrichedPoints={enrichedPoints}
            totalMinutes={totalMinutes} graphStartMinute={graphStartMinute} xTicks={xTicks} compact={compact} />
        ) : (
          <>
            {/* Danger/Watch window badges */}
            <DangerWindowBadges dangerWindows={dangerWindows} />

            {/* Tab label */}
            {activeTab !== "stacked" && (
              <p style={{ margin: "0 4px 6px", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>
                {activeTab === "basal" ? `Basal insulin — ${basalOnlyCurves.map(c => c.entry.insulinName).filter((v, i, a) => a.indexOf(v) === i).join(" + ")} — 24h activity` : `Bolus insulin — ${bolusOnlyCurves.map(c => c.entry.insulinName).filter((v, i, a) => a.indexOf(v) === i).join(" + ")} — 24h activity`}
              </p>
            )}

            <ResponsiveContainer width="100%" height={chartHeight}>
              <ComposedChart data={enrichedPoints} margin={{ top: 4, right: 8, left: compact ? -12 : 0, bottom: 0 }}>
                <defs>
                  {entryCurves.map(({ entry, stackColour }) => (
                    <linearGradient key={`sgrad_${entry.id}`} id={`sgrad_${entry.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={stackColour} stopOpacity={entry.type === "basal" ? 0.25 : 0.30} />
                      <stop offset="100%" stopColor={stackColour} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} strokeWidth={0.75} vertical={false} />

                {/* Pressure map background bands */}
                {pressureBands.filter((b) => b.pressure !== "light").map((band, i) => (
                  <ReferenceArea key={`pband-${i}`} x1={band.start} x2={band.end}
                    fill={PRESSURE_COLOURS[band.pressure]} fillOpacity={PRESSURE_OPACITY[band.pressure]}
                    stroke={PRESSURE_COLOURS[band.pressure]} strokeOpacity={0.4} strokeDasharray="2 4" strokeWidth={1}
                    ifOverflow="hidden" />
                ))}

                {dayBoundaries.map((m) => (
                  <ReferenceLine key={`day-${m}`} x={m} stroke="var(--text-muted)" strokeDasharray="8 4" strokeOpacity={0.4}
                    label={{ value: `Day ${Math.floor(m / MINUTES_PER_DAY) + 1}`, position: "top", fill: "var(--text-secondary)", fontSize: 11, fontWeight: 500 }} />
                ))}

                {/* Current time marker */}
                <ReferenceLine x={currentMinute} stroke="#F59E0B" strokeWidth={2}
                  label={{ value: "Now", position: "top", fill: "#F59E0B", fontSize: 10, fontWeight: 700 }} />

                {/* Dose markers — filtered by active tab */}
                {doseMarkers
                  .filter((dm) => activeTab === "stacked" || dm.entry.type === activeTab)
                  .map((dm, i) => (
                  <ReferenceLine key={`dose-${i}`} x={dm.min} stroke={dm.colour} strokeDasharray="3 5" strokeOpacity={0.7} strokeWidth={1}
                    label={{
                      value: `${dm.entry.time} — ${dm.entry.dose}U ${getAbbrev(dm.entry.insulinName)}`,
                      position: "top",
                      fill: dm.colour,
                      fontSize: 9,
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      offset: 8 + dm.offset * 20,
                    }} />
                ))}

                <XAxis dataKey="minute" type="number" domain={[graphStartMinute, totalMinutes]} ticks={xTicks} tickFormatter={minutesToLabel}
                  tick={{ fontSize: 11, fill: "var(--text-secondary)", fontWeight: 400, fontFamily: "'DM Sans', sans-serif" }}
                  axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
                <YAxis yAxisId="iob"
                  tick={{ fontSize: 11, fill: "var(--text-secondary)", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}
                  tickFormatter={(v: number) => `${v.toFixed(1)}`}
                  axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }}
                  label={{ value: activeTab === "basal" ? "Basal activity (U)" : activeTab === "bolus" ? "Bolus activity (U)" : "IOB (Units)", angle: -90, position: "insideLeft", offset: 16, style: { fontSize: 10, fill: "var(--text-secondary)", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" } }} />
                {hasGlucose && activeTab === "stacked" && (
                  <YAxis yAxisId="glucose" orientation="right"
                    tick={{ fontSize: 11, fill: GLUCOSE_COLOUR, fontFamily: "'DM Sans', sans-serif" }}
                    tickFormatter={(v: number) => `${v.toFixed(1)}`}
                    axisLine={{ stroke: GLUCOSE_COLOUR, strokeOpacity: 0.3 }} tickLine={{ stroke: GLUCOSE_COLOUR, strokeOpacity: 0.3 }}
                    label={{ value: `Glucose (${profile.glucoseUnit})`, angle: 90, position: "insideRight", offset: 16, style: { fontSize: 10, fill: GLUCOSE_COLOUR } }} />
                )}

                <Tooltip content={tooltipContent} />

                {/* Stacked area layers — filtered by tab */}
                {(activeTab === "stacked" ? entryCurves : activeTab === "basal" ? basalOnlyCurves : bolusOnlyCurves).map(({ entry, stackColour }) => (
                  <Area key={entry.id} yAxisId="iob" type="monotone" dataKey={entry.id}
                    stackId="insulin"
                    stroke={stackColour} strokeWidth={0.5} strokeOpacity={0.4}
                    fill={`url(#sgrad_${entry.id})`}
                    animationDuration={prefersReduced ? 0 : 800} dot={false}
                    name={`${entry.insulinName} ${entry.dose}U`} />
                ))}

                {/* Combined IOB outline */}
                <Line yAxisId="iob" type="monotone" dataKey="totalIOB"
                  stroke="#1A2A5E" strokeWidth={2.5}
                  dot={false} animationDuration={prefersReduced ? 0 : 800}
                  name="Combined IOB" />

                {/* Green what-if overlay — original curve shown when in what-if mode (Rule 12) */}
                {isModified && activeTab === "stacked" && (
                  <Line yAxisId="iob" type="monotone"
                    data={originalPoints.map((p) => ({ minute: p.minute, originalIOB: p.totalIOB }))}
                    dataKey="originalIOB"
                    stroke="#2E9E5A" strokeWidth={2.5} strokeDasharray="8 4"
                    dot={false} animationDuration={0}
                    name="Original (before what-if)" />
                )}

                {hasGlucose && activeTab === "stacked" && (
                  <Line yAxisId="glucose" type="monotone" dataKey="glucose"
                    stroke={GLUCOSE_COLOUR} strokeWidth={2} dot={false} connectNulls
                    animationDuration={prefersReduced ? 0 : 800} name="Glucose"
                    activeDot={{ r: 3, stroke: GLUCOSE_COLOUR, strokeWidth: 2, fill: "var(--bg-card)" }} />
                )}
              </ComposedChart>
            </ResponsiveContainer>

            {/* Pressure legend */}
            <PressureLegend />
          </>
        )}

        {showDensityBar && (
          <div style={{ marginTop: 8 }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <IOBDensityBar points={rawPoints.map((p: any) => ({ minute: p.minute, pressure: p.pressure }))} totalMinutes={totalMinutes} />
          </div>
        )}

        {/* ─── Summary stats (matches reference design) ──────────── */}
        <SummaryStats
          peakIOB={peakIOB}
          peakTime={minutesToTime(peakPoint?.minute || 0)}
          lowestIOB={lowestIOB}
          lowestTime={minutesToTime(lowestPoint?.minute || 0)}
          strongOverlapHours={strongOverlapHours}
          totalBasal={totalBasalDose}
          totalBolus={totalBolusDose}
        />
      </div>

      {showInsight && (
        <div style={{ marginTop: 12 }}>
          <SixtySecondInsight view={view} content={insight} pressureClass={worstPressure} />
        </div>
      )}

      {showWhatIf && (
        <div style={{ marginTop: 12 }}>
          <WhatIfTiming
            basalEntries={whatIfBasal}
            bolusEntries={whatIfBolus}
            onTimingChange={handleTimingChange}
            onDoseChange={handleDoseChange}
            onReset={handleReset}
            isModified={isModified}
            tier={tier}
          />
        </div>
      )}
    </div>
  );
}
