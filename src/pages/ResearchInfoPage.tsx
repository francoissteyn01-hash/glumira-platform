import { Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";

const T = {
  navy:    "#1a2a5e",
  deep:    "#0d1b3e",
  teal:    "#2ab5c1",
  amber:   "#f59e0b",
  muted:   "#64748b",
  border:  "#e2e8f0",
  bg:      "#f8f9fa",
  heading: "'Playfair Display', Georgia, serif",
  body:    "'DM Sans', -apple-system, sans-serif",
};

export default function ResearchInfoPage() {
  const { isDark, toggle } = useTheme();
  const bg = isDark ? T.deep : T.bg;
  const fg = isDark ? "#ffffff" : T.navy;
  const border = isDark ? "rgba(255,255,255,0.12)" : T.border;
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const muted = isDark ? "#94a3b8" : T.muted;

  return (
    <div style={{ minHeight: "100vh", background: bg, color: fg, fontFamily: T.body, transition: "background 0.3s, color 0.3s" }}>
      {/* Top bar with Mira + wordmark + theme toggle */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        background: isDark ? "rgba(13,27,62,0.92)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}>
            <img src="/brand/mira-hero.png" alt="Mira" style={{ width: 36, height: 36, objectFit: "contain", mixBlendMode: isDark ? "screen" : "multiply" }} />
            <span style={{ fontFamily: T.heading, fontSize: 20, fontWeight: 700, letterSpacing: -0.2 }}>
              GluMira<span style={{ color: T.teal }}>™</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: 40, height: 40, borderRadius: 999, background: "transparent",
              border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "inherit", fontSize: 18,
            }}
          >
            {isDark ? "☀" : "🌙"}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 64px" }}>
        <Link to="/" style={{ color: T.teal, fontSize: 14, textDecoration: "none" }}>← Back home</Link>

        <h1 style={{ fontFamily: T.heading, color: fg, fontSize: 32, margin: "20px 0 8px", lineHeight: 1.15, fontWeight: 700 }}>
          GluMira™ Real-World Research Programme
        </h1>
        <p style={{ color: muted, fontSize: 14, marginBottom: 32 }}>
          Voluntary · Anonymous · Withdrawable at any time
        </p>

        <div style={{
          background: `${T.amber}14`,
          border: `1px solid ${T.amber}55`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 999,
            background: `linear-gradient(135deg, ${T.amber}, #d97706)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>🎗️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, letterSpacing: 1.2, textTransform: "uppercase" }}>
              Research Champion
            </div>
            <div style={{ fontSize: 14, marginTop: 2, lineHeight: 1.5 }}>
              Want to fund this work directly?{" "}
              <Link to="/donate" style={{ color: T.amber, fontWeight: 700, textDecoration: "underline" }}>
                Donate to research
              </Link>{" "}
              and unlock the gold Champion badge on your profile.
            </div>
          </div>
        </div>

        {[
          {
            title: "What data is collected",
            body: "Anonymised glucose patterns, insulin dose ranges, and module inputs (e.g. menopause stage, diet type). No names, emails, locations, or any identifying information is ever collected for research purposes.",
          },
          {
            title: "How it is used",
            body: "Data is aggregated across participants to identify real-world patterns in T1D management. Findings may be used to improve GluMira's algorithms, published in academic journals (aggregate only), or shared with research partners under strict anonymisation agreements. No individual data is ever shared.",
          },
          {
            title: "Who has access",
            body: "GluMira's internal research team only. Third parties receive aggregated, de-identified statistical summaries — never raw data.",
          },
          {
            title: "Your rights",
            body: "Participation is entirely voluntary and has no effect on your access to GluMira's features. You may withdraw at any time from Settings → Research. Withdrawal stops future data collection immediately. Previously collected data remains in aggregated form (it cannot be individually identified or removed from aggregate summaries).",
          },
          {
            title: "Legal basis",
            body: "Data processing is based on explicit informed consent under GDPR Article 9(2)(a) for special category health data used for research purposes, with appropriate anonymisation safeguards.",
          },
        ].map(section => (
          <div
            key={section.title}
            style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}
          >
            <h3 style={{ fontFamily: T.heading, color: fg, fontSize: 17, margin: "0 0 10px", fontWeight: 700 }}>{section.title}</h3>
            <p style={{ color: isDark ? "#cbd5e1" : "#374151", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{section.body}</p>
          </div>
        ))}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 32 }}>
          <Link
            to="/app-settings"
            style={{ display: "inline-block", background: T.teal, color: "#fff", padding: "12px 24px", borderRadius: 999, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
          >
            Manage preferences in Settings
          </Link>
          <Link
            to="/donate"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.amber, color: T.navy, padding: "12px 24px", borderRadius: 999, fontSize: 14, fontWeight: 700, textDecoration: "none" }}
          >
            <span aria-hidden>🎗️</span> Donate to research
          </Link>
        </div>

        <p style={{ textAlign: "center", color: muted, fontSize: 12, marginTop: 24, lineHeight: 1.6 }}>
          Questions? Contact us at <a href="mailto:privacy@glumira.ai" style={{ color: T.teal }}>privacy@glumira.ai</a>
        </p>
      </div>
    </div>
  );
}
