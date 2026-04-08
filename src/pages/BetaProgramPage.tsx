import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardSave } from "@/hooks/useKeyboardSave";

/* ─── GluMira™ V7 — Beta Program Module ───────────────────────────────── */

type FeedbackCategory = "Bug Report" | "Feature Request" | "UI/UX Feedback" | "General";
type Severity = "Low" | "Medium" | "High" | "Critical";

interface FeedbackEntry {
  id: string;
  category: FeedbackCategory;
  description: string;
  severity?: Severity;
  createdAt: string;
}

const CATEGORIES: FeedbackCategory[] = ["Bug Report", "Feature Request", "UI/UX Feedback", "General"];
const SEVERITIES: Severity[] = ["Low", "Medium", "High", "Critical"];

const CHANGELOG = [
  "V7.0.0 — Full platform rebuild with IOB Hunter™ engine",
  "Education system — 100 articles, ISPAD/ADA/NICE referenced",
  "Mira AI — Claude-powered education assistant",
  "11 specialist modules — Pregnancy, Paediatric, ADHD, Thyroid, and more",
];

function getBetaTier(daysActive: number): string {
  if (daysActive >= 30) return "Power User";
  if (daysActive >= 7) return "Active Tester";
  return "Early Access";
}

function tierColor(tier: string): string {
  if (tier === "Power User") return "#f59e0b";
  if (tier === "Active Tester") return "var(--accent-teal)";
  return "var(--text-secondary)";
}

export default function BetaProgramPage() {
  const { user } = useAuth();

  // Form state
  const [category, setCategory] = useState<FeedbackCategory>("General");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  // Feedback list
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [daysInBeta, setDaysInBeta] = useState(0);

  useEffect(() => {
    apiFetch<{ entries: FeedbackEntry[]; daysInBeta: number }>("/api/beta-feedback")
      .then((res) => {
        setFeedback(res.entries ?? []);
        setDaysInBeta(res.daysInBeta ?? 0);
      })
      .catch(() => {
        // gracefully degrade
      });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const body: Record<string, unknown> = { category, description, severity: category === "Bug Report" ? severity : undefined };
      const res = await apiFetch<{ entry: FeedbackEntry }>("/api/beta-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.entry) setFeedback((prev) => [res.entry, ...prev].slice(0, 5));
      setDescription("");
      setFile(null);
      setSubmitMsg("Feedback submitted — thank you!");
    } catch {
      setSubmitMsg("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [category, description, severity]);

  useKeyboardSave(handleSubmit);

  const tier = getBetaTier(daysInBeta);

  const card: React.CSSProperties = { background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12, padding: 16, marginBottom: 16 };
  const label: React.CSSProperties = { fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" };
  const inputBase: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-light)",
    background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* ── Header ───────────────────────────────────────────────── */}
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          Beta Program
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 24 }}>
          Help shape the future of GluMira™
        </p>

        {/* ── Beta Status Card ─────────────────────────────────────── */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>Beta Tier</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: tierColor(tier) }}>{tier}</div>
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 999, fontSize: "0.6875rem", fontWeight: 600,
              background: `${tierColor(tier)}22`, color: tierColor(tier), border: `1px solid ${tierColor(tier)}44`,
            }}>
              {daysInBeta} {daysInBeta === 1 ? "day" : "days"} active
            </div>
          </div>
        </div>

        {/* ── Beta Stats Card ──────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          <div style={{ ...card, marginBottom: 0, textAlign: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {feedback.length}
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-faint)" }}>Feedback sent</div>
          </div>
          <div style={{ ...card, marginBottom: 0, textAlign: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {daysInBeta}
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-faint)" }}>Days in beta</div>
          </div>
          <div style={{ ...card, marginBottom: 0, textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem" }}>
              {tier === "Power User" ? "🏆" : tier === "Active Tester" ? "🧪" : "🚀"}
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-faint)" }}>Tier badge</div>
          </div>
        </div>

        {/* ── Feedback Form ────────────────────────────────────────── */}
        <div style={card}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
            Submit Feedback
          </h2>

          <label style={label}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
            style={{ ...inputBase, marginBottom: 12, cursor: "pointer" }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {category === "Bug Report" && (
            <>
              <label style={label}>Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                style={{ ...inputBase, marginBottom: 12, cursor: "pointer" }}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </>
          )}

          <label style={label}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your feedback in detail..."
            rows={5}
            style={{ ...inputBase, marginBottom: 12, resize: "vertical" }}
          />

          <label style={label}>Screenshot (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ ...inputBase, marginBottom: 16, padding: 8 }}
          />
          {file && <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginBottom: 12 }}>Selected: {file.name}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
            style={{
              width: "100%", padding: "10px 16px", borderRadius: 8, border: "none",
              background: submitting || !description.trim() ? "var(--border-light)" : "var(--accent-teal)",
              color: submitting || !description.trim() ? "var(--text-faint)" : "#fff",
              fontSize: "0.875rem", fontWeight: 600, cursor: submitting || !description.trim() ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif", transition: "background 0.2s",
            }}
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>

          {submitMsg && (
            <p style={{ fontSize: "0.8125rem", color: submitMsg.includes("thank") ? "var(--accent-teal)" : "#ef4444", marginTop: 8 }}>
              {submitMsg}
            </p>
          )}
        </div>

        {/* ── Recent Feedback ──────────────────────────────────────── */}
        {feedback.length > 0 && (
          <div style={card}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Recent Feedback
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {feedback.slice(0, 5).map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-light)",
                    background: "var(--bg-primary)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent-teal)" }}>{f.category}</span>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-faint)" }}>
                      {new Date(f.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                    {f.description.length > 120 ? f.description.slice(0, 120) + "..." : f.description}
                  </p>
                  {f.severity && (
                    <span style={{ fontSize: "0.625rem", color: "var(--text-faint)", marginTop: 4, display: "inline-block" }}>
                      Severity: {f.severity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Changelog ────────────────────────────────────────────── */}
        <div style={card}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
            Changelog
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CHANGELOG.map((entry, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-teal)", marginTop: 6, flexShrink: 0 }} />
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  {entry}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
