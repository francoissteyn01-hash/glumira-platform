/**
 * GluMira™ V7 — Story CTA buttons
 * Handles both single cta and cta_options (clinician variant).
 */

import { type CSSProperties } from "react";

interface CTAItem {
  label: string;
  href: string;
}

interface StoryCTAProps {
  cta?: CTAItem;
  ctaOptions?: CTAItem[];
}

export default function StoryCTA({ cta, ctaOptions }: StoryCTAProps) {
  const buttons = ctaOptions ?? (cta ? [cta] : []);
  if (buttons.length === 0) return null;

  const isSingle = buttons.length === 1;

  const containerStyle: CSSProperties = {
    position: "fixed",
    bottom: 72,
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: isSingle ? "row" : "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "0 24px",
    zIndex: 110,
    animation: "fadeIn 0.4s ease",
  };

  const btnBase: CSSProperties = {
    padding: "12px 32px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    cursor: "pointer",
    transition: "background 0.2s, transform 0.15s",
    minWidth: 160,
    textAlign: "center",
    textDecoration: "none",
    display: "inline-block",
  };

  const primaryStyle: CSSProperties = {
    ...btnBase,
    background: "#2ab5c1",
    color: "#ffffff",
    border: "none",
    boxShadow: "0 2px 12px rgba(42,181,193,0.25)",
  };

  const secondaryStyle: CSSProperties = {
    ...btnBase,
    background: "rgba(255,255,255,0.1)",
    color: "#f8f9fa",
    border: "1px solid rgba(255,255,255,0.2)",
  };

  return (
    <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
      {buttons.map((btn, i) => (
        <a
          key={btn.label}
          href={btn.href}
          style={i === 0 ? primaryStyle : secondaryStyle}
        >
          {btn.label}
        </a>
      ))}
    </div>
  );
}
