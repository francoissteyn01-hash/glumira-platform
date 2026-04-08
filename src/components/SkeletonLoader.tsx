import React from 'react';

interface SkeletonProps {
  variant: 'card' | 'chart' | 'row' | 'list';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonProps> = ({ variant, count = 1 }) => {
  if (variant === 'card') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              borderRadius: 12,
              height: 120,
              width: '100%',
              marginBottom: i < count - 1 ? 12 : 0,
            }}
          />
        ))}
      </>
    );
  }

  if (variant === 'chart') {
    return (
      <div
        className="skeleton"
        style={{
          borderRadius: 12,
          height: 300,
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {[1, 2, 3, 4].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${(i + 1) * 20}%`,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              borderRadius: 8,
              height: 44,
              width: '100%',
              marginBottom: i < count - 1 ? 8 : 0,
            }}
          />
        ))}
      </>
    );
  }

  // list
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            borderRadius: 8,
            height: 44,
            width: '100%',
          }}
        />
      ))}
    </div>
  );
};

export default SkeletonLoader;
