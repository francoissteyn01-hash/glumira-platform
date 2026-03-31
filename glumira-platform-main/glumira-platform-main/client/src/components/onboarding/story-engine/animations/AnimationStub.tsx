/**
 * GluMira™ StoryEngine — AnimationStub Base Component
 *
 * Renders a branded placeholder for any animation that has not yet been
 * implemented as a production Lottie/Framer Motion component.
 *
 * In production, replace each named stub with a real animation component.
 * This stub will never appear in production if all stubs are replaced.
 *
 * Onboarding 3 — Prompt 3 (Upgrade 3)
 */

import { motion } from "framer-motion";
import type { AnimationProps } from "../types";

interface AnimationStubProps extends AnimationProps {
  /** The visual_id string — displayed in the placeholder. */
  visualId: string;
  /** The design brief from visual_note — shown in dev mode only. */
  brief?: string;
  /** Background colour class (Tailwind) — varies by profile theme. */
  bgClass?: string;
  /** Accent colour class (Tailwind) — varies by profile theme. */
  accentClass?: string;
}

/**
 * AnimationStub renders a branded placeholder with:
 * - A pulsing GluMira™ owl icon (SVG inline)
 * - The visual_id label
 * - The design brief (dev mode only, hidden in production)
 * - A subtle Framer Motion entrance animation
 * - A static frame when reducedMotion is true
 */
export function AnimationStub({
  visualId,
  brief,
  isActive,
  reducedMotion,
  bgClass = "bg-[#1a2a5e]",
  accentClass = "text-[#2ab5c1]",
  className = "",
}: AnimationStubProps) {
  const isDev = import.meta.env.DEV;

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.97 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const pulseVariants = {
    idle: { scale: 1, opacity: 0.8 },
    pulse: {
      scale: [1, 1.06, 1],
      opacity: [0.8, 1, 0.8],
      transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <motion.div
      className={`relative flex flex-col items-center justify-center w-full h-full rounded-2xl overflow-hidden ${bgClass} ${className}`}
      variants={reducedMotion ? undefined : containerVariants}
      initial={reducedMotion ? undefined : "hidden"}
      animate={reducedMotion ? undefined : isActive ? "visible" : "hidden"}
      aria-hidden="true"
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(42,181,193,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Owl icon placeholder */}
      <motion.div
        variants={reducedMotion ? undefined : pulseVariants}
        initial="idle"
        animate={reducedMotion ? undefined : isActive ? "pulse" : "idle"}
        className="relative z-10 mb-4"
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Body */}
          <ellipse cx="32" cy="38" rx="18" ry="20" fill="#1a2a5e" stroke="#2ab5c1" strokeWidth="1.5" />
          {/* Head */}
          <ellipse cx="32" cy="20" rx="14" ry="13" fill="#1a2a5e" stroke="#2ab5c1" strokeWidth="1.5" />
          {/* Left eye */}
          <circle cx="26" cy="19" r="4.5" fill="#0d1b3e" stroke="#2ab5c1" strokeWidth="1.2" />
          <circle cx="26" cy="19" r="2" fill="#f59e0b" />
          {/* Right eye */}
          <circle cx="38" cy="19" r="4.5" fill="#0d1b3e" stroke="#2ab5c1" strokeWidth="1.2" />
          <circle cx="38" cy="19" r="2" fill="#f59e0b" />
          {/* Amber teardrop on forehead */}
          <ellipse cx="32" cy="11" rx="3" ry="4" fill="#f59e0b" opacity="0.9" />
          {/* Beak */}
          <polygon points="32,23 29,27 35,27" fill="#f59e0b" />
          {/* Wings */}
          <path d="M14 42 Q10 30 18 28 Q20 38 32 38" fill="#2ab5c1" opacity="0.35" />
          <path d="M50 42 Q54 30 46 28 Q44 38 32 38" fill="#2ab5c1" opacity="0.35" />
        </svg>
      </motion.div>

      {/* visual_id label */}
      <p className={`relative z-10 text-xs font-mono font-semibold tracking-widest uppercase ${accentClass} opacity-70`}>
        {visualId.replace(/^anim_/, "").replace(/_/g, " ")}
      </p>

      {/* Design brief — dev only */}
      {isDev && brief && (
        <p className="relative z-10 mt-3 max-w-xs text-center text-[11px] text-white/40 leading-relaxed px-4">
          {brief}
        </p>
      )}

      {/* "Animation pending" badge */}
      <span className="absolute bottom-3 right-3 z-10 text-[10px] font-mono text-white/20 uppercase tracking-widest">
        stub
      </span>
    </motion.div>
  );
}
