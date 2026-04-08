/**
 * GluMira™ V7 — Clip Engine
 * Two-character dialogue player for Gatiep & MiraAi education clips.
 * Mobile-first, full-screen, Scandinavian Minimalist.
 */

import { useState, useEffect, useMemo } from "react";
import { useStoryPlayer, type StoryData } from "@/hooks/useStoryPlayer";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useTTS } from "@/hooks/useTTS";
import { PlaceholderAnimation, getAnimationProps } from "@/animations";
import StoryProgress from "@/components/story/StoryProgress";
import StorySubtitle from "@/components/story/StorySubtitle";

export type ClipId =
  | "sugar"
  | "sneak"
  | "double-up"
  | "night-crawler"
  | "vanishing-act"
  | "birthday";

interface ClipScene {
  id: string;
  character: "gatiep" | "miraai";
  visual_id: string;
  visual_note: string;
  subtitle_text: string;
  voice_text: string;
  voice_style: string;
  show_graph?: string;
  duration_ms: number;
}

export interface ClipData {
  clip_id: string;
  title: string;
  target_age: string;
  total_duration_ms: number;
  trick: string | null;
  teaching_point: string;
  scenes: ClipScene[];
}

interface Props {
  clipId: ClipId;
  onComplete?: () => void;
  onClose?: () => void;
}

const CLIP_IMPORTS: Record<ClipId, () => Promise<{ default: unknown }>> = {
  "sugar":          () => import("@/clips/clip-sugar.json"),
  "sneak":          () => import("@/clips/clip-sneak.json"),
  "double-up":      () => import("@/clips/clip-double-up.json"),
  "night-crawler":  () => import("@/clips/clip-night-crawler.json"),
  "vanishing-act":  () => import("@/clips/clip-vanishing-act.json"),
  "birthday":       () => import("@/clips/clip-birthday.json"),
};

const CHARACTER_COLORS = {
  gatiep: { accent: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", label: "Gatiep" },
  miraai:  { accent: "#2ab5c1", bg: "rgba(42, 181, 193, 0.12)", label: "MiraAi" },
} as const;

export default function ClipEngine({ clipId, onComplete, onClose }: Props) {
  const [clip, setClip] = useState<ClipData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // Load clip data
  useEffect(() => {
    const loader = CLIP_IMPORTS[clipId];
    if (!loader) {
      setLoadError(`Unknown clip: ${clipId}`);
      return;
    }
    loader()
      .then((mod) => setClip((mod.default ?? mod) as ClipData))
      .catch((e) => setLoadError(e.message));
  }, [clipId]);

  // Adapt ClipData to StoryData for the player hook
  const storyData: StoryData | null = useMemo(() => {
    if (!clip) return null;
    return {
      profile_type: clip.clip_id,
      voice_style: "warm_reassuring",
      total_duration_ms: clip.total_duration_ms,
      scenes: clip.scenes.map((s) => ({
        id: s.id,
        visual_id: s.visual_id,
        visual_note: s.visual_note,
        subtitle_text: s.subtitle_text,
        voice_text: s.voice_text,
        duration_ms: s.duration_ms,
      })),
    };
  }, [clip]);

  const player = useStoryPlayer(storyData, reducedMotion);

  // Per-scene TTS — switch voice style based on character
  const currentClipScene = clip?.scenes[player.sceneIndex] ?? null;
  const ttsGatiep = useTTS("friendly_upbeat");
  const ttsMiraai = useTTS("warm_reassuring");

  useEffect(() => {
    if (currentClipScene && (player.state === "PLAYING" || player.state === "REPLAYING")) {
      const tts = currentClipScene.character === "gatiep" ? ttsGatiep : ttsMiraai;
      tts.speak(currentClipScene.voice_text);
    }
  }, [player.sceneIndex, player.state]);

  // Notify on complete
  useEffect(() => {
    if (player.state === "COMPLETE" && onComplete) {
      onComplete();
    }
  }, [player.state]);

  // Swipe gesture
  const containerRef = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: player.advance,
    onSwipeRight: player.replay,
  });

  // ── Loading / Error ────────────────────────────────────────────────

  if (loadError) {
    return (
      <div style={fullScreenStyle}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <p style={{ color: "#ef4444", fontSize: 16, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Failed to load clip: {loadError}
          </p>
        </div>
      </div>
    );
  }

  if (!clip || !player.scene || !currentClipScene) {
    return (
      <div style={fullScreenStyle}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#2ab5c1", fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif", animation: "pulse 1.5s infinite" }}>
            Loading clip...
          </p>
        </div>
      </div>
    );
  }

  // ── Complete ───────────────────────────────────────────────────────

  if (player.state === "COMPLETE") {
    return (
      <div style={fullScreenStyle}>
        <StoryProgress progress={1} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
          <PlaceholderAnimation {...getAnimationProps("profile_complete_celebration")} />
          <h2 style={{ color: "#fff", fontSize: 22, fontFamily: "'DM Sans', system-ui, sans-serif", margin: 0 }}>
            {clip.title}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif", textAlign: "center", maxWidth: 320, margin: 0, lineHeight: 1.5 }}>
            {clip.teaching_point}
          </p>
          {onClose && (
            <button type="button" onClick={onClose} style={ctaButtonStyle}>
              Back to Clips
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────

  const char = CHARACTER_COLORS[currentClipScene.character];
  const animProps = getAnimationProps(currentClipScene.visual_id, currentClipScene.visual_note);

  return (
    <div
      ref={containerRef}
      onClick={player.advance}
      style={fullScreenStyle}
    >
      <StoryProgress progress={player.progress} />

      {/* Scene counter */}
      <div style={{
        position: "absolute", top: 14, right: 20, zIndex: 20,
        fontSize: 11, color: "rgba(255,255,255,0.4)",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {player.sceneIndex + 1} / {clip.scenes.length}
      </div>

      {/* Close button */}
      {onClose && (
        <button type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            position: "absolute", top: 12, left: 20, zIndex: 20,
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 6, padding: "6px 14px", cursor: "pointer",
            fontSize: 11, color: "rgba(255,255,255,0.6)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          Close
        </button>
      )}

      {/* Character indicator */}
      <div style={{
        position: "absolute", top: 42, left: "50%", transform: "translateX(-50%)", zIndex: 20,
        background: char.bg, border: `1px solid ${char.accent}40`,
        borderRadius: 20, padding: "4px 16px",
        fontSize: 12, color: char.accent,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontWeight: 600,
        transition: "all 0.3s ease",
      }}>
        {char.label}
      </div>

      {/* Trick badge */}
      {clip.trick && (
        <div style={{
          position: "absolute", top: 70, left: "50%", transform: "translateX(-50%)", zIndex: 20,
          fontSize: 10, color: "rgba(255,255,255,0.35)",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 1, textTransform: "uppercase",
        }}>
          {clip.trick}
        </div>
      )}

      {/* Animation area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "90px 24px 100px",
          opacity: reducedMotion ? 1 : undefined,
          transition: reducedMotion ? "none" : "opacity 0.4s ease",
        }}
        key={currentClipScene.id}
      >
        <div style={{ width: "100%", maxWidth: 400, aspectRatio: "4/3" }}>
          <PlaceholderAnimation {...animProps} />
        </div>
      </div>

      {/* Subtitle bar with character colour accent */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
        background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
        padding: "40px 24px 32px",
      }}>
        <p style={{
          margin: 0, textAlign: "center",
          fontSize: 16, lineHeight: 1.5,
          color: "#fff",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          borderLeft: `3px solid ${char.accent}`,
          paddingLeft: 12,
          maxWidth: 480,
          marginInline: "auto",
        }}>
          {currentClipScene.subtitle_text}
        </p>
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

const fullScreenStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  background: "linear-gradient(135deg, #1a2a5e 0%, #0f1b3d 100%)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  cursor: "pointer",
  userSelect: "none",
};

const ctaButtonStyle: React.CSSProperties = {
  background: "#2ab5c1",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "12px 32px",
  fontSize: 15,
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 8,
};
