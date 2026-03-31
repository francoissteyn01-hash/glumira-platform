/**
 * GluMira™ StoryEngine — Story Progress Bar
 *
 * Renders a top progress bar that fills across total_duration_ms.
 * Shows individual scene markers as notches on the bar.
 * Animates smoothly using Framer Motion.
 * Respects prefers-reduced-motion.
 *
 * Onboarding 3 — Prompt 3 (Upgrade 10)
 */

import { motion, useReducedMotion } from "framer-motion";
import type { StoryScene } from "./types";

interface StoryProgressBarProps {
  /** All scenes in the current story. */
  scenes: StoryScene[];
  /** Total story duration in milliseconds. */
  totalDurationMs: number;
  /** Index of the currently active scene (0-based). */
  currentSceneIndex: number;
  /** Elapsed time within the current scene in milliseconds. */
  elapsedInSceneMs: number;
  /** Optional className for the outer container. */
  className?: string;
}

/**
 * StoryProgressBar renders a full-width progress bar with:
 * - A filled track that advances in real-time across total_duration_ms
 * - Scene marker notches at each scene boundary
 * - Completed scene segments shown at full opacity
 * - Current scene segment animated in real-time
 * - Reduced-motion fallback: instant jumps between scene markers
 */
export function StoryProgressBar({
  scenes,
  totalDurationMs,
  currentSceneIndex,
  elapsedInSceneMs,
  className = "",
}: StoryProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();

  // Calculate cumulative elapsed time including current scene progress
  const completedMs = scenes
    .slice(0, currentSceneIndex)
    .reduce((sum, s) => sum + s.duration_ms, 0);

  const totalElapsedMs = completedMs + elapsedInSceneMs;
  const progressPercent = Math.min(
    100,
    (totalElapsedMs / totalDurationMs) * 100
  );

  // Scene marker positions as percentages
  const markerPositions: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < scenes.length - 1; i++) {
    cumulative += scenes[i].duration_ms;
    markerPositions.push((cumulative / totalDurationMs) * 100);
  }

  return (
    <div
      className={`relative w-full h-1 bg-white/20 rounded-full overflow-visible ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(progressPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Story progress: scene ${currentSceneIndex + 1} of ${scenes.length}`}
    >
      {/* Filled track */}
      <motion.div
        className="absolute left-0 top-0 h-full bg-[#2ab5c1] rounded-full origin-left"
        style={{ width: `${progressPercent}%` }}
        animate={{ width: `${progressPercent}%` }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.25, ease: "linear" }
        }
      />

      {/* Scene marker notches */}
      {markerPositions.map((pos, i) => (
        <div
          key={i}
          className={`absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full transition-colors duration-200 ${
            i < currentSceneIndex ? "bg-[#2ab5c1]" : "bg-white/40"
          }`}
          style={{ left: `${pos}%` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
