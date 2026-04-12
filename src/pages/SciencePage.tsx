/**
 * GluMira™ V7 — SciencePage
 * Rule 15: cite FDA/EMA/PMID per profile.
 * Rule 27: educational platform, not a medical device.
 * Rule 26/40/51: no names, no geography, no vendor drops in public copy.
 */

import MarketingLayout from "@/layouts/MarketingLayout";
import { BRAND, FONTS } from "@/lib/brand";

type InsulinRow = {
  name: string;
  class: string;
  onset: string;
  peak: string;
  doa: string;
  model: string;
  cite: string;
};

const INSULINS: InsulinRow[] = [
  { name: "Fiasp",       class: "Ultra-rapid", onset: "~5 min",   peak: "1.0 h",      doa: "3–5 h",     model: "Exponential",      cite: "FDA label 2017" },
  { name: "Lyumjev",     class: "Ultra-rapid", onset: "~5 min",   peak: "1.0 h",      doa: "3–5 h",     model: "Exponential",      cite: "FDA label 2020" },
  { name: "Humalog",     class: "Rapid",       onset: "10–15 m",  peak: "1.0–2.0 h",  doa: "3–5 h",     model: "Exponential",      cite: "FDA label" },
  { name: "NovoRapid",   class: "Rapid",       onset: "10–15 m",  peak: "1.0–3.0 h",  doa: "3–5 h",     model: "Exponential",      cite: "FDA label" },
  { name: "Apidra",      class: "Rapid",       onset: "10–15 m",  peak: "0.5–1.5 h",  doa: "3–5 h",     model: "Exponential",      cite: "FDA label" },
  { name: "Actrapid",    class: "Short",       onset: "30 m",     peak: "2–5 h",      doa: "6–8 h",     model: "Exponential",      cite: "EMA SmPC" },
  { name: "NPH",         class: "Intermediate", onset: "1–2 h",   peak: "4–10 h",     doa: "10–16 h",   model: "Exponential",      cite: "FDA label" },
  { name: "Levemir",     class: "Long (basal)", onset: "1–2 h",   peak: "flat",       doa: "5.7–19.9 h", model: "Albumin-bound, dose-dependent", cite: "PMID 15855574" },
  { name: "Detemir",     class: "Long (basal)", onset: "1–2 h",   peak: "flat",       doa: "5.7–19.9 h", model: "Albumin-bound, dose-dependent", cite: "PMID 15855574" },
  { name: "Lantus",      class: "Long (basal)", onset: "1–2 h",   peak: "plateau",    doa: "~24 h",     model: "Microprecipitate", cite: "FDA label + EMA SmPC" },
  { name: "Basaglar",    class: "Long (basal)", onset: "1–2 h",   peak: "plateau",    doa: "~24 h",     model: "Microprecipitate", cite: "FDA label" },
  { name: "Tresiba",     class: "Ultra-long",  onset: "1–2 h",    peak: "flat",       doa: "≥42 h",     model: "Depot-release",    cite: "FDA label + EMA SmPC" },
  { name: "Toujeo",      class: "Ultra-long",  onset: "1–2 h",    peak: "flat",       doa: "≥32 h",     model: "Depot-release",    cite: "FDA label + EMA SmPC" },
];

type Principle = { title: string; body: string };

const PRINCIPLES: Principle[] = [
  {
    title: "Cite or delete",
    body: "Every pharmacokinetic parameter comes from a label, a summary of product characteristics, or a peer-reviewed paper. No vibes, no averages of averages.",
  },
  {
    title: "Dose-dependent duration",
    body: "Albumin-bound insulins do not have one duration — they have a family of curves that change with dose. We model the family, not a midpoint.",
  },
  {
    title: "Timing, not volume",
    body: "The tool will suggest when the picture gets clearer. It will not suggest how many units to inject. Dose decisions stay with you and your clinician.",
  },
  {
    title: "Prior-day tail preserved",
    body: "A graph that starts at zero IOB lies to you. Overnight basal is still working at 06:00 — the chart shows that, always.",
  },
];

export default function SciencePage() {
  return (
    <MarketingLayout>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 20px 0" }}>
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            margin: 0,
          }}
        >
          Science
        </p>
        <h1
          style={{
            margin: "10px 0 14px",
            fontFamily: FONTS.heading,
            fontSize: "clamp(32px, 7vw, 54px)",
            fontWeight: 700,
            color: BRAND.white,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          The science of insulin,
          <br />
          <span style={{ color: BRAND.amber, textShadow: "0 0 28px rgba(245,158,11,0.3)" }}>
            made visible.
          </span>
        </h1>
        <p
          style={{
            maxWidth: 680,
            fontSize: "clamp(15px, 3vw, 17px)",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.74)",
          }}
        >
          Thirteen canonical insulins. Four decay models. Every parameter
          traceable to a public source. This is how GluMira<span style={{ fontSize: "0.7em", verticalAlign: "super" }}>™</span> draws its curves.
        </p>
      </div>

      {/* Principles */}
      <div style={{ maxWidth: 1000, margin: "32px auto 0", padding: "0 20px" }}>
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {PRINCIPLES.map((p) => (
            <div
              key={p.title}
              style={{
                padding: "20px 20px 18px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: FONTS.heading,
                  fontSize: 18,
                  fontWeight: 700,
                  color: BRAND.white,
                  letterSpacing: "-0.01em",
                }}
              >
                {p.title}
              </p>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Insulin table */}
      <div style={{ maxWidth: 1000, margin: "48px auto 0", padding: "0 20px" }}>
        <h2
          style={{
            fontFamily: FONTS.heading,
            fontSize: "clamp(22px, 4.5vw, 30px)",
            fontWeight: 700,
            color: BRAND.white,
            letterSpacing: "-0.01em",
            margin: "0 0 14px",
          }}
        >
          The 13 canonical profiles
        </h2>
        <p
          style={{
            margin: "0 0 18px",
            fontSize: 14,
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.6)",
            maxWidth: 680,
          }}
        >
          Units: onset and peak in hours. Duration of action is range-based for
          dose-dependent profiles. Citations link to public labels and PMIDs.
        </p>

        <div
          style={{
            overflowX: "auto",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 720,
              borderCollapse: "collapse",
              fontFamily: FONTS.body,
              fontSize: 13,
              color: "rgba(255,255,255,0.82)",
            }}
          >
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                {["Insulin", "Class", "Onset", "Peak", "DOA", "Model", "Cite"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.55)",
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INSULINS.map((row, i) => (
                <tr
                  key={row.name}
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                  }}
                >
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: BRAND.white }}>{row.name}</td>
                  <td style={{ padding: "12px 14px" }}>{row.class}</td>
                  <td style={{ padding: "12px 14px", fontFamily: FONTS.mono }}>{row.onset}</td>
                  <td style={{ padding: "12px 14px", fontFamily: FONTS.mono }}>{row.peak}</td>
                  <td style={{ padding: "12px 14px", fontFamily: FONTS.mono }}>{row.doa}</td>
                  <td style={{ padding: "12px 14px", color: "rgba(255,255,255,0.68)" }}>{row.model}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{row.cite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p
          style={{
            margin: "16px 0 0",
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.7,
          }}
        >
          Sources: product labels, EMA Summaries of Product Characteristics,
          and indexed pharmacokinetic studies including PMID 15855574 for the
          dose-dependent duration of albumin-bound basal insulin.
        </p>
      </div>

      {/* Origin — no names, no geography */}
      <div style={{ maxWidth: 760, margin: "56px auto 0", padding: "0 20px" }}>
        <h2
          style={{
            fontFamily: FONTS.heading,
            fontSize: "clamp(22px, 4.5vw, 30px)",
            fontWeight: 700,
            color: BRAND.white,
            letterSpacing: "-0.01em",
            margin: "0 0 14px",
          }}
        >
          Why this exists
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.78)", margin: 0 }}>
          A parent sat awake through one night, feeding a child glucose with a
          spoon every twenty minutes. There was no CGM on the arm and no
          prediction on a screen — only a glass of sugar water and a worry
          about overnight basal still working while the child slept. GluMira<span style={{ fontSize: "0.7em", verticalAlign: "super" }}>™</span> exists
          because that parent could not see what the insulin was doing. Now it
          is drawn.
        </p>
        <p
          style={{
            marginTop: 24,
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.7,
          }}
        >
          GluMira<span style={{ fontSize: "0.7em", verticalAlign: "super" }}>™</span> is an educational platform, not a medical device. No
          personal data required to browse. Decisions about insulin remain
          between you and a qualified clinician.
        </p>
      </div>
    </MarketingLayout>
  );
}
