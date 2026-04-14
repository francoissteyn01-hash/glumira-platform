/**
 * GluMira™ V7 — Glucose Timeline Card
 * Shows CGM glucose timeline or empty state with import CTA.
 */

import React from "react";
import EmptyState from "../EmptyState";
import { useHasGlucose } from "../../hooks/dashboard-checks";

const GhostedGrid = () => (
  <svg width="200" height="100" viewBox="0 0 200 100" style={{ opacity: 0.3 }}>
    <rect x="0" y="30" width="200" height="40" fill="rgba(34, 197, 94, 0.2)" stroke="#22AABB" strokeWidth="1" />
    <text x="10" y="50" fontSize="10" fill="#22AABB">4.0–8.0 mmol/L Target Zone</text>
  </svg>
);

const GlucoseTimelineCard: React.FC = () => {
  const hasGlucose = useHasGlucose();

  if (hasGlucose) {
    // TODO: render real glucose timeline chart
    return <div />;
  }

  return (
    <EmptyState
      title="Glucose Timeline"
      message="Your glucose timeline will appear here once you import CGM data."
      illustration={<GhostedGrid />}
      ctaLabel="Import from Dexcom Clarity"
      ctaHref="/import/dexcom"
      subText="Supports Dexcom Clarity CSV exports"
    />
  );
};

export default GlucoseTimelineCard;
