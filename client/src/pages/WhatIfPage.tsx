/**
 * GluMira™ V7 — What-If Scenario Engine
 * Real PK/PD pharmacokinetic curves — NO triangles.
 * Uses IOB Hunter™ engine with 3-model calculations.
 */

import { useState, useMemo, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, ReferenceArea,
} from "recharts";
import { useDemoData } from "../hooks/useDemoData";
import { DISCLAIMER } from "../lib/constants";
import {
  type InsulinDose,
  FORMULARY,
  INSULIN_NAMES,
  BASAL_NAMES,
  PRESSURE_COLORS,
} from "../engine/iob-hunter";
import { generateCombinedCurve, generateInterpretation } from "../engine/iob-aggregator";

type ViewMode = "combined" | "basal" | "bolus" | "density";

function formatHour(h: number): string {
  const hr = Math.floor(((h % 24) + 24) % 24);
  const mn = Math.round(((h % 1) + 1) % 1 * 60);
  return `${String(hr).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
}

export default function WhatIfPage() {
  const { activeCase } = useDemoData();
  const [view, setView] = useState<ViewMode>("combined");

  // Initialise doses from active demo case
  const initialDoses: InsulinDose[] = [
    ...activeCase.regimen.basal.map((d, i) => {
      const [h, m] = d.time.split(":").map(Number);
      return { id: `b${i}`, insulin: d.insulin, dose: d.dose, hour: h + m / 60 };
    }),
    ...activeCase.regimen.bolus.map((d, i) => {
      const [h, m] = d.time.split(":").map(Number);
      return { id: `r${i}`, insulin: d.insulin, dose: d.dose, hour: h + m / 60 };
    }),
  ];

  const [doses, setDoses] = useState<InsulinDose[]>(initialDoses);

  // Generate IOB curve from real PK engine
  const curveData = useMemo(() => generateCombinedCurve(doses, 0, 24), [doses]);
  const interpretation = useMemo(() => generateInterpretation(curveData, doses), [curveData, doses]);

  const yMax = useMemo(() => {
    const peak = curveData.reduce((m, p) => Math.max(m, p.totalIOB), 0);
    return Math.ceil(peak * 1.15) || 5;
  }, [curveData]);

  // Chart data with pressure-based danger zones
  const chartData = useMemo(() =>
    curveData.map((p) => ({
      ...p,
      dangerIOB: p.pressure === "overlap" ? p.totalIOB : undefined,
    })),
    [curveData],
  );

  // Current time
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Dose mutations
  const updateDose = useCallback((id: string, field: keyof InsulinDose, value: string | number) => {
    setDoses((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));
  }, []);

  const addDose = useCallback(() => {
    setDoses((prev) => [...prev, {
      id: `new${Date.now()}`,
      insulin: "Aspart (NovoRapid)",
      dose: 4,
      hour: 12,
    }]);
  }, []);

  const removeDose = useCallback((id: string) => {
    setDoses((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const toggleBtn = (mode: ViewMode, label: string) => (
    <button
      type="button"
      key={mode}
      onClick={() => setView(mode)}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        view === mode
          ? "bg-[#1a2a5e] text-white"
          : "bg-white border border-[#e2e8f0] text-[#718096] hover:bg-[#f0f4f8]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Education banner */}
      <div className="bg-[#1a2a5e] text-white text-center text-xs px-4 py-3 font-medium">
        PHARMACOLOGICAL EDUCATION — This tool shows how insulin pharmacology responds to timing and dose changes. Discuss any changes with your care team before adjusting your regimen.
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <h1 className="text-2xl font-bold text-[#1a2a5e]" style={{ fontFamily: "'Playfair Display', serif" }}>
          What-If Scenario Engine
        </h1>
        <p className="text-sm text-[#718096]">Adjust doses and times below. Watch the IOB curve reshape in real time.</p>

        {/* ── Editable Dose Panel ────────────────────────────────── */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#718096] uppercase tracking-wide font-semibold">Doses</p>
            <button type="button" onClick={addDose} className="text-xs bg-[#2ab5c1] text-white px-3 py-1 rounded-lg hover:bg-[#229eaa]">+ Add Dose</button>
          </div>
          {doses.map((d) => (
            <div key={d.id} className="flex items-center gap-3 flex-wrap">
              <select
                value={d.insulin}
                onChange={(e) => updateDose(d.id, "insulin", e.target.value)}
                className="rounded border border-[#e2e8f0] px-2 py-1.5 text-xs text-[#1a2a5e] bg-white min-w-[180px]"
              >
                {INSULIN_NAMES.map((ins) => (
                  <option key={ins} value={ins}>{ins}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  defaultValue={d.dose}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0.25) {
                      updateDose(d.id, "dose", val);
                    } else if (e.target.value === "" || val < 0.25) {
                      updateDose(d.id, "dose", 0.25);
                      e.target.value = "0.25";
                    }
                  }}
                  onChange={(e) => {
                    // Allow free typing — validate on blur only
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      updateDose(d.id, "dose", val);
                    }
                  }}
                  step={0.25}
                  min={0}
                  max={100}
                  placeholder="0.00"
                  className="w-20 rounded border border-[#e2e8f0] px-2 py-1.5 text-xs text-[#1a2a5e] text-center"
                />
                <span className="text-[10px] text-[#718096]">U</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  value={d.hour}
                  onChange={(e) => updateDose(d.id, "hour", Number(e.target.value))}
                  min={0}
                  max={23.75}
                  step={0.25}
                  className="w-28 accent-[#2ab5c1]"
                  style={{ minHeight: "44px" }}
                />
                <span className="text-xs text-[#1a2a5e] w-12 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatHour(d.hour)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeDose(d.id)}
                className="text-[#ef4444] text-xs hover:underline px-2 py-1"
              >
                &times; Remove
              </button>
            </div>
          ))}
          {doses.length === 0 && (
            <p className="text-xs text-[#a0aec0] text-center py-3">No doses. Click "+ Add Dose" above.</p>
          )}
        </div>

        {/* ── View Toggle ─────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap">
          {toggleBtn("combined", "Combined")}
          {toggleBtn("basal", "Basal Only")}
          {toggleBtn("bolus", "Bolus Only")}
          {toggleBtn("density", "Density (All Curves)")}
        </div>

        {/* ── Primary IOB Graph ───────────────────────────────────── */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#1a2a5e] mb-3">
            IOB Hunter™ — Live Pharmacokinetic Curve
          </h2>
          <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 300 : 400}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="hour"
                type="number"
                domain={[0, 24]}
                ticks={Array.from({ length: 13 }, (_, i) => i * 2)}
                tickFormatter={formatHour}
                fontSize={10}
              />
              <YAxis
                domain={[0, yMax]}
                fontSize={11}
                label={{ value: "IOB (Units)", angle: -90, position: "insideLeft", offset: 0 }}
              />
              <Tooltip
                labelFormatter={(h: number) => formatHour(h)}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const pt = payload[0]?.payload;
                  if (!pt) return null;
                  return (
                    <div className="rounded-lg bg-white border border-[#e2e8f0] p-3 shadow-lg text-xs max-w-[220px]">
                      <p className="font-semibold text-[#1a2a5e] mb-1">{formatHour(pt.hour)}</p>
                      <p>Basal: {pt.basalIOB.toFixed(1)}U</p>
                      <p>Bolus: {pt.bolusIOB.toFixed(1)}U</p>
                      <p className="font-semibold">Combined: {pt.totalIOB.toFixed(1)}U</p>
                      <p style={{ color: PRESSURE_COLORS[pt.pressure as keyof typeof PRESSURE_COLORS] }}>
                        Pressure: {pt.pressure.charAt(0).toUpperCase() + pt.pressure.slice(1)}
                      </p>
                      {pt.perInsulin?.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-[#e2e8f0]">
                          {pt.perInsulin.map((pi: { insulin: string; iob: number }) => (
                            <p key={pi.insulin} className="text-[#718096]">
                              {pi.insulin.split("(")[0].trim()}: {pi.iob.toFixed(2)}U
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }}
              />

              {/* Pressure zone shading for danger windows */}
              {interpretation.dangerWindows.map((dw, i) => (
                <ReferenceArea
                  key={`danger-${i}`}
                  x1={dw.start}
                  x2={dw.end}
                  fill="#ef4444"
                  fillOpacity={0.15}
                />
              ))}

              {/* Danger area */}
              <Area type="monotone" dataKey="dangerIOB" stroke="none" fill="#ef4444" fillOpacity={0.15} isAnimationActive={false} />

              {/* Basal curve */}
              {(view === "combined" || view === "basal" || view === "density") && (
                <Area
                  type="monotone"
                  dataKey="basalIOB"
                  stackId={view === "combined" ? "iob" : undefined}
                  stroke="#2ab5c1"
                  fill="#2ab5c1"
                  fillOpacity={0.3}
                  isAnimationActive={false}
                />
              )}

              {/* Bolus curve */}
              {(view === "combined" || view === "bolus" || view === "density") && (
                <Area
                  type="monotone"
                  dataKey="bolusIOB"
                  stackId={view === "combined" ? "iob" : undefined}
                  stroke="#1a2a5e"
                  fill="#1a2a5e"
                  fillOpacity={0.4}
                  isAnimationActive={false}
                />
              )}

              {/* Total line for density view */}
              {view === "density" && (
                <Area
                  type="monotone"
                  dataKey="totalIOB"
                  stroke="#f97316"
                  fill="none"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  isAnimationActive={false}
                />
              )}

              {/* Current time indicator */}
              <ReferenceLine
                x={currentHour}
                stroke="#f59e0b"
                strokeWidth={2}
                label={{ value: "Now", position: "top", fill: "#f59e0b", fontSize: 10 }}
              />

              {/* Dose markers */}
              {doses.map((d) => (
                <ReferenceLine
                  key={d.id}
                  x={d.hour}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: `${formatHour(d.hour)} — ${d.dose}U`,
                    position: "insideTopRight",
                    fill: "#64748b",
                    fontSize: 8,
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── 60-Second Interpretation Panel ───────────────────── */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
          <h3 className="text-sm font-bold text-[#1a2a5e] uppercase tracking-wide mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            60-Second Interpretation
          </h3>
          {interpretation.lines.length > 0 ? (
            <ul className="space-y-2 text-sm text-[#4a5568]">
              {interpretation.lines.map((line, i) => (
                <li
                  key={i}
                  className={`flex gap-2 ${
                    line.includes("Danger") || line.includes("OVERLAP")
                      ? "text-[#ef4444] font-medium"
                      : ""
                  }`}
                >
                  <span className="text-[#2ab5c1] mt-0.5">{"\u2022"}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#a0aec0]">Add doses above to generate interpretation.</p>
          )}
          <p className="text-[10px] text-[#a0aec0] mt-3">{DISCLAIMER}</p>
        </div>

        <p className="text-xs text-[#a0aec0] text-center">{DISCLAIMER}</p>
      </div>
    </div>
  );
}
