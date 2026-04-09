// components/dashboard/InsulinRegimenSummaryCard.tsx
import React from 'react';
import EmptyState from '../EmptyState';
import { useHasProfile } from '../../hooks/dashboard-checks';

const PillIcons = () => (
  <div style={{ display: 'flex', gap: 8, opacity: 0.3 }}>
    <svg width="20" height="20" viewBox="0 0 20 20">
      <rect x="5" y="5" width="10" height="6" fill="#0d1b3e" rx="3" />
    </svg>
    <svg width="20" height="20" viewBox="0 0 20 20">
      <rect x="5" y="4" width="8" height="12" fill="#22AABB" rx="1" />
    </svg>
  </div>
);

const InsulinRegimenSummaryCard: React.FC = () => {
  const hasProfile = useHasProfile();

  if (hasProfile /* and regimen exists */) {
    return <div></div>;
  }

  return (
    <EmptyState
      title="Insulin Regimen Summary"
      message="Set up your insulin regimen to unlock personalized IOB tracking."
      illustration={<PillIcons />}
      ctaLabel="Set Up Regimen"
      ctaHref="/profile/setup"
      owlIcon={true}
    />
  );
};

export default InsulinRegimenSummaryCard;
