import React from 'react';

interface BasalEvalGaugeProps {
  score: number;
  observations: Array<{ type: 'positive' | 'warning' | 'alert'; text: string }>;
}

const BasalEvalGauge: React.FC<BasalEvalGaugeProps> = ({ score, observations }) => {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 10) / 10;
  const dashoffset = circumference * (1 - progress);

  const iconMap = {
    positive: { symbol: '\u2713', color: '#4CAF50' },
    warning: { symbol: '\u26A0', color: '#FFC107' },
    alert: { symbol: '\u2715', color: '#F44336' },
  };

  return (
    <div
      style={{
        background: 'var(--bg-card, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 12,
        padding: 20,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Gauge */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border, #e5e7eb)"
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--accent-teal, #2AB5C1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          {/* Score text */}
          <text
            x={size / 2}
            y={size / 2 - 2}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 28,
              fontWeight: 700,
              fill: 'var(--accent-teal, #2AB5C1)',
            }}
          >
            {score.toFixed(1)}
          </text>
          {/* /10 label */}
          <text
            x={size / 2}
            y={size / 2 + 20}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fill: 'var(--text-muted, #9ca3af)',
            }}
          >
            /10
          </text>
        </svg>
      </div>

      {/* Observations */}
      <div style={{ textAlign: 'left' }}>
        {observations.map((obs, i) => {
          const icon = iconMap[obs.type];
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                lineHeight: 1.6,
                color: 'var(--text-secondary, #4b5563)',
              }}
            >
              <span style={{ color: icon.color, flexShrink: 0, fontSize: 13 }}>
                {icon.symbol}
              </span>
              <span>{obs.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BasalEvalGauge;
