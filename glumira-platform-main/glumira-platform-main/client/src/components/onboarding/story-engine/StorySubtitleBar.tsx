/**
 * GluMira™ StoryEngine — Story Subtitle Bar
 *
 * Persistent bottom bar that always displays subtitle_text.
 * Renders even when TTS is off or unavailable.
 * Animates on scene change with a subtle fade/slide.
 *
 * Onboarding 3 — Prompt 3 (Upgrade 1)
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface StorySubtitleBarProps {
  /** The subtitle text to display (from subtitle_text field). */
  text: string;
  /** Unique key — change this to trigger the entrance animation. */
  sceneKey: string;
  /** Optional className for the outer container. */
  className?: string;
}

/**
 * StorySubtitleBar renders a frosted-glass subtitle bar at the bottom
 * of the story viewport. Text fades in on each scene change.
 * Always visible — does not depend on TTS availability.
 */
export function StorySubtitleBar({
  text,
  sceneKey,
  className = "",
}: StorySubtitleBarProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`relative w-full px-6 py-4 ${className}`}
      style={{
        background:
          "linear-gradient(to top, rgba(13,27,62,0.92) 0%, rgba(13,27,62,0.0) 100%)",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={sceneKey}
          className="text-white text-base font-medium leading-snug text-center drop-shadow-sm"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? false : { opacity: 0, y: -4 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.3, ease: "easeOut" }
          }
          aria-live="polite"
          aria-atomic="true"
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
