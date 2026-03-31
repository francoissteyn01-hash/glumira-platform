/**
 * GluMira™ StoryEngine — TypeScript Types
 *
 * Typed schema for all story script JSON fields.
 * Covers ProfileType enum, StoryScene, StoryScript,
 * single CTA and dual cta_options structures.
 *
 * Onboarding 3 — Prompt 3 (Upgrades 4 & 5)
 */

// ─── Profile Types ────────────────────────────────────────────────────────────

/**
 * All valid GluMira™ user profile types.
 * Maps 1:1 to story-[profile].json filenames and onboarding routes.
 */
export type ProfileType =
  | "patient"
  | "parent"
  | "child"
  | "teen"
  | "clinician"
  | "organisation"
  | "researcher";

/** Exhaustive array of all ProfileType values — use for iteration/validation. */
export const ALL_PROFILES: ProfileType[] = [
  "patient",
  "parent",
  "child",
  "teen",
  "clinician",
  "organisation",
  "researcher",
];

// ─── Voice Styles ─────────────────────────────────────────────────────────────

/**
 * Voice style identifiers — map to ElevenLabs Voice IDs via voiceConfig.ts.
 */
export type VoiceStyle =
  | "warm_neutral"
  | "warm_reassuring"
  | "friendly_upbeat"
  | "calm_peer"
  | "professional_measured"
  | "calm_authoritative";

// ─── Scene ────────────────────────────────────────────────────────────────────

/**
 * A single scene within a story script.
 *
 * - `duration_ms`    — how long the scene auto-displays before advancing
 * - `voice_text`     — full narration text sent to the TTS engine
 * - `subtitle_text`  — shorter text always shown in the subtitle bar
 * - `visual_id`      — maps to an animation component in /animations/
 * - `visual_note`    — design brief for the animation (not rendered)
 */
export interface StoryScene {
  scene_id: string;
  duration_ms: number;
  voice_text: string;
  subtitle_text: string;
  visual_id: string;
  visual_note: string;
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

/** Single call-to-action (used by all profiles except clinician). */
export interface StoryCTA {
  text: string;
  route: string;
}

// ─── Story Script ─────────────────────────────────────────────────────────────

/**
 * Full story script for a single profile.
 *
 * - `cta`         — used by patient, parent, child, teen, organisation, researcher
 * - `cta_options` — used by clinician (dual CTA); StoryEngine handles both
 *
 * Exactly one of `cta` or `cta_options` must be present.
 */
export interface StoryScript {
  profile: ProfileType;
  voice_style: VoiceStyle;
  total_duration_ms: number;
  scenes: StoryScene[];
  cta?: StoryCTA;
  cta_options?: StoryCTA[];
}

// ─── Engine Props ─────────────────────────────────────────────────────────────

/** Props accepted by the StoryEngine component. */
export interface StoryEngineProps {
  /** The user profile — determines which story script is loaded. */
  profile: ProfileType;
  /** Called when the user completes the story or taps the CTA. */
  onComplete?: (route: string) => void;
  /** Called when the user explicitly closes/skips the entire story. */
  onSkip?: () => void;
  /** Override auto-advance — useful for testing or accessibility modes. */
  autoAdvance?: boolean;
}

// ─── Animation Props ──────────────────────────────────────────────────────────

/** Props passed to every animation component stub. */
export interface AnimationProps {
  /** Whether the animation is currently the active scene. */
  isActive: boolean;
  /** Whether prefers-reduced-motion is active — show static frame if true. */
  reducedMotion: boolean;
  /** Optional className for layout overrides. */
  className?: string;
}
