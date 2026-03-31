/**
 * GluMira™ V7 — client/src/pages/RegisterPage.tsx
 * data-testid contracts from auth.spec.ts
 */
import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate   = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState<string|null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const { error: err } = await signUp(email, password, { role: "user" });
    setLoading(false);
    if (err) { setError(err.message ?? "Registration failed."); return; }
    navigate("/dashboard");
  }

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.brand}>
          <span style={{fontSize:28}}>🦉</span>
          <span style={S.wordmark}>GluMira<sup style={{fontSize:10,verticalAlign:"super",color:"#2ab5c1"}}>™</sup></span>
        </div>
        <h1 style={S.h1}>Create account</h1>
        <p style={S.sub}>Join the GluMira™ beta — free for 6 weeks</p>

        {error && <div style={S.err}>{error}</div>}

        <form onSubmit={handleSubmit} style={S.form}>
          <label style={S.label} htmlFor="email">Email address</label>
          <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="you@clinic.com" required autoComplete="email" style={S.input} />

          <label style={S.label} htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)}
            placeholder="Min. 8 characters" required autoComplete="new-password" style={S.input} />

          <label style={S.label} htmlFor="confirm">Confirm password</label>
          <input id="confirm" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
            placeholder="Repeat password" required autoComplete="new-password" style={S.input} />

          <button type="submit" disabled={loading}
            style={{...S.btn, opacity: loading ? 0.6 : 1, marginTop:16}}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={S.footer}>
          Already have an account? <Link to="/login" style={S.link}>Sign in</Link>
        </p>
        <p style={S.disc}>GluMira™ is an educational platform, not a medical device.</p>
      </div>
    </div>
  );
}

const S: Record<string,React.CSSProperties> = {
  wrap:  {minHeight:"100vh",background:"#f8f9fa",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"DM Sans,system-ui,sans-serif"},
  card:  {background:"#fff",border:"1px solid #dee2e6",borderRadius:16,padding:"40px 44px",width:"100%",maxWidth:400,boxShadow:"0 4px 24px rgba(26,42,94,0.08)"},
  brand: {display:"flex",alignItems:"center",gap:8,marginBottom:24},
  wordmark:{fontFamily:"Playfair Display,Georgia,serif",fontSize:20,fontWeight:700,color:"#1a2a5e"},
  h1:    {fontFamily:"Playfair Display,Georgia,serif",fontSize:24,fontWeight:700,color:"#1a2a5e",margin:"0 0 4px"},
  sub:   {fontSize:13,color:"#52667a",marginBottom:24},
  err:   {background:"rgba(211,47,47,0.06)",border:"1px solid rgba(211,47,47,0.2)",borderLeft:"3px solid #D32F2F",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#D32F2F",marginBottom:16},
  form:  {display:"flex",flexDirection:"column",gap:4},
  label: {fontSize:12,fontWeight:500,color:"#1a2a5e",marginBottom:4,marginTop:12},
  input: {height:40,background:"#f8f9fa",border:"1px solid #dee2e6",borderRadius:8,padding:"0 12px",fontFamily:"DM Sans,sans-serif",fontSize:14,color:"#1a2a5e",outline:"none"},
  btn:   {height:44,background:"#2ab5c1",color:"#0d1b3e",fontFamily:"DM Sans,sans-serif",fontSize:15,fontWeight:600,border:"none",borderRadius:8,cursor:"pointer"},
  footer:{textAlign:"center",fontSize:13,color:"#52667a",marginTop:16},
  link:  {color:"#2ab5c1",fontWeight:500,textDecoration:"none"},
  disc:  {textAlign:"center",fontSize:11,color:"#adb5bd",marginTop:16},
};
