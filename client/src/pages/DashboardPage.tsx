/**
 * GluMira™ V7 — client/src/pages/DashboardPage.tsx
 * IOB Activity Dashboard with test profiles and 60-second insight panel.
 */

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../hooks/useAuth";
import { DISCLAIMER } from "../lib/constants";
import { calculateIOB, INSULIN_PHARMACOLOGY } from "../lib/country-insulin-formulary";
import SixtySecondInsight from "../components/SixtySecondInsight";
import UnitToggle from "../components/UnitToggle";

/* ── Test Profile Data ─────────────────────────────────────────────── */

const RILEY_DOSES = [
  // Day 1
  { insulin: "Degludec (Tresiba)", dose: 12, timeHour: 18.5, label: "Tresiba 12U" },
  { insulin: "Fiasp", dose: 3, timeHour: 7, label: "Fiasp 3U" },
  { insulin: "Fiasp", dose: 2.5, timeHour: 12.5, label: "Fiasp 2.5U" },
  { insulin: "Humulin R", dose: 3.5, timeHour: 18, label: "Humulin R 3.5U" },
  // Day 2 (same pattern, offset by 24)
  { insulin: "Degludec (Tresiba)", dose: 12, timeHour: 42.5, label: "Tresiba 12U" },
  { insulin: "Fiasp", dose: 3, timeHour: 31, label: "Fiasp 3U" },
  { insulin: "Fiasp", dose: 2.5, timeHour: 36.5, label: "Fiasp 2.5U" },
  { insulin: "Humulin R", dose: 3.5, timeHour: 42, label: "Humulin R 3.5U" },
  // Prior-cycle Tresiba from day before Day 1 (residual)
  { insulin: "Degludec (Tresiba)", dose: 12, timeHour: -5.5, label: "Prior Tresiba 12U" },
];

const SUBJ002_DOSES = [
  // Day 1
  { insulin: "Detemir (Levemir)", dose: 7, timeHour: 6, label: "Levemir 7U" },
  { insulin: "Detemir (Levemir)", dose: 6.5, timeHour: 13.5, label: "Levemir 6.5U" },
  { insulin: "Detemir (Levemir)", dose: 7.5, timeHour: 20.583, label: "Levemir 7.5U" },
  { insulin: "Fiasp", dose: 1, timeHour: 18, label: "Fiasp 1U" },
  { insulin: "Actrapid", dose: 1.5, timeHour: 18, label: "Actrapid 1.5U" },
  // Day 2
  { insulin: "Detemir (Levemir)", dose: 7, timeHour: 30, label: "Levemir 7U" },
  { insulin: "Detemir (Levemir)", dose: 6.5, timeHour: 37.5, label: "Levemir 6.5U" },
  { insulin: "Detemir (Levemir)", dose: 7.5, timeHour: 44.583, label: "Levemir 7.5U" },
  { insulin: "Fiasp", dose: 1, timeHour: 42, label: "Fiasp 1U" },
  { insulin: "Actrapid", dose: 1.5, timeHour: 42, label: "Actrapid 1.5U" },
  // Prior cycle residuals
  { insulin: "Detemir (Levemir)", dose: 7.5, timeHour: -3.417, label: "Prior Levemir 7.5U" },
  { insulin: "Detemir (Levemir)", dose: 6.5, timeHour: -10.5, label: "Prior Levemir 6.5U" },
];

const PROFILES: Record<string, { name: string; doses: typeof RILEY_DOSES }> = {
  riley: { name: "Riley (SUBJ-001)", doses: RILEY_DOSES },
  subj002: { name: "SUBJ-002 (Levemir 3×)", doses: SUBJ002_DOSES },
};

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatHourTick(hour: number): string {
  const h = Math.floor(hour % 24);
  const m = Math.round((hour % 1) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
      <p className="text-xs text-[#718096] uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#1a2a5e]">{value}</p>
      <p className="text-xs text-[#718096]">{unit}</p>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { user } = useAuth();
  const [profileKey, setProfileKey] = useState<string>("riley");

  const profile = PROFILES[profileKey];
  const doses = profile.doses;

  /* Compute IOB curve data */
  const { chartData, peakTotalIOB } = useMemo(() => {
    // First pass: build raw points to find peak
    const points: {
      hour: number;
      basalIOB: number;
      bolusIOB: number;
      totalIOB: number;
      label: string;
    }[] = [];

    let peak = 0;

    for (let minute = 0; minute <= 48 * 60; minute += 15) {
      const hour = minute / 60;
      let basalIOB = 0;
      let bolusIOB = 0;

      for (const d of doses) {
        const hoursAfterInjection = hour - d.timeHour;
        if (hoursAfterInjection < 0) continue;
        const iob = calculateIOB(d.insulin, hoursAfterInjection) * d.dose;
        const pharm = INSULIN_PHARMACOLOGY[d.insulin];
        if (pharm?.category === "basal") {
          basalIOB += iob;
        } else {
          bolusIOB += iob;
        }
      }

      const totalIOB = basalIOB + bolusIOB;
      if (totalIOB > peak) peak = totalIOB;

      points.push({
        hour,
        basalIOB: Math.round(basalIOB * 100) / 100,
        bolusIOB: Math.round(bolusIOB * 100) / 100,
        totalIOB: Math.round(totalIOB * 100) / 100,
        label: hour < 24 ? "Day 1" : "Day 2",
      });
    }

    // Second pass: mark danger zone
    const dangerThreshold = 0.75 * peak;
    const data = points.map((p) => ({
      ...p,
      dangerIOB: p.totalIOB > dangerThreshold ? p.totalIOB : 0,
    }));

    return { chartData: data, peakTotalIOB: peak };
  }, [doses]);

  /* Current-hour IOB for stat card */
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const currentPoint = chartData.reduce((closest, p) =>
    Math.abs(p.hour - currentHour) < Math.abs(closest.hour - currentHour) ? p : closest,
    chartData[0],
  );

  /* Today's dose count */
  const todayDoseCount = doses.filter((d) => d.timeHour >= 0 && d.timeHour < 24).length;

  /* Dose reference lines (only those within 0–48) */
  const visibleDoses = doses.filter((d) => d.timeHour >= 0 && d.timeHour <= 48);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2a5e]">Dashboard</h1>
            <p className="text-sm text-[#718096]">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={profileKey}
              onChange={(e) => setProfileKey(e.target.value)}
              className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1a2a5e] focus:outline-none focus:ring-2 focus:ring-[#2ab5c1]"
            >
              {Object.entries(PROFILES).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.name}
                </option>
              ))}
            </select>
            <UnitToggle />
          </div>
        </div>

        {/* Medical disclaimer */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-800">{DISCLAIMER}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Latest Glucose" value="—" unit="mmol/L" />
          <StatCard
            label="Active IOB"
            value={currentPoint ? currentPoint.totalIOB.toFixed(2) : "—"}
            unit="U IOB"
          />
          <StatCard
            label="Today's Doses"
            value={String(todayDoseCount)}
            unit="logged"
          />
        </div>

        {/* IOB Activity Chart */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#1a2a5e] mb-4">
            IOB Activity — {profile.name} | 48-Hour Model
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                type="number"
                domain={[0, 48]}
                ticks={Array.from({ length: 25 }, (_, i) => i * 2)}
                tickFormatter={(h: number) => {
                  const timeStr = formatHourTick(h);
                  return h === 0 || h === 24 ? `${timeStr}\n${h < 24 ? "Day 1" : "Day 2"}` : timeStr;
                }}
                fontSize={10}
              />
              <YAxis
                label={{ value: "IOB (Units)", angle: -90, position: "insideLeft", offset: 0 }}
                fontSize={11}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)} U`,
                  name === "basalIOB" ? "Basal IOB"
                    : name === "bolusIOB" ? "Bolus IOB"
                    : name === "dangerIOB" ? "Danger Zone"
                    : "Total IOB",
                ]}
                labelFormatter={(h: number) => `${formatHourTick(h)} (${h < 24 ? "Day 1" : "Day 2"})`}
              />
              <Area
                type="monotone"
                dataKey="basalIOB"
                stackId="1"
                stroke="#2ab5c1"
                fill="#2ab5c1"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="bolusIOB"
                stackId="1"
                stroke="#1a2a5e"
                fill="#1a2a5e"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="dangerIOB"
                stroke="none"
                fill="#ef4444"
                fillOpacity={0.3}
              />
              {visibleDoses.map((d, i) => (
                <ReferenceLine
                  key={`${d.label}-${d.timeHour}-${i}`}
                  x={d.timeHour}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{
                    value: d.label,
                    position: "top",
                    fontSize: 9,
                    fill: "#64748b",
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 60-Second Insight Panel */}
        <SixtySecondInsight />

      </div>
    </div>
  );
}
