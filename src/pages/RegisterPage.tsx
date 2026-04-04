import { useState } from "react";

const T = "#2ab5c1";
const N = "#1a2a5e";
const D = "#0D1B3E";
const A = "#f59e0b";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [role, setRole] = useState("");

  const roles = [
    { id: "caregiver", label: "Caregiver" },
    { id: "patient", label: "Patient" },
    { id: "clinician", label: "Clinician" },
  ];

  const ready = name && email && pw && role;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:${D}}
        .rg{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(170deg,${D},${N} 80%);padding:32px 24px;font-family:'DM Sans',sans-serif}
        .rg-card{width:100%;max-width:380px}
        .rg-brand{text-align:center;margin-bottom:28px}
        .rg-brand h1{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#fff;letter-spacing:1px}
        .rg-brand h1 span{font-size:14px;vertical-align:super;color:${T}}
        .rg-brand p{font-size:10px;color:#5a6a80;letter-spacing:2px;text-transform:uppercase;margin-top:4px}
        .rg-f{margin-bottom:14px}
        .rg-f label{display:block;font-size:12px;font-weight:500;color:#8899aa;margin-bottom:5px}
        .rg-f input{width:100%;padding:10px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#e2e8f0;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.2s}
        .rg-f input:focus{border-color:${T}}
        .rg-f input::placeholder{color:#3a4a5a}
        .rg-roles{display:flex;gap:8px;margin-bottom:22px}
        .rg-role{flex:1;padding:9px 0;border:1px solid rgba(255,255,255,0.1);border-radius:6px;background:rgba(255,255,255,0.03);color:#8899aa;font-size:13px;font-weight:500;text-align:center;cursor:pointer;transition:all 0.15s;font-family:'DM Sans',sans-serif}
        .rg-role:hover{border-color:rgba(42,181,193,0.3);color:#c8d6e5}
        .rg-role.on{border-color:${T};background:rgba(42,181,193,0.1);color:${T}}
        .rg-btn{width:100%;padding:12px;border:none;border-radius:6px;background:${T};color:#fff;font-size:15px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:opacity 0.2s}
        .rg-btn:disabled{opacity:0.35;cursor:default}
        .rg-btn:not(:disabled):hover{opacity:0.9}
        .rg-disc{text-align:center;margin-top:20px;font-size:10px;color:#3a4a5a;line-height:1.5}
      `}</style>

      <div className="rg">
        <div className="rg-card">
          <div className="rg-brand">
            <h1>GluMira<span>&trade;</span></h1>
            <p>Powered by IOB Hunter&trade;</p>
          </div>

          <div className="rg-f">
            <label>Name</label>
            <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="rg-f">
            <label>Email</label>
            <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="rg-f">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} />
          </div>

          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8899aa", marginBottom: 8 }}>
            I am a...
          </label>
          <div className="rg-roles">
            {roles.map(r => (
              <button
                key={r.id}
                className={`rg-role${role === r.id ? " on" : ""}`}
                onClick={() => setRole(r.id)}
                type="button"
              >
                {r.label}
              </button>
            ))}
          </div>

          <button className="rg-btn" disabled={!ready}>
            Create account
          </button>

          <div className="rg-disc">
            GluMira&trade; is an educational platform, not a medical device.
          </div>
        </div>
      </div>
    </>
  );
}
