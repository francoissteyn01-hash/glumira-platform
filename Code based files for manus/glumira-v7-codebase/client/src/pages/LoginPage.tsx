/**
 * GluMira™ V7 — client/src/pages/LoginPage.tsx
 * data-testid contracts from auth.spec.ts and clinician.spec.ts
 */
import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string|null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) { setError("Incorrect email or password."); return; }
    navigate("/dashboard");
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.owl}>🦉</span>
          <span style={styles.wordmark}>GluMira<sup style={styles.sup}>™</sup></span>
        </div>

        <h1 style={styles.h1}>Sign in</h1>
        <p style={styles.sub}>The science of insulin, made visible</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label} htmlFor="email">Email address</label>
          <input
            id="email"
            data-testid="email-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@clinic.com"
            required
            autoComplete="email"
            style={styles.input}
          />

          <label style={styles.label} htmlFor="password">Password</label>
          <input
            id="password"
            data-testid="password-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            style={styles.input}
          />

          <div style={styles.forgotRow}>
            <Link to="/reset-password" style={styles.link}>Forgot password?</Link>
          </div>

          <button
            data-testid="login-submit"
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Signing in…" : "Sign in to GluMira™"}
          </button>
        </form>

        <div style={styles.divider}><span>or</span></div>

        <button onClick={signInWithGoogle} style={styles.googleBtn}>
          Continue with Google
        </button>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>Create one free →</Link>
        </p>

        <p style={styles.disclaimer}>
          GluMira™ is an educational platform, not a medical device.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap:        { minHeight:"100vh",background:"#f8f9fa",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"DM Sans,system-ui,sans-serif" },
  card:        { background:"#fff",border:"1px solid #dee2e6",borderRadius:16,padding:"40px 44px",width:"100%",maxWidth:400,boxShadow:"0 4px 24px rgba(26,42,94,0.08)" },
  brand:       { display:"flex",alignItems:"center",gap:8,marginBottom:24 },
  owl:         { fontSize:28 },
  wordmark:    { fontFamily:"Playfair Display,Georgia,serif",fontSize:20,fontWeight:700,color:"#1a2a5e" },
  sup:         { fontSize:10,verticalAlign:"super",color:"#2ab5c1" },
  h1:          { fontFamily:"Playfair Display,Georgia,serif",fontSize:24,fontWeight:700,color:"#1a2a5e",margin:"0 0 4px" },
  sub:         { fontSize:13,color:"#52667a",marginBottom:24 },
  errorBox:    { background:"rgba(211,47,47,0.06)",border:"1px solid rgba(211,47,47,0.2)",borderLeft:"3px solid #D32F2F",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#D32F2F",marginBottom:16 },
  form:        { display:"flex",flexDirection:"column",gap:4 },
  label:       { fontSize:12,fontWeight:500,color:"#1a2a5e",marginBottom:4,marginTop:12 },
  input:       { height:40,background:"#f8f9fa",border:"1px solid #dee2e6",borderRadius:8,padding:"0 12px",fontFamily:"DM Sans,sans-serif",fontSize:14,color:"#1a2a5e",outline:"none" },
  forgotRow:   { textAlign:"right",marginTop:4,marginBottom:4 },
  btn:         { marginTop:12,height:44,background:"#2ab5c1",color:"#0d1b3e",fontFamily:"DM Sans,sans-serif",fontSize:15,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer" },
  divider:     { display:"flex",alignItems:"center",gap:12,margin:"20px 0",color:"#52667a",fontSize:11 },
  googleBtn:   { width:"100%",height:40,background:"#fff",border:"1px solid #dee2e6",borderRadius:8,fontFamily:"DM Sans,sans-serif",fontSize:14,cursor:"pointer",marginBottom:16 },
  footer:      { textAlign:"center",fontSize:13,color:"#52667a",marginTop:8 },
  link:        { color:"#2ab5c1",fontWeight:500,textDecoration:"none" },
  disclaimer:  { textAlign:"center",fontSize:11,color:"#adb5bd",marginTop:16 },
};
