/**
 * GluMira™ V7 — Glucose Unit Toggle
 * Small pill toggle: "mmol/L" | "mg/dL"
 * Consumes and updates the global GlucoseUnitsContext.
 */

import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";

export default function UnitToggle() {
  const { units, setUnits } = useGlucoseUnits();

  const opt = (value: "mmol" | "mg", label: string) => {
    const active = units === value;
    return (
      <button
        type="button"
        onClick={() => setUnits(value)}
        style={{
          padding: "5px 12px",
          borderRadius: 6,
          border: "none",
          background: active ? "#2ab5c1" : "transparent",
          color: active ? "#ffffff" : "#52667a",
          fontSize: 12,
          fontWeight: active ? 700 : 500,
          cursor: "pointer",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          transition: "all 0.15s",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#f1f3f5",
        borderRadius: 8,
        padding: 2,
        border: "1px solid #dee2e6",
      }}
    >
      {opt("mmol", "mmol/L")}
      {opt("mg", "mg/dL")}
    </div>
  );
}
