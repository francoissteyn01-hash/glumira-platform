import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ReferenceDot, ReferenceArea, ResponsiveContainer,
} from "recharts";
import type { DemoCase } from "../../hooks/useDemoData";
import {
  type InsulinDose,
  FORMULARY,
  PRESSURE_COLORS,
} from "../../engine/iob-hunter";
import { generateCombinedCurve, generateInterpretation } from "../../engine/iob-aggregator";

type ViewMode = "combined" | "basal" | "bolus" | "glucose" | "density";

function formatHour(h: number): string {
  const hr = Math.floor(((h % 24) + 24) % 24);
  const mn = Math.round(((h % 1) + 1) % 1 * 60);
  return `${String(hr).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
}

interface Props {
  data: DemoCase;
}

export default function IOBCombinedGraph({ data }: Props) {
  const [view, setView] = useState<ViewMode>("combined");

  // Convert demo regimen to InsulinDose array and compute via real PK engine
  const doses: InsulinDose[] = useMemo(() => {
    const allDoses = [...data.regimen.basal, ...data.regimen.bolus];
    return allDoses.map((d, i) => {
      const [h, m] = d.time.split(":").map(Number);
      return { id: `d${i}`, insulin: d.insulin, dose: d.dose, hour: h + m / 60 };
    });
  }, [data]);

  // Use real PK engine if all insulins are in the formulary, else fall back to demo data
  const hasAllInsulins = doses.every((d) => FORMULARY[d.insulin]);

  const computedCurve = useMemo(() => {
    if (!hasAllInsulins) return null;
    return generateCombinedCurve(doses, 0, 24);
  }, [doses, hasAllInsulins]);

  const interpretation = useMemo(() => {
    if (!computedCurve) return null;
    return generateInterpretation(computedCurve, doses);
  }, [computedCurve, doses]);

  // Chart data — prefer computed PK curve, fall back to demo timeline
  const chartData = useMemo(() => {
    if (computedCurve) {
      return computedCurve.map((p) => ({
        hour: p.hour,
        basal: p.basalIOB,
        bolus: p.bolusIOB,
        combined: p.totalIOB,
        pressure: p.pressure,
        perInsulin: p.perInsulin,
        dangerIOB: p.pressure === "overlap" ? p.totalIOB : undefined,
      }));
    }
    // Fallback to pre-computed demo timeline
    return data.iobTimeline.map((p) => ({
      ...p,
      perInsulin: [] as { insulin: string; iob: number }[],
      dangerIOB: p.pressure === "overlap" ? p.combined : undefined,
    }));
  }, [computedCurve, data.iobTimeline]);

  const peakIOB = Math.max(...chartData.map((p) => p.combined ?? p.basal + p.bolus));
  const yMax = Math.ceil(peakIOB * 1.15) || 5;

  // Current time marker
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Dose markers from regimen
  const doseMarkers = [...data.regimen.basal, ...data.regimen.bolus].map((d) => {
    const [h, m] = d.time.split(":").map(Number);
    const hour = h + m / 60;
    const point = chartData.reduce((closest, p) =>
      Math.abs(p.hour - hour) < Math.abs(closest.hour - hour) ? p : closest,
      chartData[0],
    );
    return { ...d, hour, iob: point.combined ?? (point.basal + point.bolus) };
  });

  // Danger windows from interpretation
  const dangerWindows = interpretation?.dangerWindows ?? data.dangerWindows ?? [];

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
          IOB Hunter™ — 24-Hour Combined Graph
        </h2>
        <div className="flex gap-2 flex-wrap">
          {toggleBtn("combined", "Combined")}
          {toggleBtn("basal", "Basal Only")}
          {toggleBtn("bolus", "Bolus Only")}
          {toggleBtn("density", "Density")}
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
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const pt = payload[0]?.payload;
                if (!pt) return null;
                return (
                  <div className="rounded-lg bg-white border border-[#e2e8f0] p-3 shadow-lg text-xs max-w-[220px]">
                    <p className="font-semibold text-[#1a2a5e] mb-1">{formatHour(pt.hour)}</p>
                    <p>Basal: {(pt.basal ?? pt.basalIOB ?? 0).toFixed(1)}U</p>
                    <p>Bolus: {(pt.bolus ?? pt.bolusIOB ?? 0).toFixed(1)}U</p>
                    <p className="font-semibold">Combined: {(pt.combined ?? pt.totalIOB ?? 0).toFixed(1)}U</p>
                    <p style={{ color: PRESSURE_COLORS[pt.pressure as keyof typeof PRESSURE_COLORS] }}>
                      Pressure: {pt.pressure?.charAt(0).toUpperCase() + pt.pressure?.slice(1)}
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

            {/* Danger zone shading */}
            {dangerWindows.map((dw: { start: string | number; end: string | number }, i: number) => {
              const startH = typeof dw.start === "string" ? parseInt(dw.start) + parseInt(dw.start.split(":")[1] || "0") / 60 : dw.start;
              const endH = typeof dw.end === "string" ? parseInt(dw.end) + parseInt(dw.end.split(":")[1] || "0") / 60 : dw.end;
              return (
                <ReferenceArea key={`danger-${i}`} x1={startH} x2={endH} fill="#ef4444" fillOpacity={0.12} />
              );
            })}

            <Area type="monotone" dataKey="dangerIOB" stroke="none" fill="#ef4444" fillOpacity={0.15} isAnimationActive={false} />

            {/* Basal */}
            {(view === "combined" || view === "basal" || view === "density") && (
              <Area type="monotone" dataKey="basal" stackId={view === "combined" ? "iob" : undefined} stroke="#2ab5c1" fill="#2ab5c1" fillOpacity={0.3} isAnimationActive={false} />
            )}
            {/* Bolus */}
            {(view === "combined" || view === "bolus" || view === "density") && (
              <Area type="monotone" dataKey="bolus" stackId={view === "combined" ? "iob" : undefined} stroke="#1a2a5e" fill="#1a2a5e" fillOpacity={0.4} isAnimationActive={false} />
            )}
            {/* Total overlay for density */}
            {view === "density" && (
              <Area type="monotone" dataKey="combined" stroke="#f97316" fill="none" strokeWidth={2} strokeDasharray="4 2" isAnimationActive={false} />
            )}

            {/* Current time */}
            <ReferenceLine x={currentHour} stroke="#f59e0b" strokeWidth={2} label={{ value: "Now", position: "top", fill: "#f59e0b", fontSize: 10 }} />

            {/* Dose markers */}
            {doseMarkers.map((d, i) => (
              <ReferenceLine
                key={i}
                x={d.hour}
                stroke="#64748b"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: `${d.insulin.split("(")[0].trim()} ${d.dose}U`,
                  position: "insideTopRight",
                  fill: "#64748b",
                  fontSize: 8,
                }}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
