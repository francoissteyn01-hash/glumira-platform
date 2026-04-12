import React, { useState, useCallback } from 'react';

/**
 * ChartView — clinical only. Mountains/kids views removed.
 */
export type ChartView = 'clinical';

type ChartViewToggleProps = {
  view: ChartView;
  onChange: (view: ChartView) => void;
}

/**
 * With only one view, this renders nothing.
 * Kept as a component so existing imports don't break.
 */
const ChartViewToggle: React.FC<ChartViewToggleProps> = () => null;

export function useChartView(_defaultView: ChartView = 'clinical'): [ChartView, (v: ChartView) => void] {
  const [view, setView] = useState<ChartView>('clinical');
  const set = useCallback((_v: ChartView) => {
    setView('clinical');
  }, []);
  return [view, set];
}

export default ChartViewToggle;
