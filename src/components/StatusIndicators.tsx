import React from 'react';

// --- NightscoutStatus ---

interface NightscoutStatusProps {
  status: 'connected' | 'stale' | 'error' | 'disconnected';
}

const nightscoutColors: Record<NightscoutStatusProps['status'], string> = {
  connected: '#22c55e',
  stale: '#eab308',
  error: '#ef4444',
  disconnected: '#94a3b8',
};

const nightscoutLabels: Record<NightscoutStatusProps['status'], string> = {
  connected: 'Connected',
  stale: 'Stale',
  error: 'Error',
  disconnected: 'Disconnected',
};

export const NightscoutStatus: React.FC<NightscoutStatusProps> = ({ status }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: nightscoutColors[status],
        flexShrink: 0,
      }}
    />
    <span
      style={{
        fontSize: 11,
        fontFamily: '"DM Sans", sans-serif',
        color: 'var(--text-muted)',
      }}
    >
      {nightscoutLabels[status]}
    </span>
  </span>
);

// --- IOBPressureBar ---

interface IOBPressureBarProps {
  pressure: 'light' | 'moderate' | 'strong' | 'overlap';
}

const pressureFill: Record<IOBPressureBarProps['pressure'], { width: string; color: string }> = {
  light: { width: '25%', color: '#22c55e' },
  moderate: { width: '50%', color: '#eab308' },
  strong: { width: '75%', color: '#f97316' },
  overlap: { width: '100%', color: '#ef4444' },
};

export const IOBPressureBar: React.FC<IOBPressureBarProps> = ({ pressure }) => {
  const { width, color } = pressureFill[pressure];
  return (
    <div
      style={{
        width: 80,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'var(--border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width,
          height: '100%',
          borderRadius: 3,
          backgroundColor: color,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
};

// --- ProfileProgress ---

interface ProfileProgressProps {
  percent: number;
  size?: number;
}

export const ProfileProgress: React.FC<ProfileProgressProps> = ({ percent, size = 32 }) => {
  const strokeWidth = size * 0.12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      {/* Fill */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent-teal)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />
      {/* Center text */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        style={{
          fontSize: size * 0.3,
          fontFamily: '"DM Sans", sans-serif',
          fill: 'var(--text-muted)',
        }}
      >
        {Math.round(clamped)}%
      </text>
    </svg>
  );
};
