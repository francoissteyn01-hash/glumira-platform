/**
 * GluMira™ StoryEngine
 *
 * Full-featured animated onboarding explainer component.
 * Replaces the in-app video with a profile-specific story experience.
 *
 * Features:
 * ✓ Auto-advance using duration_ms per scene
 * ✓ Top progress bar filling across total_duration_ms with scene markers
 * ✓ Persistent subtitle bar (always visible, even without TTS)
 * ✓ ElevenLabs TTS narration via useTTS hook
 * ✓ Tap/click to advance scene early
 * ✓ Swipe-left to advance, swipe-right to replay current scene
 * ✓ Replay button for current scene
 * ✓ prefers-reduced-motion: static frames + 4s fixed timer
 * ✓ Dynamic JSON import per profile (code-split)
 * ✓ Handles both cta (single) and cta_options (dual) CTA structures
 * ✓ Loading and error states
 * ✓ Keyboard navigation (ArrowRight = advance, ArrowLeft = replay)
 * ✓ Full ARIA support
 *
 * Onboarding 3 — Prompt 3 (Upgrades 1, 8, 9, 10)
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";
import { loadStoryScript } from "./storyLoader";
import { StoryProgressBar } from "./StoryProgressBar";
import { StorySubtitleBar } from "./StorySubtitleBar";
import { ANIMATION_REGISTRY } from "./animations/index";
import { useTTS } from "@/hooks/useTTS";
import type { ProfileType, StoryCTA, StoryScript } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Fallback scene duration when prefers-reduced-motion is active (ms). */
const REDUCED_MOTION_SCENE_DURATION_MS = 4000;

/** Minimum swipe distance to register as a gesture (px). */
const SWIPE_THRESHOLD_PX = 50;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StoryEngineProps {
  profile: ProfileType;
  onComplete?: (route: string) => void;
  onSkip?: () => void;
  /** Override auto-advance — useful for testing. */
  autoAdvance?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StoryEngine — the animated onboarding explainer for GluMira™.
 *
 * @example
 * <StoryEngine
 *   profile="patient"
 *   onComplete={(route) => navigate(route)}
 *   onSkip={() => navigate("/dashboard")}
 * />
 */
export function StoryEngine({
  profile,
  onComplete,
  onSkip,
  autoAdvance = true,
}: StoryEngineProps) {
  const [, navigate] = useLocation();
  const prefersReducedMotion = useReducedMotion() ?? false;

  // ── Story script state ────────────────────────────────────────────────────
  const [script, setScript] = useState<StoryScript | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Scene state ───────────────────────────────────────────────────────────
  const [sceneIndex, setSceneIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showCta, setShowCta] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── TTS ───────────────────────────────────────────────────────────────────
  const { speak, stop: stopTTS } = useTTS({
    voiceStyle: script?.voice_style ?? "warm_neutral",
    enabled: !prefersReducedMotion,
  });

  // ── Load story script ─────────────────────────────────────────────────────
  useEffect(() => {
    setScript(null);
    setLoadError(null);
    setSceneIndex(0);
    setElapsedMs(0);
    setShowCta(false);

    loadStoryScript(profile)
      .then(setScript)
      .catch((err: Error) => {
        setLoadError(err.message);
      });
  }, [profile]);

  // ── Current scene ─────────────────────────────────────────────────────────
  const currentScene = script?.scenes[sceneIndex] ?? null;
  const totalScenes = script?.scenes.length ?? 0;
  const isLastScene = sceneIndex === totalScenes - 1;

  // ── Advance to next scene ─────────────────────────────────────────────────
  const advanceScene = useCallback(() => {
    if (!script) return;

    if (isLastScene) {
      setShowCta(true);
      stopTTS();
      clearTimer();
      return;
    }

    setSceneIndex((i) => i + 1);
    setElapsedMs(0);
  }, [script, isLastScene, stopTTS]);

  // ── Replay current scene ──────────────────────────────────────────────────
  const replayScene = useCallback(() => {
    setElapsedMs(0);
    if (currentScene) {
      speak(currentScene.voice_text);
    }
  }, [currentScene, speak]);

  // ── Timer helpers ─────────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Auto-advance timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (!script || !currentScene || showCta || !autoAdvance) return;

    clearTimer();

    const sceneDuration = prefersReducedMotion
      ? REDUCED_MOTION_SCENE_DURATION_MS
      : currentScene.duration_ms;

    const TICK_MS = 50;

    timerRef.current = setInterval(() => {
      setElapsedMs((prev) => {
        const next = prev + TICK_MS;
        if (next >= sceneDuration) {
          clearTimer();
          advanceScene();
          return 0;
        }
        return next;
      });
    }, TICK_MS);

    return () => clearTimer();
  }, [
    script,
    sceneIndex,
    currentScene,
    showCta,
    autoAdvance,
    prefersReducedMotion,
    advanceScene,
    clearTimer,
  ]);

  // ── TTS on scene change ───────────────────────────────────────────────────
  useEffect(() => {
    if (!currentScene || prefersReducedMotion) return;
    speak(currentScene.voice_text);
    return () => stopTTS();
  }, [currentScene, prefersReducedMotion, speak, stopTTS]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advanceScene();
      if (e.key === "ArrowLeft") replayScene();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [advanceScene, replayScene]);

  // ── Touch / swipe handlers ────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartXRef.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
      touchStartXRef.current = null;

      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) {
        // Short tap — advance
        if (!showCta) advanceScene();
        return;
      }

      if (deltaX < 0) {
        // Swipe left — advance
        if (!showCta) advanceScene();
      } else {
        // Swipe right — replay
        replayScene();
      }
    },
    [advanceScene, replayScene, showCta]
  );

  // ── CTA handler ───────────────────────────────────────────────────────────
  const handleCta = useCallback(
    (route: string) => {
      onComplete ? onComplete(route) : navigate(route);
    },
    [onComplete, navigate]
  );

  // ── Resolve CTA(s) ────────────────────────────────────────────────────────
  const ctaList: StoryCTA[] = script
    ? script.cta_options ?? (script.cta ? [script.cta] : [])
    : [];

  // ── Animation component ───────────────────────────────────────────────────
  const AnimComponent = currentScene
    ? ANIMATION_REGISTRY[currentScene.visual_id]
    : null;

  // ── Render: loading ───────────────────────────────────────────────────────
  if (!script && !loadError) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[400px] bg-[#1a2a5e]">
        <motion.div
          className="w-10 h-10 rounded-full border-2 border-[#2ab5c1] border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          aria-label="Loading story"
        />
      </div>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] bg-[#1a2a5e] gap-4 p-8">
        <p className="text-white/70 text-sm text-center">
          Unable to load onboarding story. Please try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium text-[#1a2a5e] bg-[#2ab5c1] rounded-lg hover:bg-[#2ab5c1]/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Render: CTA screen ────────────────────────────────────────────────────
  if (showCta && script) {
    return (
      <motion.div
        className="relative flex flex-col items-center justify-center w-full h-full min-h-[400px] bg-[#1a2a5e] px-8 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
      >
        {ctaList.map((cta) => (
          <button
            key={cta.route}
            onClick={() => handleCta(cta.route)}
            className="w-full max-w-xs px-6 py-3.5 text-base font-semibold text-[#1a2a5e] bg-[#f59e0b] rounded-xl hover:bg-[#f59e0b]/90 active:scale-95 transition-all shadow-lg"
          >
            {cta.text}
          </button>
        ))}
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-sm text-white/40 hover:text-white/70 transition-colors mt-2"
          >
            Skip for now
          </button>
        )}
      </motion.div>
    );
  }

  // ── Render: story ─────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full h-full min-h-[400px] overflow-hidden select-none outline-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => !showCta && advanceScene()}
      tabIndex={0}
      role="region"
      aria-label={`GluMira onboarding story — scene ${sceneIndex + 1} of ${totalScenes}`}
    >
      {/* Progress bar */}
      {script && currentScene && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4">
          <StoryProgressBar
            scenes={script.scenes}
            totalDurationMs={script.total_duration_ms}
            currentSceneIndex={sceneIndex}
            elapsedInSceneMs={elapsedMs}
          />
        </div>
      )}

      {/* Skip button */}
      {onSkip && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSkip();
          }}
          className="absolute top-4 right-4 z-30 text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1"
          aria-label="Skip onboarding story"
        >
          Skip
        </button>
      )}

      {/* Animation area */}
      <div className="relative flex-1 w-full">
        <AnimatePresence mode="wait">
          {AnimComponent && currentScene && (
            <motion.div
              key={currentScene.scene_id}
              className="absolute inset-0"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? false : { opacity: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.35, ease: "easeInOut" }
              }
            >
              <AnimComponent
                isActive={true}
                reducedMotion={prefersReducedMotion}
                className="w-full h-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtitle bar */}
      {currentScene && (
        <div className="relative z-20 w-full mt-auto">
          <StorySubtitleBar
            text={currentScene.subtitle_text}
            sceneKey={currentScene.scene_id}
          />
        </div>
      )}

      {/* Replay button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          replayScene();
        }}
        className="absolute bottom-16 left-4 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Replay current scene"
        title="Replay"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M2 8a6 6 0 1 0 1.5-3.9L2 2.5V6h3.5L4.1 4.6A4.5 4.5 0 1 1 3.5 8H2Z"
            fill="white"
            opacity="0.7"
          />
        </svg>
      </button>
    </div>
  );
}
