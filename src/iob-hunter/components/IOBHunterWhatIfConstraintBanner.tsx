import React from 'react';

interface Props {
  message?: string;
}

export default function WhatIfConstraintBanner({ message }: Props) {
  return (
    <div style={{
      padding: '12px 16px',
      background: '#e0f2fe',
      border: '1px solid #06b6d4',
      borderRadius: 8,
      fontSize: 12,
      color: '#0c4a6e',
      marginBottom: 16,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <strong>What-If Mode:</strong> Adjust dose times ±2 hours or units ±50% from your profile. Cannot change insulin type or add new insulins.
      {message && <div style={{ marginTop: 4, fontSize: 11 }}>{message}</div>}
    </div>
  );
}
