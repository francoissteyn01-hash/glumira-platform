/**
 * GluMira™ V7 — What-If Scenario Engine (Real IOB Engine)
 * Interactive IOB graph using real pharmacokinetic calculations.
 * Chart style matches IOBHunterChart (Chart.js with segmented colors).
 *
 * DISCLAIMER: GluMira is an educational tool only, not a medical device.
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
import { INSULIN_PROFILES } from "@/iob-hunter/engine/insulin-profiles";
import type { InsulinProfile } from "@/iob-hunter/types";

Chart.register(
  CategoryScale,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ChartTooltip,
);

interface EditableDose {
  id: string;
  insulinName: string;
  dose: number | null;
  hour: number;
  type: "basal" | "bolus";
}

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

const DEFAULT_DOSES: EditableDose[] = [
  { id: "b0", insulinName: "Degludec (Tresiba)", dose: 12, hour: 18.5, type: "basal" },
  { id: "r0", insulinName: "Fiasp", dose: 3, hour: 7, type: "bolus" },
  { id: "r1", insulinName: "Fiasp", dose: 2.5, hour: 12.5, type: "bolus" },
  { id: "r2", insulinName: "Humulin R", dose: 3.5, hour: 18, type: "bolus" },
];

export default function WhatIfPage() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const [doses, setDoses] = useState<EditableDose[]>(DEFAULT_DOSES);

  // Real IOB calculation using IOB engine
  const chartData = useMemo(() => {
    const points: Array<{ hour: number; basal: number; bolus: number; combined: number }> = [];
    
    for (let min = 0; min <= 24 * 60; min += 15) {
      const hour = min / 60;
      let basal = 0;
      let bolus = 0;

      for (const d of doses) {
        if (!d.dose || d.dose <= 0) continue;

        // Get insulin profile from registry
        const profile = INSULIN_PROFILES.find(p => p.common_name.includes(d.insulinName.split('(')[0].trim()));
        if (!profile) continue;

        // Calculate elapsed time in minutes
        const elapsedHours = hour - d.hour;
        if (elapsedHours < -0.5) continue; // Don't show future doses
        
        const elapsedMinutes = elapsedHours * 60;
        if (elapsedMinutes < 0) continue;

        // Use real IOB engine
        const iob = calculateIOB(d.dose, profile, elapsedMinutes, 70); // 70kg default weight
        
        if (d.type === "basal") {
          basal += iob;
        } else {
          bolus += iob;
        }
      }

      points.push({
        hour,
        basal: Math.max(0, Math.round(basal * 100) / 100),
        bolus: Math.max(0, Math.round(bolus * 100) / 100),
        combined: Math.max(0, Math.round((basal + bolus) * 100) / 100),
      });
    }
    return points;
  }, [doses]);

  // Render Chart.js with segmented colors matching IOBHunterChart
  useEffect(() => {
    if (!chartRef.current) return;

    const maxIOB = Math.max(...chartData.map(p => p.combined), 5);

    const colors = chartData.map(p => segmentColourForValue(p.combined, maxIOB));

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: chartData.map(p => formatHour(p.hour)),
        datasets: [
          {
            label: 'Basal IOB',
            data: chartData.map(p => p.basal),
            borderColor: COLOUR.basal,
            backgroundColor: `${COLOUR.basal}20`,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: 'Bolus IOB',
            data: chartData.map(p => p.bolus),
            borderColor: COLOUR.whatIf,
            backgroundColor: `${COLOUR.whatIf}20`,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: 'Combined IOB',
            data: chartData.map(p => p.combined),
            borderColor: COLOUR.overlap,
            backgroundColor: colors.map((c, i) => i === 0 ? 'transparent' : c),
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            segment: {
              borderColor: (ctx) => colors[ctx.p0DataIndex] ?? COLOUR.overlap,
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { font: { size: 12 }, padding: 15 },
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleFont: { size: 12 },
            bodyFont: { size: 11 },
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed.y ?? 0;
                return `${ctx.dataset.label}: ${value.toFixed(2)}U`;
              },
            },
          },
        },
        scales: {
          x: {
            type: 'category',
            grid: { color: COLOUR.gridLine },
            ticks: { font: { size: 10 }, color: COLOUR.axis },
          },
          y: {
            min: 0,
            max: maxIOB,
            grid: { color: COLOUR.gridLine },
            ticks: { font: { size: 10 }, color: COLOUR.axis },
            title: { display: true, text: 'IOB (Units)', font: { size: 12 } },
          },
        },
      },
    };

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, config);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData]);

  const updateDose = (id: string, field: keyof EditableDose, value: string | number | null) => {
    setDoses((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));
  };

  const addDose = () => {
    setDoses((prev) => [...prev, { 
      id: `new${Date.now()}`, 
      insulinName: "Fiasp", 
      dose: 4, 
      hour: 12, 
      type: "bolus" 
    }]);
  };

  const removeDose = (id: string) => {
    setDoses((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Education banner */}
      <div className="bg-[#1a2a5e] text-white text-center text-xs px-4 py-3 font-medium">
        PHARMACOLOGICAL EDUCATION — Real IOB engine. Timing and dose changes shown in real-time curves. Always consult your care team.
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <h1 className="text-2xl font-bold text-[#1a2a5e]" style={{ fontFamily: "'Playfair Display', serif" }}>
          What-If IOB Scenario Engine
        </h1>
        <p className="text-sm text-[#718096]">Real pharmacokinetic calculations. Adjust doses and times to see how IOB curves respond.</p>

        {/* Editable doses */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#718096] uppercase tracking-wide font-semibold">Insulin Doses</p>
            <button type="button" onClick={addDose} className="text-xs bg-[#2ab5c1] text-white px-3 py-1 rounded-lg hover:bg-[#229eaa]">+ Add Dose</button>
          </div>
          {doses.map((d) => (
            <div key={d.id} className="flex items-center gap-3 flex-wrap">
              <select
                value={d.insulinName}
                onChange={(e) => updateDose(d.id, "insulinName", e.target.value)}
                className="rounded border border-[#e2e8f0] px-2 py-1.5 text-xs text-[#1a2a5e] bg-white min-w-[160px]"
              >
                {INSULIN_PROFILES.map((p: InsulinProfile) => (
                  <option key={p.id} value={p.common_name}>{p.common_name}</option>
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
                  className="w-16 rounded border border-[#e2e8f0] px-2 py-1.5 text-xs text-[#1a2a5e] text-center"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                <span className="text-[10px] text-[#718096]">U</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={formatHour(d.hour).replace(":", "")}
                  onChange={(e) => {
                    const [h, m] = e.target.value.slice(0, 2) + ":" + e.target.value.slice(2);
                    const hNum = parseInt(h);
                    const mNum = parseInt(m);
                    if (!Number.isNaN(hNum) && !Number.isNaN(mNum)) {
                      updateDose(d.id, "hour", hNum + mNum / 60);
                    }
                  }}
                  className="rounded border border-[#e2e8f0] px-2 py-1.5 text-xs text-[#1a2a5e]"
                  style={{ fontFamily: "'JetBrains Mono', monospace", minWidth: 72 }}
                />
                <span className="text-[10px] text-[#718096]">({d.type})</span>
              </div>

              <button
                type="button"
                onClick={() => removeDose(d.id)}
                className="text-[#ef4444] text-xs hover:underline"
              >
                ✕ Remove
              </button>
            </div>
          ))}
        </div>

        {/* Chart.js Canvas - Real IOB Engine */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#1a2a5e] mb-4">Real IOB Curve (Pharmacokinetic Engine)</h2>
          <div style={{ position: 'relative', height: '400px' }}>
            <canvas ref={chartRef} />
          </div>
        </div>

        <div className="rounded-xl border border-[#e2e8f0] bg-[#f0fdf4] p-4">
          <p className="text-xs text-[#1b5e20] font-medium mb-2">ℹ Color Legend</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[#1b5e20]">
            <div><span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLOUR.light }}></span> Light IOB (&lt;25%)</div>
            <div><span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLOUR.moderate }}></span> Moderate (25-50%)</div>
            <div><span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLOUR.strong }}></span> Strong (50-75%)</div>
            <div><span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: COLOUR.overlap }}></span> Overlap (&gt;75%)</div>
          </div>
        </div>

        <p className="text-xs text-[#a0aec0] text-center">Educational tool only. Consult your care team before making changes.</p>
      </div>
    </div>
  );
}
