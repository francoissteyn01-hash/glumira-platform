import { type CSSProperties } from "react";

interface StoryProgressProps {
  current: number;
  total: number;
}

export default function StoryProgress({ current, total }: StoryProgressProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  const trackStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: "rgba(26,42,94,0.1)",
    zIndex: 100,
  };

  const fillStyle: CSSProperties = {
    height: "100%",
    width: `${pct}%`,
    background: "#2ab5c1",
    borderRadius: "0 2px 2px 0",
    transition: "width 0.4s ease",
  };

  return (
    <div style={trackStyle}>
      <div style={fillStyle} />
    </div>
  );
}
