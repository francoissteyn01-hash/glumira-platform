import React, { useState, useCallback } from 'react';

export type ChartView = 'clinical' | 'kids' | 'mountains';

interface ChartViewToggleProps {
  view: ChartView;
  onChange: (view: ChartView) => void;
}

const STORAGE_KEY = 'glumira-chart-view';

const VIEWS: { key: ChartView; label: string }[] = [
  { key: 'clinical', label: '📊 Clinical' },
  { key: 'mountains', label: '⛰️ Mountains' },
];

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
    padding: '0 14px',
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
      {VIEWS.map(({ key, label }) => (
        <button key={key} style={buttonStyle(view === key)} onClick={() => handleClick(key)}>
          {label}
        </button>
      ))}
    </div>
  );
};

const VALID_VIEWS: ChartView[] = ['clinical', 'kids', 'mountains'];

export function useChartView(defaultView: ChartView = 'clinical'): [ChartView, (v: ChartView) => void] {
  const [view, setView] = useState<ChartView>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ChartView;
      if (VALID_VIEWS.includes(stored)) return stored;
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
