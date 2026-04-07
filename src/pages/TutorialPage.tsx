/**
 * GluMira™ V7 — Tutorial Page
 * Public tutorial at /tutorial — no auth required.
 * Scandinavian Minimalist: #f8f9fa bg, #1a2a5e navy, #2ab5c1 teal, DM Sans.
 */

import { Link } from "react-router-dom";

const BG = "#f8f9fa";
const NAVY = "#1a2a5e";
const TEAL = "#2ab5c1";
const MUTED = "#718096";
const BORDER = "#e2e8f0";

const font = "'DM Sans', system-ui, sans-serif";

interface Section {
  id: string;
  title: string;
  body: React.ReactNode;
}

const MODULES = [
  { name: "Pregnancy",       when: "When managing gestational diabetes or T1D during pregnancy — trimester-adjusted targets." },
  { name: "Paediatric",      when: "Age-adjusted guidance for infants, toddlers, children, and teens." },
  { name: "School Care Plan", when: "Generate a printable care plan for teachers and school nurses." },
  { name: "Menstrual Cycle", when: "Track how hormonal cycles affect insulin sensitivity and glucose patterns." },
  { name: "ADHD",            when: "Coexisting ADHD — routines, reminders, and executive function support." },
  { name: "Thyroid",         when: "Hyper/hypothyroid interactions with insulin sensitivity." },
  { name: "Ramadan",         when: "Safer fasting during Ramadan — suhoor, iftar, and insulin timing." },
  { name: "Kosher",          when: "Kosher dietary considerations alongside carb counting." },
  { name: "Halal",           when: "Halal dietary considerations alongside carb counting." },
  { name: "Bernstein",       when: "Low-carb approach to tight glucose control (Dr. Bernstein's method)." },
  { name: "Sick Day",        when: "Illness management — stress hormones, ketones, hydration." },
];

const SECTIONS: Section[] = [
  {
    id: "getting-started",
    title: "1. Getting Started",
    body: (
      <>
        <p>
          Create your account, then set up your profile with your insulin regimen, glucose targets, and
          diagnosis details.
        </p>
        <ul>
          <li><strong>Sign up</strong> at <Link to="/register" style={{ color: TEAL }}>/register</Link> (email + password)</li>
          <li><strong>Complete onboarding</strong> — tell GluMira™ about your regimen and targets</li>
        </ul>
      </>
    ),
  },
  {
    id: "dashboard",
    title: "2. Understanding Your Dashboard",
    body: (
      <>
        <p>The dashboard shows everything important at a glance:</p>
        <ul>
          <li><strong>Latest Glucose</strong> — most recent reading from Nightscout or manual entry</li>
          <li><strong>Active IOB</strong> — insulin still working in the body, with a pressure label (Light / Moderate / Strong / Overlap)</li>
          <li><strong>Today's Doses</strong> — total doses logged since midnight</li>
          <li><strong>Glucose Trend Chart</strong> — 24-hour glucose curve with target range band</li>
          <li><strong>IOB Curve</strong> — how insulin activity rises and falls over 24 hours</li>
          <li><strong>Regimen Summary</strong> — your current basal and bolus schedule</li>
        </ul>
        <p style={{ color: MUTED, fontSize: 13 }}>
          Each widget is educational — GluMira™ shows you <em>what insulin is doing</em>, not what to do next.
        </p>
      </>
    ),
  },
  {
    id: "logging",
    title: "3. Logging Insulin",
    body: (
      <>
        <p>
          Enter doses from the <Link to="/insulin" style={{ color: TEAL }}>Insulin Log</Link> page. Select the
          insulin type, dose, and time.
        </p>
        <div
          style={{
            background: "rgba(42,181,193,0.06)",
            border: `1px solid ${TEAL}33`,
            borderRadius: 10,
            padding: "14px 18px",
            margin: "14px 0",
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: NAVY }}>
            Why 0.25U increments matter
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: MUTED }}>
            For children and insulin-sensitive adults, a quarter unit can change glucose by 2 mmol/L or more.
            GluMira™ supports decimal inputs so you can model the doses you actually give — including half-unit
            pens, syringes with half markings, and pumps that deliver 0.05U increments.
          </p>
        </div>
        <ul>
          <li>Tap <strong>+ Add Dose</strong> and choose your insulin</li>
          <li>Enter the dose in 0.25U (or finer) increments</li>
          <li>Set the time — defaults to now, editable</li>
          <li>Save — the IOB curve updates immediately</li>
        </ul>
      </>
    ),
  },
  {
    id: "iob-graph",
    title: "4. Reading the IOB Graph",
    body: (
      <>
        <p>The IOB Hunter™ curve shows three important things:</p>
        <ul>
          <li><strong>Rising curve</strong> — insulin is getting stronger, approaching its peak activity</li>
          <li><strong>Peak</strong> — maximum glucose-lowering effect (for rapid insulins, around 60–90 minutes)</li>
          <li><strong>Falling curve</strong> — insulin is wearing off, but never quite to zero</li>
        </ul>
        <p>
          <strong>Danger windows</strong> appear when multiple doses overlap. Look for the amber
          (<em>Moderate</em>) and red (<em>Strong / Overlap</em>) zones — these are moments when stacking can
          push glucose too low.
        </p>
        <p>
          <strong>The quiet tail</strong> is the long, slow decay after the peak. Even when you feel the dose
          is "done", a small amount of insulin is still working — that's why injecting too soon after a previous
          dose can cause unexpected lows.
        </p>
      </>
    ),
  },
  {
    id: "what-if",
    title: "5. Using What-If Scenarios",
    body: (
      <>
        <p>
          What-if scenarios are a learning tool. Every parameter on the IOB curve — dose, time, insulin type —
          is editable. Change something, and watch the curve redraw in real time.
        </p>
        <ul>
          <li><strong>"What if I gave 0.5U more?"</strong> — see how the peak shifts</li>
          <li><strong>"What if I injected 30 minutes earlier?"</strong> — see how the timing changes overlap</li>
          <li><strong>"What if I switched to a different insulin?"</strong> — compare half-lives and peaks</li>
        </ul>
        <p style={{ color: MUTED, fontSize: 13 }}>
          These scenarios are for <strong>learning</strong>, not for guessing your next dose. Always check with
          your care team before making real changes.
        </p>
      </>
    ),
  },
  {
    id: "modules",
    title: "6. Specialist Modules",
    body: (
      <>
        <p>GluMira™ has 11 specialist modules for specific clinical and dietary contexts:</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginTop: 14 }}>
          {MODULES.map((m) => (
            <div
              key={m.name}
              style={{
                border: `1px solid ${BORDER}`,
                background: "#ffffff",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: NAVY }}>{m.name}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{m.when}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: "mira",
    title: "7. Talking to Mira",
    body: (
      <>
        <p>
          Mira is GluMira's AI education assistant. She explains diabetes concepts in plain language and can
          walk you through any of the 100 education topics.
        </p>
        <p><strong>What to ask Mira:</strong></p>
        <ul>
          <li>"What's the difference between Fiasp and NovoRapid?"</li>
          <li>"How does insulin stacking happen?"</li>
          <li>"Why does my glucose rise at dawn?"</li>
          <li>"What's the quiet tail of an IOB curve?"</li>
          <li>"How does exercise affect insulin sensitivity?"</li>
        </ul>
        <p><strong>What Mira can do:</strong></p>
        <ul>
          <li>Explain concepts in age-appropriate language (7-year-olds, teens, parents, clinicians)</li>
          <li>Point you to relevant education topics and modules</li>
          <li>Interpret patterns you're seeing in your data</li>
        </ul>
        <p><strong>What Mira cannot do:</strong></p>
        <ul>
          <li>Tell you how much insulin to take</li>
          <li>Diagnose conditions</li>
          <li>Replace your care team</li>
        </ul>
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: 10,
            padding: "12px 16px",
            margin: "16px 0",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>
            <strong>Mira educates — she never prescribes.</strong> Every answer ends with a reminder to check
            with your healthcare team before making changes.
          </p>
        </div>
      </>
    ),
  },
];

export default function TutorialPage() {
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: font, color: NAVY }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: TEAL, margin: 0 }}>
            Tutorial
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", margin: "6px 0 12px", color: NAVY }}>
            How to use GluMira&trade;
          </h1>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, margin: 0 }}>
            A walkthrough of every part of the app — from logging your first dose to understanding the IOB
            curve and talking to Mira. No account required.
          </p>
        </div>

        {/* Table of contents */}
        <nav
          aria-label="Tutorial sections"
          style={{
            background: "#ffffff",
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "18px 22px",
            marginBottom: 32,
          }}
        >
          <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>
            Contents
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  style={{ color: NAVY, fontSize: 14, textDecoration: "none", fontWeight: 500 }}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {SECTIONS.map((s) => (
            <section
              key={s.id}
              id={s.id}
              style={{
                background: "#ffffff",
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: "24px 28px",
                scrollMarginTop: 20,
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 14px", color: NAVY, letterSpacing: "-0.01em" }}>
                {s.title}
              </h2>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#4a5568",
                }}
                className="tutorial-body"
              >
                {s.body}
              </div>
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        <div
          style={{
            marginTop: 40,
            background: "#ffffff",
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "24px 28px",
            textAlign: "center",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, color: NAVY, margin: "0 0 8px" }}>
            Ready to explore?
          </h3>
          <p style={{ fontSize: 13, color: MUTED, margin: "0 0 16px" }}>
            Jump into your dashboard or sign up to get started.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/dashboard"
              style={{
                background: TEAL,
                color: NAVY,
                padding: "10px 20px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Open Dashboard
            </Link>
            <Link
              to="/register"
              style={{
                background: "transparent",
                color: NAVY,
                border: `1px solid ${BORDER}`,
                padding: "10px 20px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: 11, color: MUTED, textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
          GluMira&trade; is an educational platform and does not constitute medical advice.
          Always consult your healthcare team before making changes to your diabetes management.
        </p>
      </div>

      {/* Inline styles for body lists/paragraphs */}
      <style>{`
        .tutorial-body p { margin: 0 0 12px; }
        .tutorial-body p:last-child { margin-bottom: 0; }
        .tutorial-body ul { margin: 0 0 12px; padding-left: 22px; }
        .tutorial-body li { margin-bottom: 6px; }
        .tutorial-body strong { color: ${NAVY}; font-weight: 600; }
      `}</style>
    </div>
  );
}
