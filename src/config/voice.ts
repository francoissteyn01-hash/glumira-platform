/**
 * GluMira™ V7 — Voice style to Voice ID mapping
 * Placeholder IDs for Phase 1 — will be replaced with ElevenLabs voice IDs.
 */

export const VOICE_MAP: Record<string, string> = {
  warm_neutral:          "voice_ph_warm_neutral_001",
  warm_reassuring:       "voice_ph_warm_reassuring_002",
  friendly_upbeat:       "voice_ph_friendly_upbeat_003",
  calm_peer:             "voice_ph_calm_peer_004",
  professional_measured: "voice_ph_professional_measured_005",
  calm_authoritative:    "voice_ph_calm_authoritative_006",
};

export type VoiceStyle = keyof typeof VOICE_MAP;
