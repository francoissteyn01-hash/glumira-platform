/**
 * GluMira™ V7 — Alert Notification Center
 *
 * Stacked notification panel that polls /api/alerts every 30s and displays
 * active glucose-aware alerts (hypo, hyper, fast trend, stacking). Each
 * alert can be dismissed or snoozed; both actions persist client-side in
 * localStorage so the choice is honoured per-device across sessions.
 *
 * The server endpoints (POST /api/alerts/dismiss, PUT /api/alerts/snooze)
 * are called for telemetry but the source of truth for "what's hidden"
 * lives in localStorage to survive server restarts and offline use.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";

type Severity = "info" | "warning" | "critical";
type AlertType = "hypo" | "hyper" | "stacking" | "rising_fast" | "falling_fast";

type ActiveAlert = {
  id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  body: string;
  triggeredAt: string;
  metadata?: Record<string, unknown>;
}

type AlertsResponse = {
  ok: boolean;
  alerts: ActiveAlert[];
  computedAt: string;
}

const POLL_INTERVAL_MS = 30_000;
const DISMISSED_KEY    = "glumira.alerts.dismissed";
const SNOOZED_KEY      = "glumira.alerts.snoozed";
const SNOOZE_OPTIONS: Array<{ label: string; ms: number }> = [
  { label: "15 min", ms: 15  * 60_000 },
  { label: "1 hour", ms: 60  * 60_000 },
  { label: "4 hours", ms: 240 * 60_000 },
];

const SEVERITY_COLOUR: Record<Severity, string> = {
  info:     "#3b82f6",
  warning:  "#f59e0b",
  critical: "#ef4444",
};

/* ─── localStorage helpers ───────────────────────────────────────────────── */
function readMap(key: string): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(key) || "{}") as Record<string, string>; }
  catch { return {}; }
}
function writeMap(key: string, value: Record<string, string>): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / SSR */ }
}

export default function AlertNotificationCenter() {
  const { session } = useAuth();
  const [data, setData]       = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Record<string, string>>(() => readMap(DISMISSED_KEY));
  const [snoozed,   setSnoozed]   = useState<Record<string, string>>(() => readMap(SNOOZED_KEY));
  const [openSnoozeFor, setOpenSnoozeFor] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API}/api/alerts`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = (await res.json()) as AlertsResponse;
      setData(json);
      setError(null);
    } catch (e) {
      setError((e as Error)?.message ?? "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Initial fetch + polling
  useEffect(() => {
    fetchAlerts();
    pollRef.current = window.setInterval(fetchAlerts, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current != null) window.clearInterval(pollRef.current);
    };
  }, [fetchAlerts]);

  /* ─── Derived: filter dismissed + still-snoozed ──────────────────────── */
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

  /* ─── Actions ────────────────────────────────────────────────────────── */
  const handleDismiss = useCallback(async (alertId: string) => {
    const next = { ...dismissed, [alertId]: new Date().toISOString() };
    setDismissed(next);
    writeMap(DISMISSED_KEY, next);
    if (!session) return;
    fetch(`${API}/api/alerts/dismiss`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ alertId }),
    }).catch(() => { /* telemetry only */ });
  }, [dismissed, session]);

  const handleSnooze = useCallback(async (alertId: string, ms: number) => {
    const untilIso = new Date(Date.now() + ms).toISOString();
    const next = { ...snoozed, [alertId]: untilIso };
    setSnoozed(next);
    writeMap(SNOOZED_KEY, next);
    setOpenSnoozeFor(null);
    if (!session) return;
    fetch(`${API}/api/alerts/snooze`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ alertId, untilIso }),
    }).catch(() => { /* telemetry only */ });
  }, [snoozed, session]);

  /* ─── Card chrome ────────────────────────────────────────────────────── */
  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    borderRadius: 12,
    border: "1px solid var(--border-light)",
    padding: 16,
  };

  const headerRow = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
      <h3 style={{
        margin: 0, fontSize: 16, fontWeight: 700,
        color: "var(--text-primary)", fontFamily: "'Playfair Display', serif",
      }}>
        Alerts
      </h3>
      <span style={{
        fontSize: 10, fontWeight: 600, color: "var(--text-faint)",
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
      }}>
        {visibleAlerts.length > 0 ? `${visibleAlerts.length} ACTIVE` : "ALL CLEAR"}
      </span>
    </div>
  );

  if (loading && !data) {
    return (
      <div style={cardStyle} aria-busy="true">
        {headerRow}
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Loading…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={cardStyle} role="alert">
        {headerRow}
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Unable to load alerts.
        </p>
      </div>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <div style={cardStyle}>
        {headerRow}
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          No active alerts. Your data looks steady.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      {headerRow}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visibleAlerts.map((alert) => {
          const colour = SEVERITY_COLOUR[alert.severity];
          const isOpen = openSnoozeFor === alert.id;
          return (
            <div
              key={alert.id}
              role="alert"
              aria-label={alert.title}
              style={{
                borderLeft: `4px solid ${colour}`,
                background: colour + "0F",
                borderRadius: 8,
                padding: "10px 12px",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 13, fontWeight: 700,
                    color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}>
                    {alert.title}
                  </p>
                  <p style={{
                    margin: "2px 0 0", fontSize: 12, lineHeight: 1.4,
                    color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}>
                    {alert.body}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                  <button type="button"
                    onClick={() => setOpenSnoozeFor(isOpen ? null : alert.id)}
                    style={iconBtn}
                    aria-label={`Snooze ${alert.title}`}
                  >
                    Snooze
                  </button>
                  <button type="button"
                    onClick={() => handleDismiss(alert.id)}
                    style={{ ...iconBtn, color: colour }}
                    aria-label={`Dismiss ${alert.title}`}
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {isOpen && (
                <div style={{
                  marginTop: 8, paddingTop: 8,
                  borderTop: "1px solid var(--border-light)",
                  display: "flex", gap: 6,
                }}>
                  {SNOOZE_OPTIONS.map((opt) => (
                    <button type="button" key={opt.label}
                      onClick={() => handleSnooze(alert.id, opt.ms)}
                      style={snoozeOptBtn}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{
        margin: "10px 0 0", fontSize: 10, color: "var(--text-faint)",
        fontFamily: "'DM Sans', system-ui, sans-serif", textAlign: "right",
      }}>
        Updates every 30s · educational only
      </p>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--border-light)",
  borderRadius: 6,
  padding: "3px 8px",
  fontSize: 10,
  fontWeight: 600,
  color: "var(--text-secondary)",
  fontFamily: "'DM Sans', system-ui, sans-serif",
  cursor: "pointer",
  minHeight: 24,
};

const snoozeOptBtn: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-light)",
  borderRadius: 6,
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-primary)",
  fontFamily: "'DM Sans', system-ui, sans-serif",
  cursor: "pointer",
};
