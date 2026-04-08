import React from 'react';

interface InsightPanelProps {
  pressureClass: 'light' | 'moderate' | 'strong' | 'overlap';
  summary: string;
  dangerWindow?: string;
  disclaimer?: string;
}

const accentColors: Record<InsightPanelProps['pressureClass'], string> = {
  light: '#22c55e',
  moderate: '#eab308',
  strong: '#f97316',
  overlap: '#ef4444',
};

const InsightPanel: React.FC<InsightPanelProps> = ({
  pressureClass,
  summary,
  dangerWindow,
  disclaimer,
}) => {
  const accent = accentColors[pressureClass];
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#0D1B3E' : '#1a2a5e';

  return (
    <div
      className="insight-panel"
      style={{
        background: bg,
        color: '#ffffff',
        borderRadius: 16,
        padding: 24,
        borderLeft: `4px solid ${accent}`,
        position: 'relative',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Mira mini avatar */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#1a2a5e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #2AB5C1',
        }}
      >
        <span
          style={{
            color: '#2AB5C1',
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          M
        </span>
      </div>

      {/* Header */}
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 600,
          fontSize: 16,
          color: '#2AB5C1',
          marginBottom: 12,
        }}
      >
        ⏱ 60-SECOND INSIGHT
      </div>

      {/* Summary */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 400,
          lineHeight: 1.7,
          marginBottom: dangerWindow || disclaimer ? 16 : 0,
        }}
      >
        {summary}
      </div>

      {/* Danger window */}
      {dangerWindow && (
        <div
          style={{
            borderLeft: '4px solid #ef4444',
            background: 'rgba(239, 68, 68, 0.08)',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 14,
            lineHeight: 1.7,
            marginBottom: disclaimer ? 16 : 0,
          }}
        >
          {dangerWindow}
        </div>
      )}

      {/* Disclaimer */}
      {disclaimer && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 300,
            fontStyle: 'italic',
            color: '#8FA3BF',
            lineHeight: 1.5,
          }}
        >
          {disclaimer}
        </div>
      )}

      <style>{`
        [data-theme="dark"] .insight-panel {
          background: #0D1B3E !important;
        }
      `}</style>
    </div>
  );
};

export default InsightPanel;
