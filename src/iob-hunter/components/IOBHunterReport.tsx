/**
 * GluMira™ V7 — IOB Hunter v7 · Clinical Report
 *
 * Assembles all 7 report sections below the pressure map:
 *   1. KPI row
 *   2. Pharmacokinetic reference table
 *   3. Basal coverage analysis
 *   4. Suggested improvements (timing only, NEVER dose volume)
 *   5. Stacking risk assessment
 *   6. Clinical summary
 *   7. Disclaimer + footer
 *
 * Tier-gated sections (Clinical/Enterprise only) are handled by the
 * parent page — this component just renders what it's given. Anchor
 * semantics: the report is a single <article> so screen readers can
 * navigate it as one document.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type {
  BasalCoverageAnalysis,
  InsulinDose,
  InsulinProfile,
  ReportKPIs,
  StackingAlert,
} from "@/iob-hunter/types";
import {
  basalCoverageSummary,
  clinicalSummary,
  kpiHeadline,
  stackingAlertNarratives,
  suggestedImprovements,
} from "@/iob-hunter/engine/narrative-generator";
import IOBHunterKPIRow from "./IOBHunterKPIRow";
import IOBHunterPharmaTable from "./IOBHunterPharmaTable";

export type IOBHunterReportProps = {
  doses: InsulinDose[];
  profiles: readonly InsulinProfile[];
  kpis: ReportKPIs;
  basalAnalysis: BasalCoverageAnalysis;
  stackingAlerts: StackingAlert[];
}

export default function IOBHunterReport({
  doses,
  profiles,
  kpis,
  basalAnalysis,
  stackingAlerts,
}: IOBHunterReportProps) {
  const improvements = suggestedImprovements(basalAnalysis, stackingAlerts);
  const narratives = stackingAlertNarratives(stackingAlerts);

  return (
    <article
      aria-label="IOB Hunter clinical report"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* 1. KPI row */}
      <IOBHunterKPIRow kpis={kpis} />

      {/* Headline narrative */}
      <Section>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--text-primary)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {kpiHeadline(kpis)}
        </p>
      </Section>

      {/* 2. Pharmacokinetic reference */}
      <IOBHunterPharmaTable doses={doses} profiles={profiles} />

      {/* 3. Basal coverage */}
      <Section title="Basal coverage">
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {basalCoverageSummary(basalAnalysis)}
        </p>
      </Section>

      {/* 4. Suggested improvements */}
      {improvements.length > 0 && (
        <Section title="Suggested improvements">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {improvements.map((imp) => (
              <Callout key={imp.priority} tone="good" numberBadge={imp.priority}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                >
                  {imp.title}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: "var(--text-secondary)",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                >
                  {imp.body}
                </p>
              </Callout>
            ))}
          </div>
        </Section>
      )}

      {/* 5. Stacking risk */}
      <Section title="Stacking risk assessment">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {narratives.map((n, i) => (
            <Callout key={i} tone={stackingAlerts.length === 0 ? "good" : "warn"}>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: "var(--text-secondary)",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                {n}
              </p>
            </Callout>
          ))}
        </div>
      </Section>

      {/* 6. Clinical summary */}
      <Section title="Clinical summary">
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--text-primary)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {clinicalSummary(kpis, basalAnalysis, stackingAlerts)}
        </p>
      </Section>

      {/* 7. Disclaimer */}
      <div
        role="note"
        style={{
          marginTop: 16,
          padding: "14px 18px",
          borderRadius: 10,
          background: "#FEF3C7",
          border: "1px solid #FCD34D",
          color: "#78350F",
          fontSize: 12,
          lineHeight: 1.5,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <strong>Important:</strong> GluMira™ is an educational platform and
        does not constitute medical advice. All suggestions should be
        discussed with a qualified diabetes care team. Never make dose
        changes based on this report alone.
      </div>

      {/* Footer */}
      <p
        style={{
          margin: "20px 0 0",
          textAlign: "center",
          fontSize: 11,
          color: "var(--text-faint)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        GluMira™ — Powered by IOB Hunter™
      </p>
    </article>
  );
}

/* ─── Small layout primitives ─────────────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginTop: 16,
      }}
    >
      {title && (
        <h3
          style={{
            margin: "0 0 10px",
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text-primary)",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

function Callout({
  tone,
  numberBadge,
  children,
}: {
  tone: "good" | "warn" | "alert";
  numberBadge?: number;
  children: React.ReactNode;
}) {
  const toneStyles = {
    good:  { bg: "#ECFDF5", border: "#10B981", dot: "#10B981" },
    warn:  { bg: "#FEF3C7", border: "#F59E0B", dot: "#F59E0B" },
    alert: { bg: "#FEE2E2", border: "#EF4444", dot: "#EF4444" },
  }[tone];

  return (
    <div
      style={{
        background: toneStyles.bg,
        borderLeft: `4px solid ${toneStyles.border}`,
        borderRadius: 8,
        padding: "12px 14px",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      {numberBadge != null && (
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            width: 24,
            height: 24,
            borderRadius: 999,
            background: toneStyles.dot,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {numberBadge}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}
