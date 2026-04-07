/**
 * GluMira™ V7 — client/src/components/UnitToggle.tsx
 * mmol/L ↔ mg/dL toggle with instant conversion.
 */

import { useState, useCallback } from "react";

interface UnitToggleProps {
  unit: "mmol/L" | "mg/dL";
  onChange: (unit: "mmol/L" | "mg/dL") => void;
  size?: "sm" | "md";
}

const CONVERSION_FACTOR = 18.0182;

export function convertGlucose(value: number, from: "mmol/L" | "mg/dL", to: "mmol/L" | "mg/dL"): number {
  if (from === to) return value;
  if (from === "mmol/L") return Math.round(value * CONVERSION_FACTOR * 10) / 10;
  return Math.round((value / CONVERSION_FACTOR) * 100) / 100;
}

export default function UnitToggle({ unit, onChange, size = "sm" }: UnitToggleProps) {
  const isMmol = unit === "mmol/L";
  const toggle = useCallback(() => {
    onChange(isMmol ? "mg/dL" : "mmol/L");
  }, [isMmol, onChange]);

  const px = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <button
      type="button"
      onClick={toggle}
      className={`${px} rounded-full font-medium transition-colors border
        ${isMmol
          ? "bg-[#2ab5c1]/10 text-[#2ab5c1] border-[#2ab5c1]/30"
          : "bg-[#1a2a5e]/10 text-[#1a2a5e] border-[#1a2a5e]/30"
        } hover:opacity-80`}
      aria-label={`Switch to ${isMmol ? "mg/dL" : "mmol/L"}`}
    >
      {unit}
    </button>
  );
}
