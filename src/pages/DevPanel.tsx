import { useState } from "react";

const T = "#2ab5c1";
const A = "#f59e0b";
const N = "#1a2a5e";
const D = "#0D1B3E";

const R: [string, [string, string, number?][]][] = [
  ["CORE", [
    ["/", "Landing"], ["/auth", "Auth"], ["/dashboard", "Dashboard"],
    ["/settings", "Settings"], ["/settings/caregivers", "Caregivers"],
    ["/faq", "FAQ"],
  ]],
  ["EDUCATION", [
    ["/education", "Education Hub"], ["/education/topic/1", "Topic (sample)"],
    ["/mira", "Mira AI"], ["/badges", "Badges"],
  ]],
  ["ONBOARDING", [
    ["/onboarding/story", "Story Engine"], ["/meals/plan", "Meal Plan"],
  ]],
  ["CLINICAL", [
    ["/modules/pregnancy", "Pregnancy"], ["/modules/paediatric", "Paediatric"],
    ["/modules/school-care", "School Care"], ["/modules/menstrual", "Menstrual"],
    ["/modules/adhd", "ADHD"], ["/modules/thyroid", "Thyroid"],
  ]],
  ["DIETARY", [
    ["/modules/ramadan", "Ramadan"], ["/modules/kosher", "Kosher"],
    ["/modules/halal", "Halal"], ["/modules/bernstein", "Bernstein"],
    ["/modules/sick-day", "Sick Day"],
  ]],
  ["API", [
    ["/api/auth", "Auth", 1], ["/api/iob", "IOB Calc", 1],
    ["/api/patient", "Patient", 1], ["/api/caregiver", "Caregiver", 1],
    ["/api/mira", "Mira", 1], ["/api/education", "Education", 1],
    ["/api/meal-plan", "Meal Plan", 1], ["/api/badges", "Badges", 1],
    ["/api/analytics", "Analytics", 1], ["/api/settings", "Settings", 1],
    ["/api/subscription", "Subscription", 1],
  ]],
  ["INFRA", [
    ["https://glumira-platform-production.up.railway.app", "Railway", 2],
    ["https://supabase.com/dashboard/project/lsmxsqgckcxsbayfdtxs", "Supabase", 2],
    ["https://github.com/francoissteyn01-hash/glumira-platform", "GitHub", 2],
    ["https://app.netlify.com", "Netlify", 2],
  ]],
];

export default function DevPanel() {
  const [q, setQ] = useState("");
  const [profile, setProfile] = useState("Emily");

  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:${D}}
        .dp{min-height:100vh;background:${D};color:#9aa5b4;font-family:'DM Sans',sans-serif;padding:12px 16px;max-width:480px;margin:0 auto}
        .dp-top{position:sticky;top:0;z-index:10;background:${D};padding:8px 0 12px;border-bottom:1px solid rgba(42,181,193,0.1)}
        .dp-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
        .dp-logo{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;color:${T};letter-spacing:1px}
        .dp-logo b{color:${A}}
        .dp-switch{display:flex;align-items:center;gap:6px;font-size:11px;font-family:'JetBrains Mono',monospace}
        .dp-switch span{color:#4a5568}
        .dp-switch button{background:rgba(42,181,193,0.1);border:1px solid rgba(42,181,193,0.2);color:${T};font-size:10px;padding:3px 8px;border-radius:4px;cursor:pointer;font-family:'JetBrains Mono',monospace}
        .dp-switch button:hover{background:rgba(42,181,193,0.2)}
        .dp-name{color:#e2e8f0;font-weight:500}
        .dp-q{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:5px;padding:7px 10px;color:#e2e8f0;font-family:'JetBrains Mono',monospace;font-size:12px;outline:none}
        .dp-q:focus{border-color:${T}}
        .dp-q::placeholder{color:#3a4555}
        .dp-sec{margin-top:14px}
        .dp-h{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:500;letter-spacing:1.5px;color:#3a4555;margin-bottom:4px}
        .dp-r{display:flex;align-items:center;justify-content:space-between;padding:7px 8px;border-radius:4px;text-decoration:none;color:#9aa5b4;font-size:13px;transition:background 0.1s}
        .dp-r:hover{background:rgba(42,181,193,0.06);color:#e2e8f0}
        .dp-r .p{font-family:'JetBrains Mono',monospace;font-size:10px;color:#3a4555;flex-shrink:0;margin-left:8px;max-width:45%;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .dp-tag{font-family:'JetBrains Mono',monospace;font-size:8px;padding:1px 5px;border-radius:2px;margin-left:6px;flex-shrink:0}
        .t-api{background:rgba(245,158,11,0.12);color:${A}}
        .t-ext{background:rgba(42,181,193,0.1);color:${T}}
        .dp-ft{margin-top:20px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.04);display:flex;gap:16px;flex-wrap:wrap}
        .dp-ft div{font-family:'JetBrains Mono',monospace;font-size:10px;color:#3a4555}
        .dp-ft div b{color:${T};font-size:14px;display:block}
      `}</style>

      <div className="dp">
        <div className="dp-top">
          <div className="dp-bar">
            <div className="dp-logo">GLUMIRA<b>&trade;</b> DEV</div>
            <div className="dp-switch">
              <span>viewing</span>
              <span className="dp-name">{profile}</span>
              <button onClick={() => setProfile(p => p === "Emily" ? "Anouk" : "Emily")}>
                &hArr; {profile === "Emily" ? "Anouk" : "Emily"}
              </button>
            </div>
          </div>
          <input
            className="dp-q"
            placeholder="filter..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        {R.map(([label, routes]) => {
          const f = routes.filter(r => match(r[0]) || match(r[1]));
          if (!f.length) return null;
          return (
            <div className="dp-sec" key={label}>
              <div className="dp-h">{label}</div>
              {f.map(r => (
                <a
                  key={r[0]}
                  className="dp-r"
                  href={r[0]}
                  target={r[2] === 2 ? "_blank" : undefined}
                  rel={r[2] === 2 ? "noopener noreferrer" : undefined}
                >
                  <span>{r[1]}</span>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <span className="p">{r[0]}</span>
                    {r[2] === 1 && <span className="dp-tag t-api">API</span>}
                    {r[2] === 2 && <span className="dp-tag t-ext">EXT</span>}
                  </span>
                </a>
              ))}
            </div>
          );
        })}

        <div className="dp-ft">
          <div><b>6</b>core</div>
          <div><b>11</b>modules</div>
          <div><b>11</b>APIs</div>
          <div><b>4</b>infra</div>
          <div><b>23</b>tables</div>
        </div>
      </div>
    </>
  );
}
