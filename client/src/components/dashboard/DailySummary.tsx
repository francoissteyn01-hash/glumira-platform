import type { DemoCase } from "../../hooks/useDemoData";

interface Props {
  data: DemoCase;
}

export default function DailySummary({ data }: Props) {
  const basalTotal = data.regimen.basal.reduce((s, d) => s + d.dose, 0);
  const bolusTotal = data.regimen.bolus.reduce((s, d) => s + d.dose, 0);
  const tdd = basalTotal + bolusTotal;
  const basalPct = tdd > 0 ? Math.round((basalTotal / tdd) * 100) : 0;
  const bolusCount = data.regimen.bolus.length;
  const readings = data.glucoseReadings;
  const avgGlucose = readings.length > 0
    ? (readings.reduce((s, r) => s + r.value, 0) / readings.length).toFixed(1)
    : "\u2014";

  const stat = (label: string, value: string, unit: string) => (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-[#718096] uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-[#1a2a5e] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</p>
      <p className="text-[10px] text-[#a0aec0]">{unit}</p>
    </div>
  );

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
      <p className="text-xs text-[#718096] uppercase tracking-wide mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>Daily Summary</p>
      <div className="flex gap-4 flex-wrap">
        {stat("TDD", tdd.toFixed(1), "units")}
        {stat("Basal:Bolus", `${basalPct}:${100 - basalPct}`, "split")}
        {stat("Bolus Events", String(bolusCount), "today")}
        {stat("Avg Glucose", String(avgGlucose), data.glucoseUnits)}
      </div>
    </div>
  );
}
