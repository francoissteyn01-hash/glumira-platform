import { useState, useEffect } from "react";
import type { DemoDangerWindow } from "../../hooks/useDemoData";

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

interface Props {
  dangerWindows: DemoDangerWindow[];
}

export default function RiskWindow({ dangerWindows }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Find active or next window
  let activeWindow: DemoDangerWindow | null = null;
  let nextWindow: DemoDangerWindow | null = null;
  let minutesUntilClose = 0;

  for (const w of dangerWindows) {
    const start = parseTime(w.start);
    const end = parseTime(w.end);
    if (currentHour >= start && currentHour < end) {
      activeWindow = w;
      minutesUntilClose = Math.round((end - currentHour) * 60);
      break;
    }
    if (start > currentHour && (!nextWindow || start < parseTime(nextWindow.start))) {
      nextWindow = w;
    }
  }

  const hours = Math.floor(minutesUntilClose / 60);
  const mins = minutesUntilClose % 60;

  return (
    <div
      className="rounded-xl border bg-white p-5"
      style={{
        borderColor: activeWindow ? "#ef4444" : "#e2e8f0",
        animation: activeWindow ? "pulse 2s infinite" : "none",
      }}
    >
      <p className="text-xs text-[#718096] uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Risk Window</p>
      {activeWindow ? (
        <>
          <p className="text-sm font-semibold text-[#ef4444]">
            Danger window closes in {hours}h {mins}m
          </p>
          <p className="text-xs text-[#718096] mt-1">
            {activeWindow.start} \u2013 {activeWindow.end} ({activeWindow.severity})
          </p>
        </>
      ) : nextWindow ? (
        <>
          <p className="text-sm font-medium text-[#1a2a5e]">Next window: {nextWindow.start} \u2013 {nextWindow.end}</p>
          <p className="text-xs text-[#718096] mt-1">{nextWindow.severity} severity</p>
        </>
      ) : (
        <p className="text-sm text-[#22c55e] font-medium">No active danger window.</p>
      )}
      <style>{`@keyframes pulse { 0%, 100% { border-color: #ef4444; } 50% { border-color: #fca5a5; } }`}</style>
    </div>
  );
}
