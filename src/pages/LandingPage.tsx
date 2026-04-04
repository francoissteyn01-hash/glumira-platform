/**
 * GluMira™ V7 — LandingPage.tsx
 * Mobile-first. Mira banner on top, text below, no duplicate nav.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500;600&display=swap";

const T = {
  navy: "#1a2a5e",
  navyDeep: "#0d1b3e",
  teal: "#2ab5c1",
  amber: "#f59e0b",
  white: "#ffffff",
  heading: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const responsiveCSS = `
  .glm-landing {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    text-align: center;
  }

  /* Mira banner — full width, edge-to-edge */
  .glm-banner {
    width: 100%;
    flex-shrink: 0;
  }
  .glm-banner img {
    width: 100%;
    display: block;
  }

  /* Content section */
  .glm-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28px 24px 20px;
  }

  .glm-cta-row {
    justify-content: center;
  }

  @media (min-width: 768px) {
    .glm-landing {
      flex-direction: row;
      text-align: left;
    }
    .glm-banner {
      width: 50%;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .glm-banner img {
      width: 90%;
      max-width: 600px;
    }
    .glm-content {
      width: 50%;
      padding: 40px 48px;
      align-items: flex-start;
    }
    .glm-cta-row {
      justify-content: flex-start;
    }
  }
`;

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
    <div
      className="glm-landing"
      style={{
        fontFamily: T.body,
        color: T.white,
        background: `linear-gradient(155deg, ${T.navyDeep} 0%, ${T.navy} 100%)`,
      }}
    >
      <style>{responsiveCSS}</style>

      {/* ═══ MIRA BANNER ══════════════════════════════════════════════════ */}
      <div className="glm-banner">
        <img
          src="/images/mira-hero.png"
          alt="Mira — GluMira™ AI Companion"
          style={{
            objectFit: "contain",
            mixBlendMode: "lighten",
            filter: "drop-shadow(0 0 40px rgba(42,181,193,0.15))",
          }}
        />
      </div>

      {/* ═══ CONTENT ═════════════════════════════════════════════════════ */}
      <div className="glm-content">
        {/* Name — big, bold, full width */}
        <h1
          style={{
            fontFamily: T.heading,
            fontSize: "clamp(42px, 12vw, 72px)",
            fontWeight: 700,
            color: T.white,
            lineHeight: 1.0,
            margin: "0 0 4px",
            letterSpacing: "-0.03em",
            width: "100%",
          }}
        >
          GluMira<span style={{ fontSize: "0.35em", verticalAlign: "super", color: T.white }}>™</span>
        </h1>

        {/* Engine badge */}
        <p
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
            marginBottom: 32,
          }}
        >
          Powered by IOB Hunter™
        </p>

        {/* Tagline — two lines, "made visible" in amber glow */}
        <p
          style={{
            fontFamily: T.heading,
            fontSize: "clamp(16px, 3vw, 20px)",
            fontWeight: 700,
            color: T.white,
            margin: 0,
            lineHeight: 2.4,
            letterSpacing: "0.01em",
          }}
        >
          The science of insulin,
        </p>
        <p
          style={{
            fontFamily: T.heading,
            fontSize: "clamp(20px, 4vw, 28px)",
            fontWeight: 700,
            fontStyle: "italic",
            color: T.amber,
            margin: "0 0 36px",
            lineHeight: 2.4,
            letterSpacing: "0.01em",
            textShadow: "0 0 24px rgba(245,158,11,0.3)",
          }}
        >
          made visible
        </p>

        {/* CTA buttons — understated, refined */}
        <div className="glm-cta-row" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 32 }}>
          <button
            onClick={() => navigate("/auth")}
            style={{
              padding: "11px 28px",
              borderRadius: 8,
              border: "1px solid rgba(42,181,193,0.4)",
              background: "rgba(42,181,193,0.12)",
              color: T.teal,
              fontSize: 13,
              fontWeight: 500,
              fontFamily: T.body,
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "background 0.25s, border-color 0.25s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(42,181,193,0.22)";
              e.currentTarget.style.borderColor = "rgba(42,181,193,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(42,181,193,0.12)";
              e.currentTarget.style.borderColor = "rgba(42,181,193,0.4)";
            }}
          >
            Join the Beta — Free
          </button>
          <button
            onClick={() => navigate("/auth")}
            style={{
              padding: "11px 28px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              fontSize: 13,
              fontWeight: 400,
              fontFamily: T.body,
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "color 0.25s, border-color 0.25s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.85)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            }}
          >
            Login
          </button>
        </div>

        {/* Caregiver story */}
        <p
          style={{
            fontSize: "clamp(14px, 2.5vw, 15px)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.7,
            maxWidth: 400,
            marginBottom: 28,
          }}
        >
          For caregivers sitting awake at 2am, watching glucose numbers, asking why.
          We answer that question with science, not guesswork.
        </p>

        {/* Motto */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Silent. Vigilant. Yours.
        </p>

        {/* Disclaimer */}
        <p
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.3)",
            lineHeight: 1.5,
            marginTop: "auto",
            paddingTop: 12,
          }}
        >
          GluMira™ is an educational platform, not a medical device.
          <br />
          © {new Date().getFullYear()} GluMira™
        </p>
      </div>
    </div>
  );
}
