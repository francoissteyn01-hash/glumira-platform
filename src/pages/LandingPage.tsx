/**
 * GluMira™ V7 — LandingPage.tsx
 * Mobile-first dark Clinical Depth hero with brand background and Mira hero image.
 * Stacks vertically on mobile, side-by-side on desktop (768px+).
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Fonts ──────────────────────────────────────────────────────────────── */
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500;600&display=swap";

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  navy: "#1a2a5e",
  navyDeep: "#0d1b3e",
  teal: "#2ab5c1",
  amber: "#f59e0b",
  white: "#ffffff",
  light: "#f8fafd",
  mutedText: "#94a3b8",
  heading: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/* ─── Responsive CSS ─────────────────────────────────────────────────────── */
const responsiveCSS = `
  .glm-hero {
    flex-direction: column !important;
    padding: 24px 20px 20px !important;
    min-height: 100vh !important;
    max-height: none !important;
    text-align: center;
  }
  .glm-hero-text {
    max-width: 100% !important;
    padding-right: 0 !important;
    order: 2;
  }
  .glm-hero-image {
    order: 1;
    margin-bottom: 24px;
  }
  .glm-hero-image img {
    max-width: 280px !important;
  }
  .glm-cta-row {
    justify-content: center;
  }
  .glm-stats-row {
    justify-content: center;
  }

  @media (min-width: 768px) {
    .glm-hero {
      flex-direction: row !important;
      padding: 20px 40px 16px !important;
      min-height: calc(100vh - 56px) !important;
      max-height: 100vh !important;
      text-align: left;
    }
    .glm-hero-text {
      max-width: 520px !important;
      padding-right: 32px !important;
      order: 1;
    }
    .glm-hero-image {
      order: 2;
      margin-bottom: 0;
    }
    .glm-hero-image img {
      max-width: 100% !important;
    }
    .glm-cta-row {
      justify-content: flex-start;
    }
    .glm-stats-row {
      justify-content: flex-start;
    }
  }
`;

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
    <div
      style={{
        fontFamily: T.body,
        color: T.white,
        background: T.navyDeep,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{responsiveCSS}</style>

      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <section
        className="glm-hero"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${T.navyDeep} 0%, ${T.navyDeep} 40%, ${T.navy} 70%, ${T.navy} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: T.navyDeep,
            opacity: 0.25,
            pointerEvents: "none",
          }}
        />

        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 600px 400px at 70% 50%, rgba(42,181,193,0.1) 0%, transparent 65%),
                          radial-gradient(ellipse 400px 300px at 30% 60%, rgba(245,158,11,0.05) 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* ── Text content ── */}
        <div
          className="glm-hero-text"
          style={{
            position: "relative",
            zIndex: 2,
            flex: "1 1 50%",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: T.teal,
              marginBottom: 14,
            }}
          >
            Powered by IOB Hunter™
          </p>

          <h1
            style={{
              fontFamily: T.heading,
              fontSize: "clamp(28px, 6vw, 48px)",
              fontWeight: 700,
              color: T.white,
              lineHeight: 1.1,
              margin: "0 0 8px",
              letterSpacing: "-0.01em",
            }}
          >
            GluMira<sup style={{ fontSize: "0.4em", verticalAlign: "super", color: T.teal }}>™</sup>
          </h1>

          <p
            style={{
              fontFamily: T.heading,
              fontSize: "clamp(16px, 3vw, 22px)",
              fontWeight: 700,
              fontStyle: "italic",
              color: T.teal,
              margin: "0 0 12px",
            }}
          >
            The science of insulin, made visible
          </p>

          <p
            style={{
              fontSize: "clamp(14px, 2.5vw, 15px)",
              fontWeight: 300,
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.65,
              maxWidth: 420,
              margin: "0 auto 20px",
            }}
          >
            For caregivers sitting awake at 2am, watching glucose numbers, asking why.
            We answer that question with science, not guesswork.
          </p>

          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              margin: "0 0 22px",
            }}
          >
            Silent. Vigilant. Yours.
          </p>

          {/* CTA buttons */}
          <div className="glm-cta-row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: "11px 28px",
                borderRadius: 8,
                border: "none",
                background: T.teal,
                color: T.white,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: T.body,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(42,181,193,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
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
              Join the Beta — Free
            </button>
            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: "11px 28px",
                borderRadius: 8,
                border: "1.5px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.05)",
                color: T.white,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: T.body,
                cursor: "pointer",
                transition: "background 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
              }}
            >
              Login
            </button>
          </div>

          {/* Stat pills */}
          <div
            className="glm-stats-row"
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 20,
            }}
          >
            {["9 insulin types", "4 modules", "3 months free"].map((stat) => (
              <span
                key={stat}
                style={{
                  display: "inline-block",
                  fontFamily: T.mono,
                  fontSize: 11,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.65)",
                  background: "rgba(42,181,193,0.08)",
                  border: "1px solid rgba(42,181,193,0.15)",
                  borderRadius: 16,
                  padding: "5px 14px",
                  whiteSpace: "nowrap",
                }}
              >
                {stat}
              </span>
            ))}
          </div>
        </div>

        {/* ── Hero image ── */}
        <div
          className="glm-hero-image"
          style={{
            position: "relative",
            zIndex: 2,
            flex: "1 1 50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/images/mira-hero.png"
            alt="Mira — GluMira™ AI Companion"
            style={{
              maxWidth: "100%",
              height: "auto",
              objectFit: "contain",
              mixBlendMode: "lighten",
              filter: "drop-shadow(0 0 40px rgba(42,181,193,0.15))",
            }}
          />
        </div>
      </section>

      {/* ═══ FOOTER ════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: T.navyDeep,
          borderTop: "1px solid rgba(42,181,193,0.1)",
          padding: "16px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            maxWidth: 500,
            margin: "0 auto 6px",
            lineHeight: 1.5,
          }}
        >
          Designed for the world. — GluMira™ is an educational platform, not a medical device.
        </p>
        <p
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.25)",
          }}
        >
          © {new Date().getFullYear()} GluMira™. All rights reserved.
        </p>
      </section>
    </div>
  );
}
