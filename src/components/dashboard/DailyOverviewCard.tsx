/**
 * GluMira™ V7 — Daily Overview Card
 * Combined glucose/insulin/meals timeline or empty state.
 */

import React from "react";
import EmptyState from "../EmptyState";
import { useProfileComplete, useHasDoses, useHasGlucose } from "../../hooks/dashboard-checks";

const TimelineOutline = () => (
  <svg width="200" height="60" viewBox="0 0 200 60" style={{ opacity: 0.3 }}>
    <line x1="10" y1="30" x2="190" y2="30" stroke="#0d1b3e" strokeDasharray="5,5" />
    <text x="10" y="45" fontSize="10" fill="#666">00:00</text>
    <text x="180" y="45" fontSize="10" fill="#666">24:00</text>
  </svg>
);

const DailyOverviewCard: React.FC = () => {
  const complete = useProfileComplete();
  const hasDoses = useHasDoses();
  const hasGlucose = useHasGlucose();

  if (complete && (hasDoses || hasGlucose)) {
    // TODO: render real daily overview timeline
    return <div />;
  }

  const ctaHref = !complete ? "/profile/setup" : "/insulin";
  const ctaLabel = !complete ? "Get Started" : "Log Dose";

  return (
    <EmptyState
      title="Daily Overview"
      message="Your daily view will combine glucose, insulin, and meals on one timeline."
      illustration={<TimelineOutline />}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
    />
  );
};

export default DailyOverviewCard;
