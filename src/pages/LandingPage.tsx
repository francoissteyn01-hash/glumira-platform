/**
 * GluMira™ V7 — LandingPage.tsx
 * Coat of Arms concept. Mira is not a mascot — she is a sovereign emblem.
 * Clean white hero, no clinical data, brand-only.
 * Fits above the fold on 1366×768.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Assets ─────────────────────────────────────────────────────────────── */
// Identity owl — heraldic wings-spread, amber badge on chest, transparent bg
const OWL_IDENTITY = "/mira-owl-identity.png";

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
  mutedText: "#4a5e7a",
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

/* ─── ECG / glucose trace SVG (heraldic banner beneath owl) ──────────────── */
function HeraldicTrace() {
  return (
    <svg
      viewBox="0 0 800 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: "min(600px, 80vw)",
        height: "auto",
        display: "block",
        margin: "0 auto",
        opacity: 0.35,
      }}
    >
      {/* Flat baseline with gentle glucose-like undulation and a single heartbeat spike */}
      <path
        d="M0 24 L120 24 C160 24 180 20 200 22 L240 18 260 20 280 16 300 22 320 14 330 24 340 8 350 32 360 24 370 24 L400 22 440 20 480 24 520 22 560 20 600 24 640 22 680 24 720 22 760 24 800 24"
        stroke={T.teal}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
        color: T.navy,
        background: T.light,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ═══ COUNTDOWN TIMER PILL ═══════════════════════════════════════════ */}
      <div
        style={{
          position: "fixed",
          top: 14,
          right: 20,
          zIndex: 100,
          background: T.teal,
          color: T.white,
          fontFamily: T.mono,
          fontSize: 12,
          fontWeight: 600,
          padding: "6px 14px",
          borderRadius: 20,
          maxHeight: 32,
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 2px 12px rgba(42,181,193,0.35)",
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ opacity: 0.8, fontSize: 10, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Beta
        </span>
        {countdown.d}d {String(countdown.h).padStart(2, "0")}h{" "}
        {String(countdown.m).padStart(2, "0")}m{" "}
        {String(countdown.s).padStart(2, "0")}s
      </div>

      {/* ═══ HERO — ABOVE THE FOLD ══════════════════════════════════════════ */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "40px 24px 24px",
          minHeight: "calc(100vh - 48px)",
          maxHeight: "100vh",
          background: T.light,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial glow behind owl */}
        <div
          style={{
            position: "absolute",
            top: "18%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(42,181,193,0.06) 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* Mira — The Sentinel — sovereign, centered, large */}
        <img
          src={OWL_IDENTITY}
          alt="Mira — The Sentinel"
          style={{
            width: "clamp(220px, 30vw, 400px)",
            height: "auto",
            display: "block",
            margin: "0 auto 8px",
            filter: "drop-shadow(0 4px 40px rgba(42,181,193,0.12))",
            position: "relative",
            zIndex: 2,
          }}
        />

        {/* Heraldic ECG trace beneath her feet */}
        <div style={{ marginBottom: 16, position: "relative", zIndex: 2 }}>
          <HeraldicTrace />
        </div>

        {/* GluMira™ wordmark — large, bold, prominent */}
        <h1
          style={{
            fontFamily: T.heading,
            fontSize: "clamp(36px, 4.5vw, 52px)",
            fontWeight: 700,
            color: T.navy,
            lineHeight: 1.1,
            margin: "0 0 10px",
            letterSpacing: "-0.01em",
            position: "relative",
            zIndex: 2,
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
            margin: "0 0 10px",
            position: "relative",
            zIndex: 2,
          }}
        >
          The science of insulin, made visible
        </p>

        {/* Motto */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: T.navy,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            margin: "0 0 28px",
            position: "relative",
            zIndex: 2,
          }}
        >
          Silent. Vigilant. Yours.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 2,
          }}
        >
          <button
            onClick={() => navigate("/auth")}
            style={{
              padding: "13px 32px",
              borderRadius: 10,
              border: "none",
              background: T.teal,
              color: T.white,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: T.body,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(42,181,193,0.25)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 28px rgba(42,181,193,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(42,181,193,0.25)";
            }}
          >
            Get Started Free
          </button>
          <button
            onClick={() => navigate("/auth")}
            style={{
              padding: "13px 32px",
              borderRadius: 10,
              border: `2px solid ${T.navy}`,
              background: "transparent",
              color: T.navy,
              fontSize: 15,
              fontWeight: 500,
              fontFamily: T.body,
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.navy;
              e.currentTarget.style.color = T.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = T.navy;
            }}
          >
            Sign In
          </button>
        </div>
      </section>

      {/* ═══ BELOW THE FOLD — MINIMAL ═══════════════════════════════════════ */}
      <section
        style={{
          background: T.white,
          borderTop: "1px solid #e8ecf1",
          padding: "36px 24px 28px",
          textAlign: "center",
        }}
      >
        {/* 3 stat pills */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          {[
            "9 insulin types modelled",
            "4 specialist modules",
            "3 months free",
          ].map((stat) => (
            <span
              key={stat}
              style={{
                display: "inline-block",
                fontFamily: T.mono,
                fontSize: 12,
                fontWeight: 500,
                color: T.navy,
                background: "#f0f4f8",
                border: "1px solid #e2e8f0",
                borderRadius: 20,
                padding: "7px 18px",
                whiteSpace: "nowrap",
              }}
            >
              {stat}
            </span>
          ))}
        </div>

        {/* Disclaimer */}
        <p
          style={{
            fontSize: 11,
            color: T.mutedText,
            maxWidth: 480,
            margin: "0 auto",
            lineHeight: 1.5,
          }}
        >
          GluMira™ is an educational platform, not a medical device.
        </p>

        {/* Copyright */}
        <p
          style={{
            fontSize: 10,
            color: "#94a3b8",
            marginTop: 12,
          }}
        >
          © {new Date().getFullYear()} GluMira™. All rights reserved.
        </p>
      </section>
    </div>
  );
}
