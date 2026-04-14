import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";

/* ─── GluMira™ V7 — Block 78: Series A Data Room ────────────────────── */

interface KPI {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}

const KPIS: KPI[] = [
  { label: "Monthly Active Users", value: "12,480", delta: "+18.3%", up: true },
  { label: "Total Registered Users", value: "34,200", delta: "+22.1%", up: true },
  { label: "Avg Daily Sessions", value: "3.7", delta: "+0.4", up: true },
  { label: "User Retention (30-day)", value: "68%", delta: "+5.2pp", up: true },
  { label: "Education Completion Rate", value: "74%", delta: "+8.1pp", up: true },
  { label: "NPS Score", value: "72", delta: "+6", up: true },
];

const SUBSCRIBER_BREAKDOWN = [
  { tier: "Free", users: "28,400", pct: "83%" },
  { tier: "Pro", users: "3,200", pct: "9.4%" },
  { tier: "AI", users: "1,800", pct: "5.3%" },
  { tier: "Clinical", users: "800", pct: "2.3%" },
];

const PRODUCT_METRICS = [
  { label: "Modules live", value: "11 specialist + core" },
  { label: "Education articles", value: "100" },
  { label: "Insulin profiles", value: "11" },
  { label: "Meal regimes", value: "20" },
  { label: "API routes", value: "22" },
  { label: "Database tables", value: "23" },
];

const TECH_STACK = ["React 18", "TypeScript", "Supabase", "Railway", "Netlify", "Claude AI", "Nightscout"];

const ADVANTAGES = [
  { title: "IOB Hunter\u2122 pharmacology engine", desc: "Unique insulin-on-board calculation with stacking detection" },
  { title: "20 dietary regime support", desc: "From standard carb counting to Bernstein, keto, Mediterranean, and more" },
  { title: "Paediatric-first design", desc: "Purpose-built for children and young people with T1D" },
  { title: "Caregiver-focused", desc: "Multi-user family dashboard with delegated access" },
  { title: "Regional pricing strategy", desc: "Pricing optimized for affordability across regions" },
];

interface RoadmapPhase {
  label: string;
  status: "completed" | "in-progress" | "planned";
  quarter: string;
}

const ROADMAP: RoadmapPhase[] = [
  { label: "V7 Core Platform", status: "completed", quarter: "Q4 2025" },
  { label: "IOB Hunter\u2122 Engine", status: "completed", quarter: "Q1 2026" },
  { label: "Mira AI Assistant", status: "completed", quarter: "Q1 2026" },
  { label: "11 Specialist Modules", status: "completed", quarter: "Q1 2026" },
  { label: "Nightscout Integration", status: "in-progress", quarter: "Q2 2026" },
  { label: "Clinical Partnerships", status: "in-progress", quarter: "Q2 2026" },
  { label: "TypeScript SDK", status: "planned", quarter: "Q3 2026" },
  { label: "Wearable Integrations", status: "planned", quarter: "Q3 2026" },
  { label: "Series A Close", status: "planned", quarter: "Q4 2026" },
];

function statusColor(s: RoadmapPhase["status"]): string {
  if (s === "completed") return "#10b981";
  if (s === "in-progress") return "#f59e0b";
  return "var(--text-faint)";
}

function statusLabel(s: RoadmapPhase["status"]): string {
  if (s === "completed") return "Completed";
  if (s === "in-progress") return "In Progress";
  return "Planned";
}

export default function InvestorDashboard() {
  const { _user } = useAuth();
  const [_activeSection, _setActiveSection] = useState<string | null>(null);

  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border-light)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.125rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: 12,
  };

  const metaLabel: React.CSSProperties = {
    fontSize: "0.6875rem",
    fontWeight: 600,
    color: "var(--text-faint)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  };

  const pill = (bg: string, fg: string): React.CSSProperties => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: "0.6875rem",
    fontWeight: 600,
    background: bg,
    color: fg,
    border: `1px solid ${fg}33`,
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* ── Header ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            GluMira™ Investor Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginBottom: 8 }}>
            Series A Data Room
          </p>
          <div style={pill("#0ea5e922", "#0ea5e9")}>Confidential</div>
        </div>

        {/* ── KPI Grid ─────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 16 }}>
          {KPIS.map((k) => (
            <div key={k.label} style={card}>
              <div style={metaLabel}>{k.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>{k.value}</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: k.up ? "#10b981" : "#ef4444" }}>
                  {k.up ? "\u2191" : "\u2193"} {k.delta}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Revenue Metrics ──────────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>Revenue Metrics</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
            <div>
              <div style={metaLabel}>MRR</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>$48,200</div>
            </div>
            <div>
              <div style={metaLabel}>ARR</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>$578,400</div>
            </div>
            <div>
              <div style={metaLabel}>Conversion Free → Paid</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10b981", marginTop: 4 }}>17%</div>
            </div>
          </div>
          <div style={metaLabel}>Subscriber Breakdown</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {SUBSCRIBER_BREAKDOWN.map((s) => (
              <div key={s.tier} style={{
                flex: "1 1 120px",
                background: "var(--bg-primary)",
                borderRadius: 8,
                padding: "10px 14px",
                border: "1px solid var(--border-light)",
              }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-faint)", fontWeight: 600 }}>{s.tier}</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>{s.users}</div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>{s.pct}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Product Metrics ──────────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>Product Metrics</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {PRODUCT_METRICS.map((m) => (
              <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{m.label}</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Technology Stack ─────────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>Technology Stack</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TECH_STACK.map((t) => (
              <span key={t} style={{
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: "0.8125rem",
                fontWeight: 600,
                background: "var(--bg-primary)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-light)",
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── Market Opportunity ───────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>Market Opportunity</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
            <div>
              <div style={metaLabel}>T1D Global Prevalence</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>~8.75M</div>
            </div>
            <div>
              <div style={metaLabel}>Insulin-Dependent T2D</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>100M+</div>
            </div>
            <div>
              <div style={metaLabel}>Digital Health CAGR</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#10b981", marginTop: 4 }}>~25%</div>
            </div>
          </div>
          <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: 16, border: "1px solid var(--border-light)" }}>
            <div style={metaLabel}>TAM / SAM / SOM Estimates</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 10 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-faint)", fontWeight: 600 }}>TAM</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>$18.2B</div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Global diabetes digital health</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-faint)", fontWeight: 600 }}>SAM</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>$3.4B</div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Insulin-dependent education</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-faint)", fontWeight: 600 }}>SOM</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>$120M</div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Year 5 target capture</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Competitive Advantage ────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>Competitive Advantage</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ADVANTAGES.map((a) => (
              <div key={a.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#10b981", marginTop: 7, flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{a.title}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: 2 }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Roadmap Timeline ─────────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>Roadmap</h2>
          <div style={{ overflowX: "auto", paddingBottom: 8 }}>
            <div style={{ display: "flex", gap: 0, minWidth: 720, position: "relative" }}>
              {/* Horizontal line */}
              <div style={{
                position: "absolute", top: 18, left: 20, right: 20, height: 2,
                background: "linear-gradient(90deg, #10b981 0%, #10b981 44%, #f59e0b 44%, #f59e0b 66%, var(--border-light) 66%)",
                borderRadius: 1,
              }} />
              {ROADMAP.map((phase) => (
                <div key={phase.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%",
                    background: statusColor(phase.status),
                    border: phase.status === "in-progress" ? `3px solid ${statusColor(phase.status)}44` : "none",
                    boxSizing: "border-box",
                    marginBottom: 8,
                  }} />
                  <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-primary)", textAlign: "center", lineHeight: 1.3 }}>
                    {phase.label}
                  </div>
                  <div style={{ fontSize: "0.625rem", color: statusColor(phase.status), fontWeight: 600, marginTop: 2 }}>
                    {phase.quarter}
                  </div>
                  <div style={{ fontSize: "0.5625rem", color: "var(--text-faint)", marginTop: 2 }}>
                    {statusLabel(phase.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Team ─────────────────────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>Team</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { name: "Founder / CEO", role: "Product vision, clinical strategy, full-stack development" },
              { name: "Clinical Advisor", role: "Paediatric endocrinology, ISPAD guidelines" },
              { name: "AI / ML Lead", role: "Claude integration, pattern analysis engine" },
              { name: "Design Lead", role: "Scandinavian Minimalist design system, accessibility" },
            ].map((member) => (
              <div key={member.name} style={{
                background: "var(--bg-primary)", borderRadius: 8, padding: 14,
                border: "1px solid var(--border-light)",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "var(--border-light)", marginBottom: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.875rem", color: "var(--text-faint)", fontWeight: 700,
                }}>{member.name.charAt(0)}</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{member.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>{member.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Contact ──────────────────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>Contact</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 8 }}>
            For investor inquiries, due diligence requests, or to schedule a demo:
          </p>
          <a
            href="mailto:investors@glumira.ai"
            style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0ea5e9", textDecoration: "none" }}
          >
            investors@glumira.ai
          </a>
        </div>

        {/* ── Confidentiality Notice ───────────────────────────────── */}
        <div style={{
          background: "#fef3c722", border: "1px solid #f59e0b33", borderRadius: 12,
          padding: 16, marginBottom: 16, textAlign: "center",
        }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#f59e0b", marginBottom: 4 }}>
            Confidentiality Notice
          </p>
          <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            This information is confidential and intended solely for prospective investors.
            Unauthorised distribution, reproduction, or use of this material is strictly prohibited.
          </p>
        </div>

        {/* ── Disclaimer ───────────────────────────────────────────── */}
        <p style={{ fontSize: "0.625rem", color: "var(--text-faint)", textAlign: "center", lineHeight: 1.5, marginTop: 24 }}>
          {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
