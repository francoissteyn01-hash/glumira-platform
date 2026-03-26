/**
 * GluMira™ — Admin Audit Log Page
 *
 * Displays the HMAC-chained audit log for admin users.
 * Fetches from GET /api/admin/audit with pagination.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import React, { useState } from "react";
import { useAuditLog } from "@/hooks/useAuditLog";

// ─── Risk badge ───────────────────────────────────────────────────────────────

function RiskBadge({ risk }: { risk: string }) {
  const colours: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high:     "bg-orange-100 text-orange-700 border-orange-200",
    medium:   "bg-amber-100 text-amber-700 border-amber-200",
    low:      "bg-green-100 text-green-700 border-green-200",
  };
  const cls = colours[risk.toLowerCase()] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {risk}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAuditPage() {
  const [limit, setLimit] = useState(50);
  const { entries, loading, error, refresh, chainValid } = useAuditLog(limit);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Log</h1>
          <p className="mt-1 text-sm text-slate-500">
            HMAC-chained security audit trail — tamper-evident.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Chain integrity badge */}
          {chainValid !== undefined && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                chainValid
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${chainValid ? "bg-green-500" : "bg-red-500"}`}
              />
              {chainValid ? "Chain Intact" : "Chain Broken"}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Limit selector */}
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        <span>Show last</span>
        {[25, 50, 100, 200].map((n) => (
          <button
            key={n}
            onClick={() => setLimit(n)}
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              limit === n
                ? "bg-teal-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {n}
          </button>
        ))}
        <span>entries</span>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        </div>
      )}

      {/* Table */}
      {!loading && entries.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Time</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Actor</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Resource</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Risk</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entries.map((entry, i) => (
                <tr key={entry.id ?? i} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {entry.action}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {entry.actorId ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {entry.resourceType ?? "—"}
                    {entry.resourceId ? (
                      <span className="ml-1 font-mono text-xs text-slate-400">
                        {entry.resourceId.slice(0, 8)}…
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {entry.riskLevel ? <RiskBadge risk={entry.riskLevel} /> : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {entry.ipAddress ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">No audit log entries found.</p>
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400">
        GluMira™ is an informational tool only. Not a medical device.
      </p>
    </div>
  );
}
