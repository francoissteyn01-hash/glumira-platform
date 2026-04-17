/**
 * GluMira™ V7 — PublicPageHeader
 *
 * Shared sticky header used on every chromeless public page.
 * Enforces three non-negotiables from MEMORY.md:
 *   1. Mira owl PNG (Rule 43 · feedback_mira_owl_every_page)
 *   2. GluMira™ wordmark (Rule 42)
 *   3. Dark/light toggle (feedback_dark_light_toggle_required)
 *
 * Scandinavian Minimalist (light) / Clinical Depth (dark).
 */

import { Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";

export default function PublicPageHeader() {
  const { isDark, toggle } = useTheme();
  const border = isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0";
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: isDark ? "rgba(13,27,62,0.92)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${border}`,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 20px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: isDark ? "#ffffff" : "#0d2149" }}>
          <img
            src="/brand/mira-hero.png"
            alt="Mira — GluMira™ guardian owl"
            style={{
              width: 36,
              height: 36,
              objectFit: "contain",
              mixBlendMode: isDark ? "screen" : "multiply",
            }}
          />
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, letterSpacing: -0.2 }}>
            GluMira<span style={{ color: "#2ab5c1" }}>™</span>
          </span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            to="/donate"
            style={{
              display: "none",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 999,
              background: "#f59e0b",
              color: "#0d2149",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
            className="pphdr-donate"
          >
            <span aria-hidden>🎗️</span> Donate
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "transparent",
              border: `1px solid ${border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: isDark ? "#ffffff" : "#0d2149",
              fontSize: 18,
            }}
          >
            {isDark ? "☀" : "🌙"}
          </button>
        </nav>
      </div>
      <style>{`
        @media (min-width: 640px) {
          .pphdr-donate { display: inline-flex !important; }
        }
      `}</style>
    </header>
  );
}
