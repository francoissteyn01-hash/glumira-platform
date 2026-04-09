// components/dashboard/IOBHunterCard.tsx
import React from 'react';
import EmptyState from '../EmptyState';
import { useHasDoses } from '../../hooks/dashboard-checks';

const GhostedCurve = () => (
  <svg width="200" height="100" viewBox="0 0 200 100" style={{ opacity: 0.3 }}>
    <path d="M10 80 Q50 20 100 50 T190 40" stroke="#0d1b3e" strokeDasharray="5,5" fill="none" />
  </svg>
);

const IOBHunterCard: React.FC = () => {
  const hasDoses = useHasDoses();

  if (hasDoses) {
    // Render real IOB content
    return <div></div>; // Placeholder
  }

  return (
    <EmptyState
      title="IOB Hunter"
      message="Your Insulin on Board tracker is ready. Add your first insulin dose to see your live IOB curve."
      illustration={<GhostedCurve />}
      ctaLabel="Log First Dose"
      ctaHref="/log-dose"
      subText="Or import your data from Dexcom Clarity"
      owlIcon={true}
    />
  );
};

export default IOBHunterCard;
