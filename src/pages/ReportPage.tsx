import React, { useState, useMemo } from "react";
import {
  buildTerrainTimeline,
  evaluateBasalProfile,
  generateInsight,
  computeEntryCurve,
} from "@/lib/pharmacokinetics";
import type {
  InsulinEntry,
  TerrainPoint,
  DangerWindow,
  PressureClass,
  InsightContent,
  BasalEvaluation,
} from "@/lib/pharmacokinetics";
import IOBHeatmapRow from "@/components/charts/IOBHeatmapRow";
import BasalEvalGauge from "@/components/charts/BasalEvalGauge";
import SixtySecondInsight from "@/components/charts/SixtySecondInsight";
import IOBDensityBar from "@/components/charts/IOBDensityBar";
import { CGMVerificationBanner } from "@/components/CGMCommentSystem";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Demo data — typical T1D MDI regimen (2 × Levemir + 3 × NovoRapid)
// ---------------------------------------------------------------------------
const DEMO_ENTRIES: InsulinEntry[] = [
  {
    id: "b1",
    insulinName: "Levemir",
    dose: 5.5,
    time: "06:30",
    type: "basal",
    pharmacology: {
      name: "Levemir",
      onsetMinutes: 120,
      peakMinutes: 420,
      durationMinutes: 1200,
      category: "long",
    },
  },
  {
    id: "b2",
    insulinName: "Levemir",
    dose: 5.5,
    time: "18:30",
    type: "basal",
    pharmacology: {
      name: "Levemir",
      onsetMinutes: 120,
      peakMinutes: 420,
      durationMinutes: 1200,
      category: "long",
    },
  },
  {
    id: "r1",
    insulinName: "NovoRapid",
    dose: 3,
    time: "07:00",
    type: "bolus",
    mealType: "Breakfast",
    pharmacology: {
      name: "NovoRapid",
      onsetMinutes: 10,
      peakMinutes: 75,
      durationMinutes: 300,
      category: "rapid",
    },
  },
  {
    id: "r2",
    insulinName: "NovoRapid",
    dose: 4,
    time: "12:30",
    type: "bolus",
    mealType: "Lunch",
    pharmacology: {
      name: "NovoRapid",
      onsetMinutes: 10,
      peakMinutes: 75,
      durationMinutes: 300,
      category: "rapid",
    },
  },
  {
    id: "r3",
    insulinName: "NovoRapid",
    dose: 3.5,
    time: "18:00",
    type: "bolus",
    mealType: "Dinner",
    pharmacology: {
      name: "NovoRapid",
      onsetMinutes: 10,
      peakMinutes: 75,
      durationMinutes: 300,
      category: "rapid",
    },
  },
];

// ---------------------------------------------------------------------------
// Shared inline-style helpers
// ---------------------------------------------------------------------------
const CARD_STYLE: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
};

const HEADING_FONT: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  color: "var(--text-primary)",
};

const BODY_FONT: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  color: "var(--text-primary)",
};

const FOOTER_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontStyle: "italic",
  color: "var(--text-muted)",
  textAlign: "center",
  marginTop: 24,
  fontFamily: "'DM Sans', sans-serif",
};

const FOOTER_TEXT =
  "Educational only — based on published pharmacological data. Not a prescription. All changes must be discussed with your care team. GluMira™ is not a medical device.";

const PRESSURE_LEGEND: { label: string; color: string }[] = [
  { label: "Light", color: "#4ade80" },
  { label: "Moderate", color: "#facc15" },
  { label: "Strong", color: "#f97316" },
  { label: "Overlap", color: "#ef4444" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ReportPage() {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Derived calculations
  const tdd = useMemo(
    () => DEMO_ENTRIES.reduce((sum, e) => sum + e.dose, 0),
    []
  );

  const basalTotal = useMemo(
    () =>
      DEMO_ENTRIES.filter((e) => e.type === "basal").reduce(
        (s, e) => s + e.dose,
        0
      ),
    []
  );

  const basalPct = useMemo(
    () => Math.round((basalTotal / tdd) * 100),
    [basalTotal, tdd]
  );

  // Compute per-entry IOB curves
  const entryCurves = useMemo(
    () =>
      DEMO_ENTRIES.map((entry) => ({
        entry,
        curve: computeEntryCurve(entry, 2880, 2, 15),
      })),
    []
  );

  const maxIOB = useMemo(
    () =>
      Math.max(
        ...entryCurves.flatMap((ec) => ec.curve.map((pt) => pt.iob)),
        0.01
      ),
    [entryCurves]
  );

  // Terrain timeline
  const terrain = useMemo(
    () => buildTerrainTimeline(DEMO_ENTRIES),
    []
  );

  // Basal evaluation
  const basalEval = useMemo(
    () => evaluateBasalProfile(DEMO_ENTRIES, terrain.dangerWindows, terrain.points),
    []
  );

  // Insight
  const insight = useMemo(
    () => generateInsight(DEMO_ENTRIES, terrain.dangerWindows, terrain.peakIOB, terrain.worstPressure),
    []
  );

  // Categorised observations
  const positiveObs = useMemo(
    () =>
      (basalEval.observations ?? []).filter(
        (o: any) => o.type === "positive"
      ),
    [basalEval]
  );
  const warningObs = useMemo(
    () =>
      (basalEval.observations ?? []).filter(
        (o: any) => o.type === "warning"
      ),
    [basalEval]
  );
  const alertObs = useMemo(
    () =>
      (basalEval.observations ?? []).filter(
        (o: any) => o.type === "alert"
      ),
    [basalEval]
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        maxWidth: 900,
        margin: "0 auto",
        padding: "32px 20px",
        ...BODY_FONT,
      }}
    >
      {/* Print button */}
      <button
        onClick={() => window.print()}
        style={{
          background: "var(--accent-teal)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 24px",
          fontSize: 14,
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 24,
        }}
      >
        Generate PDF
      </button>

      {/* ================================================================ */}
      {/* PAGE 1 — Insulin Stacking Report                                 */}
      {/* ================================================================ */}

      {/* Header bar */}
      <div
        style={{
          background: "#1a2a5e",
          color: "#fff",
          padding: "16px 24px",
          borderRadius: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          marginBottom: 16,
        }}
      >
        <span style={{ fontWeight: 700 }}>GluMira™</span>
        <span>Powered by IOB Hunter™</span>
        <span>{today}</span>
      </div>

      {/* Pressure legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {PRESSURE_LEGEND.map((p) => (
          <div
            key={p.label}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: p.color,
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {p.label}
            </span>
          </div>
        ))}
      </div>

      {/* Patient info */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "10px 16px",
          fontSize: 13,
          color: "var(--text-secondary)",
          marginBottom: 16,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Demo Profile · Type 1 · {DEMO_ENTRIES.length} doses/day · TDD:{" "}
        {tdd}U
      </div>

      {/* Heatmap dose rows */}
      <div style={CARD_STYLE}>
        <h3
          style={{
            ...HEADING_FONT,
            fontSize: 18,
            margin: "0 0 16px 0",
          }}
        >
          Insulin Stacking Report
        </h3>
        {entryCurves.map(({ entry, curve }) => (
          <IOBHeatmapRow
            key={entry.id}
            label={`${entry.time} ${entry.pharmacology.name} ${entry.dose}U`}
            values={curve.map((pt) => pt.iob)}
            maxIOB={maxIOB}
            totalMinutes={terrain.points.length * 5}
          />
        ))}
      </div>

      {/* IOB Density Bar */}
      <div style={CARD_STYLE}>
        <h4
          style={{
            ...HEADING_FONT,
            fontSize: 15,
            margin: "0 0 12px 0",
          }}
        >
          IOB Density
        </h4>
        <IOBDensityBar points={terrain.points.map(p => ({ minute: p.minute, pressure: p.pressure }))} totalMinutes={terrain.points.length * 5} />
      </div>

      {/* Basal Evaluation Gauge */}
      <div style={CARD_STYLE}>
        <h4
          style={{
            ...HEADING_FONT,
            fontSize: 15,
            margin: "0 0 12px 0",
          }}
        >
          Basal Evaluation
        </h4>
        <BasalEvalGauge score={basalEval.score} observations={basalEval.observations} />
      </div>

      {/* Page 1 footer */}
      <p style={FOOTER_STYLE}>{FOOTER_TEXT}</p>

      <hr
        style={{
          border: "none",
          borderTop: "2px dashed var(--border)",
          margin: "32px 0",
        }}
      />

      {/* ================================================================ */}
      {/* PAGE 2 — Dose & Stacking Highlights                              */}
      {/* ================================================================ */}

      <h2
        style={{
          ...HEADING_FONT,
          fontSize: 22,
          margin: "0 0 16px 0",
        }}
      >
        Dose &amp; Stacking Highlights
      </h2>

      {/* Dose/Event data table */}
      <div style={{ ...CARD_STYLE, padding: 0, overflow: "hidden" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <thead>
            <tr
              style={{
                background: "var(--bg-primary)",
                color: "var(--text-secondary)",
                textAlign: "left",
              }}
            >
              <th style={{ padding: "10px 14px" }}>Time</th>
              <th style={{ padding: "10px 14px" }}>Insulin</th>
              <th style={{ padding: "10px 14px" }}>Dose</th>
              <th style={{ padding: "10px 14px" }}>Type</th>
              <th style={{ padding: "10px 14px" }}>Meal</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ENTRIES.map((entry, i) => (
              <tr
                key={entry.id}
                style={{
                  background:
                    i % 2 === 0 ? "var(--bg-card)" : "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
              >
                <td style={{ padding: "10px 14px" }}>{entry.time}</td>
                <td style={{ padding: "10px 14px" }}>
                  {entry.insulinName}
                </td>
                <td style={{ padding: "10px 14px" }}>{entry.dose}U</td>
                <td style={{ padding: "10px 14px", textTransform: "capitalize" }}>
                  {entry.type}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {entry.mealType ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dose Observations — positive */}
      <div
        style={{
          ...CARD_STYLE,
          borderLeft: "4px solid #4ade80",
        }}
      >
        <h4
          style={{
            ...HEADING_FONT,
            fontSize: 15,
            margin: "0 0 10px 0",
          }}
        >
          Dose Observations
        </h4>
        {positiveObs.length > 0 ? (
          positiveObs.map((obs: any, i: number) => (
            <p
              key={i}
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                margin: "6px 0",
              }}
            >
              ✓ {obs.message}
            </p>
          ))
        ) : (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            No positive observations generated.
          </p>
        )}
      </div>

      {/* Timing Considerations — warning */}
      <div
        style={{
          ...CARD_STYLE,
          borderLeft: "4px solid #facc15",
        }}
      >
        <h4
          style={{
            ...HEADING_FONT,
            fontSize: 15,
            margin: "0 0 10px 0",
          }}
        >
          Timing Considerations
        </h4>
        {warningObs.length > 0 ? (
          warningObs.map((obs: any, i: number) => (
            <p
              key={i}
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                margin: "6px 0",
              }}
            >
              ⚠ {obs.message}
            </p>
          ))
        ) : (
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            No timing considerations at this time.
          </p>
        )}
      </div>

      {/* Comments — alert */}
      <div
        style={{
          ...CARD_STYLE,
          borderLeft: `4px solid ${alertObs.length > 0 ? "#ef4444" : "var(--border)"}`,
        }}
      >
        <h4
          style={{
            ...HEADING_FONT,
            fontSize: 15,
            margin: "0 0 10px 0",
          }}
        >
          Comments
        </h4>
        {alertObs.map((obs: any, i: number) => (
          <p
            key={i}
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              margin: "6px 0",
            }}
          >
            ⚑ {obs.message}
          </p>
        ))}
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            margin: "6px 0",
          }}
        >
          At current TDD of {tdd}U, basal represents {basalPct}% of TDD.
        </p>
      </div>

      {/* 60-Second Insight */}
      <div style={CARD_STYLE}>
        <h4
          style={{
            ...HEADING_FONT,
            fontSize: 15,
            margin: "0 0 12px 0",
          }}
        >
          60-Second Insight
        </h4>
        <SixtySecondInsight view="clinical" content={insight} pressureClass={terrain.worstPressure} />
      </div>

      {/* Page 2 footer */}
      <p style={FOOTER_STYLE}>{FOOTER_TEXT}</p>

      <hr
        style={{
          border: "none",
          borderTop: "2px dashed var(--border)",
          margin: "32px 0",
        }}
      />

      {/* ================================================================ */}
      {/* PAGE 3 — Clinical Trends (placeholder)                           */}
      {/* ================================================================ */}

      <h2
        style={{
          ...HEADING_FONT,
          fontSize: 22,
          margin: "0 0 4px 0",
        }}
      >
        Clinical Trends &amp; Abnormalities
      </h2>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          margin: "0 0 20px 0",
        }}
      >
        Clinical tier — 30-day rolling analysis
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {[
          "Average TDD Trend",
          "Basal:Bolus Ratio",
          "Hypo Frequency",
          "Time in Range",
        ].map((title) => (
          <div
            key={title}
            style={{
              ...CARD_STYLE,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 120,
              marginBottom: 0,
            }}
          >
            <h4
              style={{
                ...HEADING_FONT,
                fontSize: 14,
                margin: "0 0 8px 0",
              }}
            >
              {title}
            </h4>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              Coming soon
            </span>
          </div>
        ))}
      </div>

      <CGMVerificationBanner />

      <div
        style={{
          ...CARD_STYLE,
          background: "transparent",
          border: "1px dashed var(--border)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            margin: 0,
          }}
        >
          Trend analysis requires 7+ days of logged data. Connect Nightscout
          for automatic import.
        </p>
      </div>

      {/* Page 3 footer */}
      <p style={FOOTER_STYLE}>{FOOTER_TEXT}</p>
    </div>
  );
}
