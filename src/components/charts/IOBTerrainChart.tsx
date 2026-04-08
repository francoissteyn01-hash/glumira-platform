/**
 * GluMira™ V7 — IOB Terrain Chart (Master Chart Component)
 *
 * Renders multi-cycle insulin terrain with:
 * - Individual mountain shapes per insulin with gradient fills
 * - Combined IOB pressure line
 * - Pressure zone colouring (green/amber/orange/red)
 * - Danger window highlighting
 * - Peak labels per mountain
 * - Dose markers at injection times
 * - Clinical/Kids toggle
 * - Density bar
 * - 60-second insight panel
 * - What-if panel (optional)
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
  generateKidsInsight,
  computeEntryCurve,
  type InsulinPharmacology,
  type InsulinEntry,
  type PressureClass,
  type TerrainPoint,
} from "@/lib/pharmacokinetics";

import IOBDensityBar from "@/components/charts/IOBDensityBar";
import ChartViewToggle from "@/components/charts/ChartViewToggle";
import SixtySecondInsight from "@/components/charts/SixtySecondInsight";
import WhatIfTiming from "@/components/charts/WhatIfTiming";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface BasalEntry { insulinName: string; dose: number; time: string; pharmacology: InsulinPharmacology; }
interface BolusEntry { insulinName: string; dose: number; time: string; mealType?: string; pharmacology: InsulinPharmacology; }
interface GlucosePoint { time: string; value: number; unit: "mmol/L" | "mg/dL"; }
interface ProfileInfo { name: string; caregiver?: string; age?: number; sex?: string; country: string; glucoseUnit: "mmol/L" | "mg/dL"; }

export interface IOBTerrainChartProps {
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
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MINUTES_PER_DAY = 1440;

const PRESSURE_COLOURS: Record<PressureClass, string> = {
  light: "#4CAF50", moderate: "#FFC107", strong: "#FF9800", overlap: "#F44336",
};

// Per-insulin colours: cool for basal, warm for bolus
const BASAL_COLOURS = ["#2ab5c1", "#7F77DD", "#378ADD", "#5BA3CF"];
const BOLUS_COLOURS = ["#D85A30", "#D4537E", "#EF9F27", "#E06B55"];
const GLUCOSE_COLOUR = "#f59e0b";

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

function toInsulinEntries(basalEntries: BasalEntry[], bolusEntries: BolusEntry[]): InsulinEntry[] {
  const entries: InsulinEntry[] = [];
  basalEntries.forEach((e, i) => entries.push({ id: `basal_${i}_${e.time}`, insulinName: e.insulinName, dose: e.dose, time: e.time, type: "basal", pharmacology: e.pharmacology }));
  bolusEntries.forEach((e, i) => entries.push({ id: `bolus_${i}_${e.time}`, insulinName: e.insulinName, dose: e.dose, time: e.time, type: "bolus", pharmacology: e.pharmacology, mealType: e.mealType }));
  return entries;
}

interface ChartPoint extends TerrainPoint {
  glucose?: number;
  [key: string]: any;
}

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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function TerrainTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as ChartPoint;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontFamily: "'DM Sans', system-ui, sans-serif", minWidth: 200 }}>
      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 6px", fontWeight: 600 }}>{d.label}</p>
      <div style={{ display: "flex", gap: 16 }}>
        <div>
          <p style={{ fontSize: 9, color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total IOB</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: "2px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>{d.totalIOB.toFixed(2)}U</p>
        </div>
        <div>
          <p style={{ fontSize: 9, color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pressure</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: PRESSURE_COLOURS[d.pressure], margin: "4px 0 0", textTransform: "capitalize" }}>{d.pressure === "overlap" ? "Overlap Risk" : d.pressure}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "var(--text-secondary)" }}>
        <span>Basal: {d.basalIOB.toFixed(2)}U</span>
        <span>Bolus: {d.bolusIOB.toFixed(2)}U</span>
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function IOBTerrainChart({
  profile, basalEntries, bolusEntries, glucoseData,
  cycles = 2, showInsight = true, showDensityBar = true, showWhatIf = false, compact = false, tier = "free",
}: IOBTerrainChartProps) {
  const safeCycles = Math.max(2, cycles);

  // Chart view toggle
  const [view, setView] = useState<"clinical" | "kids">(() => {
    try { return (localStorage.getItem("glumira-chart-view") as any) || "clinical"; } catch { return "clinical"; }
  });
  const handleViewChange = useCallback((v: "clinical" | "kids") => {
    setView(v);
    try { localStorage.setItem("glumira-chart-view", v); } catch {}
  }, []);

  // What-if state
  const [whatIfBasal, setWhatIfBasal] = useState(basalEntries);
  const [whatIfBolus, setWhatIfBolus] = useState(bolusEntries);
  const isModified = JSON.stringify(whatIfBasal) !== JSON.stringify(basalEntries) || JSON.stringify(whatIfBolus) !== JSON.stringify(bolusEntries);
  const activeBasal = isModified ? whatIfBasal : basalEntries;
  const activeBolus = isModified ? whatIfBolus : bolusEntries;

  const entries = useMemo(() => toInsulinEntries(activeBasal, activeBolus), [activeBasal, activeBolus]);
  const { points: rawPoints, peakIOB, dangerWindows, worstPressure } = useMemo(() => buildTerrainTimeline(entries, safeCycles), [entries, safeCycles]);
  const points = useMemo(() => attachGlucose(rawPoints, glucoseData, safeCycles), [rawPoints, glucoseData, safeCycles]);

  // Per-entry curves for individual mountains
  const entryCurves = useMemo(() => {
    const totalMinutes = safeCycles * MINUTES_PER_DAY;
    return entries.map((entry, idx) => ({
      entry, idx,
      colour: entry.type === "basal" ? BASAL_COLOURS[idx % BASAL_COLOURS.length] : BOLUS_COLOURS[idx % BOLUS_COLOURS.length],
      curve: computeEntryCurve(entry, totalMinutes, safeCycles),
    }));
  }, [entries, safeCycles]);

  // Merge individual curves into chart data
  const enrichedPoints = useMemo(() => {
    const lookup = new Map<number, Record<string, number>>();
    for (const { entry, curve } of entryCurves) {
      for (const pt of curve) {
        if (!lookup.has(pt.minute)) lookup.set(pt.minute, {});
        lookup.get(pt.minute)![entry.id] = pt.iob;
      }
    }
    return points.map((pt) => {
      const extra = lookup.get(pt.minute) || {};
      return { ...pt, ...extra };
    });
  }, [points, entryCurves]);

  // Insight content
  const insight = useMemo(() => view === "kids"
    ? generateKidsInsight(entries, dangerWindows, worstPressure, profile.name)
    : generateInsight(entries, dangerWindows, peakIOB, worstPressure),
  [entries, dangerWindows, peakIOB, worstPressure, view, profile.name]);

  const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const chartHeight = compact ? 260 : 340;
  const hasGlucose = points.some((p) => (p as any).glucose !== undefined);
  const totalDoses = entries.length;

  // X-axis ticks
  const totalMinutes = safeCycles * MINUTES_PER_DAY;
  const xTicks: number[] = [];
  for (let m = 0; m <= totalMinutes; m += 180) xTicks.push(m);
  const dayBoundaries: number[] = [];
  for (let d = 1; d < safeCycles; d++) dayBoundaries.push(d * MINUTES_PER_DAY);

  if (totalDoses === 0) {
    return (
      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: 48, textAlign: "center" }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>No doses to visualise</p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Add basal and bolus entries to see the IOB terrain.</p>
      </div>
    );
  }

  // What-if handlers
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
      {/* What-if watermark */}
      {isModified && (
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-15deg)", fontSize: 48, fontWeight: 800, color: "var(--text-primary)", opacity: 0.04, pointerEvents: "none", whiteSpace: "nowrap", zIndex: 1 }}>
            EDUCATIONAL EXPLORATION
          </div>
        </div>
      )}

      {/* Chart card */}
      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: compact ? "12px 12px 4px" : "16px 16px 8px", position: "relative" }}>
        {/* Title row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: compact ? 8 : 14, padding: "0 4px", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: compact ? 14 : 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
              IOB Terrain — {safeCycles}-Cycle View
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>
              {profile.name}{profile.caregiver ? ` (managed by ${profile.caregiver})` : ""} · {activeBasal.length} basal · {activeBolus.length} bolus
              {profile.age ? ` · age ${profile.age}` : ""}
              {isModified && <span style={{ color: "#FFC107", fontWeight: 600 }}> · WHAT-IF MODE</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* View toggle */}
            {<ChartViewToggle view={view} onChange={handleViewChange} />}
            {/* Pressure badge */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: PRESSURE_COLOURS[worstPressure] + "18", fontSize: 11, fontWeight: 600, color: PRESSURE_COLOURS[worstPressure], fontFamily: "'DM Sans', sans-serif", textTransform: "capitalize" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRESSURE_COLOURS[worstPressure] }} />
              {worstPressure === "overlap" ? "Overlap Risk" : worstPressure} · Peak {peakIOB.toFixed(1)}U
            </span>
          </div>
        </div>

        {/* No-stacking banner */}
        {dangerWindows.length === 0 && (
          <div style={{ margin: "0 4px 12px", padding: "8px 14px", borderRadius: 8, background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)", fontSize: 12, fontWeight: 500, color: "#4CAF50", fontFamily: "'DM Sans', sans-serif" }}>
            {view === "kids" ? "Looking good! No waves overlap today." : "No insulin stacking detected — steady coverage"}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "0 4px", marginBottom: 8 }}>
          {entryCurves.map(({ entry, colour }) => (
            <LegendDot key={entry.id} colour={colour} label={`${entry.insulinName} ${entry.dose}U`} />
          ))}
          {hasGlucose && <LegendDot colour={GLUCOSE_COLOUR} label="Glucose" />}
        </div>

        {/* Recharts terrain */}
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={enrichedPoints} margin={{ top: 4, right: 8, left: compact ? -12 : 0, bottom: 0 }}>
            <defs>
              {entryCurves.map(({ entry, colour }) => (
                <linearGradient key={`grad_${entry.id}`} id={`grad_${entry.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colour} stopOpacity={entry.type === "basal" ? 0.5 : 0.45} />
                  <stop offset="100%" stopColor={colour} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} strokeWidth={0.75} vertical={false} />

            {/* Day boundaries */}
            {dayBoundaries.map((m) => (
              <ReferenceLine key={`day-${m}`} x={m} stroke="var(--text-muted)" strokeDasharray="8 4" strokeOpacity={0.4}
                label={{ value: `Day ${Math.floor(m / MINUTES_PER_DAY) + 1}`, position: "top", fill: "var(--text-secondary)", fontSize: 11, fontWeight: 500 }} />
            ))}

            {/* Danger window areas */}
            {dangerWindows.map((w, i) => (
              <ReferenceArea key={`danger-${i}`} x1={w.startMinute} x2={w.endMinute}
                fill={PRESSURE_COLOURS[w.pressure]} fillOpacity={0.08}
                stroke={PRESSURE_COLOURS[w.pressure]} strokeOpacity={0.4} strokeDasharray="4 2"
                label={{ value: view === "kids" ? "Watch here!" : `Danger ${minutesToLabel(w.startMinute)}`, position: "insideTop", fill: PRESSURE_COLOURS[w.pressure], fontSize: 10, fontWeight: 500 }} />
            ))}

            {/* Dose marker lines */}
            {entries.map((entry, idx) => {
              const colour = entry.type === "basal" ? BASAL_COLOURS[idx % BASAL_COLOURS.length] : BOLUS_COLOURS[idx % BOLUS_COLOURS.length];
              const markers: any[] = [];
              for (let c = 0; c < safeCycles; c++) {
                const min = timeToMinutes(entry.time) + c * MINUTES_PER_DAY;
                markers.push(
                  <ReferenceLine key={`dose-${entry.id}-c${c}`} x={min} stroke={colour} strokeDasharray="2 4" strokeOpacity={0.6}
                    label={{ value: `${entry.insulinName} ${entry.dose}U ${entry.time}`, position: "top", fill: colour, fontSize: 9, fontWeight: 500, angle: -90, offset: 10 }} />
                );
              }
              return markers;
            })}

            <XAxis dataKey="minute" type="number" domain={[0, totalMinutes]} ticks={xTicks} tickFormatter={minutesToLabel}
              tick={{ fontSize: 11, fill: "var(--text-secondary)", fontWeight: 400, fontFamily: "'DM Sans', sans-serif" }}
              axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }} />
            <YAxis yAxisId="iob"
              tick={{ fontSize: 11, fill: "var(--text-secondary)", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}
              tickFormatter={(v: number) => `${v.toFixed(1)}`}
              axisLine={{ stroke: "var(--border)" }} tickLine={{ stroke: "var(--border)" }}
              label={{ value: "IOB (Units)", angle: -90, position: "insideLeft", offset: 16, style: { fontSize: 10, fill: "var(--text-secondary)", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" } }} />
            {hasGlucose && (
              <YAxis yAxisId="glucose" orientation="right"
                tick={{ fontSize: 11, fill: GLUCOSE_COLOUR, fontFamily: "'DM Sans', sans-serif" }}
                tickFormatter={(v: number) => `${v.toFixed(1)}`}
                axisLine={{ stroke: GLUCOSE_COLOUR, strokeOpacity: 0.3 }} tickLine={{ stroke: GLUCOSE_COLOUR, strokeOpacity: 0.3 }}
                label={{ value: `Glucose (${profile.glucoseUnit})`, angle: 90, position: "insideRight", offset: 16, style: { fontSize: 10, fill: GLUCOSE_COLOUR } }} />
            )}

            <Tooltip content={<TerrainTooltip />} />

            {/* Individual insulin mountains */}
            {entryCurves.map(({ entry, colour }) => (
              <Area key={entry.id} yAxisId="iob" type="natural" dataKey={entry.id}
                stroke={colour} strokeWidth={2} strokeOpacity={0.9}
                fill={`url(#grad_${entry.id})`}
                animationDuration={prefersReduced ? 0 : 800} dot={false}
                activeDot={{ r: 3, stroke: colour, strokeWidth: 2, fill: "var(--bg-card)" }}
                name={`${entry.insulinName} ${entry.dose}U`} />
            ))}

            {/* Combined IOB line on top */}
            <Line yAxisId="iob" type="natural" dataKey="totalIOB"
              stroke="var(--text-primary)" strokeWidth={2.5}
              dot={false} animationDuration={prefersReduced ? 0 : 800}
              name="Combined IOB" />

            {/* Glucose overlay */}
            {hasGlucose && (
              <Line yAxisId="glucose" type="natural" dataKey="glucose"
                stroke={GLUCOSE_COLOUR} strokeWidth={2} dot={false} connectNulls
                animationDuration={prefersReduced ? 0 : 800} name="Glucose"
                activeDot={{ r: 3, stroke: GLUCOSE_COLOUR, strokeWidth: 2, fill: "var(--bg-card)" }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Density bar */}
        {showDensityBar && (
          <div style={{ marginTop: 8 }}>
            <IOBDensityBar points={rawPoints.map((p: any) => ({ minute: p.minute, pressure: p.pressure }))} totalMinutes={totalMinutes} />
          </div>
        )}
      </div>

      {/* 60-Second Insight */}
      {showInsight && (
        <div style={{ marginTop: 12 }}>
          <SixtySecondInsight view={view} content={insight} pressureClass={worstPressure} />
        </div>
      )}


      {/* What-If Panel */}
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
