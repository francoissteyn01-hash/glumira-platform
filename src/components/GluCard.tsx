/**
 * GluMira™ V7 — GluCard
 * Reusable card component used across all pages.
 * Light: white bg, subtle shadow. Dark: navy bg, border separation.
 */

import type { ReactNode } from "react";

const ACCENT_COLOURS: Record<string, string> = {
  teal: "var(--accent-teal)",
  amber: "var(--accent-amber)",
  navy: "var(--text-primary)",
  danger: "var(--danger, #EF4444)",
};

interface GluCardProps {
  title?: string;
  subtitle?: string;
  accent?: "teal" | "amber" | "navy" | "danger" | "none";
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function GluCard({ title, subtitle, accent, children, className, style }: GluCardProps) {
  const accentColor = accent && accent !== "none" ? ACCENT_COLOURS[accent] : undefined;

  return (
    <div
      className={className}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        borderLeft: accentColor ? `4px solid ${accentColor}` : undefined,
        padding: "20px 24px",
        transition: "box-shadow 0.2s, border-color 0.2s",
        ...style,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "";
      }}
    >
      {title && (
        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {title}
        </h3>
      )}
      {subtitle && (
        <p
          style={{
            margin: title ? "4px 0 0" : 0,
            fontSize: 13,
            color: "var(--text-tertiary, var(--text-muted))",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {subtitle}
        </p>
      )}
      {(title || subtitle) && children ? <div style={{ marginTop: 14 }}>{children}</div> : children}
    </div>
  );
}
