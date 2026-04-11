/**
 * GluMira™ V7 — IOB Hunter Patient Header
 * Matches the Riley pressure-map header design: circular avatar,
 * patient name + subtitle, coloured injection summary.
 */

import React from "react";
import type { InsulinEntry } from "@/lib/pharmacokinetics";
import type { DemoPatientA } from "@/data/demoPatientAData";

type PatientHeaderProps = {
  patient: DemoPatientA;
  injections: InsulinEntry[];
}

const INSULIN_COLOURS: Record<string, string> = {
  levemir:  "#2ab5c1",
  tresiba:  "#2ab5c1",
  lantus:   "#2ab5c1",
  fiasp:    "#e06666",
  novorapid:"#e06666",
  humalog:  "#e06666",
  actrapid: "#c27200",
  regular:  "#c27200",
  humulin:  "#c27200",
};

function insulinColor(name: string): string {
  const key = name.toLowerCase().replace(/\s+/g, "");
  for (const [k, v] of Object.entries(INSULIN_COLOURS)) {
    if (key.includes(k)) return v;
  }
  return "#6B7280";
}

export default function PatientHeader({ patient, injections }: PatientHeaderProps) {
  const initial = patient.name.charAt(0).toUpperCase();

  return (
    <div style={{
      background: "var(--bg-card)",
      borderRadius: 12,
      border: "1px solid var(--border-light)",
      padding: "24px 28px",
      marginBottom: 24,
    }}>
      {/* Top row: avatar + name/subtitle */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "var(--text-primary)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {initial}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
            {patient.name} — 24-hour insulin pressure map
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {patient.therapy} · {patient.diet}
          </p>
        </div>
      </div>

      {/* Injection summary line */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 14 }}>
        {injections.map((inj) => (
          <span key={inj.id}>
            <span style={{ color: insulinColor(inj.insulinName), fontWeight: 600 }}>
              {inj.insulinName}
            </span>
            {" "}
            <span style={{ color: "var(--text-secondary)" }}>
              {inj.dose}U @ {inj.time}
            </span>
            <span style={{ color: "var(--text-faint)", margin: "0 4px" }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
