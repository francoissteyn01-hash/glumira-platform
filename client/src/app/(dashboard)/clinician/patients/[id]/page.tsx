"use client";
/**
 * GluMira™ Clinician Patient Detail Page
 * Version: 7.0.0
 *
 * Route: /clinician/patients/[id]
 *
 * Displays full patient summary for a clinician:
 *  - Patient profile header (name, type, regime, status)
 *  - TIR ring chart (14-day)
 *  - IOB summary card (active IOB, avg doses, stacking events)
 *  - Glucose trend mini-chart (last 24h readings)
 *  - ClinicianNotesPanel (full CRUD)
 *  - Link to generate patient report
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ClinicianNotesPanel } from "@/components/clinician/ClinicianNotesPanel";

// ─── Types ────────────────────────────────────────────────────

interface PatientSummary {
  userId: string;
  displayName: string;
  diabetesType: string;
  insulinType: string;
  regimeName: string;
  participantId: string;
  status: string;
  tir: {
    veryLowPct: number;
    lowPct: number;
    inRangePct: number;
    highPct: number;
    veryHighPct: number;
    gmi: number;
    cv: number;
    readingCount: number;
  };
  iob: {
    currentIob: number;
    riskTier: string;
    avgDailyDoses: number;
    stackingEventsLast7d: number;
  };
  lastReading: { valueMmol: number; recordedAt: string } | null;
  recentReadings: { valueMmol: number; recordedAt: string }[];
}

// ─── Supabase helper ──────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getAuthToken() {
  const { data: { session } } = await getSupabase().auth.getSession();
  return session?.access_token ?? "";
}

// ─── TIR Ring SVG ─────────────────────────────────────────────

function TirRing({ inRangePct }: { inRangePct: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (inRangePct / 100) * circ;
  const colour = inRangePct >= 70 ? "#10b981" : inRangePct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={colour} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="54" textAnchor="middle" fontSize="16" fontWeight="700" fill={colour}>
        {Math.round(inRangePct)}%
      </text>
    </svg>
  );
}

// ─── Mini Glucose Sparkline ───────────────────────────────────

function GlucoseSparkline({ readings }: { readings: { valueMmol: number }[] }) {
  if (readings.length < 2) return <div className="text-xs text-slate-400">No data</div>;
  const vals = readings.map((r) => r.valueMmol);
  const min = Math.min(...vals, 2.5);
  const max = Math.max(...vals, 14);
  const w = 200, h = 48;
  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
      <polyline points={points} fill="none" stroke="#14b8a6" strokeWidth="2" />
      {/* Target band 3.9–10.0 */}
      <rect
        x="0" y={h - ((10 - min) / (max - min)) * h}
        width={w} height={((10 - 3.9) / (max - min)) * h}
        fill="#10b98120"
      />
    </svg>
  );
}

// ─── Risk Tier Badge ──────────────────────────────────────────

function RiskBadge({ tier }: { tier: string }) {
  const cfg: Record<string, { colour: string; label: string }> = {
    safe:     { colour: "bg-green-100 text-green-800",   label: "Safe" },
    caution:  { colour: "bg-yellow-100 text-yellow-800", label: "Caution" },
    warning:  { colour: "bg-orange-100 text-orange-800", label: "Warning" },
    critical: { colour: "bg-red-100 text-red-800",       label: "Critical" },
  };
  const c = cfg[tier] ?? cfg.safe;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.colour}`}>
      {c.label}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id as string;

  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getAuthToken();
        const res = await fetch(`/api/clinician/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const data = await res.json() as { patient: PatientSummary };
        if (!cancelled) setPatient(data.patient);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load patient.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [patientId]);

  // ─── Loading ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 text-sm">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading patient…</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex items-center justify-center h-96 text-red-600 text-sm">
        <div className="text-center space-y-2">
          <p className="text-2xl">⚠️</p>
          <p>{error ?? "Patient not found."}</p>
          <button onClick={() => router.back()} className="text-teal-600 hover:underline">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">

      {/* Back + Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-slate-500 hover:text-slate-800 text-sm mb-1 flex items-center gap-1"
          >
            ← All Patients
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{patient.displayName}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-slate-500">{patient.participantId}</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-500">{patient.diabetesType}</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-500">{patient.insulinType}</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-500">{patient.regimeName}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                patient.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {patient.status}
            </span>
          </div>
        </div>

        <Link
          href={`/clinician/patients/${patientId}/report`}
          className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
        >
          📄 Generate Report
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* TIR Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <TirRing inRangePct={patient.tir.inRangePct} />
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Time in Range (14d)
            </p>
            <p className="text-sm text-slate-700">
              GMI: <strong>{patient.tir.gmi.toFixed(1)}</strong>
            </p>
            <p className="text-sm text-slate-700">
              CV: <strong>{patient.tir.cv.toFixed(0)}%</strong>
            </p>
            <p className="text-xs text-slate-400">{patient.tir.readingCount} readings</p>
          </div>
        </div>

        {/* IOB Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Active IOB
          </p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {patient.iob.currentIob.toFixed(1)}
            </span>
            <span className="text-slate-500 text-sm">U</span>
            <RiskBadge tier={patient.iob.riskTier} />
          </div>
          <p className="text-sm text-slate-600">
            Avg {patient.iob.avgDailyDoses.toFixed(1)} doses/day
          </p>
          <p className="text-sm text-slate-600">
            {patient.iob.stackingEventsLast7d} stacking event{patient.iob.stackingEventsLast7d !== 1 ? "s" : ""} (7d)
          </p>
        </div>

        {/* Last Reading + Sparkline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Glucose (24h)
          </p>
          {patient.lastReading ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">
                  {patient.lastReading.valueMmol.toFixed(1)}
                </span>
                <span className="text-slate-500 text-sm">mmol/L</span>
              </div>
              <p className="text-xs text-slate-400">
                {new Date(patient.lastReading.recordedAt).toLocaleTimeString("en-GB", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
              <GlucoseSparkline readings={patient.recentReadings} />
            </>
          ) : (
            <p className="text-sm text-slate-400">No readings in 24h</p>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800">
        <strong>GluMira™ is an educational platform only.</strong> Data shown is not a substitute
        for clinical assessment. Always apply clinical judgement.
      </div>

      {/* Clinician Notes Panel */}
      <ClinicianNotesPanel patientId={patientId} patientName={patient.displayName} />
    </div>
  );
}
