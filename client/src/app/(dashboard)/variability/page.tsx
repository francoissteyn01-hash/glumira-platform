/**
 * GluMira™ — Glucose Variability Page
 *
 * Dashboard page showing glucose variability metrics:
 * CV, MAGE, LBGI, HBGI, BGRI, J-index, eA1c, GRI, TIR breakdown.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useVariability } from "@/hooks/useVariability";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRI_ZONE_COLOURS: Record<string, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-lime-100 text-lime-800",
  C: "bg-amber-100 text-amber-800",
  D: "bg-orange-100 text-orange-800",
  E: "bg-red-100 text-red-800",
};

function MetricCard({ label, value, unit, description }: {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}{unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </div>
  );
}

function TirBar({ label, percent, colour }: { label: string; percent: number; colour: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-10 text-right">{percent.toFixed(1)}%</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VariabilityPage() {
  // In production, patientId comes from session/context
  const { data, loading, error, refresh } = useVariability("current", 14);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Glucose Variability</h1>
          <p className="mt-1 text-sm text-gray-500">
            14-day variability metrics. Powered by IOB Hunter™.
          </p>
        </div>
        <button
          onClick={refresh}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
        GluMira™ is an informational tool only. Not a medical device.
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
          Loading variability data…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      {data && (
        <>
          {/* GRI Zone Badge */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${GRI_ZONE_COLOURS[data.griZone] ?? "bg-gray-100 text-gray-800"}`}>
              GRI Zone {data.griZone}
            </span>
            <span className="text-sm text-gray-600">{data.cvStatus}</span>
            <span className="text-sm text-gray-400">·</span>
            <span className="text-sm text-gray-500">{data.readingCount} readings over {data.periodDays} days</span>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Mean Glucose" value={data.mean.toFixed(1)} unit="mmol/L" />
            <MetricCard label="Std Deviation" value={data.sd.toFixed(1)} unit="mmol/L" />
            <MetricCard label="CV" value={data.cv.toFixed(1)} unit="%" description="Target < 36%" />
            <MetricCard label="eA1c" value={data.eA1c.toFixed(1)} unit="%" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="MAGE" value={data.mage.toFixed(1)} unit="mmol/L" description="Glucose excursions" />
            <MetricCard label="LBGI" value={data.lbgi.toFixed(1)} description="Low BG risk" />
            <MetricCard label="HBGI" value={data.hbgi.toFixed(1)} description="High BG risk" />
            <MetricCard label="GRI" value={data.gri.toFixed(1)} description="Glycaemia Risk Index" />
          </div>

          {/* TIR Breakdown */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Time in Range</h2>
            <div className="space-y-3">
              <TirBar label="Very Low" percent={data.tirBreakdown.veryLow} colour="bg-red-500" />
              <TirBar label="Low" percent={data.tirBreakdown.low} colour="bg-orange-400" />
              <TirBar label="In Range" percent={data.tirBreakdown.inRange} colour="bg-green-500" />
              <TirBar label="High" percent={data.tirBreakdown.high} colour="bg-amber-400" />
              <TirBar label="Very High" percent={data.tirBreakdown.veryHigh} colour="bg-red-400" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
