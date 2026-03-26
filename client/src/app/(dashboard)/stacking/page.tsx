"use client";

/**
 * GluMira™ IOB Stacking Analysis Page
 * Version: 7.0.0
 * Route: /stacking
 *
 * Allows users to enter recent insulin doses and see:
 *  - Stacked IOB timeline chart
 *  - Peak IOB value
 *  - Risk tier badge (low / moderate / high / critical)
 *  - Plain-language narrative
 *  - Per-dose contribution breakdown
 *
 * GluMira™ is an informational tool only. Not a medical device.
 * This tool does NOT recommend doses.
 */

import React, { useState, useCallback } from "react";
import { InsulinkStackingChart } from "../../../components/charts/InsulinkStackingChart";

// ─── Types ────────────────────────────────────────────────────

type InsulinType = "NovoRapid" | "Humalog" | "Apidra" | "Fiasp" | "Tresiba" | "Lantus";

interface DoseEntry {
  id: string;
  units: number;
  administeredAt: string;
  insulinType: InsulinType;
}

interface StackingResult {
  timeline: { minutesSinceDose: number; totalIob: number; timestamp: string }[];
  peakIob: number;
  currentIob: number;
  riskScore: number;
  riskTier: "low" | "moderate" | "high" | "critical";
  narrative: string;
  doseContributions: { doseId: string; currentIob: number; peakIob: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────

function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const RISK_COLOURS: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  moderate: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

// ─── Page Component ───────────────────────────────────────────

export default function StackingPage() {
  const [doses, setDoses] = useState<DoseEntry[]>([
    {
      id: crypto.randomUUID(),
      units: 3,
      administeredAt: minutesAgoIso(90),
      insulinType: "NovoRapid",
    },
  ]);
  const [result, setResult] = useState<StackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Dose management ────────────────────────────────────────

  const addDose = () => {
    setDoses((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        units: 2,
        administeredAt: minutesAgoIso(30),
        insulinType: "NovoRapid",
      },
    ]);
  };

  const removeDose = (id: string) => {
    setDoses((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDose = (id: string, field: keyof DoseEntry, value: string | number) => {
    setDoses((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  // ─── Analysis ───────────────────────────────────────────────

  const analyse = useCallback(async () => {
    if (!doses.length) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stacking/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doses }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data: StackingResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [doses]);

  return (
    <div className="min-h-screen bg-glumira-bg p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Insulin Stacking Analysis</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          IOB Hunter™ · Powered by GluMira™ · Biexponential decay model
        </p>
      </div>

      {/* Disclaimer */}
      <div className="glum-alert-info text-sm">
        <strong>Educational tool only.</strong> This analysis does not recommend doses.
        Always consult your diabetes care team before adjusting insulin.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Dose entry */}
        <div className="space-y-4">
          <div className="glum-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Recent Doses</h2>
              <button
                onClick={addDose}
                className="text-sm text-glumira-blue hover:underline font-medium"
              >
                + Add dose
              </button>
            </div>

            <div className="space-y-3">
              {doses.map((dose, idx) => (
                <div key={dose.id} className="border border-gray-100 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Dose {idx + 1}</span>
                    {doses.length > 1 && (
                      <button
                        onClick={() => removeDose(dose.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="glum-label">Units</label>
                      <input
                        type="number"
                        min={0.5}
                        max={100}
                        step={0.5}
                        value={dose.units}
                        onChange={(e) => updateDose(dose.id, "units", parseFloat(e.target.value))}
                        className="glum-input"
                      />
                    </div>
                    <div>
                      <label className="glum-label">Insulin Type</label>
                      <select
                        value={dose.insulinType}
                        onChange={(e) => updateDose(dose.id, "insulinType", e.target.value)}
                        className="glum-input"
                      >
                        <option value="NovoRapid">NovoRapid</option>
                        <option value="Humalog">Humalog</option>
                        <option value="Apidra">Apidra</option>
                        <option value="Fiasp">Fiasp</option>
                        <option value="Tresiba">Tresiba</option>
                        <option value="Lantus">Lantus</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="glum-label">
                      Administered At
                      <span className="text-gray-400 font-normal ml-1">
                        ({formatTime(dose.administeredAt)})
                      </span>
                    </label>
                    <input
                      type="datetime-local"
                      value={dose.administeredAt.slice(0, 16)}
                      onChange={(e) =>
                        updateDose(dose.id, "administeredAt", new Date(e.target.value).toISOString())
                      }
                      className="glum-input"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={analyse}
              disabled={loading || !doses.length}
              className="glum-btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analysing…" : "Analyse Stacking"}
            </button>
          </div>

          {error && (
            <div className="glum-alert-error text-sm">{error}</div>
          )}
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Risk summary */}
              <div className="glum-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Risk Tier</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                        RISK_COLOURS[result.riskTier]
                      }`}
                    >
                      {result.riskTier}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Current IOB</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {result.currentIob.toFixed(2)}U
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Peak IOB</p>
                    <p className="text-2xl font-bold text-glumira-blue">
                      {result.peakIob.toFixed(2)}U
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed">{result.narrative}</p>
              </div>

              {/* Chart */}
              <InsulinkStackingChart
                timeline={result.timeline}
                doses={doses}
                riskTier={result.riskTier}
              />

              {/* Per-dose breakdown */}
              <div className="glum-card">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Dose Contributions
                </h3>
                <div className="space-y-2">
                  {result.doseContributions.map((dc, idx) => {
                    const dose = doses.find((d) => d.id === dc.doseId);
                    return (
                      <div
                        key={dc.doseId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">
                          Dose {idx + 1}
                          {dose && ` — ${dose.units}U ${dose.insulinType}`}
                        </span>
                        <div className="flex gap-4 text-right">
                          <span className="text-gray-500">
                            Now: <strong>{dc.currentIob.toFixed(2)}U</strong>
                          </span>
                          <span className="text-glumira-blue">
                            Peak: <strong>{dc.peakIob.toFixed(2)}U</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="glum-card flex flex-col items-center justify-center h-[400px] text-center">
              <div className="text-4xl mb-4">💉</div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                No analysis yet
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Enter your recent doses on the left and click &quot;Analyse Stacking&quot;
                to see your IOB timeline and risk assessment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer disclaimer */}
      <p className="text-xs text-gray-400 text-center pb-4">
        GluMira™ · IOB Hunter™ · Biexponential decay model · Not a medical device.
        Not a dosing tool. Always consult your diabetes care team.
      </p>
    </div>
  );
}
