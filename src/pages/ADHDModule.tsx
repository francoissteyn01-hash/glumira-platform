/**
 * GluMira V7 — ADHD + T1D Module
 * Wired to: client/src/lib/adhd-impact.ts
 * Scandinavian Minimalist design — mobile first
 */
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  calculateStimulantOverlap,
  generateAdhdMealPlan,
  simplifyIOBDisplay,
  type OverlapWindow,
  type MealBlock,
} from "@/lib/adhd-impact";

const STIMULANT_OPTIONS = [
  { value: "methylphenidate", label: "Methylphenidate (Ritalin)" },
  { value: "methylphenidate-er", label: "Methylphenidate ER (Concerta)" },
  { value: "amphetamine", label: "Amphetamine (Adderall IR)" },
  { value: "amphetamine-er", label: "Amphetamine ER (Adderall XR)" },
  { value: "lisdexamfetamine", label: "Lisdexamfetamine (Vyvanse)" },
  { value: "atomoxetine", label: "Atomoxetine (Strattera)" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ADHDModule() {
  // --- Profile state ---
  const [stimulantType, setStimulantType] = useState("methylphenidate");
  const [doseHour, setDoseHour] = useState(8);
  const [insulinDoseHour, setInsulinDoseHour] = useState(8);
  const [iobUnits, setIobUnits] = useState(0);

  // --- Quick-log state ---
  const [logFeedback, setLogFeedback] = useState<string | null>(null);

  // --- Computed ---
  const overlapWindows = useMemo(
    () => calculateStimulantOverlap(stimulantType, doseHour, insulinDoseHour, 4),
    [stimulantType, doseHour, insulinDoseHour]
  );

  const mealPlan = useMemo(
    () => generateAdhdMealPlan(stimulantType, doseHour),
    [stimulantType, doseHour]
  );

  const iobStatus = useMemo(() => simplifyIOBDisplay(iobUnits), [iobUnits]);

  // --- Quick log handler ---
  const handleLog = (action: "ate" | "dosed" | "checked") => {
    const labels = { ate: "Meal logged", dosed: "Insulin logged", checked: "BG check logged" };
    setLogFeedback(labels[action]);
    setTimeout(() => setLogFeedback(null), 2000);
  };

  // --- Risk color helper ---
  const riskColor = (risk: string) =>
    risk === "high" ? "bg-red-100 border-red-400 text-red-800"
    : risk === "medium" ? "bg-amber-100 border-amber-400 text-amber-800"
    : "bg-sky-100 border-sky-400 text-sky-800";

  const formatHour = (h: number) => {
    const hr = Math.floor(h) % 24;
    const min = Math.round((h % 1) * 60);
    return `${hr.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A2A5E]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-sm text-[#1A2A5E]/60 hover:text-[#1A2A5E]">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">ADHD + T1D</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* ─── Section 1: My ADHD Profile ─── */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold mb-4">My ADHD Profile</h2>

          <label className="block text-sm font-medium mb-1">Medication</label>
          <select
            value={stimulantType}
            onChange={(e) => setStimulantType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#2AB5C1]"
          >
            {STIMULANT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-1">Dose time</label>
          <select
            value={doseHour}
            onChange={(e) => setDoseHour(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#2AB5C1]"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{`${h.toString().padStart(2, "0")}:00`}</option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-1">Typical bolus time</label>
          <select
            value={insulinDoseHour}
            onChange={(e) => setInsulinDoseHour(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2AB5C1]"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{`${h.toString().padStart(2, "0")}:00`}</option>
            ))}
          </select>
        </section>

        {/* ─── Section 2: Medication-Insulin Overlap ─── */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold mb-4">Medication-Insulin Overlap</h2>

          {/* Visual timeline bar */}
          <div className="relative h-10 rounded-full bg-gray-100 overflow-hidden mb-3">
            {/* Stimulant bar */}
            {(() => {
              const stim = STIMULANT_OPTIONS.find((o) => o.value === stimulantType);
              const profiles: Record<string, { onset: number; duration: number }> = {
                methylphenidate: { onset: 0.5, duration: 4 },
                "methylphenidate-er": { onset: 1, duration: 8 },
                amphetamine: { onset: 0.5, duration: 5 },
                "amphetamine-er": { onset: 1.5, duration: 10 },
                lisdexamfetamine: { onset: 1.5, duration: 12 },
                atomoxetine: { onset: 1, duration: 24 },
              };
              const p = profiles[stimulantType] || profiles.methylphenidate;
              const startPct = ((doseHour + p.onset) / 24) * 100;
              const widthPct = (p.duration / 24) * 100;
              return (
                <div
                  className="absolute top-0 h-5 rounded-full bg-[#2AB5C1]/30 border border-[#2AB5C1]"
                  style={{ left: `${startPct}%`, width: `${Math.min(widthPct, 100 - startPct)}%` }}
                  title="Stimulant active"
                />
              );
            })()}
            {/* Insulin bar */}
            <div
              className="absolute bottom-0 h-5 rounded-full bg-[#1A2A5E]/20 border border-[#1A2A5E]/40"
              style={{ left: `${(insulinDoseHour / 24) * 100}%`, width: `${(4 / 24) * 100}%` }}
              title="Insulin active"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-4">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
          </div>
          <div className="flex gap-4 text-xs mb-4">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-[#2AB5C1]/40 border border-[#2AB5C1]" /> Stimulant</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-[#1A2A5E]/20 border border-[#1A2A5E]/40" /> Insulin</span>
          </div>

          {overlapWindows.length === 0 ? (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">No overlap detected at current times.</p>
          ) : (
            <div className="space-y-2">
              {overlapWindows.map((w, i) => (
                <div key={i} className={`rounded-lg border px-3 py-2 text-sm ${riskColor(w.risk)}`}>
                  <span className="font-semibold uppercase text-xs">{w.risk} risk</span>
                  <span className="mx-2">|</span>
                  <span>{formatHour(w.start)} - {formatHour(w.end)}</span>
                  <p className="mt-1 text-xs">{w.reason}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── Section 3: ADHD Meal Schedule ─── */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold mb-4">ADHD Meal Schedule</h2>
          <div className="space-y-3">
            {mealPlan.map((meal, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl bg-[#F8F9FA] px-4 py-3 border border-gray-100"
              >
                <div className="flex-shrink-0 w-14 text-center">
                  <span className="block text-sm font-semibold">{meal.time}</span>
                  <span className="block text-xs text-gray-400 capitalize">{meal.type}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{meal.note}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{meal.carbs}g carbs suggested</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Section 4: IOB Simplified ─── */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold mb-4">Insulin on Board (simplified)</h2>
          <div className="flex items-center gap-4 mb-3">
            <input
              type="range"
              min={0}
              max={8}
              step={0.1}
              value={iobUnits}
              onChange={(e) => setIobUnits(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-mono w-12 text-right">{iobUnits.toFixed(1)}u</span>
          </div>
          <div
            className="rounded-xl px-4 py-3 text-center text-sm font-medium"
            style={{ backgroundColor: iobStatus.color + "18", color: iobStatus.color, border: `1px solid ${iobStatus.color}40` }}
          >
            <span className="block text-lg font-bold">{iobStatus.level}</span>
            <span>{iobStatus.message}</span>
          </div>
        </section>

        {/* ─── Section 5: Simplified Logger ─── */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold mb-4">Quick Log</h2>
          <p className="text-xs text-gray-400 mb-3">One-tap logging for executive function support</p>
          <div className="grid grid-cols-3 gap-3">
            <button type="button"
              onClick={() => handleLog("ate")}
              className="flex flex-col items-center justify-center gap-1 rounded-xl bg-[#2AB5C1]/10 border border-[#2AB5C1]/30 py-4 min-h-[48px] text-sm font-medium text-[#1A2A5E] hover:bg-[#2AB5C1]/20 active:scale-95 transition-transform"
            >
              <span className="text-2xl">I ate</span>
            </button>
            <button type="button"
              onClick={() => handleLog("dosed")}
              className="flex flex-col items-center justify-center gap-1 rounded-xl bg-[#1A2A5E]/10 border border-[#1A2A5E]/20 py-4 min-h-[48px] text-sm font-medium text-[#1A2A5E] hover:bg-[#1A2A5E]/15 active:scale-95 transition-transform"
            >
              <span className="text-2xl">I dosed</span>
            </button>
            <button type="button"
              onClick={() => handleLog("checked")}
              className="flex flex-col items-center justify-center gap-1 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/30 py-4 min-h-[48px] text-sm font-medium text-[#1A2A5E] hover:bg-[#4CAF50]/20 active:scale-95 transition-transform"
            >
              <span className="text-2xl">I checked</span>
            </button>
          </div>
          {logFeedback && (
            <p className="mt-3 text-center text-sm font-medium text-green-700 bg-green-50 rounded-lg py-2 animate-pulse">
              {logFeedback}
            </p>
          )}
        </section>

        {/* ─── Disclaimer ─── */}
        <footer className="text-xs text-gray-400 text-center pb-8 space-y-1">
          <p>This module provides educational information only and is not medical advice.</p>
          <p>Always consult your endocrinologist and psychiatrist before adjusting insulin or ADHD medication.</p>
          <p>GluMira is not a substitute for professional healthcare.</p>
        </footer>
      </main>
    </div>
  );
}
