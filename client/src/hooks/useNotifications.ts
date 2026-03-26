/**
 * GluMira™ — useNotifications.ts
 *
 * React hook for fetching and managing in-app notifications.
 * Polls every 30 seconds for new notifications.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "hypo_risk"
  | "high_iob"
  | "stacking_alert"
  | "nightscout_sync"
  | "school_care_plan"
  | "beta_feedback"
  | "system";

export type NotificationSeverity = "info" | "warning" | "critical";

export interface GluMiraNotification {
  id: string;
  userId: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  dismissedAt: string | null;
  metadata?: Record<string, unknown>;
}

interface UseNotificationsResult {
  notifications: GluMiraNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  markAllRead: () => Promise<void>;
}

const POLL_INTERVAL_MS = 30_000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(unreadOnly = false): UseNotificationsResult {
  const [notifications, setNotifications] = useState<GluMiraNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    const url = unreadOnly
      ? "/api/notifications?unread=true"
      : "/api/notifications";

    fetch(url, { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<{
          notifications: GluMiraNotification[];
          unreadCount: number;
        }>;
      })
      .then(({ notifications: n, unreadCount: uc }) => {
        setNotifications(n);
        setUnreadCount(uc);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message ?? "Failed to load notifications");
        setLoading(false);
      });

    return () => ctrl.abort();
  }, [refreshKey, unreadOnly]);

  // ── Poll ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // ── Mark all read ──────────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read" }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      // Silent — UI will refresh on next poll
    }
  }, []);

  return { notifications, unreadCount, loading, error, refresh, markAllRead };
}

export default useNotifications;
