/**
 * GluMira™ V7 — AuthPage.tsx
 * Two-column branded auth page matching glumira-auth.html design.
 * Left: dark navy Clinical Depth panel with IOB Hunter card, stats, branding.
 * Right: white Scandinavian minimalist login/register/caregiver/reset forms.
 *
 * Colours: --navy:#1a2a5e  --teal:#2ab5c1  --amber:#f59e0b
 * Fonts:   Playfair Display (headings) + DM Sans (body) + JetBrains Mono (data)
 */

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { supabase } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";
/* ─── Assets ─────────────────────────────────────────────────────────────── */
// Identity owl — heraldic wings-spread, amber badge on chest, transparent bg
const OWL_IDENTITY = "/mira-owl-identity.png";
const CDN = {
  appIcon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/glumira_v6_matched_icon_17a09028.png",
};

/* ─── Google Fonts injection ──────────────────────────────────────────────── */
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500;600&display=swap";

function injectFonts() {
  if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
  const preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = "https://fonts.googleapis.com";
  document.head.appendChild(preconnect);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONT_HREF;
  document.head.appendChild(link);
}

/* ─── Design tokens ───────────────────────────────────────────────────────── */
const T = {
  navy: "#1a2a5e",
  navyDeep: "#0d1b3e",
  navyMid: "#152348",
  teal: "#2ab5c1",
  tealLt: "#7dd3c0",
  tealDim: "#1e8a94",
  amber: "#f59e0b",
  amberLt: "#fcd34d",
  white: "#ffffff",
  bodyText: "#1a2a5e",
  border: "#dee2e6",
  bg: "#f8f9fa",
  error: "#D32F2F",
  errorBg: "rgba(211,47,47,0.06)",
  errorBorder: "rgba(211,47,47,0.25)",
  success: "#2E7D32",
  successBg: "rgba(46,125,50,0.06)",
  successBorder: "rgba(46,125,50,0.25)",
  fontDisp: "'Playfair Display',Georgia,serif",
  fontBody: "'DM Sans',system-ui,sans-serif",
  fontMono: "'JetBrains Mono',monospace",
  rSm: "4px",
  rMd: "8px",
  rLg: "12px",
  rXl: "16px",
};

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Tab = "signin" | "register" | "caregiver" | "reset";
type Role = "" | "clinician" | "patient" | "researcher";

/* ─── Owl logo (cropped face from CDN) ────────────────────────────────────── */
function OwlLogo({ size = 32 }: { size?: number }) {
  return (
    <img
      src={CDN.appIcon}
      alt="GluMira™ Mira owl"
      width={size}
      height={size}
      style={{ borderRadius: "50%", objectFit: "cover" }}
    />
  );
}

/* ─── Google SVG ──────────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

/* ─── Reusable style helpers ──────────────────────────────────────────────── */
const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: 40,
  background: T.bg,
  border: `1px solid ${T.border}`,
  borderRadius: T.rMd,
  padding: "0 12px",
  fontFamily: T.fontBody,
  fontSize: 14,
  color: T.navy,
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  WebkitAppearance: "none",
  appearance: "none",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: T.navy,
  marginBottom: 5,
  letterSpacing: "0.01em",
};

const fieldStyle: CSSProperties = { marginBottom: 16 };

const btnSubmitBase: CSSProperties = {
  display: "block",
  width: "100%",
  height: 44,
  background: T.teal,
  color: T.navyDeep,
  fontFamily: T.fontBody,
  fontSize: 15,
  fontWeight: 600,
  border: "none",
  borderRadius: T.rMd,
  cursor: "pointer",
  transition: "all 0.15s",
  marginTop: 8,
  letterSpacing: "0.01em",
};

/* ─── Password strength helper ────────────────────────────────────────────── */
function getPasswordStrength(val: string) {
  if (!val) return { score: 0, label: "Enter a password" };
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] || "Weak" };
}

function barColor(score: number) {
  if (score <= 1) return "#D32F2F";
  if (score <= 2) return "#F57C00";
  return "#2E7D32";
}

/* ─── SPECIALTIES ─────────────────────────────────────────────────────────── */
const SPECIALTIES = [
  "Endocrinologist",
  "Diabetes educator",
  "Nurse",
  "Paediatrician",
  "GP / Family medicine",
  "Obstetrician",
];

const REGIONS = [
  { value: "", label: "Select your region" },
  { value: "AF", label: "Africa (30% discount applies)" },
  { value: "UAE", label: "UAE / Gulf" },
  { value: "UK", label: "United Kingdom" },
  { value: "EU", label: "European Union" },
  { value: "US", label: "United States" },
  { value: "INT", label: "International" },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  LEFT PANEL                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */
function LeftPanel() {
  return (
    <div
      style={{
        background: `linear-gradient(155deg, ${T.navyDeep} 0%, #0f1f4a 45%, ${T.navyMid} 75%, ${T.navy} 100%)`,
        padding: 48,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Radial glow overlays */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 700px 500px at 80% 40%, rgba(42,181,193,0.08) 0%, transparent 65%),
                        radial-gradient(ellipse 400px 300px at 10% 75%, rgba(42,181,193,0.04) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      {/* Grid pattern overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.025,
          pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(42,181,193,0.5) 60px),
                            repeating-linear-gradient(60deg, transparent, transparent 59px, rgba(42,181,193,0.5) 60px),
                            repeating-linear-gradient(120deg, transparent, transparent 59px, rgba(42,181,193,0.5) 60px)`,
        }}
      />

      {/* Brand */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 10 }}>
        <OwlLogo size={32} />
        <span style={{ fontWeight: 500, fontSize: 20, color: T.white, letterSpacing: "-0.01em" }}>
          GluMira<sup style={{ fontSize: 10, verticalAlign: "super", color: T.teal }}>™</sup>
        </span>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.teal,
            marginBottom: 20,
          }}
        >
          Powered by IOB Hunter™
        </p>
        <h2
          style={{
            fontFamily: T.fontDisp,
            fontSize: "clamp(32px, 4vw, 44px)",
            fontWeight: 700,
            color: T.white,
            lineHeight: 1.12,
            marginBottom: 20,
          }}
        >
          The science of insulin,
          <br />
          <em style={{ fontStyle: "italic", color: T.teal }}>made visible</em>
        </h2>
        <p
          style={{
            fontSize: 16,
            fontWeight: 300,
            color: "rgba(255,255,255,0.82)",
            lineHeight: 1.7,
            maxWidth: 400,
            marginBottom: 40,
          }}
        >
          For caregivers sitting awake at 2am, watching glucose numbers, asking why. We answer that question with
          science, not guesswork.
        </p>

        {/* ── Mira welcome ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: "rgba(42,181,193,0.06)",
            border: "1px solid rgba(42,181,193,0.15)",
            borderRadius: T.rXl,
            padding: "16px 20px",
            marginBottom: 32,
          }}
        >
          <img
            src={OWL_IDENTITY}
            alt="Mira — The Sentinel owl"
            width={120}
            height={120}
            style={{ borderRadius: 12, flexShrink: 0 }}
          />
          <div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: T.white,
                marginBottom: 2,
              }}
            >
              Hi, I'm Mira
            </p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 300,
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.5,
              }}
            >
              I watch over your numbers so you can rest.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {[
            { num: "9", lbl: "Insulin types modelled" },
            { num: "4", lbl: "Specialist modules" },
            { num: "3mo", lbl: "Free, no card" },
          ].map((s) => (
            <div key={s.lbl} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontFamily: T.fontMono, fontSize: 22, fontWeight: 600, color: T.white }}>
                {s.num}
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 300 }}>{s.lbl}</span>
            </div>
          ))}
        </div>


      </div>

      {/* Footer */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
          fontWeight: 300,
          lineHeight: 1.5,
        }}
      >
        GluMira™ is an educational platform, not a medical device.
        <br />
        Always discuss clinical decisions with your care team.
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  RIGHT PANEL                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
function RightPanel() {
  const [tab, setTab] = useState<Tab>("signin");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);

  /* Sign-in state */
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  /* Registration state */
  const [regStep, setRegStep] = useState(1);
  const [role, setRole] = useState<Role>("");
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [regFname, setRegFname] = useState("");
  const [regLname, setRegLname] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRegion, setRegRegion] = useState("");
  const [regClinic, setRegClinic] = useState("");
  const [regLicense, setRegLicense] = useState("");
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentHipaa, setConsentHipaa] = useState(false);
  const [consentComms, setConsentComms] = useState(false);

  /* Caregiver state */
  const [cgToken, setCgToken] = useState("");
  const [cgEmail, setCgEmail] = useState("");

  /* Reset state */
  const [resetEmail, setResetEmail] = useState("");

  const switchTab = useCallback((t: Tab) => {
    setTab(t);
    setMsg(null);
    if (t === "register") setRegStep(1);
  }, []);

  /* ─── Auth handlers ─────────────────────────────────────────────────────── */
  async function handleSignIn() {
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: siEmail, password: siPassword });
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch (e: any) {
      setMsg({ type: "error", text: e.message ?? "Incorrect email or password." });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  async function handleRegister() {
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            full_name: `${regFname} ${regLname}`.trim(),
            role,
            specialties: selectedSpecs,
            region: regRegion,
            clinic: regClinic,
            license: regLicense,
          },
        },
      });
      if (error) throw error;
      setRegStep(4);
    } catch (e: any) {
      setMsg({ type: "error", text: e.message ?? "Registration failed." });
    } finally {
      setLoading(false);
    }
  }

  async function handleCaregiverAccess() {
    if (!cgToken || !cgEmail) {
      setMsg({ type: "error", text: "Please enter your share token and email address." });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      // In production: validate token against backend
      const { error } = await supabase.auth.signInWithPassword({ email: cgEmail, password: cgToken });
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch (e: any) {
      setMsg({ type: "error", text: e.message ?? "Invalid token or email." });
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!resetEmail) return;
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      setMsg({ type: "success", text: "Reset link sent. Check your inbox." });
    } catch (e: any) {
      setMsg({ type: "error", text: e.message ?? "Failed to send reset email." });
    } finally {
      setLoading(false);
    }
  }

  function formatToken(val: string) {
    const v = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const parts: string[] = [];
    parts.push(v.slice(0, 3));
    if (v.length > 3) parts.push(v.slice(3, 7));
    if (v.length > 7) parts.push(v.slice(7, 11));
    if (v.length > 11) parts.push(v.slice(11, 15));
    return "GLM-" + parts.filter(Boolean).join("-");
  }

  const pwStrength = getPasswordStrength(regPassword);

  /* ─── Tab button style ──────────────────────────────────────────────────── */
  function tabBtnStyle(t: Tab): CSSProperties {
    const active = tab === t;
    return {
      flex: 1,
      padding: "10px 0",
      fontSize: 13,
      fontWeight: active ? 500 : 400,
      color: active ? T.teal : T.bodyText,
      background: "none",
      border: "none",
      borderBottom: `2px solid ${active ? T.teal : "transparent"}`,
      marginBottom: -1,
      cursor: "pointer",
      transition: "all 0.15s",
      fontFamily: T.fontBody,
      textAlign: "center",
    };
  }

  /* ─── Alert component ───────────────────────────────────────────────────── */
  function Alert({ type, text }: { type: "error" | "success" | "info"; text: string }) {
    const colors = {
      error: { bg: T.errorBg, border: T.error, color: T.error },
      success: { bg: T.successBg, border: T.success, color: T.success },
      info: { bg: "rgba(42,181,193,0.06)", border: T.teal, color: T.tealDim },
    };
    const c = colors[type];
    return (
      <div
        style={{
          borderRadius: T.rMd,
          padding: "11px 14px",
          fontSize: 13,
          lineHeight: 1.5,
          marginBottom: 18,
          borderLeft: `3px solid ${c.border}`,
          background: c.bg,
          color: c.color,
        }}
      >
        {text}
      </div>
    );
  }

  /* ─── Progress steps (registration) ─────────────────────────────────────── */
  function ProgressSteps() {
    const steps = ["Role", "Account", "Clinic", "Done"];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < regStep;
          const isActive = stepNum === regStep;
          return (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                flex: 1,
                position: "relative",
              }}
            >
              {i < steps.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: "50%",
                    right: "-50%",
                    height: 1,
                    background: isDone ? T.teal : T.border,
                    zIndex: 0,
                    transition: "background 0.2s",
                  }}
                />
              )}
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: `2px solid ${isDone ? T.teal : isActive ? T.teal : T.border}`,
                  background: isDone ? T.teal : T.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: isDone ? T.white : isActive ? T.teal : T.bodyText,
                  zIndex: 1,
                  position: "relative",
                  transition: "all 0.2s",
                  boxShadow: isActive ? `0 0 0 3px rgba(42,181,193,0.15)` : "none",
                }}
              >
                {isDone ? "✓" : stepNum}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: isActive ? T.teal : T.bodyText,
                  whiteSpace: "nowrap",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ─── Role selector ─────────────────────────────────────────────────────── */
  function RoleGrid() {
    const roles: { id: Role; icon: string; name: string; desc: string }[] = [
      { id: "clinician", icon: "🧑‍⚕️", name: "Clinician", desc: "Doctor, nurse, educator" },
      { id: "patient", icon: "🩺", name: "Patient", desc: "T1D or T2D" },
      { id: "researcher", icon: "🔬", name: "Researcher", desc: "Institutional" },
    ];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
        {roles.map((r) => {
          const selected = role === r.id;
          return (
            <div
              key={r.id}
              onClick={() => setRole(r.id)}
              style={{
                border: `1px solid ${selected ? T.teal : T.border}`,
                borderRadius: T.rLg,
                padding: "14px 10px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.15s",
                background: selected ? "rgba(42,181,193,0.05)" : T.white,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: selected ? "rgba(42,181,193,0.12)" : T.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  margin: "0 auto 8px",
                }}
              >
                {r.icon}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: T.navy }}>{r.name}</div>
              <div style={{ fontSize: 10, color: T.bodyText, marginTop: 2, lineHeight: 1.3 }}>{r.desc}</div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ─── Divider ───────────────────────────────────────────────────────────── */
  function Divider({ text }: { text: string }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span style={{ fontSize: 11, color: T.bodyText, whiteSpace: "nowrap" }}>{text}</span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>
    );
  }

  /* ─── Google button ─────────────────────────────────────────────────────── */
  function GoogleBtn({ label = "Continue with Google" }: { label?: string }) {
    return (
      <button
        onClick={handleGoogle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          width: "100%",
          height: 40,
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: T.rMd,
          fontFamily: T.fontBody,
          fontSize: 14,
          fontWeight: 400,
          color: T.navy,
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        <GoogleIcon />
        {label}
      </button>
    );
  }

  /* ═══ SIGN IN TAB ═══════════════════════════════════════════════════════ */
  function SignInPanel() {
    return (
      <div>
        <h2 style={{ fontFamily: T.fontDisp, fontSize: 24, fontWeight: 700, color: T.navy, marginBottom: 6 }}>
          Welcome back
        </h2>
        <p style={{ fontSize: 14, color: T.bodyText, fontWeight: 300, marginBottom: 28, lineHeight: 1.5 }}>
          Sign in to your GluMira™ account
        </p>

        {msg && msg.type === "error" && <Alert type="error" text={msg.text} />}

        <GoogleBtn />
        <Divider text="or continue with email" />

        <div style={fieldStyle}>
          <label style={labelStyle}>Email address</label>
          <input
            type="email"
            value={siEmail}
            onChange={(e) => setSiEmail(e.target.value)}
            placeholder="you@clinic.com"
            autoComplete="email"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = T.teal;
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.12)";
              e.currentTarget.style.background = T.white;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = T.bg;
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={siPassword}
            onChange={(e) => setSiPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = T.teal;
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.12)";
              e.currentTarget.style.background = T.white;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = T.bg;
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
          />
          <div style={{ textAlign: "right", marginTop: 4 }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                switchTab("reset");
              }}
              style={{ color: T.teal, fontSize: 11, textDecoration: "none" }}
            >
              Forgot password?
            </a>
          </div>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading || !siEmail || !siPassword}
          style={{
            ...btnSubmitBase,
            opacity: loading || !siEmail || !siPassword ? 0.55 : 1,
            cursor: loading || !siEmail || !siPassword ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing in…" : "Sign in to GluMira™"}
        </button>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: T.bodyText }}>
          Don't have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              switchTab("register");
            }}
            style={{ color: T.teal, fontWeight: 500, textDecoration: "none" }}
          >
            Create one free →
          </a>
        </div>
      </div>
    );
  }

  /* ═══ REGISTER TAB ═════════════════════════════════════════════════════ */
  function RegisterPanel() {
    return (
      <div>
        <ProgressSteps />

        {msg && <Alert type={msg.type} text={msg.text} />}

        {/* Step 1 — Role */}
        {regStep === 1 && (
          <div>
            <h2 style={{ fontFamily: T.fontDisp, fontSize: 24, fontWeight: 700, color: T.navy, marginBottom: 6 }}>
              Who are you?
            </h2>
            <p style={{ fontSize: 14, color: T.bodyText, fontWeight: 300, marginBottom: 28, lineHeight: 1.5 }}>
              Choose your role to customise your GluMira™ experience.
            </p>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 500,
                padding: "3px 10px",
                borderRadius: 100,
                marginBottom: 20,
                background: "rgba(42,181,193,0.08)",
                border: "1px solid rgba(42,181,193,0.2)",
                color: T.tealDim,
              }}
            >
              ✓ 3-month free trial — no card needed
            </span>

            <RoleGrid />

            {role === "clinician" && (
              <div style={fieldStyle}>
                <label style={labelStyle}>Specialisation</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {SPECIALTIES.map((s) => {
                    const sel = selectedSpecs.includes(s);
                    return (
                      <span
                        key={s}
                        onClick={() =>
                          setSelectedSpecs((prev) => (sel ? prev.filter((x) => x !== s) : [...prev, s]))
                        }
                        style={{
                          fontSize: 11,
                          padding: "4px 10px",
                          borderRadius: 100,
                          border: `1px solid ${sel ? T.teal : T.border}`,
                          background: sel ? "rgba(42,181,193,0.07)" : T.white,
                          cursor: "pointer",
                          color: sel ? T.tealDim : T.bodyText,
                          fontWeight: sel ? 500 : 400,
                          transition: "all 0.12s",
                        }}
                      >
                        {s}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <button onClick={() => setRegStep(2)} style={{ ...btnSubmitBase, marginTop: 20 }}>
              Continue →
            </button>
            <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: T.bodyText }}>
              Already registered?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  switchTab("signin");
                }}
                style={{ color: T.teal, fontWeight: 500, textDecoration: "none" }}
              >
                Sign in
              </a>
            </div>
          </div>
        )}

        {/* Step 2 — Account */}
        {regStep === 2 && (
          <div>
            <h2 style={{ fontFamily: T.fontDisp, fontSize: 24, fontWeight: 700, color: T.navy, marginBottom: 6 }}>
              Create your account
            </h2>
            <p style={{ fontSize: 14, color: T.bodyText, fontWeight: 300, marginBottom: 28, lineHeight: 1.5 }}>
              Your GluMira™ credentials
            </p>

            <GoogleBtn label="Sign up with Google" />
            <Divider text="or use email" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>First name</label>
                <input
                  type="text"
                  value={regFname}
                  onChange={(e) => setRegFname(e.target.value)}
                  placeholder="Sarah"
                  autoComplete="given-name"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.12)"; e.currentTarget.style.background = T.white; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = T.bg; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Last name</label>
                <input
                  type="text"
                  value={regLname}
                  onChange={(e) => setRegLname(e.target.value)}
                  placeholder="Nakamura"
                  autoComplete="family-name"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.12)"; e.currentTarget.style.background = T.white; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = T.bg; }}
                />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="sarah@clinic.com"
                autoComplete="email"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.12)"; e.currentTarget.style.background = T.white; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = T.bg; }}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.12)"; e.currentTarget.style.background = T.white; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = T.bg; }}
              />
              <div style={{ marginTop: 5 }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 3 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: 3,
                        borderRadius: 2,
                        flex: 1,
                        background: i <= pwStrength.score ? barColor(pwStrength.score) : T.border,
                        transition: "background 0.2s",
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: 10, color: T.bodyText }}>{pwStrength.label}</div>
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Region</label>
              <select
                value={regRegion}
                onChange={(e) => setRegRegion(e.target.value)}
                style={{ ...inputStyle, paddingRight: 32 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.12)"; e.currentTarget.style.background = T.white; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = T.bg; }}
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: T.bodyText, marginTop: 4, fontWeight: 300 }}>
                African residents receive 30% discount on Pro tier automatically.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setRegStep(1)}
                style={{
                  ...btnSubmitBase,
                  background: T.bg,
                  color: T.navy,
                  border: `1px solid ${T.border}`,
                  flex: "0 0 auto",
                  width: 80,
                }}
              >
                ← Back
              </button>
              <button onClick={() => setRegStep(3)} style={{ ...btnSubmitBase, flex: 1 }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Clinic */}
        {regStep === 3 && (
          <div>
            <h2 style={{ fontFamily: T.fontDisp, fontSize: 24, fontWeight: 700, color: T.navy, marginBottom: 6 }}>
              Your practice
            </h2>
            <p style={{ fontSize: 14, color: T.bodyText, fontWeight: 300, marginBottom: 28, lineHeight: 1.5 }}>
              Helps us customise reporting and regional guidelines.
            </p>

            <div style={fieldStyle}>
              <label style={labelStyle}>Clinic / hospital name</label>
              <input
                type="text"
                value={regClinic}
                onChange={(e) => setRegClinic(e.target.value)}
                placeholder="Windhoek Central Hospital"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.12)"; e.currentTarget.style.background = T.white; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = T.bg; }}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>
                HPCSA / licence number <span style={{ color: T.bodyText, fontWeight: 300 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={regLicense}
                onChange={(e) => setRegLicense(e.target.value)}
                placeholder="MP 123456"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.12)"; e.currentTarget.style.background = T.white; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = T.bg; }}
              />
              <div style={{ fontSize: 11, color: T.bodyText, marginTop: 4, fontWeight: 300 }}>
                Used for professional verification only. Never displayed publicly.
              </div>
            </div>

            <div
              style={{
                background: T.bg,
                border: `1px solid ${T.border}`,
                borderRadius: T.rMd,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: T.bodyText, lineHeight: 1.5, marginBottom: 10 }}>
                <input
                  type="checkbox"
                  checked={consentTerms}
                  onChange={(e) => setConsentTerms(e.target.checked)}
                  style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 2, accentColor: T.teal }}
                />
                <label style={{ fontSize: 13, fontWeight: 300, marginBottom: 0 }}>
                  I agree to the <a href="#" style={{ color: T.teal }}>Terms of Service</a> and{" "}
                  <a href="#" style={{ color: T.teal }}>Privacy Policy</a>
                </label>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: T.bodyText, lineHeight: 1.5, marginBottom: 10 }}>
                <input
                  type="checkbox"
                  checked={consentHipaa}
                  onChange={(e) => setConsentHipaa(e.target.checked)}
                  style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 2, accentColor: T.teal }}
                />
                <label style={{ fontSize: 13, fontWeight: 300, marginBottom: 0 }}>
                  I understand GluMira™ is an educational platform, not a medical device. All clinical insights must
                  be discussed with a qualified care team.
                </label>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: T.bodyText, lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={consentComms}
                  onChange={(e) => setConsentComms(e.target.checked)}
                  style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 2, accentColor: T.teal }}
                />
                <label style={{ fontSize: 13, fontWeight: 300, marginBottom: 0 }}>
                  Send me product updates and clinical insights (optional)
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setRegStep(2)}
                style={{
                  ...btnSubmitBase,
                  background: T.bg,
                  color: T.navy,
                  border: `1px solid ${T.border}`,
                  flex: "0 0 auto",
                  width: 80,
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleRegister}
                disabled={loading}
                style={{
                  ...btnSubmitBase,
                  flex: 1,
                  background: T.amber,
                  color: T.navyDeep,
                  opacity: loading ? 0.55 : 1,
                }}
              >
                {loading ? "Creating…" : "Create account →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Success */}
        {regStep === 4 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🦉</div>
            <h2
              style={{
                fontFamily: T.fontDisp,
                fontSize: 24,
                fontWeight: 700,
                color: T.navy,
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              You're in.
            </h2>
            <p
              style={{
                fontSize: 14,
                color: T.bodyText,
                fontWeight: 300,
                textAlign: "center",
                maxWidth: 280,
                margin: "0 auto 24px",
                lineHeight: 1.5,
              }}
            >
              Check your email to verify your account, then start your 3-month free trial.
            </p>
            <Alert type="success" text="Account created. Verification email sent." />
            <button onClick={() => switchTab("signin")} style={btnSubmitBase}>
              Go to sign in
            </button>
            <div style={{ marginTop: 16, fontSize: 12, color: T.bodyText }}>
              Discuss all clinical insights with your care team.
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═══ CAREGIVER TAB ════════════════════════════════════════════════════ */
  function CaregiverPanel() {
    return (
      <div>
        <h2 style={{ fontFamily: T.fontDisp, fontSize: 24, fontWeight: 700, color: T.navy, marginBottom: 6 }}>
          Caregiver access
        </h2>
        <p style={{ fontSize: 14, color: T.bodyText, fontWeight: 300, marginBottom: 28, lineHeight: 1.5 }}>
          Enter your share token from the clinician or patient who invited you.
        </p>

        {msg && <Alert type={msg.type} text={msg.text} />}

        {/* Token display box */}
        <div
          style={{
            background: "rgba(42,181,193,0.06)",
            border: "1px solid rgba(42,181,193,0.2)",
            borderRadius: T.rLg,
            padding: 16,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: T.tealDim,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Share token
          </div>
          <div
            style={{
              fontFamily: T.fontMono,
              fontSize: 14,
              color: T.navy,
              letterSpacing: "0.1em",
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: T.rSm,
              padding: "8px 14px",
              display: "inline-block",
            }}
          >
            {cgToken || "GLM-XXXX-XXXX-XXXX"}
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Your share token</label>
          <input
            type="text"
            value={cgToken}
            onChange={(e) => setCgToken(formatToken(e.target.value))}
            placeholder="GLM-XXXX-XXXX-XXXX"
            style={{ ...inputStyle, fontFamily: T.fontMono, letterSpacing: "0.06em", textTransform: "uppercase" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.12)"; e.currentTarget.style.background = T.white; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = T.bg; }}
          />
          <div style={{ fontSize: 11, color: T.bodyText, marginTop: 4, fontWeight: 300 }}>
            Your clinician or patient sends this token when they create a caregiver share link.
          </div>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Your email address</label>
          <input
            type="email"
            value={cgEmail}
            onChange={(e) => setCgEmail(e.target.value)}
            placeholder="parent@family.com"
            autoComplete="email"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.12)"; e.currentTarget.style.background = T.white; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = T.bg; }}
          />
          <div style={{ fontSize: 11, color: T.bodyText, marginTop: 4, fontWeight: 300 }}>
            Must match the email address your clinician used to invite you.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            borderRadius: T.rMd,
            padding: "11px 14px",
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 18,
            borderLeft: `3px solid ${T.teal}`,
            background: "rgba(42,181,193,0.06)",
            color: T.tealDim,
          }}
        >
          <span>ℹ️</span>
          <span>
            Caregiver access is <strong>view-only by default</strong> unless your clinician granted edit permissions.
            Discuss all clinical decisions with your care team.
          </span>
        </div>

        <button
          onClick={handleCaregiverAccess}
          disabled={loading}
          style={{
            ...btnSubmitBase,
            opacity: loading ? 0.55 : 1,
          }}
        >
          {loading ? "Verifying token…" : "Access patient profile"}
        </button>

        <Divider text="no token?" />
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, color: T.bodyText, marginBottom: 10 }}>
            Ask your clinician or the patient's account holder to generate a caregiver share link from their dashboard.
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              switchTab("signin");
            }}
            style={{ fontSize: 13, color: T.teal, fontWeight: 500, textDecoration: "none" }}
          >
            Already have an account? Sign in →
          </a>
        </div>
      </div>
    );
  }

  /* ═══ RESET TAB ════════════════════════════════════════════════════════ */
  function ResetPanel() {
    return (
      <div>
        <h2 style={{ fontFamily: T.fontDisp, fontSize: 24, fontWeight: 700, color: T.navy, marginBottom: 6 }}>
          Reset password
        </h2>
        <p style={{ fontSize: 14, color: T.bodyText, fontWeight: 300, marginBottom: 28, lineHeight: 1.5 }}>
          Enter your email and we'll send a reset link.
        </p>

        {msg && msg.type === "success" && <Alert type="success" text={msg.text} />}
        {msg && msg.type === "error" && <Alert type="error" text={msg.text} />}

        <div style={fieldStyle}>
          <label style={labelStyle}>Email address</label>
          <input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="you@clinic.com"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.12)"; e.currentTarget.style.background = T.white; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = T.bg; }}
            onKeyDown={(e) => e.key === "Enter" && handleReset()}
          />
        </div>
        <button
          onClick={handleReset}
          disabled={loading || !resetEmail}
          style={{
            ...btnSubmitBase,
            opacity: loading || !resetEmail ? 0.55 : 1,
          }}
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
        <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: T.bodyText }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              switchTab("signin");
            }}
            style={{ color: T.teal, fontWeight: 500, textDecoration: "none" }}
          >
            ← Back to sign in
          </a>
        </div>
      </div>
    );
  }

  /* ─── Render right panel ────────────────────────────────────────────────── */
  return (
    <div
      style={{
        background: T.white,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 56px",
        minHeight: "100vh",
        overflowY: "auto",
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Tab nav */}
        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}`, marginBottom: 36 }}>
          <button style={tabBtnStyle("signin")} onClick={() => switchTab("signin")}>
            Sign in
          </button>
          <button style={tabBtnStyle("register")} onClick={() => switchTab("register")}>
            Clinician sign-up
          </button>
          <button style={tabBtnStyle("caregiver")} onClick={() => switchTab("caregiver")}>
            Caregiver access
          </button>
        </div>

        {tab === "signin" && <SignInPanel />}
        {tab === "register" && <RegisterPanel />}
        {tab === "caregiver" && <CaregiverPanel />}
        {tab === "reset" && <ResetPanel />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN EXPORT                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function AuthPage() {
  useEffect(() => {
    injectFonts();
  }, []);

  return (
    <>
      {/* Keyframe animation for the live dot blink */}
      <style>{`
        @keyframes glm-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 480px",
          minHeight: "100vh",
          fontFamily: T.fontBody,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <LeftPanel />
        <RightPanel />
      </div>
      {/* Mobile: hide left panel */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 480px"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1fr 480px"] > div:first-child {
            display: none !important;
          }
          div[style*="grid-template-columns: 1fr 480px"] > div:last-child {
            padding: 40px 24px !important;
          }
        }
      `}</style>
    </>
  );
}
