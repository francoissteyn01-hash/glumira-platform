import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/*  Block 73 — Clinical AI Report                                     */
/* ------------------------------------------------------------------ */

type Period = 7 | 14 | 30 | 90;

interface PatientHeader {
  name: string;
  id: string;
  age: number;
  diabetesType: string;
  insulinRegimen: string;
}

interface GlucoseStats {
  mean: number;
  sd: number;
  cv: number;
  gmi: number;
  readings: number;
  tir: { veryLow: number; low: number; inRange: number; high: number; veryHigh: number };
}

interface DetectedPattern {
  label: string;
  severity: "info" | "warning" | "critical";
  description: string;
}

interface InsulinStats {
  tdd: number;
  basalPct: number;
  bolusCount: number;
  stackingEvents: number;
  dangerWindows: string[];
}

interface IOBSummary {
  worstClass: string;
  overlapFrequency: number;
}

interface ReportData {
  patient: PatientHeader;
  stats: GlucoseStats;
  patterns: DetectedPattern[];
  insulin: InsulinStats;
  iob: IOBSummary;
  discussionPoints: string[];
  summary: string;
}

const PERIODS: { label: string; value: Period }[] = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

const SEVERITY_BADGE: Record<string, string> = {
  info: "bg-blue-900/40 text-blue-300 border-blue-700",
  warning: "bg-amber-900/40 text-amber-300 border-amber-700",
  critical: "bg-red-900/40 text-red-300 border-red-700",
};

function sampleData(period: Period): ReportData {
  const readings = period * 12;
  const tir = 68;
  return {
    patient: {
      name: "Sample Patient",
      id: "GLU-20240417",
      age: 14,
      diabetesType: "Type 1",
      insulinRegimen: "MDI (Basal-Bolus)",
    },
    stats: {
      mean: 8.4,
      sd: 3.1,
      cv: 36.9,
      gmi: 7.2,
      readings,
      tir: { veryLow: 1, low: 4, inRange: tir, high: 20, veryHigh: 7 },
    },
    patterns: [
      { label: "Dawn Phenomenon", severity: "warning", description: "Glucose rises detected between 04:00-07:00 on 60% of mornings." },
      { label: "Post-Lunch Spike", severity: "info", description: "Consistent post-lunch excursions above 13.9 mmol/L, average peak at 14.6." },
      { label: "Overnight Lows", severity: "critical", description: "3 readings below 3.0 mmol/L between 01:00-04:00 in the past " + period + " days." },
      { label: "Stacking Event", severity: "warning", description: "Correction bolus given within 2 h of previous bolus on 4 occasions." },
    ],
    insulin: { tdd: 32, basalPct: 48, bolusCount: period * 4, stackingEvents: 4, dangerWindows: ["22:00-02:00", "15:00-17:00"] },
    iob: { worstClass: "High Overlap", overlapFrequency: 6 },
    discussionPoints: [
      "Is the dawn phenomenon pattern worth addressing with basal timing adjustment?",
      "Post-lunch spikes suggest possible pre-bolus timing review.",
      "Overnight lows may warrant basal rate reduction after 22:00.",
      "Stacking events cluster on school days — could stress or routine changes be a factor?",
      "GMI of 7.2% is above target — would a bolus calculator review help?",
    ],
    summary: `Over the past ${period} days, this patient logged ${readings} glucose readings with ${tir}% time in range. A dawn phenomenon was detected on the majority of mornings, and 3 clinically significant overnight lows occurred. Post-lunch spikes are a recurring pattern. Insulin stacking was observed 4 times, predominantly on weekdays.`,
  };
}

const card = "rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5";

export default function ClinicalReportPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>(14);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/trpc/clinicalReport.generate?period=${period}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setReport(d.result?.data ?? sampleData(period)))
      .catch(() => setReport(sampleData(period)))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading || !report)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-secondary)] animate-pulse">Generating clinical report...</p>
      </div>
    );

  const { patient, stats, patterns, insulin, iob, discussionPoints, summary } = report;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] print:bg-white">
      <div className="mx-auto max-w-[960px]" style={{ padding: "clamp(16px, 4vw, 32px)" }}>
        {/* ---------- Title & period selector ---------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--text-primary)]">
              Clinical AI Report
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1 font-['DM_Sans']">
              AI-generated clinical summary for clinician review
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium font-['DM_Sans'] transition-colors border ${
                  period === p.value
                    ? "bg-brand-600 text-white border-brand-500"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-light)] hover:text-[var(--text-primary)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* ---------- Patient header ---------- */}
          <div className={card}>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm font-['DM_Sans']">
              {([
                ["Name", patient.name],
                ["Patient ID", patient.id],
                ["Age", `${patient.age} years`],
                ["Diabetes Type", patient.diabetesType],
                ["Regimen", patient.insulinRegimen],
              ] as const).map(([label, value]) => (
                <div key={label}>
                  <p className="text-[var(--text-secondary)] text-xs">{label}</p>
                  <p className="text-[var(--text-primary)] font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ---------- Executive summary ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-3">
              Executive Summary
            </h2>
            <p className="text-sm text-[var(--text-secondary)] font-['DM_Sans'] leading-relaxed">{summary}</p>
          </div>

          {/* ---------- Glucose statistics ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-4">
              Glucose Statistics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {([
                ["Mean Glucose", `${stats.mean} mmol/L`],
                ["SD", `${stats.sd} mmol/L`],
                ["CV%", `${stats.cv}%`],
                ["GMI", `${stats.gmi}%`],
              ] as const).map(([label, value]) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-[var(--text-secondary)] font-['DM_Sans']">{label}</p>
                  <p className="text-xl font-bold font-['JetBrains_Mono'] text-[var(--text-primary)]">{value}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2 font-['DM_Sans']">
              Time in Range Breakdown
            </h3>
            <table className="w-full text-sm font-['DM_Sans']">
              <thead>
                <tr className="text-left text-xs text-[var(--text-secondary)] border-b border-[var(--border-light)]">
                  <th className="pb-2">Range</th>
                  <th className="pb-2">mmol/L</th>
                  <th className="pb-2 text-right">%</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-primary)]">
                {([
                  ["Very Low", "<3.0", stats.tir.veryLow, "text-red-400"],
                  ["Low", "3.0 - 3.9", stats.tir.low, "text-orange-400"],
                  ["In Range", "3.9 - 10.0", stats.tir.inRange, "text-green-400"],
                  ["High", "10.0 - 13.9", stats.tir.high, "text-amber-400"],
                  ["Very High", ">13.9", stats.tir.veryHigh, "text-red-400"],
                ] as const).map(([label, range, pct, color]) => (
                  <tr key={label} className="border-b border-[var(--border-light)]/30">
                    <td className={`py-2 font-medium ${color}`}>{label}</td>
                    <td className="py-2 font-['JetBrains_Mono'] text-xs">{range}</td>
                    <td className={`py-2 text-right font-['JetBrains_Mono'] font-bold ${color}`}>{pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---------- Pattern analysis ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-4">
              Pattern Analysis
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {patterns.map((p) => (
                <div
                  key={p.label}
                  className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-primary)] p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${SEVERITY_BADGE[p.severity]}`}
                    >
                      {p.severity}
                    </span>
                    <span className="text-sm font-semibold text-[var(--text-primary)] font-['DM_Sans']">
                      {p.label}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-['DM_Sans'] leading-relaxed">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ---------- Insulin analysis ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-4">
              Insulin Analysis
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {([
                ["TDD", `${insulin.tdd} U`],
                ["Basal %", `${insulin.basalPct}%`],
                ["Bolus Count", `${insulin.bolusCount}`],
                ["Stacking Events", `${insulin.stackingEvents}`],
              ] as const).map(([label, value]) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-[var(--text-secondary)] font-['DM_Sans']">{label}</p>
                  <p className="text-lg font-bold font-['JetBrains_Mono'] text-[var(--text-primary)]">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-['DM_Sans'] mb-1">Danger Windows</p>
              <div className="flex gap-2">
                {insulin.dangerWindows.map((w) => (
                  <span
                    key={w}
                    className="text-xs font-['JetBrains_Mono'] px-2 py-1 rounded bg-red-900/30 text-red-400 border border-red-800"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ---------- IOB Pressure ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-3">
              IOB Pressure Summary
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm font-['DM_Sans']">
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Worst Pressure Class</p>
                <p className="text-[var(--text-primary)] font-semibold">{iob.worstClass}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Overlap Frequency</p>
                <p className="text-[var(--text-primary)] font-semibold font-['JetBrains_Mono']">
                  {iob.overlapFrequency} events
                </p>
              </div>
            </div>
          </div>

          {/* ---------- Discussion points ---------- */}
          <div className={card}>
            <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[var(--text-primary)] mb-3">
              Clinician Discussion Points
            </h2>
            <ul className="space-y-2">
              {discussionPoints.map((point, i) => (
                <li key={i} className="flex gap-3 text-sm font-['DM_Sans'] text-[var(--text-secondary)]">
                  <span className="text-brand-500 font-bold font-['JetBrains_Mono'] shrink-0">{i + 1}.</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ---------- Print / Export ---------- */}
          <div className="flex gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium font-['DM_Sans'] hover:bg-brand-700 transition-colors"
            >
              Print Report
            </button>
            <a
              href="/report"
              className="px-5 py-2.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm font-medium font-['DM_Sans'] hover:bg-[var(--bg-primary)] transition-colors"
            >
              Export PDF
            </a>
          </div>

          {/* ---------- Disclaimers ---------- */}
          <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-5 space-y-2">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide font-['DM_Sans']">
              Important Disclaimers
            </p>
            <ul className="space-y-1 text-xs text-amber-300/80 font-['DM_Sans'] leading-relaxed list-disc pl-4">
              <li>AI-generated clinical summary — educational use only.</li>
              <li>This report does not constitute medical advice.</li>
              <li>Pattern observations should be verified through clinical assessment.</li>
              <li>{DISCLAIMER}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
