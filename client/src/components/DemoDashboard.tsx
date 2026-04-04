/**
 * GluMira™ V7 — Demo Dashboard Wrapper
 * Wraps dashboard with demo profile data. Fully interactive but fictional.
 * IOB curve calculated from demo regimen. Glucose chart from sampleGlucose.
 */

import { useParams, Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { DEMO_PROFILES, type DemoProfile, type GlucoseReading, type InsulinRegimen } from "../data/demo-profiles";
import { DISCLAIMER } from "../lib/constants";
import { glucoseStatus } from "../lib/utils";
import GuidedTour from "./GuidedTour";

function getProfile(id: string): DemoProfile | null {
  // Check built-in demos
  const demo = DEMO_PROFILES.find((p) => p.id === id);
  if (demo) return demo;

  // Check custom profiles
  if (id === "custom-1" || id === "custom-2") {
    const slot = id === "custom-1" ? 1 : 2;
    try {
      const raw = localStorage.getItem(`glumira-custom-profile-${slot}`);
      if (raw) return JSON.parse(raw) as DemoProfile;
    } catch {}
  }
  return null;
}

/** Simple exponential decay IOB: dose * e^(-ln2/halfLife * t) */
function calculateIOB(dose: number, hoursElapsed: number, halfLifeHours: number): number {
  if (hoursElapsed < 0) return 0;
  const lambda = Math.LN2 / halfLifeHours;
  return dose * Math.exp(-lambda * hoursElapsed);
}

/** Generate IOB curve data from regimen for a 24h period */
function generateIOBCurve(regimen: InsulinRegimen[]) {
  const points: { hour: number; iob: number }[] = [];
  for (let minute = 0; minute < 1440; minute += 15) {
    const hour = minute / 60;
    let totalIOB = 0;

    for (const r of regimen) {
      for (const time of r.times) {
        const [h, m] = time.split(":").map(Number);
        const doseHour = h + m / 60;
        let elapsed = hour - doseHour;
        if (elapsed < 0) elapsed += 24; // wrap around midnight
        totalIOB += calculateIOB(r.dose, elapsed, r.halfLife);
      }
    }
    points.push({ hour, iob: Math.round(totalIOB * 100) / 100 });
  }
  return points;
}

function GlucoseBar({ reading, low, high }: { reading: GlucoseReading; low: number; high: number }) {
  const status = reading.value < low ? "low" : reading.value > high ? "high" : "normal";
  const color = status === "low" ? "bg-red-400" : status === "high" ? "bg-orange-400" : "bg-emerald-400";
  const maxVal = 20;
  const pct = Math.min((reading.value / maxVal) * 100, 100);

  return (
    <div className="flex items-end gap-1 flex-1 min-w-0">
      <div className="flex flex-col items-center flex-1 min-w-0">
        <span className="text-[9px] text-[#718096] mb-0.5">{reading.value}</span>
        <div className="w-full max-w-[20px] bg-[#f0f4f8] rounded-t-sm" style={{ height: "60px" }}>
          <div
            className={`w-full rounded-t-sm ${color} transition-all`}
            style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
          />
        </div>
        <span className="text-[8px] text-[#a0aec0] mt-0.5">{reading.time}</span>
      </div>
    </div>
  );
}

function IOBChart({ points }: { points: { hour: number; iob: number }[] }) {
  const maxIOB = Math.max(...points.map((p) => p.iob), 1);
  const width = 100;
  const height = 40;

  const pathD = points
    .map((p, i) => {
      const x = (p.hour / 24) * width;
      const y = height - (p.iob / maxIOB) * height;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaD = pathD + ` L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24" preserveAspectRatio="none">
      <path d={areaD} fill="#2ab5c1" opacity="0.15" />
      <path d={pathD} fill="none" stroke="#2ab5c1" strokeWidth="0.5" />
    </svg>
  );
}

/** Pressure classification based on IOB level */
function getPressure(iob: number, maxIOB: number): { label: string; color: string } {
  const ratio = maxIOB > 0 ? iob / maxIOB : 0;
  if (ratio > 0.75) return { label: "Overlap", color: "text-red-600 bg-red-50 border-red-200" };
  if (ratio > 0.50) return { label: "Strong", color: "text-orange-600 bg-orange-50 border-orange-200" };
  if (ratio > 0.25) return { label: "Moderate", color: "text-amber-600 bg-amber-50 border-amber-200" };
  return { label: "Light", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
}

export default function DemoDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profile = id ? getProfile(id) : null;

  const iobCurve = useMemo(() => {
    if (!profile?.child?.regimen) return [];
    return generateIOBCurve(profile.child.regimen);
  }, [profile]);

  const currentIOB = useMemo(() => {
    const now = new Date();
    const hourNow = now.getHours() + now.getMinutes() / 60;
    const nearest = iobCurve.reduce((best, p) =>
      Math.abs(p.hour - hourNow) < Math.abs(best.hour - hourNow) ? p : best,
      iobCurve[0] ?? { hour: 0, iob: 0 }
    );
    return nearest.iob;
  }, [iobCurve]);

  const maxIOB = useMemo(() => Math.max(...iobCurve.map((p) => p.iob), 1), [iobCurve]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-[#718096]">Profile not found.</p>
          <Link to="/safe-mode" className="text-xs text-[#2ab5c1] hover:underline">
            Back to Safe Mode
          </Link>
        </div>
      </div>
    );
  }

  const child = profile.child;
  const isClinicianView = profile.role === "clinician";
  const pressure = getPressure(currentIOB, maxIOB);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Guided Tour */}
      <GuidedTour profileId={profile.id} />

      {/* Demo Mode Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
        <p className="text-xs font-medium text-amber-800">
          DEMO MODE — {profile.name} — Fictional data
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5" id="tour-dashboard">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1a2a5e]">{profile.name}</h1>
            <p className="text-xs text-[#718096]">{profile.description}</p>
          </div>
          <Link
            to="/safe-mode"
            className="text-xs text-[#718096] hover:text-[#1a2a5e] border border-[#e2e8f0] rounded-lg px-3 py-1.5 transition-colors"
          >
            Back
          </Link>
        </div>

        {/* Medical disclaimer */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2">
          <p className="text-[10px] text-amber-800">{DISCLAIMER}</p>
        </div>

        {isClinicianView ? (
          /* Clinician view */
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#1a2a5e]">Patient Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {profile.patients?.map((patient, i) => (
                <div key={i} className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                  <p className="text-sm font-medium text-[#1a2a5e]">{patient.name}</p>
                  <p className="text-xs text-[#718096] mt-1">{patient.condition}</p>
                  <button className="mt-3 text-[10px] text-[#2ab5c1] hover:underline">
                    View Report
                  </button>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 text-center" id="tour-modules">
              <p className="text-xs text-[#718096]">
                Pattern analysis and report generation available for each patient.
              </p>
            </div>
          </div>
        ) : (
          /* Patient / Caregiver view */
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                <p className="text-[10px] text-[#718096] uppercase tracking-wide">Latest Glucose</p>
                <p className="mt-1 text-2xl font-bold text-[#1a2a5e]">
                  {child?.sampleGlucose[child.sampleGlucose.length - 1]?.value ?? "—"}
                </p>
                <p className="text-[10px] text-[#718096]">{child?.units ?? "mmol/L"}</p>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                <p className="text-[10px] text-[#718096] uppercase tracking-wide">Active IOB</p>
                <p className="mt-1 text-2xl font-bold text-[#1a2a5e]">{currentIOB.toFixed(1)}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-[10px] text-[#718096]">U</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${pressure.color}`}>
                    {pressure.label}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                <p className="text-[10px] text-[#718096] uppercase tracking-wide">Today's Doses</p>
                <p className="mt-1 text-2xl font-bold text-[#1a2a5e]">
                  {child?.regimen.reduce((sum, r) => sum + r.times.length, 0) ?? 0}
                </p>
                <p className="text-[10px] text-[#718096]">scheduled</p>
              </div>
            </div>

            {/* Glucose Chart */}
            {child && (
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#1a2a5e]">Glucose Trend</h2>
                  <div className="flex items-center gap-2 text-[9px] text-[#a0aec0]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Normal</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> High</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Low</span>
                  </div>
                </div>
                {/* Target range band */}
                <div className="text-[9px] text-[#a0aec0] flex justify-between px-1">
                  <span>Target: {child.glucoseTarget.low}–{child.glucoseTarget.high} {child.units}</span>
                </div>
                <div className="flex items-end gap-0.5 h-20 px-1">
                  {child.sampleGlucose.map((reading, i) => (
                    <GlucoseBar
                      key={i}
                      reading={reading}
                      low={child.glucoseTarget.low}
                      high={child.glucoseTarget.high}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* IOB Curve */}
            {child && iobCurve.length > 0 && (
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 space-y-2" id="tour-iob-curve">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#1a2a5e]">IOB Curve (24h)</h2>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${pressure.color}`} id="tour-stacking">
                    Pressure: {pressure.label}
                  </span>
                </div>
                <IOBChart points={iobCurve} />
                <div className="flex justify-between text-[8px] text-[#a0aec0] px-1">
                  <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
                </div>
              </div>
            )}

            {/* Regimen Summary */}
            {child && (
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 space-y-3">
                <h2 className="text-sm font-semibold text-[#1a2a5e]">Insulin Regimen</h2>
                <div className="space-y-2">
                  {child.regimen.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className={`w-2 h-2 rounded-full ${r.type === "basal" ? "bg-[#1a2a5e]" : "bg-[#2ab5c1]"}`} />
                      <span className="font-medium text-[#1a2a5e] w-24">{r.insulin}</span>
                      <span className="text-[#718096]">{r.dose}U</span>
                      <span className="text-[#a0aec0]">{r.times.join(", ")}</span>
                      <span className="text-[#a0aec0] text-[10px]">t½ {r.halfLife}h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Quick Nav */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" id="tour-education">
          <Link to="/education" className="rounded-xl border border-[#e2e8f0] bg-white p-4 text-center hover:shadow-sm transition-shadow">
            <p className="text-xs font-medium text-[#1a2a5e]">Education</p>
            <p className="text-[9px] text-[#a0aec0] mt-0.5">100 topics</p>
          </Link>
          <Link to="/mira" className="rounded-xl border border-[#e2e8f0] bg-white p-4 text-center hover:shadow-sm transition-shadow" id="tour-mira">
            <p className="text-xs font-medium text-[#1a2a5e]">Ask Mira</p>
            <p className="text-[9px] text-[#a0aec0] mt-0.5">AI assistant</p>
          </Link>
          <Link to="/modules/bernstein" className="rounded-xl border border-[#e2e8f0] bg-white p-4 text-center hover:shadow-sm transition-shadow" id="tour-modules">
            <p className="text-xs font-medium text-[#1a2a5e]">Modules</p>
            <p className="text-[9px] text-[#a0aec0] mt-0.5">Specialist</p>
          </Link>
          <Link to="/mira" className="rounded-xl border border-[#e2e8f0] bg-white p-4 text-center hover:shadow-sm transition-shadow" id="tour-feedback">
            <p className="text-xs font-medium text-[#1a2a5e]">Feedback</p>
            <p className="text-[9px] text-[#a0aec0] mt-0.5">via Mira</p>
          </Link>
        </div>

      </div>
    </div>
  );
}
