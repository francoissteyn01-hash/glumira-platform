"use client";

/**
 * GluMira™ Clinician View Page
 * Version: 7.0.0
 * Route: /clinician
 *
 * Provides clinicians with:
 *  - Patient selector
 *  - TIR ring chart (24h / 7d / 14d / 30d)
 *  - Variability metrics (CV, SD, mean glucose)
 *  - AI pattern analysis summary (Phase 2)
 *  - Bernstein Q&A panel
 *  - Insulin stacking risk overview
 *  - School Care Plan quick-generate button
 *
 * GluMira Pro + GluMira AI tiers only.
 */

import React, { useState, useEffect, useCallback } from "react";
import { ClinicianDashboard } from "../../../components/clinician/ClinicianDashboard";
import { BernsteinQAPanel } from "../../../components/clinician/BernsteinQAPanel";

// ─── Types ────────────────────────────────────────────────────

interface PatientSummary {
  id: string;
  displayName: string;
  diabetesType: string;
  insulinType: string;
  lastSync: string | null;
}

interface GlucoseReading {
  recordedAt: string;
  glucoseMmol: number;
  source: string;
}

interface InsulinkDose {
  id: string;
  administeredAt: string;
  doseUnits: number;
  insulinName: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function computeTIR(readings: GlucoseReading[]): {
  veryHigh: number;
  high: number;
  target: number;
  low: number;
  veryLow: number;
} {
  if (!readings.length) return { veryHigh: 0, high: 0, target: 0, low: 0, veryLow: 0 };

  const counts = { veryHigh: 0, high: 0, target: 0, low: 0, veryLow: 0 };
  for (const r of readings) {
    const g = r.glucoseMmol;
    if (g >= 13.9) counts.veryHigh++;
    else if (g >= 10.0) counts.high++;
    else if (g >= 3.9) counts.target++;
    else if (g >= 3.0) counts.low++;
    else counts.veryLow++;
  }

  const total = readings.length;
  return {
    veryHigh: Math.round((counts.veryHigh / total) * 100),
    high: Math.round((counts.high / total) * 100),
    target: Math.round((counts.target / total) * 100),
    low: Math.round((counts.low / total) * 100),
    veryLow: Math.round((counts.veryLow / total) * 100),
  };
}

function computeVariability(readings: GlucoseReading[]): {
  mean: number;
  sd: number;
  cv: number;
} {
  if (!readings.length) return { mean: 0, sd: 0, cv: 0 };
  const values = readings.map((r) => r.glucoseMmol);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const sd = Math.sqrt(variance);
  const cv = mean > 0 ? (sd / mean) * 100 : 0;
  return {
    mean: Math.round(mean * 10) / 10,
    sd: Math.round(sd * 10) / 10,
    cv: Math.round(cv * 10) / 10,
  };
}

// ─── Mock data for demo / pre-DB state ───────────────────────

const DEMO_PATIENTS: PatientSummary[] = [
  {
    id: "NAM-001",
    displayName: "NAM-001 (Beta)",
    diabetesType: "Type 1",
    insulinType: "NovoRapid",
    lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "ZA-001",
    displayName: "ZA-001 (Beta)",
    diabetesType: "Type 1",
    insulinType: "Humalog",
    lastSync: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
];

function generateDemoReadings(count: number): GlucoseReading[] {
  const readings: GlucoseReading[] = [];
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const base = 5.5 + Math.sin(i / 12) * 1.5;
    const noise = (Math.random() - 0.5) * 1.2;
    readings.push({
      recordedAt: new Date(now - i * 5 * 60 * 1000).toISOString(),
      glucoseMmol: Math.max(2.5, Math.min(18, base + noise)),
      source: "cgm",
    });
  }
  return readings;
}

function generateDemoDoses(count: number): InsulinkDose[] {
  const doses: InsulinkDose[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    doses.push({
      id: `dose-${i}`,
      administeredAt: new Date(now - i * 4 * 60 * 60 * 1000).toISOString(),
      doseUnits: 2 + Math.floor(Math.random() * 4),
      insulinName: "NovoRapid",
    });
  }
  return doses;
}

// ─── Page Component ───────────────────────────────────────────

export default function ClinicianPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(DEMO_PATIENTS[0].id);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "14d" | "30d">("7d");
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [doses, setDoses] = useState<InsulinkDose[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedPatient = DEMO_PATIENTS.find((p) => p.id === selectedPatientId)!;

  const loadPatientData = useCallback(async () => {
    setLoading(true);
    try {
      // In production: fetch from /api/patient/[id]/readings?range=7d
      // For now: generate demo data
      const readingCount = timeRange === "24h" ? 288 : timeRange === "7d" ? 2016 : timeRange === "14d" ? 4032 : 8640;
      setReadings(generateDemoReadings(readingCount));
      setDoses(generateDemoDoses(timeRange === "24h" ? 4 : 14));
    } finally {
      setLoading(false);
    }
  }, [selectedPatientId, timeRange]);

  useEffect(() => {
    loadPatientData();
  }, [loadPatientData]);

  const tir = computeTIR(readings);
  const variability = computeVariability(readings);

  return (
    <div className="min-h-screen bg-glumira-bg p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinician View</h1>
          <p className="text-[10px] text-glumira-blue font-medium">Visualizing the science of insulin</p>
          <p className="text-sm text-gray-500 mt-0.5">
            GluMira™ Pro · Pattern Analysis · Phase 2
          </p>
        </div>

        {/* Patient selector */}
        <div className="flex items-center gap-3">
          <label htmlFor="patient-select" className="text-sm font-medium text-gray-700">
            Patient:
          </label>
          <select
            id="patient-select"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="glum-input py-1.5 text-sm min-w-[160px]"
          >
            {DEMO_PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient meta bar */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
          {selectedPatient.diabetesType}
        </span>
        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
          {selectedPatient.insulinType}
        </span>
        {selectedPatient.lastSync && (
          <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-medium">
            Last sync: {new Date(selectedPatient.lastSync).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Time range selector */}
      <div className="flex gap-2">
        {(["24h", "7d", "14d", "30d"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setTimeRange(r)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              timeRange === r
                ? "bg-glumira-blue text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-glumira-blue" />
        </div>
      ) : (
        <>
          {/* Main clinician dashboard */}
          <ClinicianDashboard
            patientId={selectedPatientId}
            timeRange={timeRange}
            tir={tir}
            variability={variability}
            readingCount={readings.length}
            doseCount={doses.length}
          />

          {/* Variability metrics cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glum-card text-center">
              <p className="text-xs text-gray-500 mb-1">Mean Glucose</p>
              <p className="text-2xl font-bold text-gray-900">{variability.mean}</p>
              <p className="text-xs text-gray-400">mmol/L</p>
            </div>
            <div className="glum-card text-center">
              <p className="text-xs text-gray-500 mb-1">Std Deviation</p>
              <p className={`text-2xl font-bold ${variability.sd <= 1.5 ? "text-green-600" : variability.sd <= 2.5 ? "text-amber-500" : "text-red-600"}`}>
                {variability.sd}
              </p>
              <p className="text-xs text-gray-400">mmol/L</p>
            </div>
            <div className="glum-card text-center">
              <p className="text-xs text-gray-500 mb-1">CV%</p>
              <p className={`text-2xl font-bold ${variability.cv < 36 ? "text-green-600" : variability.cv < 50 ? "text-amber-500" : "text-red-600"}`}>
                {variability.cv}%
              </p>
              <p className="text-xs text-gray-400">{variability.cv < 36 ? "Stable" : variability.cv < 50 ? "Variable" : "High"}</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3">
            <a
              href="/school-care-plan"
              className="glum-btn-secondary text-sm"
            >
              Generate School Care Plan
            </a>
            <a
              href="/stacking"
              className="glum-btn-secondary text-sm"
            >
              Stacking Analysis
            </a>
            <button
              onClick={loadPatientData}
              className="glum-btn-secondary text-sm"
            >
              Refresh Data
            </button>
          </div>

          {/* Bernstein Q&A Panel */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Bernstein AI Q&amp;A
            </h2>
            <BernsteinQAPanel
              patientContext={{
                diabetesType: selectedPatient.diabetesType,
              }}
            />
          </div>
        </>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center pb-4">
        GluMira™ is an informational tool only. Not a medical device. Not a dosing tool.
        Always consult your diabetes care team.
      </p>
    </div>
  );
}
