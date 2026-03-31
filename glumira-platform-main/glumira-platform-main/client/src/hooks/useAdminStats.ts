/**
 * GluMira™ — useAdminStats hook
 *
 * Fetches platform statistics from GET /api/admin/stats
 * for the admin dashboard.
 *
 * Usage:
 *   const { stats, loading, error, refresh } = useAdminStats();
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  patientCount: number;
  clinicianCount: number;
  adminCount: number;
  totalReadings: number;
  readingsLast7d: number;
  totalDoses: number;
  dosesLast7d: number;
  totalFeedback: number;
  avgFeedbackRating: number;
  betaParticipants: number;
  activeBetaParticipants: number;
  healthStatus: {
    database: "ok" | "degraded" | "down";
    nightscout: "ok" | "degraded" | "down" | "unconfigured";
    lastChecked: string;
  };
  generatedAt: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseAdminStatsResult {
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAdminStats(
  /** Auto-refresh interval in milliseconds. 0 = no auto-refresh. */
  refreshInterval = 0
): UseAdminStatsResult {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Fetch
  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    fetch("/api/admin/stats", { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<AdminStats>;
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message ?? "Failed to load admin stats");
        setLoading(false);
      });

    return () => ctrl.abort();
  }, [refreshKey]);

  // Auto-refresh
  useEffect(() => {
    if (!refreshInterval || refreshInterval < 5000) return;
    const id = setInterval(refresh, refreshInterval);
    return () => clearInterval(id);
  }, [refresh, refreshInterval]);

  return { stats, loading, error, refresh };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Colour class for health status badge */
export function healthColour(status: "ok" | "degraded" | "down" | "unconfigured"): string {
  switch (status) {
    case "ok":           return "text-emerald-600 bg-emerald-50";
    case "degraded":     return "text-amber-600 bg-amber-50";
    case "down":         return "text-red-600 bg-red-50";
    case "unconfigured": return "text-slate-500 bg-slate-100";
  }
}

/** Format large numbers with commas */
export function formatCount(n: number): string {
  return n.toLocaleString("en-ZA");
}

/** Format average rating as stars string */
export function formatRating(avg: number): string {
  const full = Math.floor(avg);
  const half = avg - full >= 0.5;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - (half ? 1 : 0));
}

export default useAdminStats;
