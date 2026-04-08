/**
 * GluMira™ V7 — What-If Scenario Engine
 * Editable IOB graph for pharmacological education.
 */

import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import { useDemoData } from "../hooks/useDemoData";
import { DISCLAIMER } from "../lib/constants";

interface EditableDose {
  id: string;
  insulin: string;
  dose: number;
  hour: number;
  type: string;
}

const INSULIN_OPTIONS = [
  "Degludec (Tresiba)", "Detemir (Levemir)", "Glargine U100 (Lantus)",
  "Fiasp", "Novorapid", "Humulin R", "Actrapid",
];

function formatHour(h: number): string {
  const hr = Math.floor(h % 24);
  const mn = Math.round((h % 1) * 60);
  return `${String(hr).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
}

function simpleIOB(dose: number, hoursAfter: number, isBasal: boolean): number {
  if (hoursAfter < 0) return 0;
  if (isBasal) {
    const doa = 24;
    if (hoursAfter >= doa) return 0;
    return dose * (1 - hoursAfter / doa);
  }
  const peak = 1.5;
  const doa = 5;
  if (hoursAfter >= doa) return 0;
  if (hoursAfter <= peak) return dose * (hoursAfter / peak);
  return dose * (1 - (hoursAfter - peak) / (doa - peak));
}

const BASAL_NAMES = ["Degludec (Tresiba)", "Detemir (Levemir)", "Glargine U100 (Lantus)"];

export default function WhatIfPage() {
  const { activeCase } = useDemoData();

  const initialDoses: EditableDose[] = [
    ...activeCase.regimen.basal.map((d, i) => {
      const [h, m] = d.time.split(":").map(Number);
      return { id: `b${i}`, insulin: d.insulin, dose: d.dose, hour: h + m / 60, type: d.type };
    }),
    ...activeCase.regimen.bolus.map((d, i) => {
      const [h, m] = d.time.split(":").map(Number);
      return { id: `r${i}`, insulin: d.insulin, dose: d.dose, hour: h + m / 60, type: d.type };
    }),
  ];

  const [doses, setDoses] = useState<EditableDose[]>(initialDoses);

  const chartData = useMemo(() => {
    const points = [];
    for (let min = 0; min <= 24 * 60; min += 15) {
      const hour = min / 60;
      let basal = 0;
      let bolus = 0;
      for (const d of doses) {
        const elapsed = hour - d.hour;
        const isBasal = BASAL_NAMES.includes(d.insulin);
        const iob = simpleIOB(d.dose, elapsed, isBasal);
        if (isBasal) basal += iob; else bolus += iob;
      }
      points.push({ hour, basal: Math.round(basal * 100) / 100, bolus: Math.round(bolus * 100) / 100, combined: Math.round((basal + bolus) * 100) / 100 });
    }
    return points;
  }, [doses]);

  const updateDose = (id: string, field: keyof EditableDose, value: string | number) => {
    setDoses((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));
  };

  const addDose = () => {
    setDoses((prev) => [...prev, { id: `new${Date.now()}`, insulin: "Novorapid", dose: 4, hour: 12, type: "rapid" }]);
  };

  const removeDose = (id: string) => {
    setDoses((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Education banner — permanent, cannot dismiss */}
      <div className="bg-[#1a2a5e] text-white text-center text-xs px-4 py-3 font-medium">
        PHARMACOLOGICAL EDUCATION — This tool shows how insulin pharmacology responds to timing and dose changes. Discuss any changes with your care team before adjusting your regimen.
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <h1 className="text-2xl font-bold text-[#1a2a5e]" style={{ fontFamily: "'Playfair Display', serif" }}>
          What-If Scenario Engine
        </h1>
        <p className="text-sm text-[#718096]">Adjust doses and times below. Watch the IOB curve reshape in real time.</p>

        {/* Editable doses */}
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
                className="rounded border border-[#e2e8f0] px-2 py-1.5 text-xs text-[#1a2a5e] bg-white min-w-[160px]"
              >
                {INSULIN_OPTIONS.map((ins) => <option key={ins} value={ins}>{ins}</option>)}
              </select>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={d.dose}
                  onChange={(e) => updateDose(d.id, "dose", Math.max(0.25, Number(e.target.value)))}
                  step={0.25}
                  min={0.25}
                  max={100}
                  className="w-16 rounded border border-[#e2e8f0] px-2 py-1.5 text-xs text-[#1a2a5e] text-center"
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
                  className="w-24"
                />
                <span className="text-xs text-[#1a2a5e] w-12 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatHour(d.hour)}</span>
              </div>
              <button type="button" onClick={() => removeDose(d.id)} className="text-[#ef4444] text-xs hover:underline">&times; Remove</button>
            </div>
          ))}
        </div>

        {/* Graph */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#1a2a5e] mb-3">Live IOB Curve</h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" type="number" domain={[0, 24]} ticks={Array.from({ length: 13 }, (_, i) => i * 2)} tickFormatter={formatHour} fontSize={10} />
              <YAxis fontSize={11} label={{ value: "IOB (Units)", angle: -90, position: "insideLeft", offset: 0 }} />
              <Tooltip labelFormatter={(h: number) => formatHour(h)} formatter={(v: number, name: string) => [`${v.toFixed(1)}U`, name === "basal" ? "Basal" : name === "bolus" ? "Bolus" : "Combined"]} />
              <Area type="monotone" dataKey="basal" stackId="1" stroke="#2ab5c1" fill="#2ab5c1" fillOpacity={0.3} />
              <Area type="monotone" dataKey="bolus" stackId="1" stroke="#1a2a5e" fill="#1a2a5e" fillOpacity={0.4} />
              {/* Current time */}
              <ReferenceLine x={new Date().getHours() + new Date().getMinutes() / 60} stroke="#f59e0b" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-[#a0aec0] text-center">{DISCLAIMER}</p>
      </div>
    </div>
  );
}
