/**
 * GluMira™ V7 — LandingPage
 * Multi-section marketing site. Hero preserved (Rule 24 + 43).
 * All analysis surfaces carry disclaimers (Rule 27).
 * No names, no locations, no vendor drops (R26/R40/R51).
 */

import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import MarketingLayout from "@/layouts/MarketingLayout";
import { BRAND, FONTS, loadBrandFonts } from "@/lib/brand";
import StackingGauge from "@/components/marketing/StackingGauge";
import RiskTimeline from "@/components/marketing/RiskTimeline";

const T = {
  navy: BRAND.navy,
  navyDeep: BRAND.navyDeep,
  teal: BRAND.teal,
  amber: BRAND.amber,
  white: BRAND.white,
  heading: FONTS.heading,
  body: FONTS.body,
  mono: FONTS.mono,
};

/* ───────────────────── Hero (centered, dense, Rule 24 + 43) ─────────────── */

function Hero() {
  const navigate = useNavigate();

  return (
    <section
      style={{
        position: "relative",
        padding: "56px 20px 72px",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 900,
          maxWidth: "140vw",
          background:
            "radial-gradient(circle at center, rgba(42,181,193,0.12) 0%, rgba(42,181,193,0) 55%)",
          filter: "blur(20px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 920, margin: "0 auto" }}>
        {/* Mira — compact, floats above wordmark */}
        <img
          src="/images/mira-hero.png"
          alt="Mira — GluMira™ AI companion"
          style={{
            width: "clamp(140px, 22vw, 220px)",
            height: "auto",
            display: "block",
            margin: "0 auto 18px",
            objectFit: "contain",
            mixBlendMode: "lighten",
            filter: "drop-shadow(0 0 48px rgba(42,181,193,0.22))",
          }}
        />

        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            margin: "0 0 14px",
          }}
        >
          Companion for life with insulin
        </p>

        <h1
          style={{
            fontFamily: T.heading,
            fontSize: "clamp(44px, 9.5vw, 104px)",
            fontWeight: 700,
            color: T.white,
            lineHeight: 0.95,
            margin: "0 0 12px",
            letterSpacing: "-0.035em",
          }}
        >
          GluMira
          <span style={{ fontSize: "0.32em", verticalAlign: "super", color: T.white }}>™</span>
        </h1>

        <p
          style={{
            fontFamily: T.heading,
            fontSize: "clamp(20px, 4.4vw, 36px)",
            fontWeight: 700,
            color: T.white,
            margin: "0 0 6px",
            lineHeight: 1.15,
            letterSpacing: "-0.015em",
          }}
        >
          The science of insulin,{" "}
          <span style={{ color: T.amber, textShadow: "0 0 28px rgba(245,158,11,0.35)" }}>
            made visible.
          </span>
        </p>

        <p
          style={{
            maxWidth: 560,
            margin: "18px auto 28px",
            fontSize: "clamp(14px, 2.6vw, 16px)",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          A companion for life with insulin — Type&nbsp;1, Type&nbsp;2, LADA, MODY and
          gestational. See what your insulin is still doing, and when the picture gets
          clearer.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <button type="button" onClick={() => navigate("/demo")} style={ctaStyle(T.teal, T.navyDeep)}>
            Browse as guest
          </button>
          <button
            type="button"
            onClick={() => navigate("/auth?mode=signup")}
            style={ctaStyle(T.amber, T.navyDeep)}
          >
            Start 30-day free trial
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/auth")}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: "rgba(255,255,255,0.55)",
            fontSize: 13,
            fontFamily: T.body,
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Already have an account? Log in
        </button>

        {/* Trust strip */}
        <div
          style={{
            marginTop: 34,
            display: "flex",
            gap: 18,
            justifyContent: "center",
            flexWrap: "wrap",
            fontFamily: T.body,
            fontSize: 12,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.02em",
          }}
        >
          <span>✓ Free forever</span>
          <span style={{ opacity: 0.35 }}>•</span>
          <span>✓ No card required</span>
          <span style={{ opacity: 0.35 }}>•</span>
          <span>✓ 13 cited insulin profiles</span>
          <span style={{ opacity: 0.35 }}>•</span>
          <span>✓ Educational, not a medical device</span>
        </div>
      </div>
    </section>
  );
}

function ctaStyle(bg: string, fg: string): React.CSSProperties {
  return {
    minHeight: 48,
    padding: "13px 28px",
    borderRadius: 8,
    border: `1px solid ${bg}CC`,
    background: bg,
    color: fg,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: T.body,
    cursor: "pointer",
    letterSpacing: "0.02em",
    boxShadow: `0 4px 16px ${bg}44`,
    transition: "transform 0.15s",
  };
}

/* ───────────────────── Section shell ────────────────────────────────────── */

function Section({ eyebrow, title, kicker, children }: {
  eyebrow?: string;
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ padding: "56px 20px 8px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {eyebrow ? (
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          style={{
            margin: "10px 0 0",
            fontFamily: T.heading,
            fontSize: "clamp(26px, 5.5vw, 40px)",
            fontWeight: 700,
            color: T.white,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          {title}
        </h2>
        {kicker ? (
          <p
            style={{
              margin: "12px 0 0",
              maxWidth: 620,
              fontSize: "clamp(15px, 3vw, 17px)",
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.72)",
            }}
          >
            {kicker}
          </p>
        ) : null}
        <div style={{ marginTop: 28 }}>{children}</div>
      </div>
    </section>
  );
}

/* ───────────────────── Problem (R26/R40 — no names, no geography) ──────── */

function Problem() {
  return (
    <Section
      eyebrow="The night that named us"
      title="A parent, a child, a glass of sugar water."
      kicker="One long night watching a basal dose keep working hours after bedtime. No CGM on the arm, no projection on a screen, no way to see what the insulin was still doing. GluMira™ exists because insulin that cannot be seen cannot be answered."
    >
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.7,
          margin: 0,
          maxWidth: 620,
        }}
      >
        Free is the priority tier. The parent who most needs GluMira<span style={{ fontSize: "0.7em", verticalAlign: "super" }}>™</span> cannot
        afford a subscription. Pro funds Free — that is the whole model.
      </p>
    </Section>
  );
}

/* ───────────────────── IOB Hunter preview (gauge + timeline) ──────────── */

function IOBPreview() {
  return (
    <Section
      eyebrow="IOB Hunter"
      title="See the insulin that is still working."
      kicker="Stacking pressure, risk windows, timing suggestions — drawn from cited pharmacokinetics. Timing only. Never dose volumes."
    >
      <div
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "minmax(0, 1fr)",
          alignItems: "start",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "grid",
            gap: 20,
            gridTemplateColumns: "minmax(180px, 260px) 1fr",
            alignItems: "center",
          }}
          className="glm-iob-preview-card"
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <StackingGauge score={62} caption="Right now — sample data" />
          </div>
          <div style={{ minWidth: 0 }}>
            <RiskTimeline
              segments={[
                { from: "14:30", to: "17:45", level: "watch", note: "stacking" },
                { from: "17:45", to: "21:00", level: "safe", note: "clear" },
                { from: "21:00", to: "23:30", level: "watch", note: "basal peak" },
              ]}
              nextSafeLabel="Clearer picture expected after 17:45"
            />
            <p
              style={{
                margin: "14px 0 0",
                fontSize: 13,
                color: "rgba(255,255,255,0.62)",
                lineHeight: 1.7,
              }}
            >
              This is a sample curve, rendered with the same engine that powers
              the live tool. Every parameter links back to a public source.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 680px) {
          .glm-iob-preview-card { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          to="/demo"
          style={{
            minHeight: 48,
            display: "inline-flex",
            alignItems: "center",
            padding: "12px 22px",
            borderRadius: 10,
            background: T.teal,
            color: T.navyDeep,
            fontFamily: T.body,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Try the interactive demo →
        </Link>
        <Link
          to="/science"
          style={{
            minHeight: 48,
            display: "inline-flex",
            alignItems: "center",
            padding: "12px 22px",
            borderRadius: 10,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            color: T.white,
            fontFamily: T.body,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Read the science
        </Link>
      </div>

      <p
        style={{
          margin: "16px 0 0",
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        GluMira<span style={{ fontSize: "0.7em", verticalAlign: "super" }}>™</span> is an educational platform, not a medical device.
      </p>
    </Section>
  );
}

/* ───────────────────── How it works ─────────────────────────────────────── */

const HOW: Array<{ title: string; body: string }> = [
  {
    title: "Cited pharmacokinetics",
    body: "Thirteen canonical insulins. Four decay models — exponential, microprecipitate, albumin-bound, depot-release. Every parameter links back to a public label or PMID.",
  },
  {
    title: "Stacking score",
    body: "A single 0–100 number for right now. Green below 30, amber by 55, red above 75. Designed to answer one question in under a second.",
  },
  {
    title: "Timing suggestions",
    body: "When the picture gets clearer — never how many units to inject. The tool draws the curve. The dose stays with you and your clinician.",
  },
];

function HowItWorks() {
  return (
    <Section
      eyebrow="How it works"
      title="Three pieces. Nothing more."
    >
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {HOW.map((h) => (
          <div
            key={h.title}
            style={{
              padding: "22px 20px 20px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              minHeight: 160,
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: T.heading,
                fontSize: 19,
                fontWeight: 700,
                color: T.white,
                letterSpacing: "-0.01em",
              }}
            >
              {h.title}
            </p>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14,
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {h.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────── Pricing strip ────────────────────────────────────── */

function PricingStrip() {
  return (
    <Section eyebrow="Pricing" title="Free is forever. Pro is 30 days to decide.">
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <div
          style={{
            padding: "24px 22px",
            borderRadius: 14,
            background: "rgba(42,181,193,0.06)",
            border: `1px solid ${T.teal}44`,
          }}
        >
          <p style={{ margin: 0, fontFamily: T.body, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: T.teal, fontWeight: 600 }}>Free</p>
          <p style={{ margin: "6px 0 2px", fontFamily: T.heading, fontSize: 30, fontWeight: 700, color: T.white, letterSpacing: "-0.02em" }}>$0 · forever</p>
          <p style={{ margin: "8px 0 14px", fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
            Stacking graph, basal timing suggestions, 13 cited insulin profiles.
            No card required.
          </p>
          <Link to="/pricing" style={{ color: T.teal, fontFamily: T.body, fontSize: 13, textDecoration: "underline", textUnderlineOffset: 3 }}>
            See the full breakdown →
          </Link>
        </div>

        <div
          style={{
            padding: "24px 22px",
            borderRadius: 14,
            background: "rgba(245,158,11,0.06)",
            border: `1px solid ${T.amber}44`,
          }}
        >
          <p style={{ margin: 0, fontFamily: T.body, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: T.amber, fontWeight: 600 }}>Pro</p>
          <p style={{ margin: "6px 0 2px", fontFamily: T.heading, fontSize: 30, fontWeight: 700, color: T.white, letterSpacing: "-0.02em" }}>30 days free</p>
          <p style={{ margin: "8px 0 14px", fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
            Save scenarios, compare what-ifs, export PDF reports. Your trial
            funds the free tier.
          </p>
          <Link to="/pricing" style={{ color: T.amber, fontFamily: T.body, fontSize: 13, textDecoration: "underline", textUnderlineOffset: 3 }}>
            Start your 30 days →
          </Link>
        </div>
      </div>
    </Section>
  );
}

/* ───────────────────── Audience ─────────────────────────────────────────── */

const AUDIENCE = ["Type 1", "Type 2", "LADA", "MODY", "Gestational", "Paediatric", "Caregivers", "Clinicians"];

function Audience() {
  return (
    <Section eyebrow="For whom" title="Everyone whose day is shaped by insulin.">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {AUDIENCE.map((a) => (
          <span
            key={a}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontFamily: T.body,
              fontSize: 14,
              color: "rgba(255,255,255,0.82)",
              letterSpacing: "0.01em",
            }}
          >
            {a}
          </span>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────── FAQ ──────────────────────────────────────────────── */

const FAQ = [
  {
    q: "Is GluMira™ a medical device?",
    a: "No. GluMira™ is an educational platform. It does not diagnose, treat, or replace a clinician. It draws what published pharmacokinetics already say about insulin and lets you see it clearly.",
  },
  {
    q: "Does GluMira™ tell me how many units to inject?",
    a: "Never. Timing guidance only — when the picture is clearer, when stacking pressure eases. Dose volume decisions stay with you and a qualified clinician.",
  },
  {
    q: "What insulins are modelled?",
    a: "Thirteen canonical profiles across rapid, short, intermediate, long, and ultra-long classes. Each carries a public citation — a label, an SmPC, or a PMID.",
  },
  {
    q: "Does the free tier expire?",
    a: "No. Free is forever, no card required. Pro is a 30-day trial — the sale funds the free tier for people who cannot pay.",
  },
  {
    q: "What about privacy?",
    a: "No personal data is required to browse. The demo runs on a synthetic profile. Accounts are optional and only needed to save scenarios.",
  },
];

function FAQSection() {
  return (
    <Section eyebrow="FAQ" title="Short answers.">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {FAQ.map((f) => (
          <details
            key={f.q}
            style={{
              padding: "16px 18px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontFamily: T.body,
                fontSize: 15,
                fontWeight: 600,
                color: T.white,
                listStyle: "none",
              }}
            >
              {f.q}
            </summary>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────── Final CTA ────────────────────────────────────────── */

function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section style={{ padding: "72px 20px 40px" }}>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "32px 24px",
          borderRadius: 18,
          background: `linear-gradient(155deg, rgba(42,181,193,0.08) 0%, rgba(13,27,62,0.5) 100%)`,
          border: "1px solid rgba(42,181,193,0.24)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: T.heading,
            fontSize: "clamp(22px, 5vw, 32px)",
            fontWeight: 700,
            color: T.white,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          See what your insulin is doing — tonight.
        </p>
        <p
          style={{
            margin: "12px auto 22px",
            fontSize: 15,
            color: "rgba(255,255,255,0.72)",
            maxWidth: 520,
            lineHeight: 1.6,
          }}
        >
          No card. No account. One tap to the demo.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={() => navigate("/demo")} style={ctaStyle(T.teal, T.navyDeep)}>
            Browse as guest
          </button>
          <button type="button" onClick={() => navigate("/auth?mode=signup")} style={ctaStyle(T.amber, T.navyDeep)}>
            Start 30-day trial
          </button>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── Page ─────────────────────────────────────────────── */

export default function LandingPage() {
  useEffect(() => {
    loadBrandFonts();
  }, []);

  return (
    <MarketingLayout showNav={true}>
      <Hero />
      <Problem />
      <IOBPreview />
      <HowItWorks />
      <PricingStrip />
      <Audience />
      <FAQSection />
      <FinalCTA />
    </MarketingLayout>
  );
}
