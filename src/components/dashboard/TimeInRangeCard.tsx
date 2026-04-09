// components/dashboard/TimeInRangeCard.tsx
import React from 'react';
import EmptyState from '../EmptyState';
import { useHasGlucose } from '../../hooks/dashboard-checks';

const DonutOutline = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" style={{ opacity: 0.3 }}>
    <circle cx="50" cy="50" r="40" stroke="#22AABB" strokeWidth="10" fill="none" strokeDasharray="5,5" />
  </svg>
);

const TimeInRangeCard: React.FC = () => {
  const hasGlucose = useHasGlucose();

  if (hasGlucose /* and >=24h data */) {
    return <div></div>;
  }

  return (
    <EmptyState
      title="Time in Range Statistics"
      message="Your Time in Range stats need at least 24 hours of glucose data."
      illustration={<DonutOutline />}
      ctaLabel="Import CGM Data"
      ctaHref="/import/dexcom"
    />
  );
};

export default TimeInRangeCard;
