/**
 * GluMira™ StoryEngine — ElevenLabs Voice Configuration
 *
 * Maps each voice_style value to an ElevenLabs Voice ID.
 * Replace [SET_IN_CONFIG] placeholders with real Voice IDs from your
 * ElevenLabs project before deploying to production.
 *
 * Voice IDs are sourced from: https://elevenlabs.io/app/voice-library
 *
 * Onboarding 3 — Prompt 3 (Upgrade 2)
 */

import type { VoiceStyle } from "./types";

// ─── Voice ID Map ─────────────────────────────────────────────────────────────

/**
 * Maps VoiceStyle → ElevenLabs Voice ID string.
 *
 * Defaults ship as empty strings so the TTS hook gracefully degrades
 * to subtitle-only mode when IDs are not yet configured.
 */
export const VOICE_ID_MAP: Record<VoiceStyle, string> = {
  /**
   * warm_neutral — Patient profile
   * Tone: Calm, empowering, peer-level. Adult managing their own diabetes.
   * Suggested ElevenLabs voice: "Rachel" or "Bella"
   */
  warm_neutral: import.meta.env.VITE_ELEVENLABS_VOICE_WARM_NEUTRAL ?? "",

  /**
   * warm_reassuring — Parent profile
   * Tone: Warm, supportive, reassuring. Caregiver of a child with diabetes.
   * Suggested ElevenLabs voice: "Dorothy" or "Elli"
   */
  warm_reassuring: import.meta.env.VITE_ELEVENLABS_VOICE_WARM_REASSURING ?? "",

  /**
   * friendly_upbeat — Child profile (ages 8–14)
   * Tone: Playful, energetic, heroic. Higher energy delivery.
   * Suggested ElevenLabs voice: "Freya" or a younger-sounding voice
   */
  friendly_upbeat: import.meta.env.VITE_ELEVENLABS_VOICE_FRIENDLY_UPBEAT ?? "",

  /**
   * calm_peer — Teen profile (ages 15–18)
   * Tone: Minimal, cool, peer-level. No hand-holding.
   * Suggested ElevenLabs voice: "Adam" (young) or "Antoni"
   */
  calm_peer: import.meta.env.VITE_ELEVENLABS_VOICE_CALM_PEER ?? "",

  /**
   * professional_measured — Clinician + Researcher profiles
   * Tone: Precise, evidence-led, clinical. Time-constrained audience.
   * Suggested ElevenLabs voice: "Daniel" or "Arnold"
   */
  professional_measured:
    import.meta.env.VITE_ELEVENLABS_VOICE_PROFESSIONAL_MEASURED ?? "",

  /**
   * calm_authoritative — School / Organisation profile
   * Tone: Clear, procedural, safety-first. School nurse / administrator.
   * Suggested ElevenLabs voice: "Callum" or "George"
   */
  calm_authoritative:
    import.meta.env.VITE_ELEVENLABS_VOICE_CALM_AUTHORITATIVE ?? "",
};

// ─── TTS Settings ─────────────────────────────────────────────────────────────

/** ElevenLabs API base URL. */
export const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

/** Default model for all story narration. */
export const ELEVENLABS_MODEL_ID = "eleven_turbo_v2_5";

/** Default voice settings applied to all story narration. */
export const DEFAULT_VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true,
} as const;

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Returns the ElevenLabs Voice ID for a given voice style.
 * Returns null if the voice ID has not been configured (empty string).
 */
export function getVoiceId(voiceStyle: VoiceStyle): string | null {
  const id = VOICE_ID_MAP[voiceStyle];
  return id && id.length > 0 ? id : null;
}

/**
 * Returns true if TTS is available for the given voice style.
 * TTS is unavailable if the Voice ID env var is not set.
 */
export function isTTSAvailable(voiceStyle: VoiceStyle): boolean {
  return getVoiceId(voiceStyle) !== null;
}
