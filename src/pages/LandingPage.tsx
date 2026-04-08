/**
 * GluMira™ V7 — LandingPage.tsx
 * Mobile-first. Mira banner on top, text below, no duplicate nav.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500;600&display=swap";

const CASE_STUDIES = [
  {
    code: "SUBJ-001",
    title: "Overnight Lows — A Timing Question",
    type: "Paediatric · MDI · Tresiba + Fiasp + Humulin R",
    insight:
      "The dinner Humulin R tail overlaps with the Tresiba ramp-up through 02:00–06:00. Combined pressure peaks during fasting — this explains the overnight lows. A timing question, not a dose question.",
    tag: "Overlap",
    tagColor: "#F44336",
  },
  {
    code: "SUBJ-002",
    title: "Gastro Emergency — Insulin You Can't Take Back",
    type: "Paediatric · MDI · Levemir 3× + Fiasp + Actrapid",
    insight:
      "Vomiting at 18:30 expelled carbs, but the dinner bolus was already absorbed. Combined IOB at 20:30 reached ~7.9 U against zero incoming glucose. If the caregiver had seen the IOB at vomiting onset — that is the information that saves lives.",
    tag: "Critical",
    tagColor: "#F44336",
  },
];

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

  .glm-case-carousel {
    width: 100%;
    max-width: 440px;
    margin-bottom: 28px;
    position: relative;
  }

  .glm-case-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(42,181,193,0.15);
    border-radius: 12px;
    padding: 20px 22px;
    transition: opacity 0.5s ease, transform 0.5s ease;
  }

  .glm-case-dots {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-top: 14px;
  }

  .glm-case-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    transition: background 0.3s;
    padding: 0;
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
  const [caseIdx, setCaseIdx] = useState(0);

  useEffect(() => {
    if (!document.querySelector('link[href*="Playfair"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = FONT_HREF;
      document.head.appendChild(link);
    }
  }, []);

  // Auto-rotate case studies every 8s
  useEffect(() => {
    const timer = setInterval(() => {
      setCaseIdx((i) => (i + 1) % CASE_STUDIES.length);
    }, 8000);
    return () => clearInterval(timer);
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

        {/* Engine badge */}
        <p
          style={{
            fontSize: "clamp(11px, 2.2vw, 14px)",
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
            marginBottom: 0,
          }}
        >
          Powered by IOB Hunter™
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

        {/* ═══ ROTATING CASE STUDIES ═══════════════════════════════════ */}
        <div className="glm-case-carousel">
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              marginBottom: 10,
            }}
          >
            Case Studies — Real IOB Insights
          </p>
          {CASE_STUDIES.map((cs, i) => (
            <div
              key={cs.code}
              className="glm-case-card"
              style={{
                display: i === caseIdx ? "block" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: 11,
                    fontWeight: 600,
                    color: T.teal,
                    letterSpacing: "0.04em",
                  }}
                >
                  {cs.code}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: `${cs.tagColor}22`,
                    color: cs.tagColor,
                    letterSpacing: "0.04em",
                  }}
                >
                  {cs.tag}
                </span>
              </div>
              <p
                style={{
                  fontFamily: T.heading,
                  fontSize: 16,
                  fontWeight: 700,
                  color: T.white,
                  margin: "0 0 4px",
                  lineHeight: 1.3,
                }}
              >
                {cs.title}
              </p>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.4)",
                  margin: "0 0 10px",
                  letterSpacing: "0.02em",
                }}
              >
                {cs.type}
              </p>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 300,
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {cs.insight}
              </p>
            </div>
          ))}
          <div className="glm-case-dots">
            {CASE_STUDIES.map((cs, i) => (
              <button
                type="button"
                key={cs.code}
                className="glm-case-dot"
                aria-label={`View case study ${cs.code}`}
                onClick={() => setCaseIdx(i)}
                style={{
                  background: i === caseIdx ? T.teal : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
          <p
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              marginTop: 10,
              fontStyle: "italic",
            }}
          >
            Educational only — not medical advice. All data anonymised.
          </p>
        </div>

        {/* CTA buttons — understated, refined */}
        <div className="glm-cta-row" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 32 }}>
          <button type="button"
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
          <button type="button"
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
          <button type="button"
            onClick={() => navigate("/demo")}
            style={{
              padding: "11px 28px",
              borderRadius: 8,
              border: "1px solid rgba(245,158,11,0.4)",
              background: "rgba(245,158,11,0.08)",
              color: "#f59e0b",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: T.body,
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "background 0.25s, border-color 0.25s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(245,158,11,0.18)";
              e.currentTarget.style.borderColor = "rgba(245,158,11,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(245,158,11,0.08)";
              e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)";
            }}
          >
            Browse as Guest
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
