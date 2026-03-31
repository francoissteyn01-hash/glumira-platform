/**
 * GluMira™ V7 — client/src/components/onboarding/OnboardingFlow.tsx
 *
 * Interactive onboarding system for beta participants.
 * Based on: chat_12_Interactive_Onboarding_System, chat_01_StoryEngine_Onboarding_Build
 *
 * Components:
 *   OnboardingFlow     — main orchestrator
 *   WelcomeScene       — animated welcome with owl
 *   ProfileSetupScene  — diabetes type, insulin type, CGM
 *   TargetRangeScene   — glucose targets
 *   NightscoutScene    — CGM connection
 *   CompleteScene      — success + participant ID
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTelemetry } from "../../hooks/useTelemetry";

// ── Types ──────────────────────────────────────────────────────────────────────

export type DiabetesType  = "T1D" | "T2D" | "Gestational";
export type InsulinMethod = "MDI" | "pump" | "oral" | "none";
export type CGMType       = "dexcom" | "libre" | "nightscout" | "finger_prick" | "none";

export interface OnboardingData {
  diabetesType:    DiabetesType | null;
  insulinMethod:   InsulinMethod | null;
  cgmType:         CGMType | null;
  nightscoutUrl:   string;
  targetLow:       number;
  targetHigh:      number;
  glucoseUnit:     "mmol" | "mgdl";
  consentGiven:    boolean;
}

type Step = "welcome" | "profile" | "targets" | "cgm" | "complete";

// ── Progress bar ───────────────────────────────────────────────────────────────

const STEPS: Step[] = ["welcome", "profile", "targets", "cgm", "complete"];

function ProgressBar({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  const pct = ((idx) / (STEPS.length - 1)) * 100;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ height: 4, background: "#dee2e6", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#2ab5c1", borderRadius: 2, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {STEPS.slice(0, -1).map((s, i) => (
          <span key={s} style={{ fontSize: 11, color: i <= idx ? "#2ab5c1" : "#adb5bd", fontFamily: "DM Sans, sans-serif" }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Owl mascot (inline SVG) ───────────────────────────────────────────────────

function OwlIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill="#0d1b3e"/>
      <ellipse cx="24" cy="27" rx="13" ry="14" fill="#1a5fb4"/>
      <ellipse cx="24" cy="17" rx="12" ry="10" fill="#1a5fb4"/>
      <circle cx="17" cy="17" r="5.5" fill="#C8890A"/>
      <circle cx="31" cy="17" r="5.5" fill="#C8890A"/>
      <circle cx="17" cy="17" r="3.2" fill="#0d1b3e"/>
      <circle cx="31" cy="17" r="3.2" fill="#0d1b3e"/>
      <circle cx="18" cy="16" r="1.2" fill="white"/>
      <circle cx="32" cy="16" r="1.2" fill="white"/>
      <ellipse cx="24" cy="35" rx="2.5" ry="3.5" fill="#f59e0b"/>
    </svg>
  );
}

// ── Scene: Welcome ─────────────────────────────────────────────────────────────

function WelcomeScene({ onNext, data, setData }: SceneProps) {
  return (
    <div style={styles.scene}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <OwlIcon size={72} />
        <h1 style={styles.h1}>Welcome to GluMira™</h1>
        <p style={styles.body}>
          The science of insulin, made visible. This takes about 3 minutes.
          We'll set up your profile so GluMira works for you from day one.
        </p>
        <div style={styles.betaBadge}>🧪 Beta participant — 6-week free access</div>
      </div>

      <div style={styles.consentBox}>
        <label style={styles.checkRow}>
          <input
            type="checkbox"
            checked={data.consentGiven}
            onChange={e => setData({ ...data, consentGiven: e.target.checked })}
            style={{ accentColor: "#2ab5c1", marginRight: 10 }}
          />
          <span style={styles.checkText}>
            I agree my data may be used for GluMira beta development.
            <br/>
            <span style={{ color: "#adb5bd", fontWeight: 300 }}>All responses are confidential. Educational platform only.</span>
          </span>
        </label>
      </div>

      <button
        style={{ ...styles.btn, opacity: data.consentGiven ? 1 : 0.4 }}
        disabled={!data.consentGiven}
        onClick={onNext}
      >
        Let's start →
      </button>
      <p style={styles.disclaimer}>GluMira™ is not a medical device. Discuss all clinical decisions with your care team.</p>
    </div>
  );
}

// ── Scene: Profile ─────────────────────────────────────────────────────────────

function ProfileScene({ onNext, onBack, data, setData }: SceneProps) {
  return (
    <div style={styles.scene}>
      <h2 style={styles.h2}>Your diabetes profile</h2>
      <p style={styles.body}>Helps GluMira pick the right insulin curves and targets for you.</p>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Diabetes type</label>
        <div style={styles.optionGrid}>
          {(["T1D","T2D","Gestational"] as DiabetesType[]).map(t => (
            <button key={t} style={{ ...styles.optBtn, ...(data.diabetesType === t ? styles.optBtnActive : {}) }}
              onClick={() => setData({ ...data, diabetesType: t })}>
              {t === "T1D" ? "Type 1" : t === "T2D" ? "Type 2" : "Gestational"}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>How do you manage insulin?</label>
        <div style={styles.optionGrid}>
          {[
            { v: "MDI", l: "Multiple Daily Injections" },
            { v: "pump", l: "Insulin Pump" },
            { v: "oral", l: "Oral Medication" },
            { v: "none", l: "Diet Only" },
          ].map(o => (
            <button key={o.v} style={{ ...styles.optBtn, ...(data.insulinMethod === o.v ? styles.optBtnActive : {}) }}
              onClick={() => setData({ ...data, insulinMethod: o.v as InsulinMethod })}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Glucose unit preference</label>
        <div style={{ display: "flex", gap: 10 }}>
          {(["mmol","mgdl"] as const).map(u => (
            <button key={u} style={{ ...styles.optBtn, flex: 1, ...(data.glucoseUnit === u ? styles.optBtnActive : {}) }}
              onClick={() => setData({ ...data, glucoseUnit: u })}>
              {u === "mmol" ? "mmol/L" : "mg/dL"}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.btnRow}>
        <button style={styles.btnSecondary} onClick={onBack}>← Back</button>
        <button style={{ ...styles.btn, flex: 1, opacity: data.diabetesType && data.insulinMethod ? 1 : 0.4 }}
          disabled={!data.diabetesType || !data.insulinMethod} onClick={onNext}>
          Continue →
        </button>
      </div>
    </div>
  );
}

// ── Scene: Targets ─────────────────────────────────────────────────────────────

function TargetsScene({ onNext, onBack, data, setData }: SceneProps) {
  const unit = data.glucoseUnit === "mmol" ? "mmol/L" : "mg/dL";
  const presets = data.glucoseUnit === "mmol"
    ? [{ l: "Standard (4.4–10.0)", low: 4.4, high: 10.0 }, { l: "Tight (3.9–7.8)", low: 3.9, high: 7.8 }, { l: "Relaxed (5.0–12.0)", low: 5.0, high: 12.0 }]
    : [{ l: "Standard (79–180)", low: 79, high: 180 }, { l: "Tight (70–140)", low: 70, high: 140 }, { l: "Relaxed (90–216)", low: 90, high: 216 }];

  return (
    <div style={styles.scene}>
      <h2 style={styles.h2}>Your glucose targets</h2>
      <p style={styles.body}>These are used to calculate Time in Range and colour-code your chart. Discuss with your care team.</p>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Quick presets</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {presets.map(p => (
            <button key={p.l} style={{ ...styles.optBtn, textAlign: "left", ...(data.targetLow === p.low && data.targetHigh === p.high ? styles.optBtnActive : {}) }}
              onClick={() => setData({ ...data, targetLow: p.low, targetHigh: p.high })}>
              {p.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Low target ({unit})</label>
          <input type="number" style={styles.input} value={data.targetLow} step={0.1}
            onChange={e => setData({ ...data, targetLow: parseFloat(e.target.value) })} />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>High target ({unit})</label>
          <input type="number" style={styles.input} value={data.targetHigh} step={0.1}
            onChange={e => setData({ ...data, targetHigh: parseFloat(e.target.value) })} />
        </div>
      </div>

      <div style={styles.btnRow}>
        <button style={styles.btnSecondary} onClick={onBack}>← Back</button>
        <button style={{ ...styles.btn, flex: 1 }} onClick={onNext}>Continue →</button>
      </div>
    </div>
  );
}

// ── Scene: CGM Connection ──────────────────────────────────────────────────────

function CGMScene({ onNext, onBack, data, setData }: SceneProps) {
  return (
    <div style={styles.scene}>
      <h2 style={styles.h2}>Connect your CGM</h2>
      <p style={styles.body}>GluMira syncs with your continuous glucose monitor in real time.</p>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>CGM type</label>
        <div style={styles.optionGrid}>
          {[
            { v: "nightscout", l: "Nightscout" },
            { v: "dexcom",     l: "Dexcom" },
            { v: "libre",      l: "FreeStyle Libre" },
            { v: "finger_prick", l: "Finger prick only" },
            { v: "none",       l: "Skip for now" },
          ].map(o => (
            <button key={o.v} style={{ ...styles.optBtn, ...(data.cgmType === o.v ? styles.optBtnActive : {}) }}
              onClick={() => setData({ ...data, cgmType: o.v as CGMType })}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {data.cgmType === "nightscout" && (
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Nightscout URL</label>
          <input type="url" style={styles.input} placeholder="https://your-site.ns.io"
            value={data.nightscoutUrl}
            onChange={e => setData({ ...data, nightscoutUrl: e.target.value })} />
          <p style={styles.hint}>Your Nightscout site URL. We'll test the connection now.</p>
        </div>
      )}

      <div style={styles.btnRow}>
        <button style={styles.btnSecondary} onClick={onBack}>← Back</button>
        <button style={{ ...styles.btn, flex: 1, opacity: data.cgmType ? 1 : 0.4 }}
          disabled={!data.cgmType} onClick={onNext}>
          {data.cgmType === "none" ? "Skip →" : "Connect →"}
        </button>
      </div>
    </div>
  );
}

// ── Scene: Complete ────────────────────────────────────────────────────────────

function CompleteScene({ data }: Pick<SceneProps, "data">) {
  const { user } = useAuth();
  return (
    <div style={{ ...styles.scene, textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🦉</div>
      <h2 style={styles.h1}>You're all set.</h2>
      <p style={styles.body}>
        Your profile is saved. GluMira is ready.<br/>
        Your 6-week beta starts now — Pro features unlock after 7 days.
      </p>
      {user && (
        <div style={{ ...styles.betaBadge, marginBottom: 24, display: "inline-block" }}>
          Participant: {user.email}
        </div>
      )}
      <div style={{ background: "rgba(42,181,193,0.06)", border: "1px solid rgba(42,181,193,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 24, textAlign: "left" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#1e8a94", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>Your setup</div>
        <div style={styles.summaryRow}><span style={styles.summaryLabel}>Type</span><span style={styles.summaryVal}>{data.diabetesType}</span></div>
        <div style={styles.summaryRow}><span style={styles.summaryLabel}>Insulin</span><span style={styles.summaryVal}>{data.insulinMethod}</span></div>
        <div style={styles.summaryRow}><span style={styles.summaryLabel}>CGM</span><span style={styles.summaryVal}>{data.cgmType ?? "Not set"}</span></div>
        <div style={styles.summaryRow}><span style={styles.summaryLabel}>Targets</span><span style={styles.summaryVal}>{data.targetLow}–{data.targetHigh} {data.glucoseUnit}</span></div>
      </div>
      <a href="/dashboard" style={{ ...styles.btn, display: "inline-block", textDecoration: "none", color: "#0d1b3e" }}>
        Open dashboard →
      </a>
      <p style={styles.disclaimer}>GluMira™ is not a medical device. Discuss all clinical decisions with your care team.</p>
    </div>
  );
}

// ── Main orchestrator ──────────────────────────────────────────────────────────

interface SceneProps {
  data:    OnboardingData;
  setData: (d: OnboardingData) => void;
  onNext:  () => void;
  onBack:  () => void;
}

export default function OnboardingFlow() {
  const { user } = useAuth();
  const { trackFeature } = useTelemetry();

  const [step, setStep] = useState<Step>("welcome");
  const [data, setData] = useState<OnboardingData>({
    diabetesType:  null,
    insulinMethod: null,
    cgmType:       null,
    nightscoutUrl: "",
    targetLow:     4.4,
    targetHigh:    10.0,
    glucoseUnit:   "mmol",
    consentGiven:  false,
  });

  const next = useCallback(() => {
    const idx = STEPS.indexOf(step);
    const nextStep = STEPS[idx + 1];
    if (nextStep) {
      setStep(nextStep);
      trackFeature("onboarding_step", { step: nextStep });
    }
    // Save to server on complete
    if (nextStep === "complete") saveOnboarding(data, user?.id);
  }, [step, data, user, trackFeature]);

  const back = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }, [step]);

  const props: SceneProps = { data, setData, onNext: next, onBack: back };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {step !== "complete" && <ProgressBar current={step} />}
        {step === "welcome"  && <WelcomeScene  {...props} />}
        {step === "profile"  && <ProfileScene  {...props} />}
        {step === "targets"  && <TargetsScene  {...props} />}
        {step === "cgm"      && <CGMScene      {...props} />}
        {step === "complete" && <CompleteScene data={data} />}
      </div>
    </div>
  );
}

async function saveOnboarding(data: OnboardingData, userId?: string) {
  if (!userId) return;
  try {
    const token = localStorage.getItem("glumira_access_token") ?? "";
    await fetch("/api/auth/me/onboarding", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify(data),
    });
  } catch { /* non-blocking */ }
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100vh", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "DM Sans, system-ui, sans-serif" },
  card:      { background: "#fff", borderRadius: 20, border: "1px solid #dee2e6", padding: "36px 40px", width: "100%", maxWidth: 480, boxShadow: "0 4px 24px rgba(26,42,94,0.08)" },
  scene:     { display: "flex", flexDirection: "column", gap: 0 },
  h1:        { fontFamily: "Playfair Display, Georgia, serif", fontSize: 28, fontWeight: 700, color: "#1a2a5e", margin: "16px 0 8px" },
  h2:        { fontFamily: "Playfair Display, Georgia, serif", fontSize: 22, fontWeight: 700, color: "#1a2a5e", margin: "0 0 6px" },
  body:      { fontSize: 14, color: "#52667a", lineHeight: 1.6, margin: "0 0 20px", fontWeight: 300 },
  fieldGroup:{ marginBottom: 18 },
  label:     { display: "block", fontSize: 12, fontWeight: 500, color: "#1a2a5e", marginBottom: 6, letterSpacing: "0.02em" },
  hint:      { fontSize: 11, color: "#52667a", marginTop: 4, fontWeight: 300 },
  input:     { width: "100%", height: 40, border: "1px solid #dee2e6", borderRadius: 8, padding: "0 12px", fontSize: 14, fontFamily: "DM Sans, sans-serif", outline: "none", boxSizing: "border-box" },
  optionGrid:{ display: "flex", flexDirection: "column", gap: 8 },
  optBtn:    { border: "1px solid #dee2e6", borderRadius: 10, padding: "10px 14px", background: "#fff", cursor: "pointer", fontSize: 13, textAlign: "left" as const, color: "#1a2a5e", fontFamily: "DM Sans, sans-serif", transition: "all 0.12s" },
  optBtnActive: { border: "1px solid #2ab5c1", background: "rgba(42,181,193,0.06)", color: "#1e8a94", fontWeight: 500 },
  btn:       { height: 44, background: "#2ab5c1", color: "#0d1b3e", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif", width: "100%", marginTop: 8 },
  btnSecondary: { height: 44, background: "#f8f9fa", color: "#1a2a5e", border: "1px solid #dee2e6", borderRadius: 8, fontSize: 14, fontWeight: 400, cursor: "pointer", fontFamily: "DM Sans, sans-serif", width: 80, marginTop: 8 },
  btnRow:    { display: "flex", gap: 10, marginTop: 8 },
  betaBadge: { background: "rgba(42,181,193,0.08)", border: "1px solid rgba(42,181,193,0.2)", borderRadius: 100, padding: "4px 14px", fontSize: 12, fontWeight: 500, color: "#1e8a94" },
  consentBox:{ background: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: 10, padding: 14, marginBottom: 20 },
  checkRow:  { display: "flex", alignItems: "flex-start", gap: 0, cursor: "pointer" },
  checkText: { fontSize: 13, color: "#52667a", lineHeight: 1.5, fontFamily: "DM Sans, sans-serif" },
  summaryRow:{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(222,226,230,0.5)", fontSize: 13 },
  summaryLabel: { color: "#52667a", fontWeight: 300 },
  summaryVal:   { color: "#1a2a5e", fontWeight: 500 },
  disclaimer:{ fontSize: 11, color: "#adb5bd", textAlign: "center" as const, marginTop: 16, lineHeight: 1.5 },
};
