/**
 * GluMira™ V7 — Story Engine
 * Profile-driven animated onboarding system.
 * Full-screen story player, mobile-first, Scandinavian Minimalist.
 */

import { useState, useEffect, useMemo } from "react";
import { useStoryPlayer, type StoryData } from "@/hooks/useStoryPlayer";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useTTS } from "@/hooks/useTTS";
import { PlaceholderAnimation, getAnimationProps } from "@/animations";
import StoryProgress from "@/components/story/StoryProgress";
import StorySubtitle from "@/components/story/StorySubtitle";
import StoryCTA from "@/components/story/StoryCTA";

export type ProfileType =
  | "caregiver"
  | "adult_patient"
  | "paediatric_patient"
  | "newly_diagnosed"
  | "clinician";

interface Props {
  profile: ProfileType;
  onComplete?: (stats: {
    scenesViewed: string[];
    scenesSkipped: string[];
    scenesReplayed: string[];
    totalTimeMs: number;
    reducedMotion: boolean;
  }) => void;
}

// Dynamic import map for story JSON files
const STORY_IMPORTS: Record<ProfileType, () => Promise<{ default: StoryData }>> = {
  caregiver:           () => import("@/stories/story-caregiver.json"),
  adult_patient:       () => import("@/stories/story-adult_patient.json"),
  paediatric_patient:  () => import("@/stories/story-paediatric_patient.json"),
  newly_diagnosed:     () => import("@/stories/story-newly_diagnosed.json"),
  clinician:           () => import("@/stories/story-clinician.json"),
};

export default function StoryEngine({ profile, onComplete }: Props) {
  const [story, setStory] = useState<StoryData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Detect prefers-reduced-motion
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // Load story data
  useEffect(() => {
    const loader = STORY_IMPORTS[profile];
    if (!loader) {
      setLoadError(`Unknown profile type: ${profile}`);
      return;
    }
    loader()
      .then((mod) => setStory(mod.default ?? (mod as any)))
      .catch((e) => setLoadError(e.message));
  }, [profile]);

  // Player hook
  const player = useStoryPlayer(story, reducedMotion);

  // TTS stub
  const tts = useTTS(story?.voice_style ?? "warm_neutral");

  // Speak on scene change
  useEffect(() => {
    if (player.scene && (player.state === "PLAYING" || player.state === "REPLAYING")) {
      tts.speak(player.scene.voice_text);
    }
  }, [player.sceneIndex, player.state]);

  // Notify on complete
  useEffect(() => {
    if (player.state === "COMPLETE" && onComplete) {
      onComplete({
        scenesViewed: player.scenesViewed,
        scenesSkipped: player.scenesSkipped,
        scenesReplayed: player.scenesReplayed,
        totalTimeMs: player.totalElapsed,
        reducedMotion,
      });
    }
  }, [player.state]);

  // Swipe gesture
  const containerRef = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: player.advance,
    onSwipeRight: player.replay,
  });

  // ── Loading / Error states ──────────────────────────────────────────

  if (loadError) {
    return (
      <div style={fullScreenStyle}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <p style={{ color: "#ef4444", fontSize: 16, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Failed to load story: {loadError}
          </p>
        </div>
      </div>
    );
  }

  if (!story || !player.scene) {
    return (
      <div style={fullScreenStyle}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#2ab5c1", fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif", animation: "pulse 1.5s infinite" }}>
            Loading story...
          </p>
        </div>
      </div>
    );
  }

  // ── Complete state ──────────────────────────────────────────────────

  if (player.state === "COMPLETE") {
    const lastScene = story.scenes[story.scenes.length - 1];
    return (
      <div style={fullScreenStyle}>
        <StoryProgress progress={1} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <PlaceholderAnimation {...getAnimationProps("profile_complete_celebration")} />
        </div>
        <StoryCTA cta={lastScene.cta} ctaOptions={lastScene.cta_options} />
        <StorySubtitle text={lastScene.subtitle_text} />
      </div>
    );
  }

  // ── Playing state ───────────────────────────────────────────────────

  const scene = player.scene;
  const animProps = getAnimationProps(scene.visual_id, scene.visual_note);
  const isLastScene = player.sceneIndex === story.scenes.length - 1;

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
        {player.sceneIndex + 1} / {story.scenes.length}
      </div>

      {/* Skip button */}
      <button type="button"
        onClick={(e) => { e.stopPropagation(); player.advance(); }}
        style={{
          position: "absolute", top: 12, left: 20, zIndex: 20,
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 6, padding: "6px 14px", cursor: "pointer",
          fontSize: 11, color: "rgba(255,255,255,0.6)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        Skip
      </button>

      {/* Animation area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px 100px",
          opacity: reducedMotion ? 1 : undefined,
          transition: reducedMotion ? "none" : "opacity 0.4s ease",
        }}
        key={scene.id} // force re-render on scene change
      >
        <div style={{ width: "100%", maxWidth: 400, aspectRatio: "4/3" }}>
          <PlaceholderAnimation {...animProps} />
        </div>
      </div>

      {/* CTA on last scene */}
      {isLastScene && <StoryCTA cta={scene.cta} ctaOptions={scene.cta_options} />}

      {/* Subtitle bar */}
      <StorySubtitle text={scene.subtitle_text} />

      {/* CSS animation keyframes */}
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
