/**
 * GluMira™ V7 — Alert Notification Center
 *
 * Renders active glucose-aware alerts (hypo, hyper, fast trend, stacking).
 * All state and persistence logic lives in useAlerts — this file is pure UI.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useState } from "react";
import { useAlerts, SNOOZE_OPTIONS, type Severity } from "@/hooks/useAlerts";

const SEVERITY_COLOUR: Record<Severity, string> = {
  info:     "#3b82f6",
  warning:  "#f59e0b",
  critical: "#ef4444",
};

const iconBtn: React.CSSProperties = {
  background:  "transparent",
  border:      "1px solid var(--border-light)",
  borderRadius: 6,
  padding:     "3px 8px",
  fontSize:    10,
  fontWeight:  600,
  color:       "var(--text-secondary)",
  fontFamily:  "'DM Sans', system-ui, sans-serif",
  cursor:      "pointer",
  minHeight:   24,
};

const snoozeOptBtn: React.CSSProperties = {
  background:  "var(--bg-card)",
  border:      "1px solid var(--border-light)",
  borderRadius: 6,
  padding:     "4px 10px",
  fontSize:    11,
  fontWeight:  600,
  color:       "var(--text-primary)",
  fontFamily:  "'DM Sans', system-ui, sans-serif",
  cursor:      "pointer",
};

const cardStyle: React.CSSProperties = {
  background:   "var(--bg-card)",
  borderRadius: 12,
  border:       "1px solid var(--border-light)",
  padding:      16,
};

export default function AlertNotificationCenter() {
  const { visibleAlerts, loading, error, dismiss, snooze } = useAlerts();
  const [openSnoozeFor, setOpenSnoozeFor] = useState<string | null>(null);

  const headerRow = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
      <h3 style={{
        margin: 0, fontSize: 16, fontWeight: 700,
        color: "var(--text-primary)", fontFamily: "'Playfair Display', serif",
      }}>
        Alerts
      </h3>
      <span style={{
        fontSize: 10, fontWeight: 600, color: "var(--text-faint)",
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
      }}>
        {visibleAlerts.length > 0 ? `${visibleAlerts.length} ACTIVE` : "ALL CLEAR"}
      </span>
    </div>
  );

  if (loading && visibleAlerts.length === 0) {
    return (
      <div style={cardStyle} aria-busy="true">
        {headerRow}
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Loading…
        </p>
      </div>
    );
  }

  if (error && visibleAlerts.length === 0) {
    return (
      <div style={cardStyle} role="alert">
        {headerRow}
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Unable to load alerts.
        </p>
      </div>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <div style={cardStyle}>
        {headerRow}
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          No active alerts. Your data looks steady.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      {headerRow}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visibleAlerts.map((alert) => {
          const colour = SEVERITY_COLOUR[alert.severity];
          const isOpen = openSnoozeFor === alert.id;
          return (
            <div
              key={alert.id}
              role="alert"
              aria-label={alert.title}
              style={{
                borderLeft: `4px solid ${colour}`,
                background: colour + "0F",
                borderRadius: 8,
                padding: "10px 12px",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 13, fontWeight: 700,
                    color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}>
                    {alert.title}
                  </p>
                  <p style={{
                    margin: "2px 0 0", fontSize: 12, lineHeight: 1.4,
                    color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}>
                    {alert.body}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                  <button type="button"
                    onClick={() => setOpenSnoozeFor(isOpen ? null : alert.id)}
                    style={iconBtn}
                    aria-label={`Snooze ${alert.title}`}
                  >
                    Snooze
                  </button>
                  <button type="button"
                    onClick={() => dismiss(alert.id)}
                    style={{ ...iconBtn, color: colour }}
                    aria-label={`Dismiss ${alert.title}`}
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {isOpen && (
                <div style={{
                  marginTop: 8, paddingTop: 8,
                  borderTop: "1px solid var(--border-light)",
                  display: "flex", gap: 6,
                }}>
                  {SNOOZE_OPTIONS.map((opt) => (
                    <button type="button" key={opt.label}
                      onClick={() => { snooze(alert.id, opt.ms); setOpenSnoozeFor(null); }}
                      style={snoozeOptBtn}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p style={{
        margin: "10px 0 0", fontSize: 10, color: "var(--text-faint)",
        fontFamily: "'DM Sans', system-ui, sans-serif", textAlign: "right",
      }}>
        Updates every 30s · educational only
      </p>
    </div>
  );
}
