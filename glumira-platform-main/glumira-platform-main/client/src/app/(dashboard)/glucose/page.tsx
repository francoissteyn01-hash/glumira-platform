/**
 * GluMira™ Glucose Log Page
 * Version: 7.0.0
 *
 * Displays:
 *  - Manual glucose entry form (mmol/L or mg/dL, source, notes)
 *  - Current reading badge with colour classification
 *  - 24h history table with colour-coded rows
 *  - Mini sparkline of last 20 readings
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────

interface GlucoseReading {
  id: string;
  glucose: number;
  unit: "mmol/L" | "mg/dL";
  source: string;
  recorded_at: string;
  notes?: string;
}

// ─── Glucose classification ───────────────────────────────────

function classifyGlucose(mmol: number): { label: string; colour: string; bg: string } {
  if (mmol < 3.0)  return { label: "Very Low",  colour: "text-red-700",    bg: "bg-red-50" };
  if (mmol < 3.9)  return { label: "Low",        colour: "text-orange-700", bg: "bg-orange-50" };
  if (mmol <= 10.0) return { label: "In Range",  colour: "text-green-700",  bg: "bg-green-50" };
  if (mmol < 14.0) return { label: "High",       colour: "text-amber-700",  bg: "bg-amber-50" };
  return               { label: "Very High",  colour: "text-purple-700", bg: "bg-purple-50" };
}

// ─── Mini Sparkline (SVG) ─────────────────────────────────────

function Sparkline({ readings }: { readings: GlucoseReading[] }) {
  if (readings.length < 2) return null;
  const vals = readings.slice(0, 20).reverse().map((r) => r.glucose);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 120, H = 32, pad = 2;
  const pts = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (v - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-70">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="#0D9488"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────

const SOURCES = ["manual", "nightscout", "cgm", "import"] as const;

export default function GlucosePage() {
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    glucose: "",
    unit: "mmol/L" as "mmol/L" | "mg/dL",
    source: "manual" as (typeof SOURCES)[number],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const fetchReadings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/readings?limit=100");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReadings(data.readings ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load readings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReadings(); }, [fetchReadings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const val = parseFloat(form.glucose);
    if (isNaN(val) || val <= 0) {
      setFormError("Enter a valid glucose value.");
      return;
    }

    // Convert to mmol/L if needed
    const mmol = form.unit === "mg/dL" ? +(val / 18.0182).toFixed(2) : val;
    if (mmol < 1.0 || mmol > 33.3) {
      setFormError("Value out of physiological range.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          glucose: mmol,
          unit: "mmol/L",
          source: form.source,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      setForm((f) => ({ ...f, glucose: "", notes: "" }));
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
      fetchReadings();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to log reading");
    } finally {
      setSubmitting(false);
    }
  };

  const latest = readings[0];
  const latestClass = latest ? classifyGlucose(latest.glucose) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Glucose Log</h1>
          <p className="text-sm text-gray-500 mt-1">Manual entry and CGM history</p>
        </div>
        {latest && latestClass && (
          <div className={`rounded-xl px-4 py-3 text-right ${latestClass.bg}`}>
            <p className="text-xs text-gray-500">Latest</p>
            <p className={`text-2xl font-bold ${latestClass.colour}`}>
              {latest.glucose.toFixed(1)}
            </p>
            <p className={`text-xs font-medium ${latestClass.colour}`}>{latestClass.label}</p>
            <Sparkline readings={readings} />
          </div>
        )}
      </div>

      {/* Entry Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Log a Reading</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Glucose Value
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={form.glucose}
                onChange={(e) => setForm((f) => ({ ...f, glucose: e.target.value }))}
                placeholder={form.unit === "mmol/L" ? "e.g. 6.2" : "e.g. 112"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as typeof form.unit }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="mmol/L">mmol/L</option>
                <option value="mg/dL">mg/dL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as typeof form.source }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Post-meal"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
          )}
          {formSuccess && (
            <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              Reading logged successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
          >
            {submitting ? "Logging…" : "Log Reading"}
          </button>
        </form>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          History ({readings.length} readings)
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : readings.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No readings logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Time</th>
                  <th className="text-right pb-2 font-medium">Glucose</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-left pb-2 font-medium">Source</th>
                  <th className="text-left pb-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {readings.map((r) => {
                  const cls = classifyGlucose(r.glucose);
                  return (
                    <tr key={r.id} className={`${cls.bg} hover:opacity-90`}>
                      <td className="py-2 text-gray-600">
                        {new Date(r.recorded_at).toLocaleString([], {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className={`py-2 text-right font-semibold ${cls.colour}`}>
                        {r.glucose.toFixed(1)} mmol/L
                      </td>
                      <td className={`py-2 font-medium ${cls.colour}`}>{cls.label}</td>
                      <td className="py-2 text-gray-500 capitalize">{r.source}</td>
                      <td className="py-2 text-gray-400">{r.notes ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
      </p>
    </div>
  );
}
