// components/dashboard/StackingAlertsCard.tsx
import React from 'react';
import EmptyState from '../EmptyState';
import { useHasDoses } from '../../hooks/dashboard-checks';

const ShieldIcon = () => (
  <svg width="50" height="50" viewBox="0 0 50 50" style={{ color: '#4ade80' }}>
    <path d="M25 5 L45 15 V30 Q45 45 25 50 Q5 45 5 30 V15 Z" fill="currentColor" />
    <polyline points="15,25 20,30 35,20" stroke="white" strokeWidth="2" fill="none" />
  </svg>
);

const StackingAlertsCard: React.FC = () => {
  const hasDoses = useHasDoses();

  if (hasDoses) {
    // Render alerts content
    return <div></div>;
  }

  return (
    <EmptyState
      title="Stacking Alerts"
      message="No insulin stacking detected. IOB Hunter monitors your doses for overlap — alerts will appear here."
      illustration={<ShieldIcon />}
      owlIcon={true}
    />
  );
};

export default StackingAlertsCard;
