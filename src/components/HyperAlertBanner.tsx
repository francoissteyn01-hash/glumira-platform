/**
 * GluMira™ V7 — HyperAlertBanner (Block 55)
 * Dismissible alert banner displayed when a hyperglycaemic pattern is detected.
 * Mirrors the HypoAlertBanner design language (Scandinavian Minimalist).
 */

import { DISCLAIMER } from "@/lib/constants";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type HyperSeverity = "elevated" | "high" | "very_high" | "urgent";

export interface HyperAlert {
  glucoseValue: number;
  glucoseUnits: "mmol" | "mg";
  severity: HyperSeverity;
  pattern?: string;
  message: string;
  action: string;
}

interface HyperAlertBannerProps {
  alert: HyperAlert | null;
  onDismiss: () => void;
}

/* ─── Severity styles ───────────────────────────────────────────────────── */

const SEVERITY_STYLES: Record<
  HyperSeverity,
  { background: string; border: string; color: string; borderWidth: string }
> = {
  elevated: {
    background: "rgba(234,179,8,0.1)",
    border: "#eab308",
    color: "#854d0e",
    borderWidth: "1px",
  },
  high: {
    background: "rgba(249,115,22,0.1)",
    border: "#f97316",
    color: "#9a3412",
    borderWidth: "1px",
  },
  very_high: {
    background: "rgba(239,68,68,0.1)",
    border: "#ef4444",
    color: "#991b1b",
    borderWidth: "1px",
  },
  urgent: {
    background: "rgba(239,68,68,0.2)",
    border: "#ef4444",
    color: "#991b1b",
    borderWidth: "2px",
  },
};

const BADGE_BG: Record<HyperSeverity, string> = {
  elevated: "#eab308",
  high: "#f97316",
  very_high: "#ef4444",
  urgent: "#ef4444",
};

const SEVERITY_LABEL: Record<HyperSeverity, string> = {
  elevated: "Elevated",
  high: "High",
  very_high: "Very High",
  urgent: "Urgent",
};

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function HyperAlertBanner({ alert, onDismiss }: HyperAlertBannerProps) {
  if (!alert) return null;

  const styles = SEVERITY_STYLES[alert.severity];
  const unitLabel = alert.glucoseUnits === "mmol" ? "mmol/L" : "mg/dL";
  const displayVal =
    alert.glucoseUnits === "mmol"
      ? (Math.round(alert.glucoseValue * 10) / 10).toFixed(1)
      : String(Math.round(alert.glucoseValue));

  const isUrgent = alert.severity === "urgent";

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        background: styles.background,
        border: `${styles.borderWidth} solid ${styles.border}`,
        borderRadius: "var(--radius-lg, 12px)",
        padding: "var(--space-4, 16px) var(--space-5, 20px)",
        color: styles.color,
        fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2-5, 10px)",
        position: "relative",
        marginBottom: "var(--space-4, 16px)",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2-5, 10px)" }}>
        {/* Severity badge */}
        <span
          style={{
            background: BADGE_BG[alert.severity],
            color: "#fff",
            fontWeight: 700,
            fontSize: "var(--text-xs, 12px)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "3px 10px",
            borderRadius: "var(--radius-sm, 6px)",
          }}
        >
          {SEVERITY_LABEL[alert.severity]}
        </span>

        {/* Glucose value */}
        <span
          style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontWeight: 600,
            fontSize: "var(--text-lg, 18px)",
          }}
        >
          {displayVal} {unitLabel}
        </span>

        {/* Spacer */}
        <span style={{ flex: 1 }} />

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: styles.color,
            fontSize: "var(--text-xl, 20px)",
            lineHeight: 1,
            padding: "0 4px",
            opacity: 0.6,
          }}
        >
          &times;
        </button>
      </div>

      {/* Main message */}
      <p style={{ margin: 0, fontSize: "var(--text-sm, 14px)", lineHeight: 1.55, fontWeight: 500 }}>
        {alert.message}
      </p>

      {/* Pattern description (if recurring) */}
      {alert.pattern && (
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-xs, 13px)",
            opacity: 0.75,
            fontStyle: "italic",
          }}
        >
          Pattern: {alert.pattern}
        </p>
      )}

      {/* Action guidance */}
      <p style={{ margin: 0, fontSize: "var(--text-sm, 14px)", lineHeight: 1.55, fontWeight: 600 }}>
        {alert.action}
      </p>

      {/* Urgent ketone warning */}
      {isUrgent && (
        <div
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid #ef4444",
            borderRadius: "var(--radius-sm, 6px)",
            padding: "var(--space-2, 8px) var(--space-3, 12px)",
            fontSize: "var(--text-sm, 14px)",
            fontWeight: 700,
          }}
        >
          Check for ketones immediately. If ketones are present or you feel unwell, seek medical attention without delay.
        </div>
      )}

      {/* Disclaimer */}
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-2xs, 11px)",
          opacity: 0.55,
          borderTop: `1px solid ${styles.border}`,
          paddingTop: "var(--space-2, 8px)",
        }}
      >
        {DISCLAIMER}
      </p>
    </div>
  );
}
