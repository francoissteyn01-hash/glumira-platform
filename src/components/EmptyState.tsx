import React from 'react';
import { Link } from 'react-router-dom';

const OwlIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ color: '#ccc' }}>
    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="#0A2A5E"></circle>
    <path d="M15 15h10 a1 0 0 0 5 0 h-10 z" fill="currentColor"></path>
    <rect x="18" y="22" width="4" height="6" fill="#BA7517"></rect>
    <polygon points="18,25 20,20 22,25" fill="#0d1b3e"></polygon>
  </svg>
);

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  message?: string;
  ctaLabel?: string;
  ctaTo?: string;
  ctaHref?: string;
  illustration?: React.ReactNode;
  subText?: string;
  owlIcon?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, message, ctaLabel, ctaTo, ctaHref, illustration, subText, owlIcon }) => {
  const displayMessage = description || message;
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
      {owlIcon && <div style={{ marginBottom: 16 }}><OwlIcon /></div>}
      {illustration && <div style={{ marginBottom: 16 }}>{illustration}</div>}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: 'var(--teal, #14b8a6)',
          display: owlIcon || illustration ? 'none' : 'flex',
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
        {displayMessage}
      </p>

      {ctaLabel && (ctaTo || ctaHref) && (
        <Link
          to={ctaTo || ctaHref || ''}
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
      {subText && (
        <p style={{ color: 'var(--text-faint, #94a3b8)', fontSize: 12, marginTop: 8 }}>
          {subText}
        </p>
      )}
    </div>
  );
};

export default EmptyState;
