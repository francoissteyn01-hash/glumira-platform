/**
 * GluMira™ — useDoseHistory.ts
 *
 * React hook for fetching extended dose history grouped by day.
 * Wraps GET /api/doses/history?days=N.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { useState, useEffect, useCallback } from "react";
import type { DoseRecord } from "@/server/doses/dose-log";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayGroup {
  date: string;
  doses: DoseRecord[];
  totalUnits: number;
  bolusUnits: number;
  basalUnits: number;
  correctionUnits: number;
}

export interface DoseHistoryData {
  ok: boolean;
  days: number;
  totalDoses: number;
  totalUnits: number;
  groups: DayGroup[];
}

interface UseDoseHistoryResult {
  data: DoseHistoryData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDoseHistory(days = 7): UseDoseHistoryResult {
  const [data, setData] = useState<DoseHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/doses/history?days=${days}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<DoseHistoryData>;
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load dose history");
        setLoading(false);
      });
  }, [refreshKey, days]);

  return { data, loading, error, refresh };
}

export default useDoseHistory;
