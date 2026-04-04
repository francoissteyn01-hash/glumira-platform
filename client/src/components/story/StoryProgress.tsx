/**
 * GluMira™ V7 — Story progress bar
 * Top-fixed bar that fills across total_duration_ms.
 */

import { type CSSProperties } from "react";

interface StoryProgressProps {
  progress: number; // 0–1
}

export default function StoryProgress({ progress }: StoryProgressProps) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  const trackStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: "rgba(248,249,250,0.1)",
    zIndex: 110,
  };

  const fillStyle: CSSProperties = {
    height: "100%",
    width: `${pct}%`,
    background: "linear-gradient(90deg, #2ab5c1, #f59e0b)",
    borderRadius: "0 2px 2px 0",
    transition: "width 0.3s ease",
  };

  return (
    <div style={trackStyle} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div style={fillStyle} />
    </div>
  );
}
