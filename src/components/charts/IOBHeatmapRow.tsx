import React from 'react';

interface IOBHeatmapRowProps {
  label: string;
  values: number[];
  maxIOB: number;
  totalMinutes: number;
  collisionMinutes?: number[];
}

function heatColor(ratio: number): string {
  // 0 → transparent, 0.25 → #4CAF50, 0.5 → #FFC107, 0.75 → #FF9800, 1.0 → #F44336
  if (ratio <= 0) return 'transparent';

  const stops: Array<{ at: number; r: number; g: number; b: number }> = [
    { at: 0, r: 76, g: 175, b: 80 },    // #4CAF50
    { at: 0.25, r: 76, g: 175, b: 80 },
    { at: 0.5, r: 255, g: 193, b: 7 },   // #FFC107
    { at: 0.75, r: 255, g: 152, b: 0 },   // #FF9800
    { at: 1.0, r: 244, g: 67, b: 54 },    // #F44336
  ];

  const clamped = Math.min(Math.max(ratio, 0), 1);

  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].at && clamped <= stops[i + 1].at) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }

  const range = hi.at - lo.at || 1;
  const t = (clamped - lo.at) / range;
  const r = Math.round(lo.r + (hi.r - lo.r) * t);
  const g = Math.round(lo.g + (hi.g - lo.g) * t);
  const b = Math.round(lo.b + (hi.b - lo.b) * t);

  // Opacity scales with ratio for low values
  const alpha = Math.min(clamped * 1.2 + 0.15, 1);
  return `rgba(${r},${g},${b},${alpha})`;
}

const IOBHeatmapRow: React.FC<IOBHeatmapRowProps> = ({
  label,
  values,
  maxIOB,
  totalMinutes,
  collisionMinutes,
}) => {
  const bucketMinutes = values.length > 0 ? totalMinutes / values.length : totalMinutes;

  // Build collision set (bucket indices)
  const collisionBuckets = new Set<number>();
  if (collisionMinutes) {
    for (const m of collisionMinutes) {
      collisionBuckets.add(Math.min(Math.floor(m / bucketMinutes), values.length - 1));
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: 32,
        borderBottom: '1px solid var(--border)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Label */}
      <div
        style={{
          width: 140,
          minWidth: 140,
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          paddingRight: 8,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>

      {/* Heat cells */}
      <div style={{ display: 'flex', flex: 1, height: '100%', position: 'relative' }}>
        {values.map((v, i) => {
          const ratio = maxIOB > 0 ? v / maxIOB : 0;
          const hasCollision = collisionBuckets.has(i);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: '100%',
                backgroundColor: heatColor(ratio),
                position: 'relative',
              }}
            >
              {hasCollision && (
                <svg
                  width="8"
                  height="7"
                  viewBox="0 0 8 7"
                  style={{
                    position: 'absolute',
                    bottom: 1,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <polygon points="4,0 8,7 0,7" fill="#FF9800" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IOBHeatmapRow;
