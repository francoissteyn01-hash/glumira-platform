import { useState } from "react";
import { DISCLAIMER } from "@/lib/constants";

/* ─── GluMira™ V7 — Block 80: Social Media Integration ────────────── */

const SHARE_URL = "https://glumira.ai";
const TAGLINE = "The science of insulin, made visible";
const HASHTAGS = ["#GluMira", "#T1D", "#IOBHunter", "#InsulinVisibility"];

interface Platform {
  name: string;
  color: string;
  icon: string;
  action: () => void;
}

export default function SocialSharePage() {
  const [story, setStory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const userId = "demo-user";

  const twitterText = encodeURIComponent(
    "I'm using GluMira™ to understand insulin patterns better. The science of insulin, made visible. #T1D #diabetes #GluMira https://glumira.ai"
  );
  const linkedInText = encodeURIComponent(
    "Excited to share GluMira™ — an innovative digital health platform bringing insulin visibility to families managing Type 1 Diabetes. Powered by pharmacology-based modelling, it's redefining diabetes education. #DigitalHealth #T1D #Innovation"
  );
  const whatsAppText = encodeURIComponent(
    "Check out GluMira™ — a free diabetes education platform that makes insulin visible: https://glumira.ai"
  );
  const emailSubject = encodeURIComponent("Check out GluMira™ — Insulin Visibility Platform");
  const emailBody = encodeURIComponent(
    "Hi,\n\nI wanted to share GluMira™ with you — it's a free diabetes education platform that makes insulin activity visible through pharmacology-based modelling.\n\nLearn more: https://glumira.ai\n\nThe science of insulin, made visible."
  );

  const platforms: Platform[] = [
    {
      name: "Twitter / X",
      color: "#000000",
      icon: "𝕏",
      action: () => window.open(`https://twitter.com/intent/tweet?text=${twitterText}`, "_blank", "noopener"),
    },
    {
      name: "Facebook",
      color: "#1877F2",
      icon: "f",
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`, "_blank", "noopener"),
    },
    {
      name: "LinkedIn",
      color: "#0A66C2",
      icon: "in",
      action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}&summary=${linkedInText}`, "_blank", "noopener"),
    },
    {
      name: "WhatsApp",
      color: "#25D366",
      icon: "W",
      action: () => window.open(`https://wa.me/?text=${whatsAppText}`, "_blank", "noopener"),
    },
    {
      name: "Email",
      color: "#EA4335",
      icon: "@",
      action: () => { window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`; },
    },
    {
      name: "Copy Link",
      color: "var(--accent-teal)",
      icon: "🔗",
      action: () => {
        navigator.clipboard.writeText(SHARE_URL).then(() => {
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2500);
        });
      },
    },
  ];

  const handleStorySubmit = async () => {
    if (!story.trim() || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/beta-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "testimonial", message: story.trim() }),
      });
      setSubmitted(true);
      setStory("");
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(`${SHARE_URL}/invite/${userId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  /* ── Styles ─────────────────────────────────────────────── */
  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border-light)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  };

  const heading: React.CSSProperties = {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.125rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: 8,
  };

  const label: React.CSSProperties = {
    fontSize: "0.6875rem",
    fontWeight: 600,
    color: "var(--text-faint)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    marginBottom: 8,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Share GluMira™
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
            Help others discover the science of insulin, made visible
          </p>
        </div>

        {/* ── Share Buttons Grid ─────────────────────────── */}
        <div style={{ ...card, padding: 24 }}>
          <p style={label}>Share on your favourite platform</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {platforms.map((p) => (
              <button
                key={p.name}
                onClick={p.action}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border-light)",
                  background: "var(--bg-primary)",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = p.color;
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 0 1px ${p.color}33`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-light)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8125rem",
                    fontWeight: 800,
                    color: "#fff",
                    background: p.color,
                    flexShrink: 0,
                  }}
                >
                  {p.icon}
                </span>
                {p.name === "Copy Link" && linkCopied ? "Link copied!" : p.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── Share Your Story ────────────────────────────── */}
        <div style={card}>
          <h2 style={heading}>Share your GluMira™ experience</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginBottom: 12 }}>
            Your story can inspire other families managing Type 1 Diabetes.
          </p>
          {submitted ? (
            <div style={{ padding: 16, borderRadius: 8, background: "#10b98114", border: "1px solid #10b98133", color: "#10b981", fontSize: "0.875rem", fontWeight: 600, textAlign: "center" }}>
              Thank you for sharing your experience.
            </div>
          ) : (
            <>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Tell us how GluMira™ has helped you or your family..."
                rows={4}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid var(--border-light)",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: "0.8125rem",
                  resize: "vertical",
                  outline: "none",
                }}
              />
              <button
                onClick={handleStorySubmit}
                disabled={submitting || !story.trim()}
                style={{
                  marginTop: 10,
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: submitting || !story.trim() ? "var(--border-light)" : "var(--accent-teal)",
                  color: submitting || !story.trim() ? "var(--text-faint)" : "#fff",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  cursor: submitting || !story.trim() ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </>
          )}
        </div>

        {/* ── Referral Card ──────────────────────────────── */}
        <div style={{ ...card, background: "linear-gradient(135deg, #0d1b3e, #162a5a)", border: "none" }}>
          <h2 style={{ ...heading, color: "#fff" }}>Know a family managing T1D?</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.8125rem", marginBottom: 14 }}>
            Share GluMira™ with them. Every family deserves insulin visibility.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <code
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 6,
                background: "#ffffff0f",
                border: "1px solid #ffffff1a",
                color: "#e2e8f0",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.75rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              glumira.ai/invite/{userId}
            </code>
            <button
              onClick={copyReferral}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: "var(--accent-teal)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.75rem",
                cursor: "pointer",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* ── Community Stats ────────────────────────────── */}
        <div style={{ ...card, textAlign: "center", padding: 28 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2rem", fontWeight: 700, color: "var(--accent-teal)", marginBottom: 4 }}>
            1,247
          </p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 600 }}>
            families using GluMira™
          </p>
          <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", marginTop: 4 }}>
            Join them in making insulin visible
          </p>
        </div>

        {/* ── Brand Assets ───────────────────────────────── */}
        <div style={card}>
          <h2 style={heading}>Brand Assets</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8125rem", marginBottom: 16 }}>
            Use our logo and tagline in your posts
          </p>

          <div style={{ marginBottom: 14 }}>
            <p style={label}>Tagline</p>
            <p style={{ color: "var(--text-primary)", fontSize: "0.9375rem", fontStyle: "italic", fontWeight: 600 }}>
              &ldquo;{TAGLINE}&rdquo;
            </p>
          </div>

          <div>
            <p style={label}>Hashtags</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {HASHTAGS.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "#2ab5c114",
                    border: "1px solid #2ab5c133",
                    color: "var(--accent-teal)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Disclaimer ─────────────────────────────────── */}
        <p style={{ color: "var(--text-faint)", fontSize: "0.6875rem", lineHeight: 1.6, textAlign: "center", marginTop: 24 }}>
          GluMira™ is an educational platform. Shared experiences are personal and not medical advice.
        </p>
        <p style={{ color: "var(--text-faint)", fontSize: "0.6875rem", lineHeight: 1.6, textAlign: "center", marginTop: 8, marginBottom: 32 }}>
          {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
