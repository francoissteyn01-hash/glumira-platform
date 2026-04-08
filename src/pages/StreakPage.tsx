import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import {
  calculateStreak,
  getMotivationalMessage,
  loadCachedStreak,
  type StreakData,
} from "@/lib/streak-engine";

/* ─── GluMira™ V7 — Streak & Engagement Dashboard ─────────────────────── */

const DAYS_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayLabel(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return DAYS_LABEL[d.getDay()];
}

function last30Dates(): string[] {
  const out: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }
  return out;
}

export default function StreakPage() {
  const [streak, setStreak] = useState<StreakData | null>(loadCachedStreak);
  const [loading, setLoading] = useState(true);
  const [logDates, setLogDates] = useState<string[]>([]);

  useEffect(() => {
    apiFetch<{ dates: string[] }>("/trpc/streak.getLogDates")
      .then((res) => {
        const dates = res.dates ?? [];
        setLogDates(dates);
        setStreak(calculateStreak(dates));
      })
      .catch(() => {
        // 404 or network error — use cached or empty
        if (!streak) setStreak(calculateStreak([]));
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logDateSet = useMemo(() => new Set(logDates.map((d) => d.slice(0, 10))), [logDates]);
  const calendar30 = useMemo(() => last30Dates(), []);
  const motivational = streak ? getMotivationalMessage(streak.currentStreak) : "";

  if (loading && !streak) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Loading streak data...</p>
      </div>
    );
  }

  const s = streak ?? calculateStreak([]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* ── Header ───────────────────────────────────────────────── */}
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          Your Streak
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 24 }}>
          Consistency builds confidence — track your logging streak.
        </p>

        {/* ── Current Streak ───────────────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: "3.5rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--accent-teal)", lineHeight: 1.1 }}>
            {s.currentStreak}
          </div>
          <div style={{ fontSize: "1rem", color: "var(--text-secondary)", marginTop: 4 }}>
            {s.currentStreak === 1 ? "day" : "days"} {s.currentStreak > 0 ? "🔥" : ""}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: 8 }}>
            Current streak
          </div>
        </div>

        {/* ── Longest Streak + Total Days Row ──────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--text-primary)" }}>
              {s.longestStreak}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>Longest streak</div>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--text-primary)" }}>
              {s.totalDaysLogged}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>Total days logged</div>
          </div>
        </div>

        {/* ── Weekly Activity Heatmap ──────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
            Last 7 Days
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {s.weeklyActivity.map((active, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    margin: "0 auto",
                    background: active ? "var(--accent-teal)" : "transparent",
                    border: active ? "none" : "2px solid var(--border-light)",
                    transition: "background 0.2s",
                  }}
                />
                <div style={{ fontSize: "0.625rem", color: "var(--text-faint)", marginTop: 4 }}>
                  {i === 0 ? "Today" : dayLabel(i)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Monthly Calendar Heatmap ─────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
            Last 30 Days
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {calendar30.map((dateKey) => {
              const logged = logDateSet.has(dateKey);
              // Count entries for that day for intensity
              const count = logDates.filter((d) => d.slice(0, 10) === dateKey).length;
              const opacity = logged ? Math.min(0.4 + count * 0.2, 1) : 0;
              return (
                <div
                  key={dateKey}
                  title={`${dateKey}${logged ? ` — ${count} log${count > 1 ? "s" : ""}` : ""}`}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: 4,
                    background: logged ? `rgba(42, 181, 193, ${opacity})` : "transparent",
                    border: logged ? "none" : "1px solid var(--border-light)",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* ── Motivational Message ─────────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--accent-teal)", borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <p style={{ color: "var(--text-primary)", fontSize: "0.9375rem", lineHeight: 1.6, fontStyle: "italic" }}>
            "{motivational}"
          </p>
        </div>

        {/* ── Milestones ───────────────────────────────────────────── */}
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
          Milestones
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
          {s.milestones.map((m) => (
            <div
              key={m.days}
              style={{
                background: "var(--bg-card)",
                border: `1px solid ${m.achieved ? "var(--accent-teal)" : "var(--border-light)"}`,
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: m.achieved ? 1 : 0.5,
              }}
            >
              <div style={{ fontSize: "1.25rem", width: 32, textAlign: "center", flexShrink: 0 }}>
                {m.achieved ? "✅" : "🔒"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {m.title}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {m.description}
                </div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "var(--text-faint)", flexShrink: 0 }}>
                {m.days}d
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
