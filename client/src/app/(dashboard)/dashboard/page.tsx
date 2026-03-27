/**
 * GluMira™ Patient Dashboard Page
 * Version: 7.0.0
 * Route: /dashboard
 *
 * The primary patient-facing view. Displays:
 *   - IOB (Insulin on Board) summary card
 *   - Time-in-Range ring (24h)
 *   - CGM glucose timeline chart
 *   - Active meal regime badge
 *   - Beta feedback prompt (first 30 days)
 *   - Disclaimer banner
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 * Always consult your diabetes care team.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────

interface IOBSummary {
  totalIOB: number;
  bolusIOB: number;
  basalIOB: number;
  peakTime: string;
  lastDoseTime: string;
  riskLevel: "safe" | "caution" | "high";
}

interface TIRSummary {
  inRange: number;
  low: number;
  high: number;
  veryLow: number;
  veryHigh: number;
  mean: number;
  gmi: number;
}

interface GlucosePoint {
  time: string;
  glucose: number;
  iob?: number;
  source: "cgm" | "manual";
}

interface MealRegimeBadge {
  regimeName: string;
  targetRange: [number, number];
  currentMealPhase: string;
}

interface DashboardData {
  iob: IOBSummary;
  tir: TIRSummary;
  glucoseHistory: GlucosePoint[];
  regime: MealRegimeBadge;
  lastUpdated: string;
  isBetaUser: boolean;
  daysInBeta: number;
}

// ─── Mock data (replaced by tRPC query in production) ─────────

const MOCK_DATA: DashboardData = {
  iob: {
    totalIOB: 1.8,
    bolusIOB: 1.2,
    basalIOB: 0.6,
    peakTime: "14:30",
    lastDoseTime: "13:45",
    riskLevel: "caution",
  },
  tir: {
    inRange: 72.4,
    low: 3.1,
    high: 18.2,
    veryLow: 0.8,
    veryHigh: 5.5,
    mean: 148,
    gmi: 7.1,
  },
  glucoseHistory: Array.from({ length: 48 }, (_, i) => ({
    time: new Date(Date.now() - (47 - i) * 30 * 60 * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    glucose: Math.round(120 + Math.sin(i / 4) * 40 + (Math.random() - 0.5) * 20),
    iob: Math.max(0, 2 - (i % 12) * 0.2 + Math.random() * 0.3),
    source: "cgm" as const,
  })),
  regime: {
    regimeName: "Standard Low-Carb",
    targetRange: [70, 140],
    currentMealPhase: "Post-lunch (2h)",
  },
  lastUpdated: new Date().toISOString(),
  isBetaUser: true,
  daysInBeta: 3,
};

// ─── IOB Summary Card ─────────────────────────────────────────

interface IOBCardProps {
  iob: IOBSummary;
}

function IOBCard({ iob }: IOBCardProps) {
  const riskColors = {
    safe: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-800" },
    caution: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-800" },
    high: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800" },
  };
  const colors = riskColors[iob.riskLevel];

  return (
    <div className={`rounded-xl border p-6 shadow-sm ${colors.bg} ${colors.border}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Insulin on Board
        </h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${colors.badge}`}>
          {iob.riskLevel}
        </span>
      </div>
      <div className="flex items-end gap-2 mb-4">
        <span className={`text-4xl font-bold ${colors.text}`}>{iob.totalIOB.toFixed(1)}</span>
        <span className="text-lg text-gray-500 mb-1">U</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/60 rounded-lg p-2">
          <p className="text-xs text-gray-500">Bolus IOB</p>
          <p className="text-base font-semibold text-gray-800">{iob.bolusIOB.toFixed(1)} U</p>
        </div>
        <div className="bg-white/60 rounded-lg p-2">
          <p className="text-xs text-gray-500">Basal IOB</p>
          <p className="text-base font-semibold text-gray-800">{iob.basalIOB.toFixed(1)} U</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Last dose: {iob.lastDoseTime} · Peak: {iob.peakTime}
      </p>
    </div>
  );
}

// ─── TIR Mini Ring ────────────────────────────────────────────

interface TIRMiniProps {
  tir: TIRSummary;
}

function TIRMini({ tir }: TIRMiniProps) {
  const circumference = 2 * Math.PI * 40;
  const inRangeOffset = circumference * (1 - tir.inRange / 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Time in Range (24h)
      </h3>
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="12" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke="#43A047" strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={inRangeOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-green-600">{tir.inRange.toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {[
            { label: "In Range", value: tir.inRange, color: "#43A047" },
            { label: "High", value: tir.high, color: "#FFA726" },
            { label: "Low", value: tir.low, color: "#FF7043" },
            { label: "Very Low", value: tir.veryLow, color: "#D32F2F" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              <span className="text-xs font-medium text-gray-700">{value.toFixed(1)}%</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-1">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">GMI</span>
              <span className="text-xs font-semibold text-blue-700">{tir.gmi.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CGM Glucose Chart ────────────────────────────────────────

interface CGMChartProps {
  data: GlucosePoint[];
  targetRange: [number, number];
}

function CGMChart({ data, targetRange }: CGMChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const glucose = payload.find((p: any) => p.dataKey === "glucose");
    const iob = payload.find((p: any) => p.dataKey === "iob");
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {glucose && (
          <p style={{ color: glucose.color }}>
            Glucose: <strong>{glucose.value} mg/dL</strong>
          </p>
        )}
        {iob && (
          <p style={{ color: iob.color }}>
            IOB: <strong>{Number(iob.value).toFixed(2)} U</strong>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Glucose & IOB — Last 24h
        </h3>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-blue-500" />
            <span>Glucose</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-orange-400 border-dashed" />
            <span>IOB</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            interval={5}
            tickLine={false}
          />
          <YAxis
            yAxisId="glucose"
            domain={[40, 300]}
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="iob"
            orientation="right"
            domain={[0, 5]}
            tick={{ fontSize: 10, fill: "#9CA3AF" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Target range band */}
          <ReferenceLine yAxisId="glucose" y={targetRange[1]} stroke="#43A047" strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine yAxisId="glucose" y={targetRange[0]} stroke="#43A047" strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine yAxisId="glucose" y={54} stroke="#D32F2F" strokeDasharray="2 2" strokeOpacity={0.6} />
          <Line
            yAxisId="glucose"
            type="monotone"
            dataKey="glucose"
            stroke="#1A6DB5"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="iob"
            type="monotone"
            dataKey="iob"
            stroke="#F97316"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Regime Badge ─────────────────────────────────────────────

interface RegimeBadgeProps {
  regime: MealRegimeBadge;
}

function RegimeBadge({ regime }: RegimeBadgeProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Active Meal Regime
      </h3>
      <p className="text-lg font-bold text-gray-900">{regime.regimeName}</p>
      <p className="text-sm text-gray-500 mt-1">{regime.currentMealPhase}</p>
      <div className="mt-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs text-gray-500">
          Target: {regime.targetRange[0]}–{regime.targetRange[1]} mg/dL
        </span>
      </div>
    </div>
  );
}

// ─── Beta Feedback Prompt ─────────────────────────────────────

interface BetaPromptProps {
  daysInBeta: number;
  onFeedback: () => void;
}

function BetaPrompt({ daysInBeta, onFeedback }: BetaPromptProps) {
  if (daysInBeta > 30) return null;
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-blue-800">
          Beta Day {daysInBeta} — How is GluMira working for you?
        </p>
        <p className="text-xs text-blue-600 mt-0.5">
          Your feedback directly shapes the product. Takes 30 seconds.
        </p>
      </div>
      <button
        onClick={onFeedback}
        className="ml-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
      >
        Give Feedback
      </button>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────

export default function DashboardPage() {
  const [data] = useState<DashboardData>(MOCK_DATA);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleFeedback = useCallback(() => {
    setShowFeedback(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">GluMira™ Dashboard</h1>
            <p className="text-[10px] text-glumira-blue font-medium">Visualizing the science of insulin</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Last updated: {new Date(data.lastUpdated).toLocaleTimeString()} ·
              Powered by IOB Hunter™
            </p>
          </div>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            Beta
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border-b border-amber-100 px-6 py-2">
        <p className="text-xs text-amber-700 text-center max-w-7xl mx-auto">
          GluMira™ is an informational tool only. Not a medical device. Not a dosing tool.
          Always consult your diabetes care team before making any changes to your management.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Beta Feedback Prompt */}
        {data.isBetaUser && (
          <BetaPrompt daysInBeta={data.daysInBeta} onFeedback={handleFeedback} />
        )}

        {/* Top Row: IOB + TIR + Regime */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <IOBCard iob={data.iob} />
          <TIRMini tir={data.tir} />
          <RegimeBadge regime={data.regime} />
        </div>

        {/* CGM Chart — full width */}
        <CGMChart data={data.glucoseHistory} targetRange={data.regime.targetRange} />
      </div>

      {/* Feedback Modal Placeholder */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Beta Feedback</h2>
            <p className="text-sm text-gray-500 mb-4">
              Thank you for testing GluMira™. Your feedback is recorded via the beta onboarding module.
            </p>
            <button
              onClick={() => setShowFeedback(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
