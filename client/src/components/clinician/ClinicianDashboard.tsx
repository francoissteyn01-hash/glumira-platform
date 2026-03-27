/**
 * GluMira™ Phase 2 — Clinician Dashboard
 * Version: 7.0.0
 * Module: UI-CLINICIAN
 *
 * Provides the clinician-facing view of patient glucose data.
 * Features:
 *   - Time-in-Range ring chart (Recharts PieChart)
 *   - Glucose variability badge (CV, SD, MAGE)
 *   - AI pattern summary panel (Claude Sonnet output)
 *   - Safety flags panel (colour-coded by severity)
 *   - Hypo risk score bar
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 * All AI-generated content is for educational purposes only.
 * Always consult a qualified diabetes care team.
 */

"use client";

import React, { useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────

interface TimeInRange {
  veryLow: number;
  low: number;
  inRange: number;
  high: number;
  veryHigh: number;
  mean: number;
  gmi: number;
}

interface GlucoseVariability {
  cv: number;
  sd: number;
  mage: number;
  isHighVariability: boolean;
}

interface HypoRiskScore {
  score: number;
  level: "low" | "moderate" | "high" | "critical";
  hypoEvents: number;
  nearHypoEvents: number;
  description: string;
}

interface SafetyFlag {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
}

interface AnalysisResult {
  analysisType: string;
  summary: string;
  structuredData: {
    tir?: TimeInRange;
    variability?: GlucoseVariability;
    hypoRisk?: HypoRiskScore;
  };
  safetyFlags: SafetyFlag[];
  disclaimer: string;
  generatedAt: string;
  modelUsed: string;
  tokensUsed?: number;
}

interface PatientSummary {
  patientId: string;
  name: string;
  diabetesType: string;
  lastSync?: string;
}

interface ClinicianDashboardProps {
  patient: PatientSummary;
  analysisResult?: AnalysisResult;
  isLoading?: boolean;
  onRequestAnalysis?: (analysisType: string) => void;
}

// ─── TIR Colours (ATTD/ADA 2019 consensus) ───────────────────

const TIR_COLORS = {
  veryLow: "#D32F2F",   // Red — Very Low (<54 mg/dL)
  low: "#FF7043",       // Orange — Low (54-70 mg/dL)
  inRange: "#43A047",   // Green — In Range (70-180 mg/dL)
  high: "#FFA726",      // Amber — High (181-250 mg/dL)
  veryHigh: "#E53935",  // Dark Red — Very High (>250 mg/dL)
};

const SEVERITY_COLORS = {
  info: "#1A6DB5",
  warning: "#F57C00",
  critical: "#D32F2F",
};

// ─── TIR Ring Chart ───────────────────────────────────────────

interface TIRChartProps {
  tir: TimeInRange;
}

function TIRRingChart({ tir }: TIRChartProps) {
  const data = [
    { name: "Very Low (<54)", value: tir.veryLow, color: TIR_COLORS.veryLow },
    { name: "Low (54-70)", value: tir.low, color: TIR_COLORS.low },
    { name: "In Range (70-180)", value: tir.inRange, color: TIR_COLORS.inRange },
    { name: "High (181-250)", value: tir.high, color: TIR_COLORS.high },
    { name: "Very High (>250)", value: tir.veryHigh, color: TIR_COLORS.veryHigh },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Time in Range
      </h3>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-2">
          {/* In Range — prominent */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TIR_COLORS.inRange }} />
              <span className="text-sm text-gray-700">In Range</span>
            </div>
            <span className="text-lg font-bold text-green-600">{tir.inRange.toFixed(1)}%</span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1" />

          {/* Other bands */}
          {[
            { label: "Very Low", value: tir.veryLow, color: TIR_COLORS.veryLow, target: "<1%" },
            { label: "Low", value: tir.low, color: TIR_COLORS.low, target: "<4%" },
            { label: "High", value: tir.high, color: TIR_COLORS.high, target: "<25%" },
            { label: "Very High", value: tir.veryHigh, color: TIR_COLORS.veryHigh, target: "<5%" },
          ].map(({ label, value, color, target }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-xs text-gray-400">target {target}</span>
              </div>
              <span className="text-xs font-medium text-gray-700">{value.toFixed(1)}%</span>
            </div>
          ))}

          {/* GMI */}
          <div className="border-t border-gray-100 pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">GMI (est. HbA1c)</span>
              <span className="text-sm font-semibold text-blue-700">{tir.gmi.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">Mean Glucose</span>
              <span className="text-sm font-semibold text-gray-700">{tir.mean.toFixed(0)} mg/dL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Variability Badge ────────────────────────────────────────

interface VariabilityBadgeProps {
  variability: GlucoseVariability;
}

function VariabilityBadge({ variability }: VariabilityBadgeProps) {
  const isHigh = variability.isHighVariability;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Glucose Variability
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">CV (Coefficient of Variation)</span>
          <span
            className={`text-lg font-bold ${isHigh ? "text-orange-600" : "text-green-600"}`}
          >
            {variability.cv.toFixed(1)}%
          </span>
        </div>
        {isHigh && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            <p className="text-xs text-orange-700 font-medium">
              High variability detected (CV &gt;36%). Target: &lt;36%.
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Standard Deviation</p>
            <p className="text-base font-semibold text-gray-800">{variability.sd.toFixed(1)} mg/dL</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">MAGE</p>
            <p className="text-base font-semibold text-gray-800">{variability.mage.toFixed(1)} mg/dL</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hypo Risk Bar ────────────────────────────────────────────

interface HypoRiskBarProps {
  hypoRisk: HypoRiskScore;
}

function HypoRiskBar({ hypoRisk }: HypoRiskBarProps) {
  const levelColors = {
    low: "bg-green-500",
    moderate: "bg-yellow-500",
    high: "bg-orange-500",
    critical: "bg-red-600",
  };
  const levelTextColors = {
    low: "text-green-700",
    moderate: "text-yellow-700",
    high: "text-orange-700",
    critical: "text-red-700",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Hypoglycaemia Risk
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold uppercase ${levelTextColors[hypoRisk.level]}`}>
            {hypoRisk.level}
          </span>
          <span className="text-2xl font-bold text-gray-800">{hypoRisk.score}/100</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${levelColors[hypoRisk.level]}`}
            style={{ width: `${hypoRisk.score}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Hypo Events (&lt;54)</p>
            <p className="text-base font-bold text-red-700">{hypoRisk.hypoEvents}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Near-Hypo Events</p>
            <p className="text-base font-bold text-orange-700">{hypoRisk.nearHypoEvents}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 italic">{hypoRisk.description}</p>
      </div>
    </div>
  );
}

// ─── Safety Flags Panel ───────────────────────────────────────

interface SafetyFlagsPanelProps {
  flags: SafetyFlag[];
}

function SafetyFlagsPanel({ flags }: SafetyFlagsPanelProps) {
  if (flags.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-sm text-green-700 font-medium">
          ✅ No safety flags — all metrics within target ranges.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Safety Flags ({flags.length})
      </h3>
      <div className="space-y-2">
        {flags.map((flag) => (
          <div
            key={flag.code}
            className="flex items-start gap-3 p-3 rounded-lg border"
            style={{
              borderColor: SEVERITY_COLORS[flag.severity] + "40",
              backgroundColor: SEVERITY_COLORS[flag.severity] + "08",
            }}
          >
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white mt-0.5 shrink-0"
              style={{ backgroundColor: SEVERITY_COLORS[flag.severity] }}
            >
              {flag.code}
            </span>
            <p className="text-sm text-gray-700">{flag.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Pattern Summary Panel ─────────────────────────────────

interface PatternSummaryPanelProps {
  summary: string;
  analysisType: string;
  generatedAt: string;
  modelUsed: string;
  disclaimer: string;
  tokensUsed?: number;
}

function PatternSummaryPanel({
  summary,
  analysisType,
  generatedAt,
  modelUsed,
  disclaimer,
  tokensUsed,
}: PatternSummaryPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          AI Pattern Analysis
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {analysisType.replace(/_/g, " ")}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(generatedAt).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
        {summary}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 italic">{disclaimer}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">Model: {modelUsed}</span>
          {tokensUsed && (
            <span className="text-xs text-gray-400">{tokensUsed} tokens</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Analysis Type Selector ───────────────────────────────────

const ANALYSIS_TYPES = [
  { id: "pattern_summary", label: "Full Pattern Summary" },
  { id: "tir_report", label: "TIR Report" },
  { id: "iob_stacking_risk", label: "IOB Stacking Risk" },
  { id: "hypo_risk", label: "Hypo Risk" },
  { id: "meal_regime_optimisation", label: "Meal Regime" },
  { id: "variability_analysis", label: "Variability" },
];

// ─── Main Clinician Dashboard ─────────────────────────────────

export function ClinicianDashboard({
  patient,
  analysisResult,
  isLoading = false,
  onRequestAnalysis,
}: ClinicianDashboardProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState("pattern_summary");

  const handleAnalysisRequest = useCallback(() => {
    onRequestAnalysis?.(selectedAnalysis);
  }, [selectedAnalysis, onRequestAnalysis]);

  const { tir, variability, hypoRisk } = analysisResult?.structuredData ?? {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Clinician Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {patient.name} · {patient.diabetesType} · ID: {patient.patientId}
              {patient.lastSync && ` · Last sync: ${new Date(patient.lastSync).toLocaleString()}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedAnalysis}
              onChange={(e) => setSelectedAnalysis(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ANALYSIS_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <button
              onClick={handleAnalysisRequest}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isLoading ? "Analysing…" : "Run AI Analysis"}
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-2">
        <p className="text-xs text-blue-700 text-center max-w-7xl mx-auto">
          GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
          AI-generated analysis is for educational purposes only.
          Always consult a qualified diabetes care team before making any clinical decisions.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Running AI pattern analysis…</p>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!isLoading && !analysisResult && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">
              Select an analysis type and click <strong>Run AI Analysis</strong> to begin.
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && analysisResult && (
          <>
            {/* Safety Flags — always first */}
            <SafetyFlagsPanel flags={analysisResult.safetyFlags} />

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tir && <TIRRingChart tir={tir} />}
              {variability && <VariabilityBadge variability={variability} />}
              {hypoRisk && <HypoRiskBar hypoRisk={hypoRisk} />}
            </div>

            {/* AI Summary */}
            <PatternSummaryPanel
              summary={analysisResult.summary}
              analysisType={analysisResult.analysisType}
              generatedAt={analysisResult.generatedAt}
              modelUsed={analysisResult.modelUsed}
              disclaimer={analysisResult.disclaimer}
              tokensUsed={analysisResult.tokensUsed}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ClinicianDashboard;
