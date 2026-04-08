import React, { useState, useEffect } from 'react';

interface MiraAvatarProps {
  tip?: string;
}

const MiraAvatar: React.FC<MiraAvatarProps> = ({ tip }) => {
  const [showTip, setShowTip] = useState(!!tip);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (tip) {
      setShowTip(true);
      const t = setTimeout(() => setShowTip(false), 5000);
      return () => clearTimeout(t);
    }
  }, [tip]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: entered ? 'translateY(0)' : 'translateY(10px)',
        opacity: entered ? 1 : 0,
        transition: 'transform 300ms ease-out, opacity 300ms ease-out',
      }}
    >
      {showTip && tip && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default, #e2e8f0)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            color: 'var(--text-primary)',
            marginBottom: 8,
            position: 'relative',
            maxWidth: 200,
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
          }}
        >
          {tip}
          {/* Triangle pointing down */}
          <div
            style={{
              position: 'absolute',
              bottom: -6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid var(--bg-card)',
            }}
          />
        </div>
      )}

      <div
        className="mira-avatar"
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          animation: 'miraPulse 4s ease-in-out infinite',
          border: '2px solid transparent',
        }}
      >
        <span
          style={{
            color: 'var(--accent-teal)',
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          M
        </span>
      </div>

      <style>{`
        [data-theme="dark"] .mira-avatar {
          border-color: var(--accent-teal) !important;
          box-shadow: 0 0 8px var(--accent-teal);
        }
      `}</style>
    </div>
  );
};

export default MiraAvatar;
