import { type CSSProperties } from "react";

interface CTAButton {
  label: string;
  action: string;
  target?: string;
}

interface StoryCTAProps {
  cta?: CTAButton;
  ctaOptions?: CTAButton[];
  onAction: (action: string, target?: string) => void;
}

export default function StoryCTA({ cta, ctaOptions, onAction }: StoryCTAProps) {
  const buttons = ctaOptions || (cta ? [cta] : []);
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
    zIndex: 100,
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
    background: "transparent",
    color: "#1a2a5e",
    border: "1px solid rgba(26,42,94,0.2)",
  };

  return (
    <div style={containerStyle}>
      {buttons.map((btn, i) => (
        <button type="button"
          key={btn.label}
          style={i === 0 ? primaryStyle : secondaryStyle}
          onClick={() => onAction(btn.action, btn.target)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
