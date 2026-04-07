import { useState } from "react";

const BADGES: Record<string, { label: string; icon: string; color: string }> = {
  balanced: { label: "Standard", icon: "🥗", color: "#2AB5C1" },
  bernstein: { label: "Bernstein", icon: "📊", color: "#DC2626" },
  carnivore: { label: "Carnivore", icon: "🥩", color: "#B91C1C" },
  dash: { label: "DASH", icon: "❤️", color: "#DC2626" },
  "full-carb": { label: "Full Carb", icon: "🍞", color: "#2563EB" },
  "gluten-free": { label: "Gluten-Free", icon: "🌾", color: "#D97706" },
  halal: { label: "Halal", icon: "☪️", color: "#059669" },
  "high-protein": { label: "High Protein", icon: "💪", color: "#7C3AED" },
  "intermittent-fasting": { label: "IF", icon: "⏰", color: "#4F46E5" },
  keto: { label: "Keto", icon: "🥑", color: "#059669" },
  kosher: { label: "Kosher", icon: "✡️", color: "#2563EB" },
  "low-carb": { label: "Low Carb", icon: "🥗", color: "#0D9488" },
  "low-gi": { label: "Low GI", icon: "📉", color: "#0891B2" },
  mediterranean: { label: "Mediterranean", icon: "🫒", color: "#B45309" },
  "mixed-balanced": { label: "Mixed", icon: "⚖️", color: "#6366F1" },
  paleo: { label: "Paleo", icon: "🦴", color: "#92400E" },
  "plant-based": { label: "Plant-Based", icon: "🌱", color: "#16A34A" },
  ramadan: { label: "Ramadan", icon: "🌙", color: "#7C3AED" },
  "sick-day": { label: "Sick Day", icon: "🤒", color: "#EF4444" },
  vegetarian: { label: "Vegetarian", icon: "🥬", color: "#15803D" },
  zone: { label: "Zone", icon: "🎯", color: "#E11D48" },
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
