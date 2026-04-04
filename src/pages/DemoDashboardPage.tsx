/**
 * GluMira™ V7 — Demo Dashboard (Safe Mode)
 * Wraps the dashboard experience with demo profile data.
 * Amber banner. Fictional data. Fully interactive.
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DEMO_PROFILES, getDemoProfile, type DemoProfile, type DemoChild } from "@/data/demo-profiles";
import GuidedTour from "@/components/safe-mode/GuidedTour";
import { DISCLAIMER } from "@/lib/constants";

const T = {
  bg: "#f8f9fa",
  navy: "#1a2a5e",
  teal: "#2ab5c1",
  amber: "#f59e0b",
  red: "#ef4444",
  muted: "#718096",
  border: "#e2e8f0",
  font: "'DM Sans', system-ui, sans-serif",
};

function getCustomProfile(slot: number): DemoProfile | null {
  try {
    const raw = localStorage.getItem(`glumira_custom_profile_${slot}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function resolveProfile(id: string): DemoProfile | null {
  if (id === "custom-1") return getCustomProfile(1);
  if (id === "custom-2") return getCustomProfile(2);
  return getDemoProfile(id) ?? null;
}

function classifyGlucose(value: number, target: { low: number; high: number }) {
  if (value < target.low) return { label: "LOW", color: T.red };
  if (value > target.high) return { label: "HIGH", color: T.amber };
  return { label: "In range", color: T.teal };
}

function calcIOB(child: DemoChild, hourNow: number): number {
  let iob = 0;
  for (const r of child.regimen) {
    for (const t of r.times) {
      const doseHour = parseInt(t.split(":")[0], 10);
      const elapsed = (hourNow - doseHour + 24) % 24;
      const decay = Math.exp(-elapsed / r.halfLife);
      if (elapsed < r.halfLife * 3) {
        iob += r.dose * decay;
      }
    }
  }
  return Math.round(iob * 100) / 100;
}

function GlucoseChart({ data, target }: { data: DemoChild["sampleGlucose"]; target: DemoChild["glucoseTarget"] }) {
  const maxVal = Math.max(...data.map((d) => d.value), target.high + 2);
  const h = 160;
  const w = "100%";

  return (
    <div style={{ position: "relative", height: h, width: w, background: "#ffffff", borderRadius: 10, border: `1px solid ${T.border}`, padding: "12px 16px", overflow: "hidden" }}>
      {/* Target range band */}
      <div style={{
        position: "absolute",
        left: 16, right: 16,
        top: `${12 + (1 - target.high / maxVal) * (h - 40)}px`,
        height: `${((target.high - target.low) / maxVal) * (h - 40)}px`,
        background: "rgba(42,181,193,0.08)",
        borderRadius: 4,
      }} />
      {/* Points */}
      <svg width="100%" height={h - 24} viewBox={`0 0 ${data.length * 60} ${h - 24}`} style={{ position: "relative", zIndex: 1 }}>
        {data.map((d, i) => {
          const x = i * 60 + 20;
          const y = (1 - d.value / maxVal) * (h - 40) + 8;
          const c = classifyGlucose(d.value, target);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={4} fill={c.color} />
              {i > 0 && (
                <line
                  x1={(i - 1) * 60 + 20}
                  y1={(1 - data[i - 1].value / maxVal) * (h - 40) + 8}
                  x2={x} y2={y}
                  stroke={T.teal} strokeWidth={1.5} strokeOpacity={0.3}
                />
              )}
              <text x={x} y={h - 30} textAnchor="middle" fontSize={9} fill={T.muted}>{d.time}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function InsulinCard({ child }: { child: DemoChild }) {
  const now = new Date().getHours();
  const iob = calcIOB(child, now);

  return (
    <div style={{ background: "#ffffff", borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted, marginBottom: 8, fontFamily: T.font }}>
        Active Insulin (IOB)
      </p>
      <p style={{ fontSize: 28, fontWeight: 700, color: T.navy, margin: "0 0 4px", fontFamily: T.font }}>
        {iob.toFixed(2)} <span style={{ fontSize: 14, fontWeight: 400, color: T.muted }}>U</span>
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {child.regimen.map((r, i) => (
          <span key={i} style={{
            fontSize: 11,
            padding: "3px 8px",
            borderRadius: 4,
            background: r.type === "basal" ? "rgba(26,42,94,0.06)" : "rgba(42,181,193,0.08)",
            color: r.type === "basal" ? T.navy : T.teal,
            fontFamily: T.font,
          }}>
            {r.insulin} {r.dose}U
          </span>
        ))}
      </div>
    </div>
  );
}

function ClinicianView({ profile }: { profile: DemoProfile }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ background: "#ffffff", borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: T.navy, marginBottom: 12, fontFamily: T.font }}>
          Patient Roster
        </p>
        {profile.patients?.map((p, i) => (
          <div key={i} style={{ padding: "10px 0", borderBottom: i < (profile.patients?.length ?? 0) - 1 ? `1px solid ${T.border}` : "none" }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: T.navy, margin: 0, fontFamily: T.font }}>{p.name}</p>
            <p style={{ fontSize: 12, color: T.muted, margin: "2px 0 0", fontFamily: T.font }}>{p.condition}</p>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/education" style={{ padding: "10px 20px", borderRadius: 8, background: T.teal, color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none", fontFamily: T.font }}>
          Education Topics
        </Link>
        <Link to="/modules/paediatric" style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${T.border}`, color: T.navy, fontSize: 13, fontWeight: 500, textDecoration: "none", fontFamily: T.font }}>
          Paediatric Module
        </Link>
      </div>
    </div>
  );
}

export default function DemoDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profile = useMemo(() => resolveProfile(id ?? ""), [id]);

  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: T.red, fontSize: 15, fontFamily: T.font }}>Profile not found.</p>
          <button onClick={() => navigate("/safe-mode")} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 8, border: "none", background: T.teal, color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: T.font }}>
            Back to Safe Mode
          </button>
        </div>
      </div>
    );
  }

  const child = profile.child;
  const isClinician = profile.role === "clinician";

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font }}>
      {/* Demo banner */}
      <div style={{
        background: "rgba(245,158,11,0.1)",
        borderBottom: "1px solid rgba(245,158,11,0.25)",
        padding: "8px 20px",
        textAlign: "center",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: T.amber, margin: 0 }}>
          DEMO MODE — {profile.name} — Fictional data
        </p>
      </div>

      {/* Guided tour */}
      <GuidedTour profileId={profile.id} />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 60px" }}>
        {/* Profile header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: T.navy, margin: 0 }}>{profile.name}</h1>
            <p style={{ fontSize: 13, color: T.muted, margin: "4px 0 0" }}>{profile.description}</p>
          </div>
          <button
            onClick={() => navigate("/safe-mode")}
            style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.navy, fontSize: 12, cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap" }}
          >
            Switch Profile
          </button>
        </div>

        {isClinician ? (
          <ClinicianView profile={profile} />
        ) : child ? (
          <div style={{ display: "grid", gap: 16 }}>
            {/* Glucose chart */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted, marginBottom: 8 }}>
                24h Glucose Trend
              </p>
              <GlucoseChart data={child.sampleGlucose} target={child.glucoseTarget} />
            </div>

            {/* IOB + Profile info */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              <InsulinCard child={child} />
              <div style={{ background: "#ffffff", borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted, marginBottom: 8 }}>
                  Profile
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 13, color: T.navy }}>
                  <span style={{ color: T.muted }}>Age</span><span>{child.age}</span>
                  <span style={{ color: T.muted }}>Weight</span><span>{child.weight} kg</span>
                  <span style={{ color: T.muted }}>Type</span><span>{child.diabetesType}</span>
                  <span style={{ color: T.muted }}>Diagnosed</span><span>{Math.round(child.diagnosedMonths / 12)} yr ago</span>
                  <span style={{ color: T.muted }}>Target</span><span>{child.glucoseTarget.low}–{child.glucoseTarget.high} {child.units}</span>
                  {child.dietaryModule && <><span style={{ color: T.muted }}>Diet</span><span style={{ textTransform: "capitalize" }}>{child.dietaryModule}</span></>}
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
              <Link to="/education" style={{ padding: "9px 18px", borderRadius: 8, background: T.teal, color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                Education
              </Link>
              <Link to="/mira" style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${T.border}`, color: T.navy, fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                Ask Mira
              </Link>
              <Link to="/badges" style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${T.border}`, color: T.navy, fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                Badges
              </Link>
              {child.dietaryModule && (
                <Link to={`/modules/${child.dietaryModule}`} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${T.amber}`, color: T.amber, fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                  {child.dietaryModule.charAt(0).toUpperCase() + child.dietaryModule.slice(1)} Module
                </Link>
              )}
            </div>
          </div>
        ) : null}

        {/* Feedback CTA */}
        <div style={{ marginTop: 32, padding: 20, background: "rgba(42,181,193,0.04)", borderRadius: 10, border: `1px solid rgba(42,181,193,0.15)`, textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: T.navy, marginBottom: 4 }}>Help shape GluMira™</p>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>Your feedback directly influences what we build next.</p>
          <Link to="/mira" style={{ padding: "9px 20px", borderRadius: 8, background: T.teal, color: "#fff", fontSize: 13, fontWeight: 500, textDecoration: "none", display: "inline-block" }}>
            Give Feedback via Mira
          </Link>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: 10, color: "rgba(113,128,150,0.5)", textAlign: "center", marginTop: 24, lineHeight: 1.5 }}>
          {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
