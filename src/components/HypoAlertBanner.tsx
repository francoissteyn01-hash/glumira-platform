/**
 * GluMira™ V7 — HypoAlertBanner (Block 18)
 * Dismissible alert banner displayed when a hypoglycaemic reading is detected.
 */

import type { HypoAlert } from "@/lib/hypo-alert";
import { DISCLAIMER } from "@/lib/constants";

/* ─── Severity styles ────────────────────────────────────────────────────── */

const SEVERITY_STYLES: Record<
  HypoAlert["severity"],
  { background: string; border: string; color: string; borderWidth: string }
> = {
  mild: {
    background: "rgba(234,179,8,0.1)",
    border: "#eab308",
    color: "#854d0e",
    borderWidth: "1px",
  },
  moderate: {
    background: "rgba(249,115,22,0.1)",
    border: "#f97316",
    color: "#9a3412",
    borderWidth: "1px",
  },
  severe: {
    background: "rgba(239,68,68,0.15)",
    border: "#ef4444",
    color: "#991b1b",
    borderWidth: "2px",
  },
};

const BADGE_BG: Record<HypoAlert["severity"], string> = {
  mild: "#eab308",
  moderate: "#f97316",
  severe: "#ef4444",
};

/* ─── Component ──────────────────────────────────────────────────────────── */

interface HypoAlertBannerProps {
  alert: HypoAlert | null;
  onDismiss: () => void;
}

export default function HypoAlertBanner({ alert, onDismiss }: HypoAlertBannerProps) {
  if (!alert) return null;

  const styles = SEVERITY_STYLES[alert.severity];
  const unitLabel = alert.glucoseUnits === "mmol" ? "mmol/L" : "mg/dL";
  const displayVal =
    alert.glucoseUnits === "mmol"
      ? (Math.round(alert.glucoseValue * 10) / 10).toFixed(1)
      : String(Math.round(alert.glucoseValue));

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        background: styles.background,
        border: `${styles.borderWidth} solid ${styles.border}`,
        borderRadius: 12,
        padding: "16px 20px",
        color: styles.color,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        marginBottom: 16,
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Severity badge */}
        <span
          style={{
            background: BADGE_BG[alert.severity],
            color: "#fff",
            fontWeight: 700,
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "3px 10px",
            borderRadius: 6,
          }}
        >
          {alert.severity}
        </span>

        {/* Glucose value */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          {displayVal} {unitLabel}
        </span>

        {/* Timestamp */}
        <span style={{ fontSize: 13, opacity: 0.7, marginLeft: "auto" }}>
          {new Date(alert.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: styles.color,
            fontSize: 20,
            lineHeight: 1,
            padding: "0 4px",
            opacity: 0.6,
          }}
        >
          &times;
        </button>
      </div>

      {/* Action guidance */}
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, fontWeight: 500 }}>
        {alert.action}
      </p>

      {/* Meal context */}
      {alert.mealContext && (
        <p style={{ margin: 0, fontSize: 13, opacity: 0.75, fontStyle: "italic" }}>
          Context: {alert.mealContext}
        </p>
      )}

      {/* Disclaimer */}
      <p
        style={{
          margin: 0,
          fontSize: 11,
          opacity: 0.55,
          borderTop: `1px solid ${styles.border}`,
          paddingTop: 8,
        }}
      >
        {DISCLAIMER}
      </p>
    </div>
  );
}
