/**
 * GluMira™ — useTTS Hook
 *
 * Manages ElevenLabs Text-to-Speech for StoryEngine scenes.
 * Fetches audio on scene load, plays it, and exposes playback state.
 *
 * Gracefully degrades to subtitle-only mode when:
 * - The ElevenLabs Voice ID is not configured
 * - The API key is not set
 * - The browser blocks audio autoplay
 * - The network request fails
 *
 * Onboarding 3 — Prompt 3 (Upgrade 1)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceStyle } from "@/components/onboarding/story-engine/types";
import {
  ELEVENLABS_API_BASE,
  ELEVENLABS_MODEL_ID,
  DEFAULT_VOICE_SETTINGS,
  getVoiceId,
  isTTSAvailable,
} from "@/components/onboarding/story-engine/voiceConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TTSStatus = "idle" | "loading" | "playing" | "paused" | "error" | "unavailable";

export interface UseTTSOptions {
  /** The voice style for this story — maps to an ElevenLabs Voice ID. */
  voiceStyle: VoiceStyle;
  /** Whether TTS is globally enabled by the user. */
  enabled?: boolean;
}

export interface UseTTSReturn {
  /** Current TTS playback status. */
  status: TTSStatus;
  /** Speak the given text. Cancels any in-progress speech. */
  speak: (text: string) => Promise<void>;
  /** Stop current speech immediately. */
  stop: () => void;
  /** Whether TTS is available for this voice style. */
  available: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useTTS — ElevenLabs TTS hook for StoryEngine.
 *
 * @example
 * const { speak, stop, status, available } = useTTS({ voiceStyle: "warm_neutral" });
 * await speak("Living with diabetes means making hundreds of decisions every day.");
 */
export function useTTS({ voiceStyle, enabled = true }: UseTTSOptions): UseTTSReturn {
  const [status, setStatus] = useState<TTSStatus>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const available = isTTSAvailable(voiceStyle) && enabled;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Stop and clean up current audio
  const stopAudio = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setStatus("idle");
  }, []);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      // Always stop previous speech first
      stopAudio();

      if (!available) {
        setStatus("unavailable");
        return;
      }

      const voiceId = getVoiceId(voiceStyle);
      if (!voiceId) {
        setStatus("unavailable");
        return;
      }

      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      if (!apiKey) {
        setStatus("unavailable");
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");

      try {
        const response = await fetch(
          `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}/stream`,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text,
              model_id: ELEVENLABS_MODEL_ID,
              voice_settings: DEFAULT_VOICE_SETTINGS,
            }),
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        if (controller.signal.aborted) return;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          setStatus("idle");
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setStatus("error");
        };

        setStatus("playing");
        await audio.play();
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Intentional abort — not an error
          return;
        }
        console.warn("[useTTS] TTS failed, falling back to subtitle-only mode:", err);
        setStatus("error");
      }
    },
    [available, voiceStyle, stopAudio]
  );

  return {
    status,
    speak,
    stop: stopAudio,
    available,
  };
}
