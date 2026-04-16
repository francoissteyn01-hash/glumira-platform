/**
 * GluMira™ V7 — Insulin Curve Glossary Page
 *
 * Educator-facing reference showing each insulin's pharmacokinetic profile:
 * curve shape, onset, peak, duration, and primary citations.
 *
 * No smoothing layer. No visual warping. What the engine calculates
 * is what the user sees — the science of insulin, made visible.
 *
 * Route: /glossary/curves
 * Accessible: all tiers (ungated education)
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useState } from "react";
import {
  INSULIN_CURVE_GLOSSARY,
  GLOSSARY_DISPLAY_ORDER,
  CURVE_SHAPE_LABELS,
  type GlossaryEntry,
} from "@/lib/insulin-curve-glossary";

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const NAVY   = "#1A2A5E";
const TEAL   = "#2AB5C1";
const AMBER  = "#F59E0B";
const BG     = "#F8F9FA";
const WHITE  = "#FFFFFF";
const MUTED  = "#6B7280";
const BORDER = "#E5E7EB";

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function formatMinutes(min: number | null): string {
  if (min === null) return "—";
  if (min < 60) return `${min} min`;
  const h = min / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

/* ─── Subcomponents ─────────────────────────────────────────────────────── */

function CurveShapeBadge({ shape, colour }: { shape: GlossaryEntry["curveShape"]; colour: string }) {
  const label = CURVE_SHAPE_LABELS[shape];
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      background: `${colour}18`,
      color: colour,
      border: `1px solid ${colour}40`,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {label}
    </span>
  );
}

function PKRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 13, color: MUTED, fontFamily: "'DM Sans', system-ui, sans-serif" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: NAVY, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
    </div>
  );
}

function InsulinSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 24,
    }}>
      {GLOSSARY_DISPLAY_ORDER.map((key) => {
        const entry = INSULIN_CURVE_GLOSSARY[key];
        const active = selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: active ? `2px solid ${entry.colour}` : `1px solid ${BORDER}`,
              background: active ? `${entry.colour}12` : WHITE,
              cursor: "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              color: active ? entry.colour : NAVY,
              transition: "all 0.15s",
              textAlign: "left",
              minWidth: 120,
            }}
          >
            <div style={{ fontWeight: 700 }}>{entry.brandName}</div>
            <div style={{ fontSize: 11, color: active ? entry.colour : MUTED, marginTop: 2 }}>
              {entry.genericName.split(" ").slice(0, 2).join(" ")}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ActivityShapeVisual({ entry }: { entry: GlossaryEntry }) {
  // Simple SVG representation of curve shape — descriptive, not engine data
  const { curveShape, colour, pk } = entry;
  const W = 280, H = 80;

  const path =
    curveShape === "peakless_plateau"
      ? `M 20,${H} C 40,${H} 50,15 70,12 L 200,12 C 220,12 240,${H} 260,${H}`
      : curveShape === "bell"
      ? `M 20,${H} C 40,${H} 60,10 130,10 C 200,10 240,${H} 260,${H}`
      : curveShape === "broad_low_peak"
      ? `M 20,${H} C 50,${H} 70,25 130,22 L 160,22 C 210,22 240,${H} 260,${H}`
      : /* rapid_triangle */ `M 20,${H} C 30,${H} 55,8 75,8 C 95,8 140,${H} 260,${H}`;

  // Onset and (if applicable) peak markers
  const onsetX = 20 + (pk.onsetMinutes / pk.durationMinutes) * (W - 40);
  const peakX = pk.peakStartMinutes != null
    ? 20 + (((pk.peakStartMinutes + (pk.peakEndMinutes ?? pk.peakStartMinutes)) / 2) / pk.durationMinutes) * (W - 40)
    : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 20}`}
      style={{ width: "100%", maxWidth: W, display: "block" }}
      aria-label={`Activity curve shape for ${entry.brandName}: ${CURVE_SHAPE_LABELS[curveShape]}`}
    >
      {/* Baseline */}
      <line x1={20} y1={H} x2={W - 20} y2={H} stroke={BORDER} strokeWidth={1} />

      {/* Filled area under curve */}
      <path
        d={`${path} Z`}
        fill={`${colour}22`}
        stroke="none"
      />

      {/* Curve line */}
      <path
        d={path}
        fill="none"
        stroke={colour}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Onset marker */}
      <line x1={onsetX} y1={10} x2={onsetX} y2={H} stroke={colour} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
      <text x={onsetX} y={H + 14} fontSize={9} textAnchor="middle" fill={MUTED} fontFamily="DM Sans, system-ui">onset</text>

      {/* Peak marker */}
      {peakX != null && (
        <>
          <line x1={peakX} y1={6} x2={peakX} y2={H} stroke={colour} strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
          <text x={peakX} y={H + 14} fontSize={9} textAnchor="middle" fill={colour} fontFamily="DM Sans, system-ui">peak</text>
        </>
      )}
    </svg>
  );
}

function EntryDetail({ entry }: { entry: GlossaryEntry }) {
  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>

      {/* Curve visualisation */}
      <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20, gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
              {entry.brandName}
              <span style={{ fontSize: 14, fontWeight: 400, color: MUTED, marginLeft: 8, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                {entry.genericName}
              </span>
            </h2>
            <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <CurveShapeBadge shape={entry.curveShape} colour={entry.colour} />
              <span style={{ fontSize: 11, color: MUTED, fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: "22px" }}>
                {entry.manufacturer} · {entry.category}
              </span>
            </div>
          </div>
        </div>

        <ActivityShapeVisual entry={entry} />
        <p style={{ fontSize: 11, color: MUTED, margin: "8px 0 0", fontStyle: "italic", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Illustrative curve shape only — for visual reference. IOB calculations use the engine's {entry.engineDecayModel} model.
        </p>
      </div>

      {/* Profile description */}
      <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: "0 0 12px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Activity Profile
        </h3>
        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {entry.profileDescription}
        </p>
        {entry.pk.durationNote && (
          <p style={{ fontSize: 12, color: MUTED, marginTop: 12, lineHeight: 1.6, fontStyle: "italic", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {entry.pk.durationNote}
          </p>
        )}
      </div>

      {/* PK parameters */}
      <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: "0 0 12px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Key Parameters
        </h3>
        <PKRow label="Onset" value={formatMinutes(entry.pk.onsetMinutes)} />
        <PKRow
          label="Peak start"
          value={entry.pk.peakStartMinutes != null ? formatMinutes(entry.pk.peakStartMinutes) : "None (peakless)"}
        />
        <PKRow
          label="Peak end"
          value={entry.pk.peakEndMinutes != null ? formatMinutes(entry.pk.peakEndMinutes) : "—"}
        />
        <PKRow label="Duration (default)" value={formatMinutes(entry.pk.durationMinutes)} />
        <PKRow label="Is peakless" value={entry.pk.ispeakless ? "Yes" : "No"} />
      </div>

      {/* Engine model */}
      <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: "0 0 12px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          GluMira™ Engine Model
        </h3>
        <div style={{
          background: "#F0F9FF",
          border: "1px solid #BAE6FD",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0369A1", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {entry.engineDecayModel}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {entry.engineCalculationNote}
        </p>
        {entry.plank2005Note && (
          <p style={{ fontSize: 12, color: AMBER, marginTop: 12, lineHeight: 1.5, fontFamily: "'DM Sans', system-ui, sans-serif", borderLeft: `3px solid ${AMBER}`, paddingLeft: 10 }}>
            {entry.plank2005Note}
          </p>
        )}
      </div>

      {/* Clinical context */}
      <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: "0 0 12px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Clinical Context
        </h3>
        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {entry.clinicalContext}
        </p>
      </div>

      {/* Source citation */}
      <div style={{ background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: "0 0 12px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Primary Source
        </h3>
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: "0 0 8px", fontFamily: "'JetBrains Mono', monospace", wordBreak: "break-word" }}>
          {entry.pkSource}
        </p>
        {entry.pkSourceUrl && (
          <a
            href={entry.pkSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 13, color: TEAL, textDecoration: "none", fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            View on PubMed / FDA ↗
          </a>
        )}
      </div>

    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function CurveGlossaryPage() {
  const [selected, setSelected] = useState<string>("Tresiba");
  const entry = INSULIN_CURVE_GLOSSARY[selected];

  return (
    <main style={{
      minHeight: "100vh",
      background: BG,
      padding: "24px 16px 48px",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: "clamp(22px, 4vw, 30px)",
            fontWeight: 700,
            color: NAVY,
            margin: "0 0 8px",
            fontFamily: "'Playfair Display', Georgia, serif",
          }}>
            Insulin Curve Glossary
          </h1>
          <p style={{ fontSize: 15, color: MUTED, margin: 0, lineHeight: 1.6 }}>
            Pharmacokinetic profiles with primary citations. All values sourced from FDA labels, EMA SmPCs, and peer-reviewed PK studies.
          </p>
        </div>

        {/* Selector */}
        <InsulinSelector selected={selected} onSelect={setSelected} />

        {/* Detail panel */}
        {entry && <EntryDetail entry={entry} />}

        {/* Disclaimer */}
        <div style={{
          marginTop: 32,
          background: "#FFFBEB",
          borderLeft: `4px solid ${AMBER}`,
          borderRadius: "0 8px 8px 0",
          padding: "14px 16px",
          fontSize: 13,
          color: "#92400E",
          lineHeight: 1.6,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          <strong>GluMira™ Educational Disclosure.</strong> This glossary is a pharmacokinetic reference for educators and clinicians. It is not medical advice and does not replace clinical judgement. IOB calculations in GluMira™ use validated decay models (Bateman two-compartment, albumin-bound depot, depot release) sourced from FDA/EMA labels and peer-reviewed studies — not simplified exponential approximations. GluMira™ is an educational platform, not a medical device.
        </div>

      </div>
    </main>
  );
}
