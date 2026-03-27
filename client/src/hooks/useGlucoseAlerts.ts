/**
 * GluMira™ — useGlucoseAlerts hook
 *
 * Fetches active glucose alerts from GET /api/alerts with 60s polling.
 * Returns alerts, unread count, and dismiss/acknowledge helpers.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertType =
  | "hypo" | "hyper"
  | "rapid-rise" | "rapid-fall"
  | "nocturnal-hypo" | "nocturnal-hyper"
  | "missed-reading"
  | "persistent-hyper" | "persistent-hypo";

export interface GlucoseAlert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  glucoseMmol: number;
  recordedAt: string;
  actionRequired: boolean;
}

interface AlertsResponse {
  alerts: GlucoseAlert[];
  total: number;
}

interface UseGlucoseAlertsReturn {
  alerts: GlucoseAlert[];
  criticalAlerts: GlucoseAlert[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  dismiss: (index: number) => void;
  dismissAll: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function alertSeverityColour(severity: AlertSeverity): string {
  switch (severity) {
    case "critical": return "text-red-600 bg-red-50 border-red-200";
    case "warning":  return "text-amber-700 bg-amber-50 border-amber-200";
    default:         return "text-blue-700 bg-blue-50 border-blue-200";
  }
}

export function alertTypeIcon(type: AlertType): string {
  switch (type) {
    case "hypo":
    case "nocturnal-hypo":
    case "persistent-hypo":  return "↓";
    case "hyper":
    case "nocturnal-hyper":
    case "persistent-hyper": return "↑";
    case "rapid-rise":       return "⬆";
    case "rapid-fall":       return "⬇";
    case "missed-reading":   return "⏱";
    default:                 return "!";
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000; // 60 seconds

export function useGlucoseAlerts(): UseGlucoseAlertsReturn {
  const [alerts, setAlerts] = useState<GlucoseAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts?limit=50");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data: AlertsResponse = await res.json();
      setAlerts(data.alerts);
      setDismissed(new Set()); // reset dismissed on fresh fetch
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    timerRef.current = setInterval(fetchAlerts, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchAlerts]);

  const visibleAlerts = alerts.filter((_, i) => !dismissed.has(i));
  const criticalAlerts = visibleAlerts.filter((a) => a.severity === "critical");

  const dismiss = useCallback((index: number) => {
    setDismissed((prev) => new Set([...prev, index]));
  }, []);

  const dismissAll = useCallback(() => {
    setDismissed(new Set(alerts.map((_, i) => i)));
  }, [alerts]);

  return {
    alerts: visibleAlerts,
    criticalAlerts,
    unreadCount: visibleAlerts.length,
    loading,
    error,
    refresh: fetchAlerts,
    dismiss,
    dismissAll,
  };
}
