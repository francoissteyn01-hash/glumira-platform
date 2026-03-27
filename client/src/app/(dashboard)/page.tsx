/**
 * GluMira — Dashboard Home Page
 *
 * Central hub showing current glucose, trend arrow, weekly summary,
 * A1c estimate, and quick-action cards.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useEffect } from "react";

interface DashboardData {
  currentGlucose: { mmol: number; arrow: string; rateLabel: string; urgency: string } | null;
  weeklySummary: { score: number; label: string; tir: number; meanMmol: number } | null;
  a1cEstimate: { eA1cPercent: number; category: string; categoryLabel: string } | null;
  recentAlerts: { id: string; severity: string; message: string; createdAt: string }[];
}

const URGENCY_COLOURS: Record<string, string> = {
  none: "bg-green-50 border-green-200 text-green-700",
  low: "bg-amber-50 border-amber-200 text-amber-700",
  moderate: "bg-orange-50 border-orange-200 text-orange-700",
  high: "bg-red-50 border-red-200 text-red-700",
  urgent: "bg-red-100 border-red-400 text-red-900",
};

export default function DashboardHomePage() {
  const [data, setData] = useState<DashboardData>({
    currentGlucose: null,
    weeklySummary: null,
    a1cEstimate: null,
    recentAlerts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [glucoseRes, weeklyRes, alertsRes] = await Promise.allSettled([
          fetch("/api/glucose/trend").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/analytics/weekly-summary").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/alerts").then((r) => (r.ok ? r.json() : null)),
        ]);

        setData({
          currentGlucose:
            glucoseRes.status === "fulfilled" && glucoseRes.value
              ? {
                  mmol: glucoseRes.value.currentMmol ?? 0,
                  arrow: glucoseRes.value.arrow ?? "→",
                  rateLabel: glucoseRes.value.rateLabel ?? "—",
                  urgency: glucoseRes.value.urgency ?? "none",
                }
              : null,
          weeklySummary:
            weeklyRes.status === "fulfilled" && weeklyRes.value
              ? weeklyRes.value
              : null,
          a1cEstimate: null,
          recentAlerts:
            alertsRes.status === "fulfilled" && alertsRes.value?.alerts
              ? alertsRes.value.alerts.slice(0, 5)
              : [],
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const glucose = data.currentGlucose;
  const weekly = data.weeklySummary;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Current Glucose Hero */}
      <div
        className={`rounded-2xl border p-6 ${
          glucose ? URGENCY_COLOURS[glucose.urgency] || URGENCY_COLOURS.none : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-60">Current Glucose</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold">
                {glucose ? glucose.mmol.toFixed(1) : "—"}
              </span>
              <span className="text-lg opacity-70">mmol/L</span>
              <span className="text-3xl ml-2">{glucose?.arrow ?? "→"}</span>
            </div>
            <p className="text-sm mt-1 opacity-70">{glucose?.rateLabel ?? "No data"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-50">Updated</p>
            <p className="text-sm font-medium">Just now</p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* TIR */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-400 uppercase">Time in Range</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {weekly ? `${weekly.tir.toFixed(0)}%` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Target: 70%+</p>
        </div>

        {/* Mean Glucose */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-400 uppercase">Mean Glucose</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {weekly ? `${weekly.meanMmol.toFixed(1)}` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">mmol/L (7-day)</p>
        </div>

        {/* Weekly Score */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-400 uppercase">Weekly Score</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {weekly ? `${weekly.score}/100` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{weekly?.label ?? "—"}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Log Meal", href: "/meals", icon: "🍽" },
          { label: "Log Dose", href: "/doses", icon: "💉" },
          { label: "Bolus Calc", href: "/bolus-calculator", icon: "🧮" },
          { label: "Export Data", href: "/glucose-trend", icon: "📊" },
        ].map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="rounded-xl border border-gray-200 bg-white p-3 text-center hover:bg-gray-50 transition-colors"
          >
            <span className="text-xl">{action.icon}</span>
            <p className="text-xs font-medium text-gray-600 mt-1">{action.label}</p>
          </a>
        ))}
      </div>

      {/* Recent Alerts */}
      {data.recentAlerts.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Alerts</h3>
          <div className="space-y-2">
            {data.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0"
              >
                <span className="text-gray-600">{alert.message}</span>
                <span className="text-xs text-gray-400">
                  {new Date(alert.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-300 text-center">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
      </p>
    </div>
  );
}
