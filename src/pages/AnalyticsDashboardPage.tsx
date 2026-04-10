/**
 * GluMira™ V7 — Analytics Dashboard Page
 *
 * Unified view of patient-facing analytics:
 *   - Glucose Variability (CV%) — 7d vs 14d
 *   - Insulin Sensitivity Heatmap — 24h ISF map
 *   - Carb Ratio (ICR) — configured vs observed
 *   - Basal Rate — overnight stability score
 *
 * Backed by /api/analytics/{summary,insulin-sensitivity,carb-ratio,basal-evaluation}
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { DISCLAIMER } from "@/lib/constants";
import { usePatientName } from "@/hooks/usePatientName";
import GlucoseVariabilityCard    from "@/components/widgets/GlucoseVariabilityCard";
import InsulinSensitivityHeatmap from "@/components/widgets/InsulinSensitivityHeatmap";
import CarbRatioCard             from "@/components/widgets/CarbRatioCard";
import BasalRateCard             from "@/components/widgets/BasalRateCard";

export default function AnalyticsDashboardPage() {
  const { patientName, isCaregiver } = usePatientName();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(24px, 6vw, 32px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 4px",
          }}>
            {isCaregiver && patientName ? `${patientName}\u2019s Analytics` : "Analytics"}
          </h1>
          <p style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            margin: 0,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            Patterns from your last 14 days of data — for review with your care team
          </p>
        </div>

        {/* Disclaimer */}
        <div style={{
          borderRadius: 8,
          background: "var(--disclaimer-bg)",
          border: "1px solid var(--disclaimer-border)",
          padding: "10px 14px",
          marginBottom: 20,
          fontSize: 12,
          color: "var(--disclaimer-text)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {DISCLAIMER}
        </div>

        {/* ── Top row: Variability + Carb Ratio + Basal ─────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}>
          <GlucoseVariabilityCard />
          <CarbRatioCard />
          <BasalRateCard />
        </div>

        {/* ── Full-width: Sensitivity heatmap ────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <InsulinSensitivityHeatmap />
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid var(--border-divider)", marginTop: 8, padding: "16px 0" }}>
          <p style={{
            fontSize: 11,
            color: "var(--text-faint)",
            textAlign: "center",
            margin: "8px 0 4px",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            {DISCLAIMER}
          </p>
          <p style={{
            fontSize: 10,
            color: "var(--placeholder)",
            textAlign: "center",
            margin: 0,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Analytics window: 14 days
          </p>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
