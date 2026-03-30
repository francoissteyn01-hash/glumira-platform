/**
 * GluMira™ V7 — LandingPage.tsx
 * Public landing page. Clinical Depth aesthetic with approved CDN assets.
 * Light neutral background (#f8fafd) with dark navy hero section.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* ─── CDN assets ─────────────────────────────────────────────────────────── */
const CDN = {
  owlGlow:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/glumira_v6_asset_owl_glow_608d9d80.png",
  appIcon:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/glumira_v6_matched_icon_17a09028.png",
  heroBg:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/glumira_v6_bg_hero_17da0369.webp",
  ctaBg:
    "https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/08.6.1_glumira-cta-bg_e54efc61.webp",
};

/* ─── Fonts ──────────────────────────────────────────────────────────────── */
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500;600&display=swap";

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  navy: "#1a2a5e",
  teal: "#2ab5c1",
  amber: "#f59e0b",
  white: "#ffffff",
  light: "#f8fafd",
  bodyText: "#1a2a5e",
  mutedText: "#4a5e7a",
  heading: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/* ─── Teal wave SVG divider ──────────────────────────────────────────────── */
function TealWave({ flip = false }: { flip?: boolean }) {
  return (
    <div style={{ lineHeight: 0, transform: flip ? "rotate(180deg)" : undefined }}>
      <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", display: "block" }}>
        <path
          d="M0 40 C360 80 720 0 1080 40 C1260 60 1380 50 1440 40 V80 H0Z"
          fill={T.light}
        />
      </svg>
    </div>
  );
}

/* ─── Insulin helix SVG (subtle background element) ──────────────────────── */
function InsulinHelix() {
  return (
    <svg
      width="200"
      height="400"
      viewBox="0 0 200 400"
      fill="none"
      style={{ position: "absolute", right: 40, top: "50%", transform: "translateY(-50%)", opacity: 0.08 }}
    >
      {/* Double helix strands */}
      <path d="M60 0 C60 50 140 50 140 100 C140 150 60 150 60 200 C60 250 140 250 140 300 C140 350 60 350 60 400" stroke={T.teal} strokeWidth="3" />
      <path d="M140 0 C140 50 60 50 60 100 C60 150 140 150 140 200 C140 250 60 250 60 300 C60 350 140 350 140 400" stroke={T.teal} strokeWidth="3" />
      {/* Cross rungs */}
      {[50, 100, 150, 200, 250, 300, 350].map((y) => (
        <line key={y} x1="70" y1={y} x2="130" y2={y} stroke={T.amber} strokeWidth="2" strokeOpacity="0.5" />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!document.querySelector('link[href*="Playfair"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = FONT_HREF;
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div style={{ fontFamily: T.body, color: T.bodyText, background: T.light, minHeight: "100vh" }}>

      {/* ═══ HERO SECTION ═══════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          background: `linear-gradient(135deg, ${T.navy} 0%, #0f1d45 100%)`,
          backgroundImage: `url(${CDN.heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          overflow: "hidden",
          padding: "0 0 0 0",
        }}
      >
        {/* Dark overlay for readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(26,42,94,0.92) 0%, rgba(15,29,69,0.88) 100%)",
            zIndex: 1,
          }}
        />

        <InsulinHelix />

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 1200,
            margin: "0 auto",
            padding: "80px 40px 100px",
            display: "flex",
            alignItems: "center",
            gap: 60,
            flexWrap: "wrap",
          }}
        >
          {/* Left: text */}
          <div style={{ flex: "1 1 480px", minWidth: 320 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <img
                src={CDN.appIcon}
                alt="GluMira™"
                width={36}
                height={36}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
              <span style={{ fontWeight: 500, fontSize: 18, color: T.white, letterSpacing: "-0.01em" }}>
                GluMira<sup style={{ fontSize: 9, verticalAlign: "super", color: T.teal }}>™</sup>
              </span>
            </div>

            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.teal,
                marginBottom: 16,
              }}
            >
              Powered by IOB Hunter™
            </p>

            <h1
              style={{
                fontFamily: T.heading,
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 700,
                lineHeight: 1.15,
                color: T.white,
                marginBottom: 20,
              }}
            >
              The science of insulin,
              <br />
              <em style={{ color: T.teal, fontStyle: "italic" }}>made visible</em>
            </h1>

            <p
              style={{
                fontSize: 17,
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.82)",
                maxWidth: 480,
                marginBottom: 36,
              }}
            >
              For caregivers sitting awake at 2am, watching glucose numbers, asking why.
              We answer that question with science, not guesswork.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/auth")}
                style={{
                  padding: "14px 32px",
                  borderRadius: 10,
                  border: "none",
                  background: T.teal,
                  color: T.white,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  boxShadow: "0 4px 20px rgba(42,181,193,0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 28px rgba(42,181,193,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(42,181,193,0.3)";
                }}
              >
                Try GluMira™ Free
              </button>
              <button
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  padding: "14px 32px",
                  borderRadius: 10,
                  border: `2px solid rgba(255,255,255,0.25)`,
                  background: "transparent",
                  color: T.white,
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.teal)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
              >
                Explore Features
              </button>
            </div>
          </div>

          {/* Right: owl */}
          <div
            style={{
              flex: "0 0 auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={CDN.owlGlow}
              alt="Mira — The Sentinel owl"
              style={{
                width: "clamp(200px, 28vw, 340px)",
                height: "auto",
                filter: "drop-shadow(0 0 60px rgba(42,181,193,0.25))",
              }}
            />
          </div>
        </div>

        {/* Wave transition to light section */}
        <TealWave />
      </section>

      {/* ═══ STATS SECTION ══════════════════════════════════════════════════ */}
      <section id="features" style={{ background: T.light, padding: "60px 40px 80px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 60,
              flexWrap: "wrap",
              marginBottom: 60,
            }}
          >
            {[
              { num: "9", label: "Insulin types modelled", color: T.teal },
              { num: "4", label: "Specialist modules", color: T.navy },
              { num: "3mo", label: "Free, no card needed", color: T.amber },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center", minWidth: 140 }}>
                <p
                  style={{
                    fontFamily: T.mono,
                    fontSize: 42,
                    fontWeight: 600,
                    color: stat.color,
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {stat.num}
                </p>
                <p style={{ fontSize: 13, color: T.mutedText, fontWeight: 400 }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* IOB Preview Card */}
          <div
            style={{
              maxWidth: 520,
              margin: "0 auto",
              background: T.white,
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              padding: 28,
              boxShadow: "0 4px 24px rgba(26,42,94,0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: T.mutedText }}>
                Nightscout · Live
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#22c55e", fontWeight: 500 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                Connected
              </span>
            </div>

            {/* Glucose trace visualization */}
            <div style={{ marginBottom: 20 }}>
              <svg viewBox="0 0 460 80" style={{ width: "100%", height: 80 }}>
                {/* Target range band */}
                <rect x="0" y="20" width="460" height="40" fill="rgba(42,181,193,0.08)" rx="4" />
                <line x1="0" y1="20" x2="460" y2="20" stroke="rgba(42,181,193,0.2)" strokeDasharray="4 4" />
                <line x1="0" y1="60" x2="460" y2="60" stroke="rgba(42,181,193,0.2)" strokeDasharray="4 4" />
                {/* Glucose line */}
                <polyline
                  points="0,45 40,42 80,38 120,35 160,40 200,42 240,38 280,32 320,35 360,40 400,38 440,36 460,38"
                  fill="none"
                  stroke={T.teal}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Current point */}
                <circle cx="460" cy="38" r="5" fill={T.teal} />
                <circle cx="460" cy="38" r="8" fill="none" stroke={T.teal} strokeWidth="1" opacity="0.4" />
              </svg>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: T.mono, fontSize: 36, fontWeight: 600, color: T.navy }}>6.4</span>
              <span style={{ fontSize: 14, color: T.mutedText }}>mmol/L</span>
            </div>
            <span
              style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 500,
                color: "#22c55e",
                background: "rgba(34,197,94,0.08)",
                padding: "3px 10px",
                borderRadius: 20,
                marginBottom: 16,
              }}
            >
              ↗ In range
            </span>

            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "IOB", value: "1.4 U" },
                { label: "Decay window", value: "3h 12m" },
                { label: "Stacking score", value: "18 — Safe", color: "#22c55e" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: T.mutedText }}>{row.label}</span>
                  <span style={{ fontFamily: T.mono, fontWeight: 500, color: row.color || T.navy }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA SECTION ════════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          backgroundImage: `url(${CDN.ctaBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "80px 40px",
          textAlign: "center",
        }}
      >
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(26,42,94,0.85)",
            zIndex: 1,
          }}
        />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 600, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: T.heading,
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 700,
              color: T.white,
              marginBottom: 16,
            }}
          >
            Start understanding insulin today
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            Join caregivers and clinicians who trust GluMira™ to make sense of insulin-on-board,
            stacking risk, and glucose patterns — all in one place.
          </p>
          <button
            onClick={() => navigate("/auth")}
            style={{
              padding: "16px 40px",
              borderRadius: 10,
              border: "none",
              background: T.teal,
              color: T.white,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 24px rgba(42,181,193,0.35)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            Try GluMira™ Free
          </button>
        </div>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════════════════════════ */}
      <footer
        style={{
          background: T.navy,
          padding: "32px 40px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, maxWidth: 600, margin: "0 auto" }}>
          GluMira™ is an educational platform, not a medical device.
          Always discuss clinical decisions with your healthcare team.
          IOB Hunter™ models are for learning purposes only.
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 12 }}>
          © {new Date().getFullYear()} GluMira™. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
