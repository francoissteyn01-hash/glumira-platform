/**
 * GluMira™ V7 — IOB Hunter Page
 *
 * Full-page insulin density map showing 24-hour IOB curve + heatmap
 * for a patient's multi-insulin regimen. Highlights peak overlap windows.
 */

import React, { useMemo } from "react";
import PatientHeader from "@/components/iob-hunter/PatientHeader";
import IOBMountainGraph from "@/components/iob-hunter/IOBMountainGraph";
import InsulinDensityHeatmap from "@/components/iob-hunter/InsulinDensityHeatmap";
import { generateHeatmapData } from "@/utils/insulinDensity";
import {
  ANOUK_PATIENT,
  ANOUK_INJECTIONS,
  PEAK_ZONE,
  HEATMAP_HIGHLIGHT,
} from "@/data/anoukData";

export default function IOBHunterPage() {
  const heatmapData = useMemo(
    () => generateHeatmapData(ANOUK_INJECTIONS),
    [],
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary, #f8f9fa)", padding: "32px 20px" }}>
      <div className="mx-auto max-w-[1200px]">
        <PatientHeader patient={ANOUK_PATIENT} injections={ANOUK_INJECTIONS} />

        <IOBMountainGraph
          injections={ANOUK_INJECTIONS}
          peakZone={PEAK_ZONE}
        />

        <InsulinDensityHeatmap
          data={heatmapData}
          highlightZone={HEATMAP_HIGHLIGHT}
        />

        {/* Footer */}
        <footer className="mt-10 rounded-xl bg-white p-6 text-center shadow-sm">
          <p className="text-xs text-gray-500 mb-3">
            <strong>⚠️ Clinical Disclaimer:</strong> This visualization shows
            insulin activity patterns for educational purposes only. All
            treatment decisions require consultation with a qualified diabetes
            care team.
          </p>
          <p className="text-sm text-gray-700">
            <strong>GlucoGuard™</strong> — Powered by{" "}
            <strong>IOB Hunter™</strong>
          </p>
        </footer>
      </div>
    </div>
  );
}
