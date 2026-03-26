/**
 * GluMira™ — Alerts Dashboard Page
 *
 * Displays all active glucose alerts with severity filtering.
 * Includes hypo risk score summary at the top.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState } from "react";
import { useGlucoseAlerts, alertSeverityColour, alertTypeIcon } from "@/hooks/useGlucoseAlerts";

type Filter = "all" | "critical" | "warning" | "info";

export default function AlertsPage() {
  const { alerts, loading, error, refresh, dismiss, dismissAll } = useGlucoseAlerts();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);

  const counts = {
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning:  alerts.filter((a) => a.severity === "warning").length,
    info:     alerts.filter((a) => a.severity === "info").length,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Glucose Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time threshold monitoring</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh
          </button>
          {alerts.length > 0 && (
            <button
              onClick={dismissAll}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Dismiss all
            </button>
          )}
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3">
        {(["critical", "warning", "info"] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilter(sev === filter ? "all" : sev)}
            className={`rounded-xl border p-3 text-left transition-all ${
              filter === sev ? alertSeverityColour(sev) : "bg-white border-gray-200"
            }`}
          >
            <p className="text-xs text-gray-500 capitalize">{sev}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{counts[sev]}</p>
          </button>
        ))}
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
          <p className="text-green-700 font-medium">No {filter === "all" ? "" : filter} alerts</p>
          <p className="text-sm text-green-500 mt-1">All readings within threshold</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert, i) => {
            const colourClass = alertSeverityColour(alert.severity);
            const icon = alertTypeIcon(alert.type);
            const time = new Date(alert.recordedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div
                key={`${alert.type}-${i}`}
                className={`flex items-start gap-3 rounded-xl border p-4 ${colourClass}`}
              >
                <span className="text-lg font-bold shrink-0 mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs opacity-70">{alert.glucoseMmol.toFixed(1)} mmol/L</span>
                    <span className="text-xs opacity-40">·</span>
                    <span className="text-xs opacity-70">{time}</span>
                    {alert.actionRequired && (
                      <span className="text-xs font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                        Action required
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismiss(i)}
                  className="text-xs opacity-40 hover:opacity-80 shrink-0"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-300 text-center">
        GluMira™ is an informational tool only. Not a medical device.
      </p>
    </div>
  );
}
