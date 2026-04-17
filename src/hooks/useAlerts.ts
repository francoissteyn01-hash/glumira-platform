/**
 * GluMira™ V7 — useAlerts hook
 *
 * Fetches active glucose alerts from the server, then persists dismiss and
 * snooze actions to the server as the source of truth. localStorage is a
 * fast-path cache so the UI stays responsive offline — but on reconnect the
 * server wins.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";

export type Severity  = "info" | "warning" | "critical";
export type AlertType = "hypo" | "hyper" | "stacking" | "rising_fast" | "falling_fast";

export type ActiveAlert = {
  id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  body: string;
  triggeredAt: string;
  dismissedAt?: string | null;
  snoozedUntil?: string | null;
  metadata?: Record<string, unknown>;
};

type AlertsResponse = {
  ok: boolean;
  alerts: ActiveAlert[];
  computedAt: string;
};

const POLL_INTERVAL_MS = 30_000;
const DISMISSED_KEY    = "glumira.alerts.dismissed";
const SNOOZED_KEY      = "glumira.alerts.snoozed";

export const SNOOZE_OPTIONS: Array<{ label: string; ms: number }> = [
  { label: "15 min", ms: 15  * 60_000 },
  { label: "1 hour", ms: 60  * 60_000 },
  { label: "4 hours", ms: 240 * 60_000 },
];

/* ─── localStorage cache helpers ─────────────────────────────────────────── */
function readCache(key: string): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(key) || "{}") as Record<string, string>; }
  catch { return {}; }
}
function writeCache(key: string, value: Record<string, string>): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / SSR */ }
}

export function useAlerts() {
  const { session } = useAuth();
  const [data,    setData]    = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // Optimistic local caches — server is source of truth on each poll
  const [dismissed, setDismissed] = useState<Record<string, string>>(() => readCache(DISMISSED_KEY));
  const [snoozed,   setSnoozed]   = useState<Record<string, string>>(() => readCache(SNOOZED_KEY));

  const pollRef = useRef<number | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API}/api/alerts`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = (await res.json()) as AlertsResponse;

      // Server-side dismissals / snoozes win: merge into local cache
      const serverDismissed: Record<string, string> = {};
      const serverSnoozed:   Record<string, string> = {};
      for (const a of json.alerts) {
        if (a.dismissedAt) serverDismissed[a.id] = a.dismissedAt;
        if (a.snoozedUntil) serverSnoozed[a.id]  = a.snoozedUntil;
      }
      setDismissed(prev => {
        const merged = { ...prev, ...serverDismissed };
        writeCache(DISMISSED_KEY, merged);
        return merged;
      });
      setSnoozed(prev => {
        const merged = { ...prev, ...serverSnoozed };
        writeCache(SNOOZED_KEY, merged);
        return merged;
      });

      setData(json);
      setError(null);
    } catch (e) {
      setError((e as Error)?.message ?? "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchAlerts();
    pollRef.current = window.setInterval(fetchAlerts, POLL_INTERVAL_MS);
    return () => { if (pollRef.current != null) window.clearInterval(pollRef.current); };
  }, [fetchAlerts]);

  /* ─── Derived: apply dismiss + snooze filters ──────────────────────────── */
  const visibleAlerts = useMemo(() => {
    if (!data) return [];
    const now = Date.now();
    return data.alerts.filter((a) => {
      if (dismissed[a.id]) return false;
      const snoozeUntil = snoozed[a.id];
      if (snoozeUntil && new Date(snoozeUntil).getTime() > now) return false;
      return true;
    });
  }, [data, dismissed, snoozed]);

  /* ─── Actions — optimistic UI, then persist to server ─────────────────── */
  const dismiss = useCallback(async (alertId: string) => {
    const now = new Date().toISOString();
    // Optimistic
    setDismissed(prev => {
      const next = { ...prev, [alertId]: now };
      writeCache(DISMISSED_KEY, next);
      return next;
    });
    if (!session) return;
    try {
      await fetch(`${API}/api/alerts/dismiss`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alertId }),
      });
    } catch {
      // Optimistic already applied; server will sync on next poll
    }
  }, [session]);

  const snooze = useCallback(async (alertId: string, ms: number) => {
    const untilIso = new Date(Date.now() + ms).toISOString();
    // Optimistic
    setSnoozed(prev => {
      const next = { ...prev, [alertId]: untilIso };
      writeCache(SNOOZED_KEY, next);
      return next;
    });
    if (!session) return;
    try {
      await fetch(`${API}/api/alerts/snooze`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alertId, untilIso }),
      });
    } catch {
      // Optimistic already applied; server will sync on next poll
    }
  }, [session]);

  return { visibleAlerts, loading, error, dismiss, snooze };
}
