import React from 'react';

interface IOBDensityBarProps {
  points: Array<{ minute: number; pressure: 'light' | 'moderate' | 'strong' | 'overlap' }>;
  totalMinutes: number;
}

const PRESSURE_ORDER: Record<string, number> = {
  light: 0,
  moderate: 1,
  strong: 2,
  overlap: 3,
};

const PRESSURE_COLORS: Record<string, { color: string; opacity: number }> = {
  light: { color: '#4CAF50', opacity: 0.7 },
  moderate: { color: '#FFC107', opacity: 0.8 },
  strong: { color: '#FF9800', opacity: 0.9 },
  overlap: { color: '#F44336', opacity: 1.0 },
};

const SEGMENT_COUNT = 48;

const IOBDensityBar: React.FC<IOBDensityBarProps> = ({ points, totalMinutes }) => {
  const minutesPerSegment = totalMinutes / SEGMENT_COUNT;

  // Map points into hourly buckets, keeping worst pressure
  const buckets: (string | null)[] = Array(SEGMENT_COUNT).fill(null);
  for (const pt of points) {
    const idx = Math.min(Math.floor(pt.minute / minutesPerSegment), SEGMENT_COUNT - 1);
    const current = buckets[idx];
    if (current === null || PRESSURE_ORDER[pt.pressure] > PRESSURE_ORDER[current]) {
      buckets[idx] = pt.pressure;
    }
  }

  // Time labels every 6 hours
  const timeLabels: Array<{ label: string; position: number }> = [];
  for (let h = 0; h <= 48; h += 6) {
    const hourInDay = h % 24;
    const label = `${String(hourInDay).padStart(2, '0')}:00`;
    timeLabels.push({ label, position: h / 48 });
  }

  // Day markers
  const dayMarkers = [
    { label: 'D1', position: 0 },
    { label: 'D2', position: 24 / 48 },
  ];

  const legendItems: Array<{ pressure: string; label: string }> = [
    { pressure: 'light', label: 'Light' },
    { pressure: 'moderate', label: 'Moderate' },
    { pressure: 'strong', label: 'Strong' },
    { pressure: 'overlap', label: 'Overlap' },
  ];

  return (
    <div style={{ width: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Bar */}
      <div
        style={{
          display: 'flex',
          height: 28,
          borderRadius: 6,
          overflow: 'hidden',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        {buckets.map((pressure, i) => {
          const cfg = pressure ? PRESSURE_COLORS[pressure] : null;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundColor: cfg ? cfg.color : 'transparent',
                opacity: cfg ? cfg.opacity : 1,
              }}
            />
          );
        })}
      </div>

      {/* Time labels + day markers */}
      <div style={{ position: 'relative', height: 28, marginTop: 4 }}>
        {timeLabels.map((t, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${t.position * 100}%`,
              transform: 'translateX(-50%)',
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </span>
        ))}
        {dayMarkers.map((d, i) => (
          <span
            key={`day-${i}`}
            style={{
              position: 'absolute',
              left: `${d.position * 100}%`,
              top: 14,
              transform: 'translateX(-50%)',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {d.label}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 6,
          flexWrap: 'wrap',
        }}
      >
        {legendItems.map((item) => {
          const cfg = PRESSURE_COLORS[item.pressure];
          return (
            <div key={item.pressure} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: cfg.color,
                  opacity: cfg.opacity,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IOBDensityBar;
