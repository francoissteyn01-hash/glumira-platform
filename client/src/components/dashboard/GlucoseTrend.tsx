import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ResponsiveContainer,
} from "recharts";
import type { DemoGlucoseReading } from "../../hooks/useDemoData";

function formatHour(h: number): string {
  const hr = Math.floor(h % 24);
  const mn = Math.round((h % 1) * 60);
  return `${String(hr).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
}

interface Props {
  readings: DemoGlucoseReading[];
  units: string;
}

export default function GlucoseTrend({ readings, units }: Props) {
  const isMmol = units === "mmol/L";
  const low = isMmol ? 3.9 : 70;
  const high = isMmol ? 10 : 180;
  const yMax = isMmol ? 16 : 300;

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
      <p className="text-xs text-[#718096] uppercase tracking-wide mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>Glucose Trend (24h)</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={readings} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="hour" type="number" domain={[0, 24]} ticks={[0, 4, 8, 12, 16, 20, 24]} tickFormatter={formatHour} fontSize={10} />
          <YAxis domain={[0, yMax]} fontSize={10} />
          <Tooltip labelFormatter={(h: number) => formatHour(h)} formatter={(v: number) => [`${v} ${units}`, "Glucose"]} />
          <ReferenceArea y1={low} y2={high} fill="#22c55e" fillOpacity={0.08} />
          <ReferenceArea y1={0} y2={low} fill="#ef4444" fillOpacity={0.06} />
          <ReferenceArea y1={high} y2={yMax} fill="#f59e0b" fillOpacity={0.06} />
          <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
