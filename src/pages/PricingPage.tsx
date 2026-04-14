/**
 * GluMira™ V7 — PricingPage
 * Rule 28: 30-day trial, always. Rule 16: free minimum is real, not trap.
 * Free tier is the priority tier — funded by Pro. Honest language, no dark patterns.
 * No names, no locations, no vendors (R26/R40/R51).
 */

import { useNavigate } from "react-router-dom";
import MarketingLayout from "@/layouts/MarketingLayout";
import { BRAND, FONTS } from "@/lib/brand";

type Feature = { label: string; free: boolean; pro: boolean; note?: string };

const FEATURES: Feature[] = [
  { label: "IOB Hunter stacking graph",                free: true,  pro: true },
  { label: "Basal timing suggestions (no dose volumes)", free: true,  pro: true },
  { label: "60-second insight panel",                  free: true,  pro: true },
  { label: "13 cited insulin profiles",                free: true,  pro: true },
  { label: "Educational modules + FAQ",                free: true,  pro: true },
  { label: "Multi-scenario what-if comparison",        free: false, pro: true },
  { label: "Save and revisit scenarios",               free: false, pro: true },
  { label: "PDF export for clinic visits",             free: false, pro: true },
  { label: "CGM overlay (when available)",             free: false, pro: true },
  { label: "Priority support",                         free: false, pro: true },
];

function Tick({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        width: 18,
        height: 18,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        background: on ? "rgba(46,158,90,0.18)" : "rgba(255,255,255,0.05)",
        color: on ? "#4ADE80" : "rgba(255,255,255,0.35)",
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {on ? "✓" : "—"}
    </span>
  );
}

type CardProps = {
  name: string;
  price: string;
  priceSub: string;
  accent: string;
  cta: string;
  onCta: () => void;
  highlight?: boolean;
  blurb: string;
};

function TierCard({ name, price, priceSub, accent, cta, onCta, highlight, blurb }: CardProps) {
  return (
    <div
      style={{
        flex: "1 1 320px",
        maxWidth: 460,
        padding: "28px 24px 24px",
        borderRadius: 18,
        background: highlight
          ? "linear-gradient(155deg, rgba(42,181,193,0.08) 0%, rgba(13,27,62,0.5) 100%)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${highlight ? `${accent}55` : "rgba(255,255,255,0.08)"}`,
        boxShadow: highlight ? `0 8px 36px ${accent}22` : "none",
        display: "flex",
        flexDirection: "column",
        minHeight: 420,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: FONTS.body,
          fontSize: 12,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: accent,
          fontWeight: 600,
        }}
      >
        {name}
      </p>
      <p
        style={{
          margin: "8px 0 2px",
          fontFamily: FONTS.heading,
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: BRAND.white,
          lineHeight: 1.05,
        }}
      >
        {price}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        {priceSub}
      </p>

      <p
        style={{
          margin: "18px 0 18px",
          fontSize: 14,
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.78)",
          maxWidth: 380,
        }}
      >
        {blurb}
      </p>

      <button
        type="button"
        onClick={onCta}
        style={{
          minHeight: 48,
          padding: "14px 22px",
          borderRadius: 10,
          border: `1px solid ${accent}`,
          background: accent,
          color: BRAND.navyDeep,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: FONTS.body,
          cursor: "pointer",
          letterSpacing: "0.01em",
          marginBottom: 18,
        }}
      >
        {cta}
      </button>
    </div>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <MarketingLayout>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "56px 20px 32px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            margin: 0,
          }}
        >
          Pricing
        </p>
        <h1
          style={{
            margin: "10px 0 12px",
            fontFamily: FONTS.heading,
            fontSize: "clamp(32px, 7vw, 54px)",
            fontWeight: 700,
            color: BRAND.white,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          Free is the priority tier.
        </h1>
        <p
          style={{
            maxWidth: 560,
            margin: "0 auto",
            fontSize: "clamp(15px, 3vw, 17px)",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          Pro funds Free — not the other way around. If you can afford Pro, you
          are subsidising a parent who cannot. That is the deal.
        </p>
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <TierCard
          name="Free"
          price="$0"
          priceSub="Forever. No card required."
          accent={BRAND.teal}
          cta="Browse as guest"
          onCta={() => navigate("/demo")}
          blurb="IOB Hunter stacking graph, basal timing suggestions, cited insulin profiles, education. Enough to understand what is happening tonight."
        />
        <TierCard
          name="Pro"
          price="30 days free"
          priceSub="Then billed monthly. Cancel anytime."
          accent={BRAND.amber}
          cta="Start 30-day trial"
          onCta={() => navigate("/auth?mode=signup")}
          highlight
          blurb="Everything in Free, plus save, compare, and export. Your subscription keeps the Free tier running for people who cannot pay."
        />
      </div>

      <div
        style={{
          maxWidth: 860,
          margin: "56px auto 0",
          padding: "0 20px",
        }}
      >
        <h2
          style={{
            fontFamily: FONTS.heading,
            fontSize: "clamp(22px, 4.5vw, 30px)",
            fontWeight: 700,
            color: BRAND.white,
            letterSpacing: "-0.01em",
            textAlign: "center",
            margin: "0 0 24px",
          }}
        >
          What is in each tier
        </h2>

        <div
          role="table"
          style={{
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            role="row"
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 0.7fr 0.7fr",
              padding: "14px 18px",
              background: "rgba(255,255,255,0.05)",
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              fontWeight: 600,
            }}
          >
            <span>Feature</span>
            <span style={{ textAlign: "center" }}>Free</span>
            <span style={{ textAlign: "center" }}>Pro</span>
          </div>
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              role="row"
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 0.7fr 0.7fr",
                padding: "14px 18px",
                borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                fontSize: 14,
                alignItems: "center",
                color: "rgba(255,255,255,0.82)",
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
              }}
            >
              <span>{f.label}</span>
              <span style={{ textAlign: "center" }}><Tick on={f.free} /></span>
              <span style={{ textAlign: "center" }}><Tick on={f.pro} /></span>
            </div>
          ))}
        </div>

        <p
          style={{
            marginTop: 28,
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            lineHeight: 1.7,
          }}
        >
          Every analysis surface carries timing guidance only — never dose
          volumes. Educational platform, not a medical device.
        </p>
      </div>
    </MarketingLayout>
  );
}
