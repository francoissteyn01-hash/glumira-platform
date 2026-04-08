import { useState } from "react";
import { DISCLAIMER } from "@/lib/constants";

/* ─── GluMira™ V7 — Block 89: Launch Announcement Page ─────────────── */

const SHARE_URL = "https://glumira.ai";

const METRICS = [
  { value: "77", label: "Pages" },
  { value: "26", label: "Engines" },
  { value: "100", label: "Education Articles" },
  { value: "20", label: "Meal Regimes" },
  { value: "17", label: "Specialist Modules" },
  { value: "11", label: "Insulin Profiles" },
];

const SOCIAL_LINKS = [
  {
    name: "Twitter / X",
    color: "#000",
    icon: "𝕏",
    url: `https://twitter.com/intent/tweet?text=${encodeURIComponent("GluMira™ V7 has launched — a free insulin visibility platform for families managing T1D. The science of insulin, made visible. #GluMira #T1D https://glumira.ai")}`,
  },
  {
    name: "Facebook",
    color: "#1877F2",
    icon: "f",
    url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`,
  },
  {
    name: "LinkedIn",
    color: "#0A66C2",
    icon: "in",
    url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`,
  },
  {
    name: "WhatsApp",
    color: "#25D366",
    icon: "W",
    url: `https://wa.me/?text=${encodeURIComponent("GluMira™ V7 just launched — free insulin visibility for families managing T1D: https://glumira.ai")}`,
  },
  {
    name: "Email",
    color: "#EA4335",
    icon: "@",
    url: `mailto:?subject=${encodeURIComponent("GluMira™ V7 Launch")}&body=${encodeURIComponent("GluMira™ V7 has launched — a free insulin visibility platform for families managing Type 1 Diabetes.\n\nLearn more: https://glumira.ai")}`,
  },
];

export default function LaunchAnnouncementPage() {
  const [linkCopied, setLinkCopied] = useState(false);

  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border-light)",
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.125rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: 12,
  };

  const label: React.CSSProperties = {
    fontSize: "0.6875rem",
    fontWeight: 600,
    color: "var(--text-faint)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    marginBottom: 6,
  };

  const bodyText: React.CSSProperties = {
    color: "var(--text-secondary)",
    fontSize: "0.875rem",
    lineHeight: 1.75,
    marginBottom: 16,
  };

  const copyLink = () => {
    navigator.clipboard.writeText(SHARE_URL).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Hero Section ─────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d1b3e 0%, #162a5a 50%, #1a3568 100%)",
          padding: "clamp(48px, 8vw, 80px) clamp(16px, 4vw, 32px)",
          textAlign: "center",
        }}
      >
        <p style={{ ...label, color: "#94a3b8", marginBottom: 12 }}>Press Release — April 2026</p>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 8,
            letterSpacing: "-0.01em",
          }}
        >
          GluMira™ V7
        </h1>
        <p
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
            fontWeight: 600,
            color: "#f59e0b",
            fontStyle: "italic",
            marginBottom: 16,
          }}
        >
          The science of insulin, made visible
        </p>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", maxWidth: 540, margin: "0 auto" }}>
          Free insulin visibility platform for families managing Type 1 Diabetes
        </p>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* ── Announcement Body ─────────────────────────── */}
        <div style={{ ...card, padding: 32 }}>
          <p style={label}>For Immediate Release</p>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.35,
              marginBottom: 8,
            }}
          >
            GluMira™ Launches Free Insulin Visibility Platform for Families Managing Type 1 Diabetes
          </h2>
          <p
            style={{
              color: "var(--accent-teal)",
              fontSize: "0.9375rem",
              fontWeight: 600,
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            Powered by IOB Hunter™ — the first pharmacology-based insulin activity visualization engine designed for caregivers
          </p>

          <p style={bodyText}>
            GluMira™ is a comprehensive diabetes education platform designed to bridge the insulin
            visibility gap for families, caregivers, and individuals managing Type 1 Diabetes.
            Built as an educational tool rather than a medical device, GluMira™ translates complex
            pharmacokinetic data into intuitive, visual learning experiences that empower users to
            understand how insulin behaves in the body.
          </p>

          <p style={bodyText}>
            For many families newly diagnosed with Type 1 Diabetes, insulin remains invisible.
            Caregivers are expected to dose a life-sustaining hormone with precision, yet have no
            way to see what that insulin is actually doing over time. GluMira™ addresses this
            fundamental visibility gap by modelling insulin activity curves, stacking patterns,
            and tail effects — making the invisible visible through education.
          </p>

          <h3 style={{ ...sectionTitle, marginTop: 24 }}>Key Features</h3>
          <ul style={{ ...bodyText, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>
              <strong>IOB Hunter™ Engine</strong> — pharmacology-based insulin-on-board visualization
              that models activity curves for 11 insulin profiles including Fiasp, NovoRapid, Lyumjev,
              Humalog, Actrapid, Levemir, Lantus, Toujeo, Tresiba, Degludec, and NPH.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>20 Meal Regimes</strong> — pre-configured carbohydrate scenarios covering
              breakfast, lunch, dinner, snacks, and correction doses across multiple dietary patterns.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>100 Education Articles</strong> — peer-reviewed content covering insulin
              pharmacology, carbohydrate counting, pattern recognition, exercise effects, sick day
              management, and more.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Mira AI</strong> — a conversational assistant powered by Claude that answers
              diabetes education questions in context-aware, age-appropriate language.
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>17 Specialist Modules</strong> — dedicated learning paths for ADHD, autism,
              coeliac disease, disordered eating, pregnancy, travel, sport, shift work, and other
              intersecting conditions.
            </li>
          </ul>

          <h3 style={{ ...sectionTitle, marginTop: 24 }}>Availability</h3>
          <p style={bodyText}>
            GluMira™ is available free of charge on the web at glumira.ai. A generous free tier
            provides full access to all educational content, IOB Hunter™ visualizations, and Mira AI.
            The platform is committed to purchasing-power-parity pricing for users in Africa and
            lower-income regions, ensuring equitable access to diabetes education globally.
          </p>

          <h3 style={{ ...sectionTitle, marginTop: 24 }}>Target Users</h3>
          <p style={bodyText}>
            GluMira™ is designed for caregivers of children with Type 1 Diabetes, adults self-managing
            T1D, clinicians seeking patient education tools, diabetes educators, and researchers
            interested in insulin pharmacology visualization.
          </p>

          <h3 style={{ ...sectionTitle, marginTop: 24 }}>Technology</h3>
          <p style={bodyText}>
            GluMira™ V7 is built with React and TypeScript on a modern web stack. The platform uses
            Supabase for authentication and data persistence, Claude AI by Anthropic for the Mira AI
            conversational engine, and a custom pharmacokinetic modelling layer for insulin activity
            calculations. The entire front-end is server-side rendered for performance and accessibility.
          </p>
        </div>

        {/* ── Key Metrics Grid ──────────────────────────── */}
        <div style={card}>
          <p style={label}>Platform at a glance</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12, marginTop: 8 }}>
            {METRICS.map((m) => (
              <div
                key={m.label}
                style={{
                  textAlign: "center",
                  padding: 16,
                  borderRadius: 8,
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--accent-teal)",
                    marginBottom: 2,
                  }}
                >
                  {m.value}
                </p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600 }}>
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Founder Quote ─────────────────────────────── */}
        <div
          style={{
            ...card,
            borderLeft: "3px solid var(--accent-teal)",
            background: "var(--bg-card)",
          }}
        >
          <blockquote
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.0625rem",
              fontStyle: "italic",
              color: "var(--text-primary)",
              lineHeight: 1.7,
              margin: 0,
              padding: 0,
            }}
          >
            &ldquo;Every caregiver deserves to see what insulin is doing. Not tomorrow, not after
            years of experience — from day one. GluMira™ exists because insulin should never
            be invisible to the people whose lives depend on it.&rdquo;
          </blockquote>
          <p style={{ color: "var(--text-faint)", fontSize: "0.8125rem", marginTop: 12, fontWeight: 600 }}>
            — Founder, GluMira™
          </p>
        </div>

        {/* ── Media Contact ─────────────────────────────── */}
        <div style={card}>
          <h3 style={sectionTitle}>Media Contact</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 4 }}>
            For press enquiries, interviews, or partnership discussions:
          </p>
          <a
            href="mailto:press@glumira.ai"
            style={{
              color: "var(--accent-teal)",
              fontSize: "0.875rem",
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              textDecoration: "none",
            }}
          >
            press@glumira.ai
          </a>
        </div>

        {/* ── CTA Buttons ───────────────────────────────── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <a
            href="/auth"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "12px 28px",
              borderRadius: 8,
              background: "var(--accent-teal)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              textDecoration: "none",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            Try GluMira™ Free
          </a>
          <a
            href="/api-docs"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "12px 28px",
              borderRadius: 8,
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
              fontWeight: 700,
              fontSize: "0.875rem",
              textDecoration: "none",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            View Documentation
          </a>
        </div>

        {/* ── Logo and Brand Mark ────────────────────────── */}
        <div style={card}>
          <h3 style={sectionTitle}>Brand Mark</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: "linear-gradient(135deg, #0d1b3e, #2ab5c1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.5rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              G
            </div>
            <div>
              <p style={{ color: "var(--text-primary)", fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: 700 }}>
                GluMira™
              </p>
              <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", fontStyle: "italic" }}>
                The science of insulin, made visible
              </p>
            </div>
          </div>
          <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", lineHeight: 1.6 }}>
            The GluMira™ name, logo, and tagline are trademarks. Use for editorial and non-commercial
            purposes is permitted with attribution.
          </p>
        </div>

        {/* ── Social Share Buttons ────────────────────────── */}
        <div style={card}>
          <p style={label}>Share this announcement</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SOCIAL_LINKS.map((p) => (
              <button
                key={p.name}
                onClick={() => window.open(p.url, "_blank", "noopener")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border-light)",
                  background: "var(--bg-primary)",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    color: "#fff",
                    background: p.color,
                    flexShrink: 0,
                  }}
                >
                  {p.icon}
                </span>
                {p.name}
              </button>
            ))}
            <button
              onClick={copyLink}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid var(--border-light)",
                background: "var(--bg-primary)",
                cursor: "pointer",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  color: "#fff",
                  background: "var(--accent-teal)",
                  flexShrink: 0,
                }}
              >
                🔗
              </span>
              {linkCopied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* ── Disclaimer ─────────────────────────────────── */}
        <p style={{ color: "var(--text-faint)", fontSize: "0.6875rem", lineHeight: 1.6, textAlign: "center", marginTop: 24, marginBottom: 32 }}>
          {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
