/**
 * GluMira™ V7 — Demo Dashboard
 * Public demo with sample data — no auth required.
 * Shows visitors what the dashboard looks like with realistic mock data.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatGlucose as fmtGlucose, getUnitLabel } from "@/utils/glucose-units";
import TimeInRangeDonut from "@/components/widgets/TimeInRangeDonut";
import ShowcaseCarousel from "@/components/ShowcaseCarousel";
import PublicPageHeader from "@/components/PublicPageHeader";

const T = {
  navy: "#1a2a5e",
  navyDeep: "#0d1b3e",
  teal: "#2ab5c1",
  amber: "#f59e0b",
  white: "#ffffff",
  heading: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/* ─── Sample data ─────────────────────────────────────────────────────── */
const SAMPLE_READINGS = [
  { glucose: 6.2, time: "08:00", trend: "Flat" },
  { glucose: 8.4, time: "09:30", trend: "FortyFiveUp" },
  { glucose: 7.1, time: "10:15", trend: "FortyFiveDown" },
  { glucose: 5.8, time: "11:00", trend: "Flat" },
  { glucose: 4.5, time: "12:30", trend: "SingleDown" },
  { glucose: 6.9, time: "13:00", trend: "FortyFiveUp" },
  { glucose: 9.2, time: "14:30", trend: "SingleUp" },
  { glucose: 7.8, time: "15:00", trend: "FortyFiveDown" },
  { glucose: 6.5, time: "16:00", trend: "Flat" },
  { glucose: 5.4, time: "17:30", trend: "FortyFiveDown" },
];

const ARROWS: Record<string, string> = {
  DoubleUp: "\u21C8", SingleUp: "\u2191", FortyFiveUp: "\u2197",
  Flat: "\u2192", FortyFiveDown: "\u2198", SingleDown: "\u2193",
  DoubleDown: "\u21CA", NONE: "\u2014",
};

const SAMPLE_IOB = 3.2;
const SAMPLE_TIR = [
  { value: 6.2 }, { value: 7.1 }, { value: 5.8 }, { value: 8.4 },
  { value: 6.9 }, { value: 4.5 }, { value: 9.2 }, { value: 7.8 },
  { value: 6.5 }, { value: 5.4 }, { value: 7.0 }, { value: 6.3 },
  { value: 5.9 }, { value: 8.1 }, { value: 6.7 }, { value: 7.5 },
];

const SAMPLE_EVENTS = [
  { time: "07:45", type: "Bolus", detail: "NovoRapid 4U" },
  { time: "08:00", type: "Meal", detail: "Breakfast — 45g carbs" },
  { time: "12:15", type: "Bolus", detail: "NovoRapid 6U" },
  { time: "12:30", type: "Meal", detail: "Lunch — 60g carbs" },
  { time: "15:00", type: "Condition", detail: "Exercise — moderate" },
];

export default function DemoDashboardPage() {
  const navigate = useNavigate();
  const [units] = useState<"mmol" | "mg">("mmol");

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card, #ffffff)",
    borderRadius: 12,
    border: "1px solid var(--border-light, #e2e8f0)",
    padding: 20,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary, #f8f9fa)" }}>
      <PublicPageHeader />
      {/* Demo banner */}
      <div style={{
        background: `linear-gradient(135deg, ${T.teal}, ${T.navy})`,
        padding: "14px 24px",
        textAlign: "center",
        color: T.white,
        fontFamily: T.body,
        fontSize: 14,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        flexWrap: "wrap",
      }}>
        <span>You're viewing a demo with sample data</span>
        <button
          type="button"
          onClick={() => navigate("/auth")}
          style={{
            padding: "6px 18px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.15)",
            color: T.white,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: T.body,
            cursor: "pointer",
          }}
        >
          Create free account
        </button>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontFamily: T.heading, fontSize: "clamp(24px, 6vw, 32px)",
            fontWeight: 700, color: "var(--text-primary, #1a2a5e)", margin: "0 0 4px",
          }}>
            Demo Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary, #64748b)", margin: 0, fontFamily: T.body }}>
            Sample data — this is what your dashboard could look like
          </p>
        </div>

        {/* Date range (static) */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {["Today", "3D", "7D", "14D", "30D"].map((label, i) => (
            <span key={label} style={{
              padding: "6px 14px", borderRadius: 6,
              border: "1px solid var(--border-light, #e2e8f0)",
              background: i === 0 ? "var(--date-btn-active-bg, #1a2a5e)" : "var(--bg-card, #fff)",
              color: i === 0 ? "var(--date-btn-active-text, #fff)" : "var(--text-secondary, #64748b)",
              fontSize: 12, fontWeight: 600, fontFamily: T.body,
            }}>
              {label}
            </span>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          borderRadius: 8, background: "var(--disclaimer-bg, #fffbeb)", border: "1px solid var(--disclaimer-border, #fde68a)",
          padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "var(--disclaimer-text, #92400e)",
          fontFamily: T.body,
        }}>
          GluMira™ is an educational platform, not a medical device. Do not make treatment decisions based on this tool alone.
        </div>

        {/* Top cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
          {/* Active Insulin */}
          <div style={cardStyle}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: T.body }}>
              Active Insulin (IOB)
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 700, color: T.teal, fontFamily: T.mono }}>
              {SAMPLE_IOB.toFixed(1)}<span style={{ fontSize: 14, marginLeft: 4, color: "var(--text-secondary, #64748b)" }}>U</span>
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-faint, #94a3b8)", fontFamily: T.body }}>
              Pressure: Moderate
            </p>
          </div>

          {/* Current Glucose */}
          <div style={cardStyle}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: T.body }}>
              Latest Glucose
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 700, color: "#22c55e", fontFamily: T.mono }}>
              {SAMPLE_READINGS[0].glucose.toFixed(1)}
              <span style={{ fontSize: 16, marginLeft: 6, color: "var(--text-secondary, #64748b)" }}>{ARROWS[SAMPLE_READINGS[0].trend]}</span>
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-faint, #94a3b8)", fontFamily: T.body }}>
              mmol/L — 2m ago
            </p>
          </div>

          {/* Time in Range */}
          <div style={cardStyle}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: T.body }}>
              Time in Range
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 700, color: "#22c55e", fontFamily: T.mono }}>
              78<span style={{ fontSize: 14, color: "var(--text-secondary, #64748b)" }}>%</span>
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-faint, #94a3b8)", fontFamily: T.body }}>
              Target: 3.9–10.0 mmol/L
            </p>
          </div>

          {/* GMI */}
          <div style={cardStyle}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: T.body }}>
              GMI (est. HbA1c)
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 700, color: "var(--text-primary, #1a2a5e)", fontFamily: T.mono }}>
              6.8<span style={{ fontSize: 14, color: "var(--text-secondary, #64748b)" }}>%</span>
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-faint, #94a3b8)", fontFamily: T.body }}>
              Based on 14-day average
            </p>
          </div>
        </div>

        {/* Showcase carousel */}
        <ShowcaseCarousel />

        {/* TIR Donut */}
        <div style={{ marginBottom: 20 }}>
          <TimeInRangeDonut readings={SAMPLE_TIR} />
        </div>

        {/* Event log */}
        <div style={{ ...cardStyle, marginBottom: 20, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-light, #e2e8f0)" }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary, #1a2a5e)", fontFamily: T.heading }}>
              Today's Events (Sample)
            </p>
          </div>
          {SAMPLE_EVENTS.map((ev, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 20px",
              borderBottom: i < SAMPLE_EVENTS.length - 1 ? "1px solid var(--border-light, #e2e8f0)" : "none",
            }}>
              <span style={{
                fontSize: 12, fontWeight: 600, fontFamily: T.mono,
                color: "var(--text-secondary, #64748b)", minWidth: 48,
              }}>
                {ev.time}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                color: ev.type === "Bolus" ? T.teal : ev.type === "Meal" ? T.amber : "#8b5cf6",
                minWidth: 64,
              }}>
                {ev.type}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-primary, #1a2a5e)", fontFamily: T.body }}>
                {ev.detail}
              </span>
            </div>
          ))}
        </div>

        {/* What-If teaser */}
        <div style={{
          ...cardStyle,
          border: "2px solid #f59e0b",
          textAlign: "center",
          marginBottom: 20,
          cursor: "pointer",
          opacity: 0.7,
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #1a2a5e)", margin: 0, fontFamily: T.body }}>
            &#9889; What-If Scenario Engine
          </p>
          <p style={{ fontSize: 12, color: "var(--text-secondary, #64748b)", margin: "4px 0 0", fontFamily: T.body }}>
            Adjust doses and times — watch the IOB curve reshape in real time
          </p>
          <p style={{ fontSize: 11, color: T.teal, margin: "8px 0 0", fontWeight: 600 }}>
            Sign up to unlock
          </p>
        </div>

        {/* CTA */}
        <div style={{
          background: `linear-gradient(135deg, ${T.navyDeep}, ${T.navy})`,
          borderRadius: 12,
          padding: "32px 24px",
          textAlign: "center",
          marginBottom: 20,
        }}>
          <h2 style={{ fontFamily: T.heading, fontSize: 24, color: T.white, margin: "0 0 8px" }}>
            Ready to track your own data?
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: "0 0 20px", fontFamily: T.body }}>
            GluMira™ is free during beta. No credit card required.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate("/auth")}
              style={{
                padding: "12px 28px", borderRadius: 8, border: "none",
                background: T.teal, color: T.white, fontSize: 14, fontWeight: 600,
                fontFamily: T.body, cursor: "pointer",
              }}
            >
              Join the Beta — Free
            </button>
            <button
              type="button"
              onClick={() => navigate("/education")}
              style={{
                padding: "12px 28px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "transparent", color: "rgba(255,255,255,0.8)",
                fontSize: 14, fontWeight: 500, fontFamily: T.body, cursor: "pointer",
              }}
            >
              Explore Education
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p style={{ fontSize: 11, color: "var(--text-faint, #94a3b8)", fontFamily: T.body }}>
            GluMira™ is an educational platform, not a medical device.
          </p>
          <p style={{ fontSize: 10, color: "var(--placeholder, #cbd5e1)", fontFamily: T.mono }}>
            V7 — Powered by IOB Hunter™
          </p>
        </div>
      </div>
    </div>
  );
}
