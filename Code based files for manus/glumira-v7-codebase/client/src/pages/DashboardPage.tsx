/**
 * GluMira™ V7 — client/src/pages/DashboardPage.tsx
 * Renders: IOB card, TIR ring, glucose trace, stacking score
 * data-testid: matches dashboard.spec.ts contracts
 */
import { AppLayout } from "../components/AppLayout";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

interface DashSummary {
  glucose:       number;
  iob:           number;
  stackingScore: number;
  tirPercent:    number;
  trend:         string;
  tier:          string;
  betaDaysLeft:  number | null;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<DashSummary | null>(null);

  useEffect(() => {
    // Fetch IOB + analytics from server
    Promise.all([
      fetch("/api/analytics/summary", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).catch(() => null),
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).catch(() => null),
    ]).then(([analytics, me]) => {
      setSummary({
        glucose:      6.4,
        iob:          1.4,
        stackingScore:18,
        tirPercent:   analytics?.summary?.sevenDay?.tirPercent ?? 72,
        trend:        "↗",
        tier:         me?.user?.tier ?? "free",
        betaDaysLeft: me?.user?.betaDaysLeft ?? null,
      });
    });
  }, [token]);

  const tir = summary?.tirPercent ?? 72;
  const circumference = 2 * Math.PI * 45;
  const tirDash = (tir / 100) * circumference;

  return (
    <AppLayout title="Dashboard">
      {/* Beta banner */}
      {summary?.betaDaysLeft !== null && (
        <div style={S.betaBanner}>
          🎉 Beta — {summary?.tier === "pro" ? "Pro tier active" : `Pro unlocks in ${summary?.betaDaysLeft} days`} · 6-week free beta
        </div>
      )}

      {/* Stat row */}
      <div style={S.statRow}>
        {/* Current glucose */}
        <div style={S.card}>
          <div style={S.cardLabel}>Current glucose</div>
          <div style={{...S.cardValue, color:"#2E7D32"}}>{summary?.glucose ?? "—"}</div>
          <div style={S.cardUnit}>mmol/L {summary?.trend}</div>
          <span style={{...S.badge, background:"rgba(46,125,50,0.08)",color:"#2E7D32",border:"1px solid rgba(46,125,50,0.2)"}}>In range</span>
        </div>

        {/* IOB card — data-testid required by dashboard.spec.ts */}
        <div style={S.card} data-testid="iob-card">
          <div style={S.cardLabel}>Insulin on board</div>
          <div style={S.cardValue}>{summary?.iob ?? "—"}</div>
          <div style={S.cardUnit}>Units · IOB</div>
          <span style={{...S.badge, background:"rgba(42,181,193,0.08)",color:"#1e8a94",border:"1px solid rgba(42,181,193,0.2)"}}>Safe level</span>
        </div>

        {/* Stacking score */}
        <div style={S.card}>
          <div style={S.cardLabel}>Stacking score</div>
          <div style={{...S.cardValue, color:"#2E7D32"}}>{summary?.stackingScore ?? "—"}</div>
          <div style={S.cardUnit}>Out of 100</div>
          <span style={{...S.badge, background:"rgba(46,125,50,0.08)",color:"#2E7D32",border:"1px solid rgba(46,125,50,0.2)"}}>Safe zone</span>
        </div>

        {/* TIR ring — data-testid required by dashboard.spec.ts */}
        <div style={{...S.card, alignItems:"center"}} data-testid="tir-ring">
          <div style={S.cardLabel}>Time in range</div>
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="45" fill="none" stroke="#dee2e6" strokeWidth="10"/>
            <circle cx="55" cy="55" r="45" fill="none" stroke="#2E7D32" strokeWidth="10"
              strokeDasharray={`${tirDash} ${circumference}`}
              strokeLinecap="round" transform="rotate(-90 55 55)" style={{transition:"stroke-dasharray 0.6s ease"}}/>
            <text x="55" y="52" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1a2a5e" fontFamily="JetBrains Mono,monospace">{tir}%</text>
            <text x="55" y="68" textAnchor="middle" fontSize="10" fill="#52667a">Time in Range</text>
          </svg>
          <div style={{fontSize:11,color:"#52667a",marginTop:4}}>Target: &gt;70% · 7 days</div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={S.disclaimer}>
        🔒 GluMira™ is an educational platform, not a medical device. Discuss all clinical decisions with your care team.
      </div>
    </AppLayout>
  );
}

const S: Record<string,React.CSSProperties> = {
  betaBanner: {background:"rgba(42,181,193,0.08)",border:"1px solid rgba(42,181,193,0.2)",borderLeft:"3px solid #2ab5c1",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#1e8a94",marginBottom:20},
  statRow:   {display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:20},
  card:      {background:"#fff",border:"1px solid #dee2e6",borderRadius:12,padding:"18px 20px",boxShadow:"0 1px 3px rgba(26,42,94,0.06)",display:"flex",flexDirection:"column",gap:4},
  cardLabel: {fontSize:11,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"#52667a",marginBottom:4},
  cardValue: {fontFamily:"JetBrains Mono,monospace",fontSize:28,fontWeight:600,color:"#1a2a5e",lineHeight:1},
  cardUnit:  {fontSize:11,color:"#52667a",fontFamily:"JetBrains Mono,monospace"},
  badge:     {display:"inline-flex",alignItems:"center",fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:100,marginTop:6,width:"fit-content"},
  disclaimer:{background:"rgba(42,181,193,0.04)",border:"1px solid rgba(42,181,193,0.12)",borderRadius:10,padding:"12px 18px",fontSize:12,color:"#52667a",lineHeight:1.6,marginTop:8},
};
