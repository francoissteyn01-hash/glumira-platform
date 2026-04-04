/**
 * GluMira™ V7 — Voice configuration
 * Maps voice_style identifiers to Voice IDs (placeholder for Phase 1).
 * Will be replaced with real ElevenLabs Voice IDs in Phase 2.
 */

export interface VoiceConfig {
  id: string;
  name: string;
  description: string;
}

export const VOICE_MAP: Record<string, VoiceConfig> = {
  warm_reassuring: {
    id: "voice_ph_warm_reassuring_001",
    name: "Warm Reassuring",
    description: "Gentle, empathetic tone for caregivers and newly diagnosed",
  },
  calm_peer: {
    id: "voice_ph_calm_peer_002",
    name: "Calm Peer",
    description: "Relaxed, conversational tone for adult patients",
  },
  friendly_upbeat: {
    id: "voice_ph_friendly_upbeat_003",
    name: "Friendly Upbeat",
    description: "Energetic, encouraging tone for paediatric patients",
  },
  professional_measured: {
    id: "voice_ph_professional_measured_004",
    name: "Professional Measured",
    description: "Clear, concise clinical tone for clinicians",
  },
};

export function getVoiceId(voiceStyle: string): string {
  return VOICE_MAP[voiceStyle]?.id ?? "voice_ph_default_000";
}
