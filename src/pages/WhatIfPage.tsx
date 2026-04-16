/**
 * GluMira™ V7 — What-If Scenario Engine
 *
 * Primary: "What if I switch from Levemir to Tresiba?" — side-by-side
 * activity-rate charts (BasalActivityChart) with full PK comparison cards.
 *
 * Secondary: generic IOB scenario builder (Chart.js, kept below).
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Chart,
  CategoryScale,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip as ChartTooltip,
  type ChartConfiguration,
} from "chart.js";
import { calculateIOB } from "@/iob-hunter/engine/iob-engine";
import {
  INSULIN_PROFILES,
} from "@/iob-hunter/engine/insulin-profiles";
import {
  generatePerDoseActivityCurves,
  computeGraphBounds,
} from "@/iob-hunter";
import type { InsulinDose } from "@/iob-hunter/types";
import BasalActivityChart from "@/iob-hunter/components/BasalActivityChart";

Chart.register(
  CategoryScale,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ChartTooltip,
);

/* ─── Demo regimens ──────────────────────────────────────────────────────── */

/** Levemir BID — 10U × 2 per day (80 kg adult, 0.25 U/kg per injection).
 *  Plank 2005 Table 1: 0.4 U/kg total → DOA ≈ 20h per dose. */
const LEVEMIR_DOSES: InsulinDose[] = [
  { id: "lev-am", insulin_name: "Levemir", dose_units: 10, administered_at: "06:00", dose_type: "basal_injection" },
  { id: "lev-pm", insulin_name: "Levemir", dose_units: 10, administered_at: "18:00", dose_type: "basal_injection" },
];

/** Tresiba OD — 20U once daily (same total daily dose for fair comparison).
 *  Heise 2012: 42h DOA, 3-day steady-state. */
const TRESIBA_DOSES: InsulinDose[] = [
  { id: "tres-od", insulin_name: "Tresiba", dose_units: 20, administered_at: "06:00", dose_type: "basal_injection" },
];

const PATIENT_WEIGHT = 80; // kg — demo

/* ─── Colour / legend helpers ────────────────────────────────────────────── */

const COLOUR = {
  light:    "#D4C960",
  moderate: "#FFD700",
  strong:   "#FF8C00",
  overlap:  "#E84040",
  basal:    "#5B8FD4",
  whatIf:   "#2E9E5A",
  gridLine: "rgba(148,163,184,0.15)",
  axis:     "#94A3B8",
} as const;

function segmentColourForValue(value: number, max: number): string {
  if (max <= 0) return COLOUR.light;
  const ratio = value / max;
  if (ratio >= 0.75) return COLOUR.overlap;
  if (ratio >= 0.5)  return COLOUR.strong;
  if (ratio >= 0.25) return COLOUR.moderate;
  return COLOUR.light;
}

function formatHour(h: number): string {
  const hr = Math.floor(h % 24);
  const mn = Math.round((h % 1) * 60);
  return `${String(hr).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
}

/* ─── Generic What-If engine state ───────────────────────────────────────── */

type EditableDose = {
  id: string;
  brandName: string;
  dose: number | null;
  hour: number;
  type: "basal" | "bolus";
}

const DEFAULT_DOSES: EditableDose[] = [
  { id: "b0", brandName: "Tresiba",    dose: 12,  hour: 18.5, type: "basal" },
  { id: "r0", brandName: "Fiasp",      dose: 3,   hour: 7,    type: "bolus" },
  { id: "r1", brandName: "Fiasp",      dose: 2.5, hour: 12.5, type: "bolus" },
  { id: "r2", brandName: "NovoRapid",  dose: 3.5, hour: 18,   type: "bolus" },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function WhatIfPage() {

  /* ── Levemir vs Tresiba activity curves ─────────────────────────────── */

  const levemirBounds = useMemo(
    () => computeGraphBounds(LEVEMIR_DOSES, INSULIN_PROFILES, PATIENT_WEIGHT),
    [],
  );
  const tresibaBounds = useMemo(
    () => computeGraphBounds(TRESIBA_DOSES, INSULIN_PROFILES, PATIENT_WEIGHT),
    [],
  );

  const levemirCurves = useMemo(() =>
    generatePerDoseActivityCurves(
      LEVEMIR_DOSES, INSULIN_PROFILES,
      levemirBounds.startHour, levemirBounds.endHour,
      15, levemirBounds.cycles, PATIENT_WEIGHT,
    ),
  [levemirBounds]);

  const tresibaCurves = useMemo(() =>
    generatePerDoseActivityCurves(
      TRESIBA_DOSES, INSULIN_PROFILES,
      tresibaBounds.startHour, tresibaBounds.endHour,
      15, tresibaBounds.cycles, PATIENT_WEIGHT,
    ),
  [tresibaBounds]);

  /* ── Generic IOB engine ──────────────────────────────────────────────── */

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const [doses, setDoses] = useState<EditableDose[]>(DEFAULT_DOSES);

  const chartData = useMemo(() => {
    const points: { hour: number; basal: number; bolus: number; combined: number }[] = [];

    for (let min = 0; min <= 24 * 60; min += 15) {
      const hour = min / 60;
      let basal = 0;
      let bolus = 0;

      for (const d of doses) {
        if (!d.dose || d.dose <= 0) continue;
        const profile = INSULIN_PROFILES.find(
          (p) => p.brand_name.toLowerCase() === d.brandName.toLowerCase(),
        );
        if (!profile) continue;
        const elapsedHours = hour - d.hour;
        if (elapsedHours < -0.5) continue;
        const elapsedMinutes = elapsedHours * 60;
        if (elapsedMinutes < 0) continue;

        const iob = calculateIOB(d.dose, profile, elapsedMinutes, PATIENT_WEIGHT);
        if (d.type === "basal") basal += iob;
        else bolus += iob;
      }

      points.push({
        hour,
        basal:    Math.max(0, Math.round(basal    * 100) / 100),
        bolus:    Math.max(0, Math.round(bolus    * 100) / 100),
        combined: Math.max(0, Math.round((basal + bolus) * 100) / 100),
      });
    }
    return points;
  }, [doses]);

  useEffect(() => {
    if (!chartRef.current) return;
    const maxIOB = Math.max(...chartData.map((p) => p.combined), 5);
    const colors = chartData.map((p) => segmentColourForValue(p.combined, maxIOB));

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: chartData.map((p) => formatHour(p.hour)),
        datasets: [
          {
            label: "Basal IOB",
            data: chartData.map((p) => p.basal),
            borderColor: COLOUR.basal,
            backgroundColor: `${COLOUR.basal}20`,
            fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
          },
          {
            label: "Bolus IOB",
            data: chartData.map((p) => p.bolus),
            borderColor: COLOUR.whatIf,
            backgroundColor: `${COLOUR.whatIf}20`,
            fill: false, tension: 0.4, pointRadius: 0, borderWidth: 2,
          },
          {
            label: "Combined IOB",
            data: chartData.map((p) => p.combined),
            borderColor: COLOUR.overlap,
            backgroundColor: colors.map((c, i) => i === 0 ? "transparent" : c),
            borderWidth: 3, fill: false, tension: 0.4, pointRadius: 0,
            segment: { borderColor: (ctx) => colors[ctx.p0DataIndex] ?? COLOUR.overlap },
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: "top", labels: { font: { size: 12 }, padding: 15 } },
          tooltip: {
            enabled: true, backgroundColor: "rgba(0,0,0,0.8)",
            callbacks: { label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(2)}U` },
          },
        },
        scales: {
          x: { type: "category", grid: { color: COLOUR.gridLine }, ticks: { font: { size: 10 }, color: COLOUR.axis } },
          y: {
            min: 0, max: maxIOB,
            grid: { color: COLOUR.gridLine }, ticks: { font: { size: 10 }, color: COLOUR.axis },
            title: { display: true, text: "IOB (Units)", font: { size: 12 } },
          },
        },
      },
    };

    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new Chart(chartRef.current, config);
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [chartData]);

  const updateDose = (id: string, field: keyof EditableDose, value: string | number | null) =>
    setDoses((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));

  const addDose = () =>
    setDoses((prev) => [...prev, { id: `new${Date.now()}`, brandName: "Fiasp", dose: 4, hour: 12, type: "bolus" }]);

  const removeDose = (id: string) =>
    setDoses((prev) => prev.filter((d) => d.id !== id));

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Education banner */}
      <div className="bg-[#1A2A5E] text-white text-center text-xs px-4 py-3 font-medium tracking-wide">
        PHARMACOLOGICAL EDUCATION — Educational platform, not a medical device. Always consult your care team.
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

        {/* ── Section 1: Levemir → Tresiba comparison ─────────────────── */}
        <div>
          <h1 className="font-bold text-[#1A2A5E] text-2xl md:text-3xl leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            What if I switch from Levemir to Tresiba?
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">
            Same total daily dose — 20U. Levemir split BID (2 × 10U). Tresiba once daily. Real pharmacokinetic engine. 80 kg adult.
          </p>
        </div>

        {/* Two basal charts side by side */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Levemir chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3">
              <p className="text-xs uppercase tracking-wider text-[#5B8FD4] font-semibold">Current regimen</p>
              <h2 className="mt-0.5 font-bold text-[#1A2A5E] text-lg"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Levemir (Detemir)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                BID · Albumin-bound · 20h at 0.4 U/kg · Plank 2005 PMID:15855574
              </p>
            </div>
            <BasalActivityChart
              curves={levemirCurves}
              startHour={levemirBounds.startHour}
              endHour={levemirBounds.endHour}
              height={280}
            />
          </div>

          {/* Tresiba chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3">
              <p className="text-xs uppercase tracking-wider text-[#1976D2] font-semibold">Alternative</p>
              <h2 className="mt-0.5 font-bold text-[#1A2A5E] text-lg"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Tresiba (Degludec)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                OD · Depot-release · 42h · CV 20% · Heise 2012 PMID:22642570
              </p>
            </div>
            <BasalActivityChart
              curves={tresibaCurves}
              startHour={tresibaBounds.startHour}
              endHour={tresibaBounds.endHour}
              height={280}
            />
          </div>
        </div>

        {/* ── Comparison cards ─────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* PK data */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-[#2AB5C1] font-semibold mb-3">PK Anchor</p>
            <table className="w-full text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-1 font-semibold text-slate-500 w-24"></th>
                  <th className="text-center py-1 font-semibold text-[#5B8FD4]">Levemir</th>
                  <th className="text-center py-1 font-semibold text-[#1976D2]">Tresiba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  ["Onset",    "2h",         "1h"],
                  ["Peak",     "None",        "None"],
                  ["DOA",      "12–20h*",     "42h+"],
                  ["CV",       "28%",         "20%"],
                  ["Cadence",  "BID",         "OD"],
                  ["SS days",  "1",           "3"],
                ].map(([label, lev, tres]) => (
                  <tr key={label}>
                    <td className="py-1.5 text-slate-500 font-medium">{label}</td>
                    <td className="py-1.5 text-center font-mono">{lev}</td>
                    <td className="py-1.5 text-center font-mono">{tres}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[10px] text-slate-400">* Dose-dependent (Plank 2005)</p>
          </div>

          {/* Mechanism */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-[#2AB5C1] font-semibold mb-3">Mechanism</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#5B8FD4] mb-1">Levemir</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  C14 fatty acid at LysB29 → 98% albumin-bound. Dihexamers slow depot release (T₅₀ 10.2h). DOA is <em>dose-dependent</em> — higher dose, longer coverage.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1976D2] mb-1">Tresiba</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Multi-hexamer chains at injection site. Zinc diffuses from chain ends → steady monomer release for 42+ hours. True flat depot — <em>never peaks</em>.
                </p>
              </div>
            </div>
          </div>

          {/* Transition */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-[#2AB5C1] font-semibold mb-3">Transition</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex gap-2">
                <span className="text-amber-500 mt-0.5">⚠</span>
                <span>Tresiba takes <strong>3 days</strong> to reach steady state — expect variability in week 1.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>Start at <strong>80% of total daily Levemir dose</strong> — Tresiba is more potent per unit.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>Switch at the <strong>morning injection</strong> — drop the evening dose entirely.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Check fasting glucose daily for 2 weeks. Titrate by 2U every 3 days.</span>
              </li>
            </ul>
            <p className="mt-3 text-[10px] text-slate-400">Always review with your prescriber before switching.</p>
          </div>

          {/* Flexibility */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-[#2AB5C1] font-semibold mb-3">Flexibility</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#5B8FD4] mb-1">Levemir</p>
                <ul className="space-y-1 text-xs text-slate-600">
                  <li>BID window: if gap &gt;14h, coverage drops</li>
                  <li>Dose-dep. DOA allows fine-tuning per body weight</li>
                  <li>Easier to reduce individual injection if hypo pattern</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1976D2] mb-1">Tresiba</p>
                <ul className="space-y-1 text-xs text-slate-600">
                  <li>Timing can vary ±8h without coverage gap</li>
                  <li>Better for shift workers, irregular schedules</li>
                  <li>Lower within-subject variability (CV 20% vs 28%)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <p className="text-xs text-amber-800 font-medium">
            GluMira™ is an educational platform and does not constitute medical advice. Always consult your healthcare team before making changes to your diabetes management. PK data: Plank 2005 PMID:15855574 · Heise 2012 PMID:22642570 · FDA NDA 203314.
          </p>
        </div>

        {/* ── Section 2: Generic IOB scenario engine ───────────────────── */}
        <div className="pt-4 border-t border-slate-200">
          <h2 className="font-bold text-[#1A2A5E] text-xl"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Custom What-If Scenario
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add any insulin combination and see real IOB curves. Adjust dose and timing.
          </p>
        </div>

        {/* Editable doses */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Insulin Doses</p>
            <button type="button" onClick={addDose}
              className="text-xs bg-[#2AB5C1] text-white px-3 py-1 rounded-lg hover:bg-[#229eaa]">
              + Add Dose
            </button>
          </div>
          {doses.map((d) => (
            <div key={d.id} className="flex items-center gap-3 flex-wrap">
              <select
                value={d.brandName}
                onChange={(e) => updateDose(d.id, "brandName", e.target.value)}
                className="rounded border border-slate-200 px-2 py-1.5 text-xs text-[#1A2A5E] bg-white min-w-[160px]"
              >
                {INSULIN_PROFILES.map((p) => (
                  <option key={p.brand_name} value={p.brand_name}>{p.brand_name}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={d.dose ?? ""}
                  onChange={(e) => updateDose(d.id, "dose", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.00"
                  max={100}
                  step={0.25}
                  className="w-16 rounded border border-slate-200 px-2 py-1.5 text-xs text-[#1A2A5E] text-center"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                <span className="text-[10px] text-slate-500">U</span>
              </div>
              <select
                value={d.type}
                onChange={(e) => updateDose(d.id, "type", e.target.value)}
                className="rounded border border-slate-200 px-2 py-1.5 text-xs text-[#1A2A5E] bg-white"
              >
                <option value="basal">Basal</option>
                <option value="bolus">Bolus</option>
              </select>
              <input
                type="time"
                value={formatHour(d.hour)}
                onChange={(e) => {
                  const [hStr, mStr] = e.target.value.split(":");
                  const h = parseInt(hStr) || 0;
                  const m = parseInt(mStr) || 0;
                  updateDose(d.id, "hour", h + m / 60);
                }}
                className="rounded border border-slate-200 px-2 py-1.5 text-xs text-[#1A2A5E]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              <button type="button" onClick={() => removeDose(d.id)}
                className="text-[#ef4444] text-xs hover:underline">
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Chart.js IOB canvas */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-[#1A2A5E] mb-4">IOB Curve (Pharmacokinetic Engine)</h3>
          <div style={{ position: "relative", height: 360 }}>
            <canvas ref={chartRef} />
          </div>
        </div>

        {/* IOB legend */}
        <div className="rounded-xl border border-slate-200 bg-[#f0fdf4] p-4">
          <p className="text-xs text-[#1b5e20] font-medium mb-2">ℹ Colour Legend</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[#1b5e20]">
            <div><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLOUR.light }} />Light IOB (&lt;25%)</div>
            <div><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLOUR.moderate }} />Moderate (25–50%)</div>
            <div><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLOUR.strong }} />Strong (50–75%)</div>
            <div><span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLOUR.overlap }} />Overlap (&gt;75%)</div>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center pb-4">
          Educational tool only. Consult your care team before making changes to your regimen.
        </p>
      </div>
    </div>
  );
}
