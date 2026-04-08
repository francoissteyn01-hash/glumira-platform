import React, { useState, useCallback } from 'react';

type ChartView = 'clinical' | 'kids';

interface ChartViewToggleProps {
  view: ChartView;
  onChange: (view: ChartView) => void;
}

const STORAGE_KEY = 'glumira-chart-view';

const ChartViewToggle: React.FC<ChartViewToggleProps> = ({ view, onChange }) => {
  const handleClick = (v: ChartView) => {
    localStorage.setItem(STORAGE_KEY, v);
    onChange(v);
  };

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    minHeight: 44,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: 8,
    transition: 'background-color 0.2s, color 0.2s',
    backgroundColor: active ? 'var(--accent-teal)' : 'transparent',
    color: active ? '#ffffff' : 'var(--text-secondary)',
  });

  return (
    <div
      style={{
        display: 'inline-flex',
        borderRadius: 8,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <button style={buttonStyle(view === 'clinical')} onClick={() => handleClick('clinical')}>
        Clinical
      </button>
      <button style={buttonStyle(view === 'kids')} onClick={() => handleClick('kids')}>
        Kids view
      </button>
    </div>
  );
};

export function useChartView(defaultView: ChartView = 'clinical'): [ChartView, (v: ChartView) => void] {
  const [view, setView] = useState<ChartView>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'clinical' || stored === 'kids') return stored;
    } catch {
      // SSR or unavailable
    }
    return defaultView;
  });

  const set = useCallback((v: ChartView) => {
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      // ignore
    }
    setView(v);
  }, []);

  return [view, set];
}

export default ChartViewToggle;
