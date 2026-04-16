/**
 * GluMira™ V7 — What-If IOB Chart
 *
 * Stacked basal + bolus IOB chart using the canonical calculateIOB engine.
 * Includes a pressure-map gradient bar and time scrubber.
 *
 * Gold standard rules enforced:
 *   Rule 9  — navy (#1A2A5E) basal layer, teal (#2AB5C1) bolus layer
 *   Rule 17 — prior-day residual: same doses assumed 24h earlier so the
 *              graph never starts at 0 IOB at the left edge
 *   4h x-ticks at 15-min resolution (every 16th label)
 *   DM Sans font throughout
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useMemo, useRef, useEffect } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js';
import { INSULIN_PROFILES, calculateIOB } from '@/iob-hunter';

Chart.register(CategoryScale, LinearScale, LineController, LineElement, PointElement, Filler, Tooltip);

/* ─── Constants ──────────────────────────────────────────────────────────── */

const COLOUR = {
  basal:    '#1A2A5E',  // Rule 9: navy base layer
  bolus:    '#2AB5C1',  // Rule 9: teal bolus layer
  gridLine: 'rgba(148,163,184,0.15)',
  axis:     '#94A3B8',
} as const;

const DM_SANS = "'DM Sans', sans-serif";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface WhatIfIOBChartProps {
  basalInsulin: { insulin: string; dose: number; times: string[] };
  bolusInsulins: Array<{ insulin: string; dose: number; hour: number }>;
  timeRangeMinutes: number;
  currentTimeMinutes: number;
  onTimeChange: (minutes: number) => void;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function WhatIfIOBChart({
  basalInsulin,
  bolusInsulins,
  timeRangeMinutes,
  currentTimeMinutes,
  onTimeChange,
}: WhatIfIOBChartProps) {

  /* ── IOB calculation ───────────────────────────────────────────────── */
  const chartData = useMemo(() => {
    const labels: string[] = [];
    const basalIOB: number[] = [];
    const bolusIOB: number[] = [];
    const pressureData: number[] = [];

    // Peak total IOB is the sum of all doses (at t=0 of each injection).
    const peakIOB =
      basalInsulin.dose * basalInsulin.times.length +
      bolusInsulins.reduce((sum, b) => sum + b.dose, 0);

    for (let minutes = 0; minutes <= timeRangeMinutes; minutes += 15) {
      labels.push(formatMinutes(minutes));

      const currentHour = minutes / 60;
      let basal = 0;
      let bolus = 0;

      // ── Basal contributions ───────────────────────────────────────────
      const basalProfile = INSULIN_PROFILES.find(
        (p) => p.brand_name.toLowerCase() === basalInsulin.insulin.toLowerCase(),
      );
      if (basalProfile) {
        for (const timeStr of basalInsulin.times) {
          const [hPart, mPart] = timeStr.split(':').map(Number);
          const injectionHour = hPart + (mPart ?? 0) / 60;

          // Current-day dose
          const elapsed = currentHour - injectionHour;
          if (elapsed >= 0) {
            basal += calculateIOB(basalInsulin.dose, basalProfile, elapsed * 60);
          }

          // Rule 17: prior-day residual — same dose 24h earlier
          const priorElapsed = currentHour - injectionHour + 24;
          if (priorElapsed >= 0) {
            basal += calculateIOB(basalInsulin.dose, basalProfile, priorElapsed * 60);
          }
        }
      }

      // ── Bolus contributions ───────────────────────────────────────────
      for (const b of bolusInsulins) {
        const bolusProfile = INSULIN_PROFILES.find(
          (p) => p.brand_name.toLowerCase() === b.insulin.toLowerCase(),
        );
        if (!bolusProfile) continue;

        const doaMinutes = bolusProfile.duration_minutes;

        // Current-day dose
        const elapsed = currentHour - b.hour;
        if (elapsed >= 0 && elapsed * 60 <= doaMinutes) {
          bolus += calculateIOB(b.dose, bolusProfile, elapsed * 60);
        }

        // Rule 17: prior-day residual
        const priorElapsed = currentHour - b.hour + 24;
        if (priorElapsed >= 0 && priorElapsed * 60 <= doaMinutes) {
          bolus += calculateIOB(b.dose, bolusProfile, priorElapsed * 60);
        }
      }

      basalIOB.push(Math.max(0, basal));
      bolusIOB.push(Math.max(0, bolus));

      const ratio = peakIOB > 0 ? (basal + bolus) / peakIOB : 0;
      pressureData.push(Math.min(1, Math.max(0, ratio)));
    }

    return { labels, basalIOB, bolusIOB, pressureData };
  }, [basalInsulin, bolusInsulins, timeRangeMinutes]);

  /* ── Chart.js canvas ───────────────────────────────────────────────── */
  const chartRef  = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const maxIOB = Math.max(...chartData.basalIOB.map((b, i) => b + chartData.bolusIOB[i]), 5);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Basal IOB',
            data: chartData.basalIOB,
            borderColor: COLOUR.basal,
            backgroundColor: `${COLOUR.basal}33`,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: 'Bolus IOB',
            data: chartData.bolusIOB,
            borderColor: COLOUR.bolus,
            backgroundColor: `${COLOUR.bolus}33`,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
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
            labels: {
              font: { family: DM_SANS, size: 12 },
              padding: 16,
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0,0,0,0.8)',
            bodyFont:  { family: DM_SANS, size: 12 },
            titleFont: { family: DM_SANS, size: 12 },
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(2)} U`,
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: COLOUR.gridLine },
            ticks: {
              font: { family: DM_SANS, size: 11 },
              color: COLOUR.axis,
              maxRotation: 0,
              // 4h x-ticks: 15-min resolution → every 16th point
              callback: (_val, index) => {
                if (index % 16 !== 0) return null;
                return chartData.labels[index] ?? null;
              },
            },
          },
          y: {
            stacked: true,
            min: 0,
            max: maxIOB,
            grid: { color: COLOUR.gridLine },
            ticks: { font: { family: DM_SANS, size: 11 }, color: COLOUR.axis },
            title: {
              display: true,
              text: 'IOB (U)',
              font: { family: DM_SANS, size: 12 },
              color: COLOUR.axis,
            },
          },
        },
      },
    };

    if (chartInst.current) chartInst.current.destroy();
    chartInst.current = new Chart(chartRef.current, config);
    return () => { chartInst.current?.destroy(); };
  }, [chartData]);

  /* ── Pressure readout ──────────────────────────────────────────────── */
  const currentIndex   = Math.min(Math.round(currentTimeMinutes / 15), chartData.pressureData.length - 1);
  const currentPressure = chartData.pressureData[currentIndex] ?? 0;
  const pressureLabel =
    currentPressure >= 0.75 ? 'Overlap' :
    currentPressure >= 0.5  ? 'Strong'  :
    currentPressure >= 0.25 ? 'Moderate': 'Light';

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-[#1A2A5E] mb-4"
        style={{ fontFamily: "'Playfair Display', serif" }}>
        Total IOB (Units on Board)
      </h3>

      {/* Chart canvas */}
      <div style={{ position: 'relative', height: 300 }}>
        <canvas ref={chartRef} />
      </div>

      {/* Pressure map */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          IOB Pressure Map
        </h4>

        {/* Gradient bar with cursor marker */}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex-1 h-7 rounded-lg overflow-hidden relative"
            style={{ background: 'linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444)' }}>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
              style={{ left: `${(currentTimeMinutes / timeRangeMinutes) * 100}%`, transition: 'left 0.1s' }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-700 min-w-[56px]">{pressureLabel}</span>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-slate-600 mb-4">
          {[
            { colour: '#22c55e', label: 'Light'    },
            { colour: '#eab308', label: 'Moderate' },
            { colour: '#f97316', label: 'Strong'   },
            { colour: '#ef4444', label: 'Overlap'  },
          ].map(({ colour, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: colour }} />
              {label}
            </span>
          ))}
        </div>

        {/* Time scrubber */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={timeRangeMinutes}
            step={15}
            value={currentTimeMinutes}
            onChange={(e) => onTimeChange(parseInt(e.target.value, 10))}
            className="flex-1 accent-[#2AB5C1]"
          />
          <span className="text-sm font-medium text-[#1A2A5E] min-w-[44px]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {formatMinutes(currentTimeMinutes)}
          </span>
          <span className="text-xs text-slate-500">
            {Math.round(currentPressure * 100)}% pressure
          </span>
        </div>
      </div>
    </div>
  );
}
