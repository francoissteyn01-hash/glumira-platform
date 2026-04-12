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
    align-items: center;
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
            fontSize: "clamp(52px, 16vw, 88px)",
            fontWeight: 700,
            color: T.white,
            lineHeight: 1.0,
            margin: "0 0 6px",
            letterSpacing: "-0.03em",
            width: "100%",
          }}
        >
          GluMira<span style={{ fontSize: "0.35em", verticalAlign: "super", color: T.white }}>™</span>
        </h1>

        {/* Companion tagline */}
        <p
          style={{
            fontSize: "clamp(11px, 2.2vw, 14px)",
            fontWeight: 500,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            marginBottom: 0,
          }}
        >
          Companion for life with insulin
        </p>

        {/* Tagline — centered in the space, equal padding top and bottom */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "44px 0" }}>
          <p
            style={{
              fontFamily: T.heading,
              fontSize: "clamp(22px, 5.5vw, 36px)",
              fontWeight: 700,
              color: T.white,
              margin: 0,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
            }}
          >
            The science of insulin,
          </p>
          <p
            style={{
              fontFamily: T.heading,
              fontSize: "clamp(22px, 5.5vw, 36px)",
              fontWeight: 700,
              color: T.amber,
              margin: 0,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              textShadow: "0 0 24px rgba(245,158,11,0.3)",
            }}
          >
            made visible
          </p>
        </div>

        {/* ═══ CTA ROW ════════════════════════════════════════════════
            Hierarchy (FJS feedback 2026-04-12):
              • Browse as Guest — TEAL SOLID — for the priority user
                (mother with 1-2 finger sticks a day, no subscription budget)
              • Start 30-Day Free Trial — AMBER SOLID — primary commercial CTA
              • Login — text link, deprioritised (existing users know where to look)
            Both Guest and Trial are equal-weight solids — the priority user
            never has to read past the first button to find her path in.
            ─────────────────────────────────────────────────────────── */}
        <div
          className="glm-cta-row"
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/demo")}
            style={{
              padding: "13px 28px",
              borderRadius: 8,
              border: "1px solid rgba(42,181,193,0.8)",
              background: T.teal,
              color: T.navyDeep,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: T.body,
              cursor: "pointer",
              letterSpacing: "0.02em",
              boxShadow: "0 4px 16px rgba(42,181,193,0.25)",
              transition: "background 0.25s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#34c9d6";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.teal;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Browse as Guest
          </button>
          <button
            type="button"
            onClick={() => navigate("/auth?mode=signup")}
            style={{
              padding: "13px 28px",
              borderRadius: 8,
              border: "1px solid rgba(245,158,11,0.8)",
              background: T.amber,
              color: T.navyDeep,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: T.body,
              cursor: "pointer",
              letterSpacing: "0.02em",
              boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
              transition: "background 0.25s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fbb04a";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.amber;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Start 30-Day Free Trial
          </button>
        </div>

        {/* Login — text link, small, under the CTAs */}
        <button
          type="button"
          onClick={() => navigate("/auth")}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            marginBottom: 28,
            color: "rgba(255,255,255,0.55)",
            fontSize: 13,
            fontWeight: 400,
            fontFamily: T.body,
            cursor: "pointer",
            letterSpacing: "0.02em",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            transition: "color 0.25s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.9)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.55)";
          }}
        >
          Already have an account? Log in
        </button>

        {/* Inclusive one-liner — replaces the four-concept paragraph */}
        <p
          style={{
            fontSize: "clamp(14px, 2.5vw, 15px)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.7,
            maxWidth: 440,
            marginBottom: 28,
          }}
        >
          A complete companion for life with insulin — for everyone managing
          Type&nbsp;1, Type&nbsp;2, LADA, MODY and gestational diabetes.
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
