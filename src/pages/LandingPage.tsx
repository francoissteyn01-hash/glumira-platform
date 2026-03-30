/**
 * GluMira™ V7 — LandingPage.tsx
 * Dark Clinical Depth hero with brand background, friendly owl with insulin graph,
 * countdown to go-live, all above the fold on 1366×768.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Assets ─────────────────────────────────────────────────────────────── */
const OWL_HERO = "/mira-owl-hero.png";
const HERO_BG = "/glumira-hero-bg-dark.png";

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

/* ─── Countdown target ───────────────────────────────────────────────────── */
const LAUNCH_DATE = new Date("2026-04-30T00:00:00Z").getTime();

function useCountdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, LAUNCH_DATE - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const countdown = useCountdown();

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
      {/* ═══ HERO — ABOVE THE FOLD ══════════════════════════════════════════ */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 40px 16px",
          minHeight: "calc(100vh - 56px)",
          maxHeight: "100vh",
          background: `linear-gradient(135deg, ${T.navyDeep} 0%, #0f1f4a 40%, #152348 70%, ${T.navy} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background image overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${HERO_BG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.25,
            pointerEvents: "none",
          }}
        />

        {/* Radial glow overlays */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 600px 400px at 70% 50%, rgba(42,181,193,0.1) 0%, transparent 65%),
                          radial-gradient(ellipse 400px 300px at 30% 60%, rgba(245,158,11,0.05) 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* ── LEFT: Text content ── */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: "1 1 50%",
            maxWidth: 520,
            paddingRight: 32,
          }}
        >
          {/* Powered by badge */}
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

          {/* GluMira™ wordmark */}
          <h1
            style={{
              fontFamily: T.heading,
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 700,
              color: T.white,
              lineHeight: 1.1,
              margin: "0 0 8px",
              letterSpacing: "-0.01em",
            }}
          >
            GluMira<sup style={{ fontSize: "0.4em", verticalAlign: "super", color: T.teal }}>™</sup>
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontFamily: T.heading,
              fontSize: "clamp(16px, 2vw, 22px)",
              fontWeight: 700,
              fontStyle: "italic",
              color: T.teal,
              margin: "0 0 12px",
            }}
          >
            The science of insulin, made visible
          </p>

          {/* Description */}
          <p
            style={{
              fontSize: 15,
              fontWeight: 300,
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.65,
              maxWidth: 420,
              margin: "0 0 20px",
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
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              margin: "0 0 22px",
            }}
          >
            Silent. Vigilant. Yours.
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
              Get Started Free
            </button>
            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: "11px 28px",
                borderRadius: 8,
                border: `1.5px solid rgba(255,255,255,0.3)`,
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
              Sign In
            </button>
          </div>

          {/* Stat pills */}
          <div
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

        {/* ── RIGHT: Owl ── */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: "0 0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <img
            src={OWL_HERO}
            alt="Mira — The Sentinel"
            style={{
              width: "clamp(200px, 22vw, 280px)",
              maxHeight: 280,
              height: "auto",
              display: "block",
              filter: "drop-shadow(0 4px 40px rgba(42,181,193,0.2)) drop-shadow(0 0 60px rgba(245,158,11,0.1))",
            }}
          />
        </div>

        {/* ── COUNTDOWN — centered bottom ── */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Countdown to Go Live
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {[
              { val: countdown.d, label: "d" },
              { val: countdown.h, label: "h" },
              { val: countdown.m, label: "m" },
              { val: countdown.s, label: "s" },
            ].map((unit, i) => (
              <div key={unit.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    background: "rgba(42,181,193,0.12)",
                    border: "1px solid rgba(42,181,193,0.2)",
                    borderRadius: 6,
                    padding: "5px 10px",
                    minWidth: 40,
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: 16,
                      fontWeight: 600,
                      color: T.teal,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {String(unit.val).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.4)",
                      marginLeft: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    {unit.label}
                  </span>
                </div>
                {i < 3 && (
                  <span style={{ color: "rgba(42,181,193,0.3)", fontSize: 14, fontWeight: 300 }}>:</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BELOW THE FOLD — MINIMAL FOOTER ═══════════════════════════════ */}
      <section
        style={{
          background: T.navyDeep,
          borderTop: "1px solid rgba(42,181,193,0.1)",
          padding: "16px 24px",
          textAlign: "center",
        }}
      >
        {/* Origin + Disclaimer */}
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            maxWidth: 500,
            margin: "0 auto 6px",
            lineHeight: 1.5,
          }}
        >
          . Designed for the world. — GluMira™ is an educational platform, not a medical device.
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
