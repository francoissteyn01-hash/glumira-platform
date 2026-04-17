/**
 * GluMira™ V7 — Auth Page (replaces old AuthPage.tsx)
 * Sign in + Sign up + Google OAuth + Caregiver access.
 * Mobile first. Scandinavian Minimalist.
 */

import { useState } from "react";
import { supabase } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";

const T = "#2ab5c1";
const N = "#1a2a5e";
const D = "#0D1B3E";

type Mode = "signin" | "signup" | "caregiver" | "reset";

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

export default function RegisterPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Sign in
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  // Sign up
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPw, setRegPw] = useState("");
  const [role, setRole] = useState("");
  const [signupDone, setSignupDone] = useState(false);

  // Caregiver
  const [cgEmail, setCgEmail] = useState("");
  const [cgToken, setCgToken] = useState("");

  // Reset
  const [resetEmail, setResetEmail] = useState("");

  async function handleSignIn() {
    if (!email || !pw) { setMsg({ type: "error", text: "Please enter email and password." }); return; }
    setLoading(true); setMsg(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
      if (error) throw error;
      const lastSignIn = data.user?.last_sign_in_at;
      const isFirst = !lastSignIn || (Date.now() - new Date(lastSignIn).getTime() < 10000);
      window.location.href = isFirst ? "/onboarding" : "/dashboard";
    } catch (e: any) {
      const m = e.message ?? "Incorrect email or password.";
      setMsg({ type: "error", text: m.includes("fetch") || m.includes("network") ? "Unable to connect. Please try again later." : m });
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSignUp() {
    if (!name || !regEmail || !regPw || !role) { setMsg({ type: "error", text: "Please fill in all fields." }); return; }
    setLoading(true); setMsg(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPw,
        options: { data: { full_name: name.trim(), role } },
      });
      if (error) throw error;
      setSignupDone(true);
    } catch (e: any) {
      setMsg({ type: "error", text: e.message ?? "Registration failed." });
    } finally { setLoading(false); }
  }

  async function handleCaregiver() {
    if (!cgEmail || !cgToken) { setMsg({ type: "error", text: "Please enter email and share token." }); return; }
    setLoading(true); setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: cgEmail, password: cgToken });
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch (e: any) {
      setMsg({ type: "error", text: e.message ?? "Invalid token or email." });
    } finally { setLoading(false); }
  }

  async function handleReset() {
    if (!resetEmail) { setMsg({ type: "error", text: "Please enter your email." }); return; }
    setLoading(true); setMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      setMsg({ type: "success", text: "Check your email for a password reset link." });
    } catch (e: any) {
      setMsg({ type: "error", text: e.message ?? "Failed to send reset email." });
    } finally { setLoading(false); }
  }

  const roles = [
    { id: "caregiver", label: "Caregiver" },
    { id: "patient", label: "Self-Managing" },
    { id: "clinician", label: "Clinician" },
  ];

  const switchMode = (m: Mode) => { setMode(m); setMsg(null); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        .au{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(170deg,${D},${N} 80%);padding:32px 24px;font-family:'DM Sans',sans-serif}
        .au-card{width:100%;max-width:380px}
        .au-brand{text-align:center;margin-bottom:24px}
        .au-brand h1{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#fff;letter-spacing:1px}
        .au-brand h1 span{font-size:14px;vertical-align:super;color:${T}}
        .au-brand p{font-size:10px;color:#5a6a80;letter-spacing:2px;text-transform:uppercase;margin-top:4px}
        .au-tabs{display:flex;gap:0;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.08)}
        .au-tab{flex:1;padding:8px 0;text-align:center;font-size:12px;font-weight:500;color:#5a6a80;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.15s;background:none;border-top:none;border-left:none;border-right:none;font-family:'DM Sans',sans-serif}
        .au-tab:hover{color:#8899aa}
        .au-tab.on{color:${T};border-bottom-color:${T}}
        .au-f{margin-bottom:14px}
        .au-f label{display:block;font-size:12px;font-weight:500;color:#8899aa;margin-bottom:5px}
        .au-f input{width:100%;padding:10px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#e2e8f0;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.2s}
        .au-f input:focus{border-color:${T}}
        .au-f input::placeholder{color:#3a4a5a}
        .au-roles{display:flex;gap:8px;margin-bottom:18px}
        .au-role{flex:1;padding:9px 0;border:1px solid rgba(255,255,255,0.1);border-radius:6px;background:rgba(255,255,255,0.03);color:#8899aa;font-size:13px;font-weight:500;text-align:center;cursor:pointer;transition:all 0.15s;font-family:'DM Sans',sans-serif}
        .au-role:hover{border-color:rgba(42,181,193,0.3);color:#c8d6e5}
        .au-role.on{border-color:${T};background:rgba(42,181,193,0.1);color:${T}}
        .au-btn{width:100%;padding:12px;border:none;border-radius:6px;background:${T};color:#fff;font-size:15px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:opacity 0.2s}
        .au-btn:disabled{opacity:0.35;cursor:default}
        .au-btn:not(:disabled):hover{opacity:0.9}
        .au-g{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:6px;background:rgba(255,255,255,0.04);color:#c8d6e5;font-size:14px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s;margin-bottom:14px}
        .au-g:hover{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.2)}
        .au-div{display:flex;align-items:center;gap:12px;margin-bottom:14px;color:#4a5568;font-size:12px}
        .au-div::before,.au-div::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.06)}
        .au-msg{padding:10px 12px;border-radius:6px;font-size:13px;margin-bottom:14px;line-height:1.4}
        .au-msg.err{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#fca5a5}
        .au-msg.ok{background:rgba(42,181,193,0.08);border:1px solid rgba(42,181,193,0.2);color:${T}}
        .au-link{background:none;border:none;color:${T};font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;padding:0}
        .au-link:hover{text-decoration:underline}
        .au-disc{text-align:center;margin-top:20px;font-size:10px;color:#3a4a5a;line-height:1.5}
        .au-done{text-align:center;padding:20px 0}
        .au-done h2{color:#e2e8f0;font-size:18px;font-weight:600;margin-bottom:8px}
        .au-done p{color:#8899aa;font-size:13px;line-height:1.5}
      `}</style>

      <div className="au">
        <div className="au-card">
          <div className="au-brand">
            <img
              src="/brand/mira-hero.png"
              alt="Mira — GluMira™ guardian owl"
              style={{
                display: "block",
                width: 80,
                height: 80,
                objectFit: "contain",
                margin: "0 auto 10px",
                mixBlendMode: "screen",
                filter: "drop-shadow(0 4px 18px rgba(42,181,193,0.3))",
              }}
            />
            <h1>GluMira<span>&trade;</span></h1>
            <p>Powered by IOB Hunter&trade;</p>
          </div>

          {/* Tabs */}
          <div className="au-tabs">
            <button type="button" className={`au-tab${mode === "signin" ? " on" : ""}`} onClick={() => switchMode("signin")}>Sign in</button>
            <button type="button" className={`au-tab${mode === "signup" ? " on" : ""}`} onClick={() => switchMode("signup")}>Register</button>
            <button type="button" className={`au-tab${mode === "caregiver" ? " on" : ""}`} onClick={() => switchMode("caregiver")}>Caregiver</button>
          </div>

          {/* Messages */}
          {msg && <div className={`au-msg ${msg.type === "error" ? "err" : "ok"}`}>{msg.text}</div>}

          {/* ─── Sign In ─────────────────────────────────── */}
          {mode === "signin" && (
            <>
              <button className="au-g" onClick={handleGoogle} type="button">
                <GoogleIcon /> Continue with Google
              </button>
              <div className="au-div">or continue with email</div>

              <div className="au-f">
                <label>Email address</label>
                <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="au-f">
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSignIn()} />
              </div>

              <div style={{ textAlign: "right", marginBottom: 14 }}>
                <button type="button" className="au-link" onClick={() => switchMode("reset")}>Forgot password?</button>
              </div>

              <button type="button" className="au-btn" onClick={handleSignIn} disabled={loading}>
                {loading ? "Signing in..." : "Sign in to GluMira\u2122"}
              </button>

              <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#8899aa" }}>
                Don't have an account?{" "}
                <button type="button" className="au-link" onClick={() => switchMode("signup")}>Create one free &rarr;</button>
              </div>
            </>
          )}

          {/* ─── Sign Up ─────────────────────────────────── */}
          {mode === "signup" && !signupDone && (
            <>
              <button className="au-g" onClick={handleGoogle} type="button">
                <GoogleIcon /> Sign up with Google
              </button>
              <div className="au-div">or register with email</div>

              <div className="au-f">
                <label>Name</label>
                <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="au-f">
                <label>Email</label>
                <input type="email" placeholder="you@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              </div>
              <div className="au-f">
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={regPw} onChange={e => setRegPw(e.target.value)} />
              </div>

              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8899aa", marginBottom: 8 }}>
                I am a...
              </label>
              <div className="au-roles">
                {roles.map(r => (
                  <button type="button" key={r.id} className={`au-role${role === r.id ? " on" : ""}`} onClick={() => setRole(r.id)}>
                    {r.label}
                  </button>
                ))}
              </div>

              <button type="button" className="au-btn" onClick={handleSignUp} disabled={loading || !name || !regEmail || !regPw || !role}>
                {loading ? "Creating account..." : "Create account"}
              </button>

              <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#8899aa" }}>
                Already have an account?{" "}
                <button type="button" className="au-link" onClick={() => switchMode("signin")}>Sign in &rarr;</button>
              </div>
            </>
          )}

          {mode === "signup" && signupDone && (
            <div className="au-done">
              <h2>Check your email</h2>
              <p>We've sent a confirmation link to <strong style={{ color: T }}>{regEmail}</strong>. Click the link to activate your account.</p>
              <button type="button" className="au-link" style={{ marginTop: 16, fontSize: 13 }} onClick={() => switchMode("signin")}>
                &larr; Back to sign in
              </button>
            </div>
          )}

          {/* ─── Caregiver ───────────────────────────────── */}
          {mode === "caregiver" && (
            <>
              <p style={{ fontSize: 13, color: "#8899aa", marginBottom: 16, lineHeight: 1.5 }}>
                If you've received a share token from a patient or care team, enter it below to access their dashboard.
              </p>
              <div className="au-f">
                <label>Your email</label>
                <input type="email" placeholder="caregiver@email.com" value={cgEmail} onChange={e => setCgEmail(e.target.value)} />
              </div>
              <div className="au-f">
                <label>Share token</label>
                <input type="password" placeholder="Paste your token" value={cgToken} onChange={e => setCgToken(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCaregiver()} />
              </div>
              <button type="button" className="au-btn" onClick={handleCaregiver} disabled={loading}>
                {loading ? "Verifying..." : "Access dashboard"}
              </button>
            </>
          )}

          {/* ─── Reset ───────────────────────────────────── */}
          {mode === "reset" && (
            <>
              <p style={{ fontSize: 13, color: "#8899aa", marginBottom: 16, lineHeight: 1.5 }}>
                Enter your email and we'll send you a password reset link.
              </p>
              <div className="au-f">
                <label>Email address</label>
                <input type="email" placeholder="you@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleReset()} />
              </div>
              <button type="button" className="au-btn" onClick={handleReset} disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </button>
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <button type="button" className="au-link" onClick={() => switchMode("signin")}>&larr; Back to sign in</button>
              </div>
            </>
          )}

          <div className="au-disc">{DISCLAIMER}</div>
        </div>
      </div>
    </>
  );
}
