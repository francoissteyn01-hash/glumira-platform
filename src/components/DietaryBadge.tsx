import { useState } from "react";

const BADGES: Record<string, { label: string; icon: string; color: string }> = {
  balanced: { label: "Standard", icon: "🥗", color: "#2AB5C1" },
  ramadan: { label: "Ramadan", icon: "🌙", color: "#7C3AED" },
  kosher: { label: "Kosher", icon: "✡️", color: "#2563EB" },
  halal: { label: "Halal", icon: "☪️", color: "#059669" },
  bernstein: { label: "Bernstein", icon: "📊", color: "#DC2626" },
};

interface DietaryBadgeProps {
  module: string;
  size?: "sm" | "md";
}

export default function DietaryBadge({ module, size = "sm" }: DietaryBadgeProps) {
  const badge = BADGES[module] || BADGES.balanced;
  const isSmall = size === "sm";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSmall ? 4 : 6,
        padding: isSmall ? "2px 8px" : "4px 12px",
        borderRadius: 20,
        border: `1px solid ${badge.color}30`,
        background: `${badge.color}10`,
        fontSize: isSmall ? 11 : 13,
        fontWeight: 500,
        color: badge.color,
        whiteSpace: "nowrap",
      }}
    >
      <span>{badge.icon}</span>
      <span>{badge.label}</span>
    </span>
  );
}
