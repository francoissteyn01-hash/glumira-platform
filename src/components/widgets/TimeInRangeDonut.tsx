/**
 * GluMira™ V7 — Time in Range Donut
 * PieChart: TIR green, TAR amber, TBR red.
 */

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Props {
  readings: { value: number }[];
  targetLow?: number;
  targetHigh?: number;
}

export default function TimeInRangeDonut({ readings, targetLow = 3.9, targetHigh = 10 }: Props) {
  const total = readings.length || 1;
  const tbr = readings.filter((r) => r.value < targetLow).length;
  const tar = readings.filter((r) => r.value > targetHigh).length;
  const tir = total - tbr - tar;

  const data = [
    { name: "In Range", value: tir, colour: "#22c55e" },
    { name: "Above Range", value: tar, colour: "#f59e0b" },
    { name: "Below Range", value: tbr, colour: "#ef4444" },
  ];

  const tirPct = Math.round((tir / total) * 100);

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 16 }}>
      <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>Time in Range</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 100, height: 100, position: "relative" }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={30} outerRadius={45} paddingAngle={2} startAngle={90} endAngle={-270}>
                {data.map((d, i) => <Cell key={i} fill={d.colour} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{tirPct}%</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {data.map((d, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.colour, display: "inline-block" }} />
              {d.name}: {Math.round((d.value / total) * 100)}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
