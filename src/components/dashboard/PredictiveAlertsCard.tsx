// components/dashboard/PredictiveAlertsCard.tsx
import React from 'react';
import EmptyState from '../EmptyState';
import { useProfileComplete, useHasDoses, useHasGlucose } from '../../hooks/dashboard-checks';

const GhostedProjection = () => (
  <svg width="200" height="100" viewBox="0 0 200 100" style={{ opacity: 0.3 }}>
    <path d="M20 80 Q80 40 120 60" stroke="#22AABB" strokeWidth="2" fill="none" />
    <path d="M120 60 Q150 30 180 40" stroke="#BAA315" strokeDasharray="5,5" fill="none" />
  </svg>
);

const PredictiveAlertsCard: React.FC = () => {
  const complete = useProfileComplete();
  const hasDoses = useHasDoses();
  const hasGlucose = useHasGlucose();

  if (hasDoses && hasGlucose) {
    return <div></div>;
  }

  const ctaHref = !complete ? '/profile/setup' : hasGlucose ? '/log-dose' : '/import/dexcom';
  const ctaLabel = !complete ? 'Complete Your Profile' : hasGlucose ? 'Log Dose' : 'Import CGM Data';

  return (
    <EmptyState
      title="Predictive Alerts"
      message="Predictive glucose projections will appear here once you have both insulin doses and CGM data."
      illustration={<GhostedProjection />}
      ctaLabel={ctaLabel}
      ctaHref={ctaHref}
    />
  );
};

export default PredictiveAlertsCard;
