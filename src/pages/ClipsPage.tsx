/**
 * GluMira™ V7 — Clips Page
 * Browse and play Gatiep & MiraAi education clips.
 */

import { useState } from "react";
import ClipEngine, { type ClipId } from "@/components/ClipEngine";

interface ClipMeta {
  id: ClipId;
  title: string;
  trick: string | null;
  target_age: string;
  teaching_point: string;
}

const CLIPS: ClipMeta[] = [
  { id: "sugar",          title: "My Mom Says You Have Sugar", trick: null,                  target_age: "6-12",  teaching_point: "What T1D is — sugar goes up with food, insulin brings it down." },
  { id: "sneak",          title: "The Sneak",                  trick: "The Sneak",           target_age: "8-14",  teaching_point: "Long-acting insulin has a quiet tail that keeps working." },
  { id: "double-up",      title: "The Double-Up",              trick: "The Double-Up",       target_age: "8-14",  teaching_point: "When insulin doses overlap, they stack." },
  { id: "night-crawler",  title: "The Night Crawler",          trick: "The Night Crawler",   target_age: "8-14",  teaching_point: "Basal insulin works overnight — that's why lows happen while you sleep." },
  { id: "vanishing-act",  title: "The Vanishing Act",          trick: "The Vanishing Act",   target_age: "10-16", teaching_point: "Vomit after insulin? Food is gone but insulin stays. Get help fast." },
  { id: "birthday",       title: "The Birthday Surprise",      trick: "The Birthday Surprise", target_age: "6-14", teaching_point: "You CAN have birthday cake. T1D doesn't steal your birthday." },
];

export default function ClipsPage() {
  const [activeClip, setActiveClip] = useState<ClipId | null>(null);

  if (activeClip) {
    return (
      <ClipEngine
        clipId={activeClip}
        onComplete={() => {}}
        onClose={() => setActiveClip(null)}
      />
    );
  }

  return (
    <div style={pageStyle}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 4px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Gatiep & MiraAi
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Education clips for young people with T1D
        </p>
      </header>

      <div style={gridStyle}>
        {CLIPS.map((clip) => (
          <button
            key={clip.id}
            type="button"
            onClick={() => setActiveClip(clip.id)}
            style={cardStyle}
          >
            {clip.trick && (
              <span style={trickBadgeStyle}>{clip.trick}</span>
            )}
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 8px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              {clip.title}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.4, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              {clip.teaching_point}
            </p>
            <span style={ageBadgeStyle}>Ages {clip.target_age}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #1a2a5e 0%, #0f1b3d 100%)",
  padding: "48px 24px",
  maxWidth: 720,
  marginInline: "auto",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  padding: 20,
  cursor: "pointer",
  textAlign: "left",
  transition: "background 0.2s, border-color 0.2s",
  position: "relative",
};

const trickBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: 10,
  fontFamily: "'JetBrains Mono', monospace",
  color: "#f59e0b",
  letterSpacing: 1,
  textTransform: "uppercase",
  marginBottom: 8,
};

const ageBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: 12,
  fontSize: 11,
  color: "#2ab5c1",
  fontFamily: "'JetBrains Mono', monospace",
};
