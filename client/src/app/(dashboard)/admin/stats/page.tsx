/**
 * GluMira™ — Admin Stats Page
 *
 * Platform-wide statistics for admin users.
 * Displays user counts, active sessions, glucose log volume, and system health.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import React from "react";
import { AdminStatsPanel } from "@/components/AdminStatsPanel";

export default function AdminStatsPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Platform Statistics</h1>
        <p className="text-sm text-slate-400">Real-time platform health and usage metrics</p>
      </div>

      {/* Stats panel */}
      <AdminStatsPanel />

      {/* Disclaimer */}
      <p className="text-center text-xs text-slate-400">
        GluMira™ is an informational tool only. Not a medical device.
        Admin access is logged and audited.
      </p>
    </div>
  );
}
