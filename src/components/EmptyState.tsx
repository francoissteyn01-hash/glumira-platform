import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, ctaLabel, ctaTo }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        borderRadius: 12,
        backgroundColor: 'var(--bg-elevated)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: 'var(--teal, #14b8a6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          color: '#fff',
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        {icon ?? 'M'}
      </div>

      <h3
        style={{
          color: 'var(--text-primary)',
          fontSize: 18,
          fontWeight: 600,
          margin: '0 0 8px',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: 14,
          margin: '0 0 20px',
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>

      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          style={{
            backgroundColor: 'var(--teal, #14b8a6)',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
