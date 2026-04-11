/**
 * GluMira™ V7 — IOB Hunter Page
 *
 * Full-page insulin density map showing 24-hour IOB curve + heatmap
 * for a patient's multi-insulin regimen. Highlights peak overlap windows.
 * Design: GluMira Scandinavian Minimalist with IOB Hunter accent palette.
 */

import React, { useMemo } from "react";
import PatientHeader from "@/components/iob-hunter/PatientHeader";
import IOBMountainGraph from "@/components/iob-hunter/IOBMountainGraph";
import InsulinDensityHeatmap from "@/components/iob-hunter/InsulinDensityHeatmap";
import { generateHeatmapData } from "@/utils/insulinDensity";
import { DISCLAIMER } from "@/lib/constants";
import {
  DEMO_PATIENT_A,
  DEMO_PATIENT_A_INJECTIONS,
  PEAK_ZONE,
  HEATMAP_HIGHLIGHT,
} from "@/data/demoPatientAData";

export default function IOBHunterPage() {
  const heatmapData = useMemo(
    () => generateHeatmapData(DEMO_PATIENT_A_INJECTIONS),
    [],
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(24px, 6vw, 32px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 4px",
          }}>
            IOB Hunter™
          </h1>
          <p style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            margin: 0,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            24-hour insulin pressure map — visualise active insulin overlap and stacking risk.
          </p>
        </div>

        {/* Medical disclaimer */}
        <div style={{
          borderRadius: 8,
          background: "var(--disclaimer-bg)",
          border: "1px solid var(--disclaimer-border)",
          padding: "10px 14px",
          marginBottom: 20,
          fontSize: 12,
          color: "var(--disclaimer-text)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {DISCLAIMER}
        </div>

        <PatientHeader patient={DEMO_PATIENT_A} injections={DEMO_PATIENT_A_INJECTIONS} />

        <IOBMountainGraph
          injections={DEMO_PATIENT_A_INJECTIONS}
          peakZone={PEAK_ZONE}
        />

        <InsulinDensityHeatmap
          data={heatmapData}
          highlightZone={HEATMAP_HIGHLIGHT}
        />

        {/* Footer */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: 12,
          border: "1px solid var(--border-light)",
          padding: "20px 24px",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: 12,
            color: "var(--text-faint)",
            margin: "0 0 8px",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            This visualization shows insulin activity patterns for educational purposes only.
            All treatment decisions require consultation with a qualified diabetes care team.
          </p>
          <p style={{
            fontSize: 14,
            color: "var(--text-primary)",
            margin: 0,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontWeight: 600,
          }}>
            GluMira™ — Powered by IOB Hunter™
          </p>
        </div>

        {/* Spacer for mobile bottom nav */}
        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
