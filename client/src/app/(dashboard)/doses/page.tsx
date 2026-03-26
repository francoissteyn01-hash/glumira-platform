/**
 * GluMira™ Dose Log Page
 * Version: 7.0.0
 *
 * Displays:
 *  - Quick log form (insulin type, dose type, units, time, notes)
 *  - Active IOB summary card with per-dose breakdown
 *  - Dose history table (last 24h)
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState } from "react";
import { useDoses } from "@/hooks/useDoses";

// ─── Insulin type options ─────────────────────────────────────

const INSULIN_TYPES = ["NovoRapid", "Humalog", "Apidra", "Fiasp", "Tresiba", "Lantus"] as const;
const DOSE_TYPES = ["bolus", "correction", "basal"] as const;

const INSULIN_COLOURS: Record<string, string> = {
  NovoRapid: "bg-blue-100 text-blue-800",
  Humalog:   "bg-purple-100 text-purple-800",
  Apidra:    "bg-green-100 text-green-800",
  Fiasp:     "bg-orange-100 text-orange-800",
  Tresiba:   "bg-slate-100 text-slate-800",
  Lantus:    "bg-gray-100 text-gray-800",
};

const DOSE_TYPE_COLOURS: Record<string, string> = {
  bolus:      "bg-teal-100 text-teal-800",
  correction: "bg-amber-100 text-amber-800",
  basal:      "bg-indigo-100 text-indigo-800",
};

// ─── IOB Risk colour ──────────────────────────────────────────

function iobRiskColour(iob: number): string {
  if (iob >= 8) return "text-red-600";
  if (iob >= 5) return "text-amber-600";
  if (iob >= 2) return "text-yellow-600";
  return "text-green-600";
}

// ─── Page ─────────────────────────────────────────────────────

export default function DosesPage() {
  const { doses, iobSummary, loading, error, logDose, deleteDose, refresh } = useDoses(24);

  const [form, setForm] = useState({
    insulinType: "NovoRapid" as (typeof INSULIN_TYPES)[number],
    doseType: "bolus" as (typeof DOSE_TYPES)[number],
    units: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const units = parseFloat(form.units);
    if (isNaN(units) || units <= 0 || units > 100) {
      setFormError("Units must be between 0.1 and 100.");
      return;
    }

    setSubmitting(true);
    try {
      await logDose({
        insulinType: form.insulinType,
        doseType: form.doseType,
        units,
        notes: form.notes || undefined,
      });
      setForm((f) => ({ ...f, units: "", notes: "" }));
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to log dose");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dose Log</h1>
        <p className="text-sm text-gray-500 mt-1">
          IOB Hunter™ — biexponential insulin-on-board tracking
        </p>
      </div>

      {/* Active IOB Card */}
      {iobSummary && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Active IOB</h2>
            <button
              onClick={refresh}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className={`text-4xl font-bold ${iobRiskColour(iobSummary.totalIob)}`}>
              {iobSummary.totalIob.toFixed(2)}
            </span>
            <span className="text-lg text-gray-500">U</span>
          </div>

          {iobSummary.doses.length > 0 ? (
            <div className="space-y-2">
              {iobSummary.doses.map((d) => (
                <div
                  key={d.doseId}
                  className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${INSULIN_COLOURS[d.insulinType] ?? "bg-gray-100"}`}>
                      {d.insulinType}
                    </span>
                    <span>{d.units}U</span>
                    <span className="text-gray-400">({d.minutesElapsed}m ago)</span>
                  </div>
                  <span className={`font-semibold ${iobRiskColour(d.remainingIob)}`}>
                    {d.remainingIob.toFixed(2)}U remaining
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No active insulin on board.</p>
          )}

          <p className="text-xs text-gray-400 mt-3">
            Computed at {new Date(iobSummary.computedAt).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Log Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Log a Dose</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Insulin Type
              </label>
              <select
                value={form.insulinType}
                onChange={(e) => setForm((f) => ({ ...f, insulinType: e.target.value as typeof form.insulinType }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {INSULIN_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dose Type
              </label>
              <select
                value={form.doseType}
                onChange={(e) => setForm((f) => ({ ...f, doseType: e.target.value as typeof form.doseType }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {DOSE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Units (U)
              </label>
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.5"
                value={form.units}
                onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
                placeholder="e.g. 4.0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Pre-meal"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
          )}
          {formSuccess && (
            <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              Dose logged successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
          >
            {submitting ? "Logging…" : "Log Dose"}
          </button>
        </form>
      </div>

      {/* Dose History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Last 24 Hours ({doses.length} doses)
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : doses.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No doses logged in the last 24 hours.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Time</th>
                  <th className="text-left pb-2 font-medium">Insulin</th>
                  <th className="text-left pb-2 font-medium">Type</th>
                  <th className="text-right pb-2 font-medium">Units</th>
                  <th className="text-left pb-2 font-medium">Notes</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {doses.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="py-2 text-gray-600">
                      {new Date(d.administeredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${INSULIN_COLOURS[d.insulinType] ?? "bg-gray-100"}`}>
                        {d.insulinType}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DOSE_TYPE_COLOURS[d.doseType] ?? "bg-gray-100"}`}>
                        {d.doseType}
                      </span>
                    </td>
                    <td className="py-2 text-right font-semibold text-gray-800">{d.units}U</td>
                    <td className="py-2 text-gray-500">{d.notes ?? "—"}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => deleteDose(d.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        aria-label="Delete dose"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        GluMira™ is an informational tool only. Not a medical device. Always consult your healthcare provider.
      </p>
    </div>
  );
}
