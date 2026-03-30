/**
 * GluMira™ V7 — client/src/pages/DashboardPage.tsx
 */

import { useAuth } from "../hooks/useAuth";
import { timeAgo, formatGlucose, glucoseStatus } from "../lib/utils";
import { DISCLAIMER } from "../lib/constants";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#f8f9fa]">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-[#1a2a5e]">
              Dashboard
            </h1>
            <p className="text-sm text-[#718096] dark:text-[#718096]">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </p>
          </div>
        </div>

        {/* Medical disclaimer */}
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3">
          <p className="text-xs text-amber-800 dark:text-amber-300">{DISCLAIMER}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Latest Glucose" value="—" unit="mmol/L" />
          <StatCard label="Active Insulin" value="—" unit="U IOB" />
          <StatCard label="Today's Doses" value="—" unit="logged" />
        </div>

        {/* Placeholder for chart */}
        <div className="rounded-xl border border-gray-200 dark:border-[#e2e8f0] bg-white dark:bg-white p-6 h-48 flex items-center justify-center">
          <p className="text-sm text-[#718096]">Glucose trend chart — connect Nightscout to populate</p>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#e2e8f0] bg-white dark:bg-white p-5">
      <p className="text-xs text-[#718096] dark:text-[#718096] uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-[#1a2a5e]">{value}</p>
      <p className="text-xs text-[#718096]">{unit}</p>
    </div>
  );
}
