/**
 * GluMira™ — GlucoseAlertBadge component
 *
 * Compact alert badge for the navigation bar.
 * Shows unread count with severity colour coding.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useGlucoseAlerts, alertTypeIcon, alertSeverityColour } from "@/hooks/useGlucoseAlerts";

// ─── Nav badge ────────────────────────────────────────────────────────────────

export function GlucoseAlertNavBadge() {
  const { unreadCount, criticalAlerts } = useGlucoseAlerts();

  if (unreadCount === 0) return null;

  const hasCritical = criticalAlerts.length > 0;

  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
        hasCritical ? "bg-red-600 text-white" : "bg-amber-500 text-white"
      }`}
    >
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  );
}

// ─── Alert list item ──────────────────────────────────────────────────────────

interface AlertItemProps {
  message: string;
  severity: "info" | "warning" | "critical";
  type: string;
  glucoseMmol: number;
  recordedAt: string;
  actionRequired: boolean;
  onDismiss: () => void;
}

export function GlucoseAlertItem({
  message,
  severity,
  type,
  glucoseMmol,
  recordedAt,
  actionRequired,
  onDismiss,
}: AlertItemProps) {
  const colourClass = alertSeverityColour(severity);
  const icon = alertTypeIcon(type as Parameters<typeof alertTypeIcon>[0]);
  const time = new Date(recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${colourClass}`}>
      <span className="text-lg font-bold mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs opacity-70">{glucoseMmol.toFixed(1)} mmol/L</span>
          <span className="text-xs opacity-50">·</span>
          <span className="text-xs opacity-70">{time}</span>
          {actionRequired && (
            <span className="text-xs font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
              Action required
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-xs opacity-50 hover:opacity-100 shrink-0 mt-0.5"
        aria-label="Dismiss alert"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Full alert panel ─────────────────────────────────────────────────────────

export function GlucoseAlertPanel() {
  const { alerts, loading, error, dismiss, dismissAll } = useGlucoseAlerts();

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700 text-center">
        No active alerts — all readings within range
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-500">{alerts.length} active alert{alerts.length !== 1 ? "s" : ""}</p>
        <button
          onClick={dismissAll}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Dismiss all
        </button>
      </div>
      {alerts.map((alert, i) => (
        <GlucoseAlertItem
          key={`${alert.type}-${alert.recordedAt}-${i}`}
          {...alert}
          onDismiss={() => dismiss(i)}
        />
      ))}
    </div>
  );
}
