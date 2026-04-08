import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ReferenceDot, ResponsiveContainer,
} from "recharts";
import type { DemoCase } from "../../hooks/useDemoData";

type ViewMode = "combined" | "basal" | "bolus" | "glucose";

function formatHour(h: number): string {
  const hr = Math.floor(h % 24);
  const mn = Math.round((h % 1) * 60);
  return `${String(hr).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
}

const PRESSURE_COLORS: Record<string, string> = {
  light: "#22c55e",
  moderate: "#f59e0b",
  strong: "#f97316",
  overlap: "#ef4444",
};

interface Props {
  data: DemoCase;
}

export default function IOBCombinedGraph({ data }: Props) {
  const [view, setView] = useState<ViewMode>("combined");

  const timeline = data.iobTimeline;
  const peakIOB = Math.max(...timeline.map((p) => p.combined));
  const yMax = Math.ceil(peakIOB * 1.15);

  const chartData = timeline.map((p) => ({
    ...p,
    dangerIOB: p.pressure === "overlap" ? p.combined : undefined,
  }));

  // Current time marker
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Dose markers from regimen
  const allDoses = [...data.regimen.basal, ...data.regimen.bolus];
  const doseMarkers = allDoses.map((d) => {
    const [h, m] = d.time.split(":").map(Number);
    const hour = h + m / 60;
    const point = timeline.reduce((closest, p) =>
      Math.abs(p.hour - hour) < Math.abs(closest.hour - hour) ? p : closest,
      timeline[0],
    );
    return { ...d, hour, iob: point.combined };
  });

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
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-[#1a2a5e]" style={{ fontFamily: "'Playfair Display', serif" }}>
          IOB Hunter\u2122 \u2014 24-Hour Combined Graph
        </h2>
        <div className="flex gap-2">
          {toggleBtn("combined", "Combined")}
          {toggleBtn("basal", "Basal Only")}
          {toggleBtn("bolus", "Bolus Only")}
          {toggleBtn("glucose", "Glucose")}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 300 : 400}>
        {view === "glucose" ? (
          <AreaChart data={data.glucoseReadings} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="hour" type="number" domain={[0, 24]} ticks={Array.from({ length: 13 }, (_, i) => i * 2)} tickFormatter={formatHour} fontSize={10} />
            <YAxis fontSize={11} label={{ value: data.glucoseUnits, angle: -90, position: "insideLeft", offset: 0 }} />
            <Tooltip labelFormatter={(h: number) => formatHour(h)} formatter={(v: number) => [`${v} ${data.glucoseUnits}`, "Glucose"]} />
            {/* Target range bands */}
            {data.glucoseUnits === "mmol/L" ? (
              <>
                <ReferenceLine y={3.9} stroke="#ef4444" strokeDasharray="4 4" />
                <ReferenceLine y={10} stroke="#f59e0b" strokeDasharray="4 4" />
              </>
            ) : (
              <>
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" />
                <ReferenceLine y={180} stroke="#f59e0b" strokeDasharray="4 4" />
              </>
            )}
            <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} dot={{ fill: "#f59e0b", r: 4 }} />
          </AreaChart>
        ) : (
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="hour" type="number" domain={[0, 24]} ticks={Array.from({ length: 13 }, (_, i) => i * 2)} tickFormatter={formatHour} fontSize={10} />
            <YAxis domain={[0, yMax]} fontSize={11} label={{ value: "IOB (Units)", angle: -90, position: "insideLeft", offset: 0 }} />
            <Tooltip
              labelFormatter={(h: number) => formatHour(h)}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const pt = timeline.find((p) => p.hour === label) || timeline[0];
                return (
                  <div className="rounded-lg bg-white border border-[#e2e8f0] p-3 shadow-lg text-xs">
                    <p className="font-semibold text-[#1a2a5e] mb-1">{formatHour(pt.hour)}</p>
                    <p>Basal: {pt.basal.toFixed(1)}U</p>
                    <p>Bolus: {pt.bolus.toFixed(1)}U</p>
                    <p className="font-semibold">Combined: {pt.combined.toFixed(1)}U</p>
                    <p style={{ color: PRESSURE_COLORS[pt.pressure] }}>
                      Pressure: {pt.pressure.charAt(0).toUpperCase() + pt.pressure.slice(1)}
                    </p>
                  </div>
                );
              }}
            />
            {/* Danger zone shading */}
            <Area type="monotone" dataKey="dangerIOB" stroke="none" fill="#ef4444" fillOpacity={0.15} />
            {/* Basal */}
            {(view === "combined" || view === "basal") && (
              <Area type="monotone" dataKey="basal" stackId="iob" stroke="#2ab5c1" fill="#2ab5c1" fillOpacity={0.3} />
            )}
            {/* Bolus */}
            {(view === "combined" || view === "bolus") && (
              <Area type="monotone" dataKey="bolus" stackId={view === "combined" ? "iob" : undefined} stroke="#1a2a5e" fill="#1a2a5e" fillOpacity={0.4} />
            )}
            {/* Current time */}
            <ReferenceLine x={currentHour} stroke="#f59e0b" strokeWidth={2} label={{ value: "Now", position: "top", fill: "#f59e0b", fontSize: 10 }} />
            {/* Dose markers */}
            {doseMarkers.map((d, i) => (
              <ReferenceDot key={i} x={d.hour} y={d.iob} r={5} fill="#1a2a5e" stroke="white" strokeWidth={2}>
                <text x={0} y={-12} textAnchor="middle" fontSize={8} fill="#64748b">{d.insulin.split("(")[0].trim()} {d.dose}U</text>
              </ReferenceDot>
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
