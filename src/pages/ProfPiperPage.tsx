/**
 * GluMira™ V7 — Prof Piper Education Hub
 *
 * Prof Piper is a pied wagtail — Mira's mentor for clinical depth.
 * He appears only here and in the Story Engine "piper_teaching" scenes.
 * He NEVER appears in the Mira chat interface.
 *
 * Asset status: PNG needed — commission new illustrator.
 * Replace PROF_PIPER_IMG with /brand/prof-piper-teaching.png when asset is ready.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { DISCLAIMER } from "@/lib/constants";

const PROF_PIPER_IMG = null; // TODO: replace with /brand/prof-piper-teaching.png when delivered

const TOPICS_FREE = [
  {
    id: "hba1c",
    title: "HbA1c — Reading the 3-month story",
    tagline: "Your blood writes a travel diary. Let me show you how to read it.",
    icon: "🔬",
    duration: "6 min",
    badge: "Blood Detective",
  },
  {
    id: "hypo-hyper",
    title: "Hypo & Hyper — Learning the language",
    tagline: "Your body sends signals. Let's learn what they mean — without panic.",
    icon: "📊",
    duration: "5 min",
    badge: "First Lesson",
  },
  {
    id: "injection",
    title: "Injection technique — The needle is tiny",
    tagline: "Piper demonstrates on a diagram. He never rushes. He never makes you feel silly.",
    icon: "💉",
    duration: "4 min",
    badge: "Brave Explorer",
  },
];

const TOPICS_PRO = [
  { id: "ketones", title: "Ketones & DKA — Alarm bells, not the fire", tagline: "Dangerous if misunderstood. Must be taught without inducing panic.", icon: "⚠️", duration: "8 min", badge: "Blood Detective" },
  { id: "pharmacology", title: "Insulin pharmacology — The wave at the beach", tagline: "Curves, half-lives, stacking. Wrapped in metaphor, never raw data.", icon: "🌊", duration: "10 min", badge: "Curve Reader" },
  { id: "carb-counting", title: "Carb counting — Start with three foods", tagline: "You don't need to count everything. Let's start where it matters.", icon: "🍽️", duration: "7 min", badge: "Scholar" },
  { id: "sick-day", title: "Sick day management — When the rules change", tagline: "Gastro + T1D is the high-stakes scenario. Calm authority required.", icon: "🤒", duration: "9 min", badge: "Scholar" },
  { id: "bloodwork", title: "Lab results — Numbers need context", tagline: "A number alone means nothing. Let me show you what's behind it.", icon: "🧪", duration: "6 min", badge: "Blood Detective" },
  { id: "puberty", title: "Growth & puberty — Your body changed the equation", tagline: "Hormones change how insulin works. Totally normal. Let's map it.", icon: "⚡", duration: "7 min", badge: "Scholar" },
  { id: "pregnancy", title: "Pregnancy & T1D — The trimester equation", tagline: "High anxiety. Clinical precision with emotional support. Both at once.", icon: "🤰", duration: "11 min", badge: "Scholar" },
];

type TopicCardProps = {
  topic: typeof TOPICS_FREE[number];
  locked?: boolean;
};

function TopicCard({ topic, locked }: TopicCardProps) {
  return (
    <div style={{
      background: "var(--bg-card)", borderRadius: 14,
      border: `1.5px solid ${locked ? "var(--border)" : "var(--accent-teal)"}`,
      padding: "18px 20px", opacity: locked ? 0.6 : 1,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 28 }}>{topic.icon}</span>
        {locked && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            color: "var(--text-muted)", background: "var(--bg-elevated)",
            padding: "3px 8px", borderRadius: 10, fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>PRO</span>
        )}
        {!locked && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            color: "var(--accent-teal)", background: "rgba(42,181,193,0.1)",
            padding: "3px 8px", borderRadius: 10, fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>FREE</span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif", lineHeight: 1.3 }}>
        {topic.title}
      </p>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.5, fontStyle: "italic" }}>
        "{topic.tagline}"
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          ⏱ {topic.duration}
        </span>
        <span style={{ fontSize: 11, color: "var(--accent-amber)", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600 }}>
          🎓 {topic.badge}
        </span>
      </div>
      {!locked && (
        <Link to={`/education/piper/${topic.id}`}
          style={{
            marginTop: 4, display: "block", textAlign: "center",
            padding: "10px", borderRadius: 8, background: "var(--accent-teal)",
            color: "#fff", fontSize: 13, fontWeight: 700,
            fontFamily: "'DM Sans', system-ui, sans-serif", textDecoration: "none",
          }}>
          Visit Prof Piper →
        </Link>
      )}
      {locked && (
        <Link to="/settings#subscription"
          style={{
            marginTop: 4, display: "block", textAlign: "center",
            padding: "10px", borderRadius: 8, background: "var(--bg-elevated)",
            color: "var(--text-muted)", fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', system-ui, sans-serif", textDecoration: "none",
          }}>
          Unlock with Pro →
        </Link>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function ProfPiperPage() {
  const [showPro, setShowPro] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* ── Hero: Mira introducing Prof Piper ───────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #0D1B3E 0%, #1A2A5E 60%, rgba(42,181,193,0.3) 100%)",
          borderRadius: 18, padding: "32px 28px", marginBottom: 28,
          display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
        }}>
          {/* Mira + Piper side by side — Piper is half Mira's height per spec */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
            <img src="/brand/mira-hero.png" alt="Mira"
              style={{ width: 80, height: 80, objectFit: "contain" }} />
            {/* Prof Piper placeholder — replace with /brand/prof-piper-teaching.png */}
            {PROF_PIPER_IMG ? (
              <img src={PROF_PIPER_IMG} alt="Prof Piper"
                style={{ width: 44, height: 44, objectFit: "contain" }} />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "rgba(255,255,255,0.08)",
                border: "2px dashed rgba(42,181,193,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }} title="Prof Piper illustration — PNG needed, commission illustrator">
                🐦
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(42,181,193,0.8)", fontFamily: "'DM Sans', system-ui, sans-serif", textTransform: "uppercase" }}>
              Mira says
            </p>
            <h1 style={{ margin: "0 0 8px", fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2 }}>
              "This one needs Prof Piper. Let's visit The Study."
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.6 }}>
              Prof Piper is a pied wagtail — Mira's mentor for the hard stuff. He explains bloodwork, insulin curves, ketones, and everything that feels overwhelming, in a way that makes you exhale.
            </p>
          </div>
        </div>

        {/* ── The Study intro ──────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #8B6F47 0%, #A0845A 100%)",
          borderRadius: 14, padding: "16px 20px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 28 }}>📚</span>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#FFFFFF", fontFamily: "'Playfair Display', serif" }}>
              The Study
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Warm shelves. Charts on the wall. A magnifying glass on the desk. Not a hospital — a place where knowledge lives and feels safe.
            </p>
          </div>
        </div>

        {/* ── Free topics ──────────────────────────────────────────────── */}
        <h2 style={{ margin: "0 0 4px", fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
          Start here — free for everyone
        </h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Clinical education is never behind a paywall. These three topics are where every GluMira™ journey begins.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 28 }}>
          {TOPICS_FREE.map((t) => <TopicCard key={t.id} topic={t} />)}
        </div>

        {/* ── Pro topics ───────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setShowPro((v) => !v)}
          style={{
            width: "100%", padding: "12px", borderRadius: 10, cursor: "pointer",
            border: "1px dashed var(--border)", background: "transparent",
            color: "var(--text-muted)", fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: 16,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          {showPro ? "▲ Hide Pro topics" : "▼ Show all Prof Piper topics (Pro)"}
        </button>
        {showPro && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 28 }}>
            {TOPICS_PRO.map((t) => <TopicCard key={t.id} topic={t as typeof TOPICS_FREE[number]} locked />)}
          </div>
        )}

        {/* ── Scholar badges ───────────────────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", padding: "20px 24px", marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 12px", fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
            🎓 Scholar Badges
          </h3>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Prof Piper's lessons unlock a separate badge category — distinct from Mira's guardian badges.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              { name: "First Lesson", trigger: "Complete first Piper scene", icon: "👓" },
              { name: "Blood Detective", trigger: "HbA1c + ketones modules", icon: "🔍" },
              { name: "Curve Reader", trigger: "Insulin pharmacology module", icon: "📈" },
              { name: "Brave Explorer", trigger: "Injection technique module", icon: "⭐" },
              { name: "Scholar", trigger: "All Prof Piper topics", icon: "🏆" },
            ].map((b) => (
              <div key={b.name} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 14px", borderRadius: 8,
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: 18 }}>{b.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{b.name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "var(--text-muted)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{b.trigger}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Back to Education ────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <Link to="/education"
            style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border)",
              color: "var(--text-secondary)", fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Sans', system-ui, sans-serif", textDecoration: "none",
              background: "var(--bg-card)",
            }}>
            ← Education Library
          </Link>
          <Link to="/mira"
            style={{
              padding: "10px 20px", borderRadius: 8, background: "var(--accent-teal)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              fontFamily: "'DM Sans', system-ui, sans-serif", textDecoration: "none",
            }}>
            Ask MiraAi instead →
          </Link>
        </div>

        {/* ── Disclaimer ───────────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.6 }}>
            Prof Piper is an illustrated narrative character, not a real clinician. {DISCLAIMER}
          </p>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
