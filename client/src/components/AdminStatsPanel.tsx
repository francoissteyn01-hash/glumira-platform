/**
 * GluMira™ — AdminStatsPanel.tsx
 *
 * Displays platform-wide stats for the admin dashboard.
 * Uses useAdminStats hook to fetch GET /api/admin/stats.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import React from "react";
import { useAdminStats } from "@/hooks/useAdminStats";

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${accent ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-white"}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-teal-700" : "text-slate-800"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AdminStatsPanelProps {
  className?: string;
}

export function AdminStatsPanel({ className = "" }: AdminStatsPanelProps) {
  const { stats, loading, error, refresh } = useAdminStats();

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-slate-200 bg-white py-12 ${className}`}>
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 ${className}`}>
        {error}
        <button onClick={refresh} className="ml-2 underline text-xs">Retry</button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Platform Overview
        </h2>
        <button
          onClick={refresh}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* User stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total Users"     value={stats.totalUsers}     accent />
        <StatTile label="Active (30d)"    value={stats.activeUsers30d} sub="last 30 days" />
        <StatTile label="Clinicians"      value={stats.clinicianCount} />
        <StatTile label="Pending"         value={stats.pendingCount}   sub="awaiting activation" />
      </div>

      {/* Data stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Glucose Readings" value={stats.totalReadings.toLocaleString()} sub="all time" />
        <StatTile label="Doses Logged"     value={stats.totalDoses.toLocaleString()}    sub="all time" />
        <StatTile label="Meals Logged"     value={stats.totalMeals.toLocaleString()}    sub="all time" />
        <StatTile label="Reports Generated" value={stats.totalReports.toLocaleString()} sub="all time" />
      </div>

      {/* System health */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">System Health</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
            stats.dbHealthy ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${stats.dbHealthy ? "bg-emerald-500" : "bg-red-500"}`} />
            Database {stats.dbHealthy ? "Healthy" : "Degraded"}
          </span>
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
            stats.storageHealthy ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${stats.storageHealthy ? "bg-emerald-500" : "bg-amber-500"}`} />
            Storage {stats.storageHealthy ? "Healthy" : "Degraded"}
          </span>
          <span className="text-slate-400">
            Last checked: {stats.checkedAt ? new Date(stats.checkedAt).toLocaleTimeString() : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdminStatsPanel;
