/**
 * GluMira™ V7 — IOB Hunter Page (v7 shell)
 *
 * Thin shell that wires the new `src/iob-hunter/` module together:
 *   VisitorEntry → Chart → What-If → Report → TierGate
 *
 * Replaces the legacy Recharts IOBMountainGraph + InsulinDensityHeatmap
 * + PatientHeader + anoukData layout. All of those files are removed
 * in the same commit as this rewrite.
 *
 * The owner's priority order from 2026-04-11: correct functionality
 * and feedback FIRST, then the nice graphic, then characters. This
 * page is a functional assembly — visual polish iterates separately
 * via P3 after it ships.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";
import {
  DEMO_PATIENT_A_V7,
  INSULIN_PROFILES,
  IOBHunterChart,
  IOBHunterReport,
  IOBHunterTierGate,
  IOBHunterVisitorEntry,
  IOBHunterWhatIf,
  getDemoPatientADoses,
  useIOBHunter,
} from "@/iob-hunter";
import type {
  InsulinDose,
  Tier,
  WhatIfResult,
  WhatIfScenario,
} from "@/iob-hunter";

/* ─── Tier detection ─────────────────────────────────────────────────── */
/*
 * For v7 slice 2.7 we treat anyone signed in as "pro" (30 days, 5 what-if
 * scenarios). Anonymous visitors are "free" (1 what-if, no save). The
 * clinical/enterprise tiers will be wired through Supabase in slice 2.2
 * (schema + data) which is a follow-up commit.
 */
function deriveTier(isAuthenticated: boolean): Tier {
  return isAuthenticated ? "pro" : "free";
}

/* ─── Tier gate state ────────────────────────────────────────────────── */
type TierGateFeature = React.ComponentProps<typeof IOBHunterTierGate>["feature"];

export default function IOBHunterPage() {
  const { session } = useAuth();
  const isAuthenticated = session != null;
  const tier = deriveTier(isAuthenticated);

  /* ─── Active dose list ─────────────────────────────────────────── */
  // Visitors start with the demo regimen. Authenticated users will have
  // their real regimen piped through in slice 2.2 — for now we fall back
  // to the demo data so the page always shows a working curve.
  const [activeDoses, setActiveDoses] = useState<InsulinDose[]>(() =>
    getDemoPatientADoses(),
  );

  /* ─── What-if overlay (optional green dashed line) ─────────────── */
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);

  /* ─── Tier gate overlay ────────────────────────────────────────── */
  const [gateFeature, setGateFeature] = useState<TierGateFeature | null>(null);

  /* ─── Engine hook — feeds the chart + report ───────────────────── */
  const { curve, kpis, markers, stackingAlerts, basalAnalysis, maxIOB } =
    useIOBHunter(activeDoses);

  /* ─── Handlers ─────────────────────────────────────────────────── */

  const handleVisitorDosesChange = useCallback((doses: InsulinDose[]) => {
    setActiveDoses(doses);
    setWhatIfResult(null); // reset any what-if overlay when the base data changes
  }, []);

  const handleWorkingDosesChange = useCallback(
    (doses: InsulinDose[], result: WhatIfResult | null) => {
      if (result) {
        setWhatIfResult(result);
      } else {
        setWhatIfResult(null);
      }
      // When in "my_data" mode, the what-if component sends the actual
      // doses back unchanged — we don't swap activeDoses in that case.
      // When in "what_if" mode, we still display the actual curve as the
      // primary line and the modified curve as the green overlay.
      // (No state change needed to activeDoses here.)
      void doses;
    },
    [],
  );

  const handleSaveScenario = useCallback((scenario: WhatIfScenario) => {
    // Slice 2.2 will wire this to Supabase via the insulin_doses table.
    // For now we just log to console so the UI path is verifiable.
     
    console.info("[IOB Hunter] save scenario (slice 2.2 will persist):", scenario.name);
  }, []);

  const handleTierGate = useCallback(
    (
      feature:
        | "save_scenario"
        | "extra_what_if"
        | "export_pdf"
        | "extended_history"
        | "ai_insights",
    ) => {
      setGateFeature(feature);
    },
    [],
  );

  const closeTierGate = useCallback(() => {
    setGateFeature(null);
  }, []);

  const handleSignUp = useCallback(() => {
    window.location.href = "/auth";
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div
        style={{
          maxWidth: 1024,
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 32px)",
        }}
      >
        {/* ─── Header ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(24px, 6vw, 32px)",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 4px",
            }}
          >
            IOB Hunter™
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              margin: 0,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            The science of insulin, made visible — 24-hour pressure map grounded
            in published pharmacokinetic data.
          </p>
        </div>

        {/* ─── Disclaimer ─────────────────────────────────────── */}
        <div
          style={{
            borderRadius: 8,
            background: "var(--disclaimer-bg)",
            border: "1px solid var(--disclaimer-border)",
            padding: "10px 14px",
            marginBottom: 20,
            fontSize: 12,
            color: "var(--disclaimer-text)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {DISCLAIMER}
        </div>

        {/* ─── Patient header (for authenticated users, will show
               real profile name in slice 2.2; for now always shows
               Patient A demo meta) ─────────────────────────── */}
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 12,
            border: "1px solid var(--border-light)",
            padding: "16px 20px",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-faint)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            {isAuthenticated ? "Your regimen" : "Demo regimen"}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {DEMO_PATIENT_A_V7.name}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 13,
              color: "var(--text-secondary)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            {DEMO_PATIENT_A_V7.therapy} · {DEMO_PATIENT_A_V7.diet}
          </p>
        </div>

        {/* ─── The pressure map ──────────────────────────────── */}
        <IOBHunterChart
          curve={curve}
          markers={markers}
          whatIfCurve={whatIfResult?.modified_curve}
          stackingAlerts={stackingAlerts}
          maxIOB={maxIOB}
          showInjectionMarkers
          showWhatIf={whatIfResult != null}
          height={400}
        />

        {/* ─── Visitor entry (unauthenticated only) ──────────── */}
        {!isAuthenticated && (
          <IOBHunterVisitorEntry
            demoDoses={getDemoPatientADoses()}
            onActiveDosesChange={handleVisitorDosesChange}
            onSignupGate={handleTierGate}
            defaultRegion="NA"
          />
        )}

        {/* ─── What-if sandbox ────────────────────────────────── */}
        <IOBHunterWhatIf
          actualDoses={activeDoses}
          profiles={INSULIN_PROFILES}
          tier={tier}
          savedScenarioCount={0}
          onWorkingDosesChange={handleWorkingDosesChange}
          onSaveScenario={handleSaveScenario}
          onTierGate={handleTierGate}
        />

        {/* ─── Clinical report ───────────────────────────────── */}
        <IOBHunterReport
          doses={activeDoses}
          profiles={INSULIN_PROFILES}
          kpis={kpis}
          basalAnalysis={basalAnalysis}
          stackingAlerts={stackingAlerts}
        />

        {/* Spacer for mobile bottom nav */}
        <div style={{ height: 80 }} />
      </div>

      {/* ─── Tier gate overlay ────────────────────────────────── */}
      {gateFeature && (
        <IOBHunterTierGate
          feature={gateFeature}
          onClose={closeTierGate}
          onSignUp={handleSignUp}
        />
      )}
    </div>
  );
}
