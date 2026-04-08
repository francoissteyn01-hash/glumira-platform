import type { DemoTimelinePoint } from "../../hooks/useDemoData";

function getPressureColor(pct: number): string {
  if (pct < 25) return "#22c55e";
  if (pct < 50) return "#f59e0b";
  if (pct < 75) return "#f97316";
  return "#ef4444";
}

function getPressureLabel(pct: number): string {
  if (pct < 25) return "Light";
  if (pct < 50) return "Moderate";
  if (pct < 75) return "Strong";
  return "Overlap";
}

interface Props {
  timeline: DemoTimelinePoint[];
}

export default function PressureGauge({ timeline }: Props) {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const closest = timeline.reduce((c, p) =>
    Math.abs(p.hour - currentHour) < Math.abs(c.hour - currentHour) ? p : c,
    timeline[0],
  );
  const peak = Math.max(...timeline.map((p) => p.combined));
  const pct = peak > 0 ? (closest.combined / peak) * 100 : 0;
  const color = getPressureColor(pct);
  const label = getPressureLabel(pct);

  // SVG arc for gauge
  const radius = 50;
  const circumference = Math.PI * radius; // semi-circle
  const dashOffset = circumference - (circumference * Math.min(pct, 100)) / 100;

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 flex flex-col items-center">
      <p className="text-xs text-[#718096] uppercase tracking-wide mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>Active Insulin Pressure</p>
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M 10 65 A 50 50 0 0 1 110 65"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <p className="text-3xl font-bold text-[#1a2a5e] -mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {closest.combined.toFixed(1)}U
      </p>
      <p className="text-xs font-semibold mt-1" style={{ color }}>{label}</p>
    </div>
  );
}
