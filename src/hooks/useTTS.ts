/**
 * GluMira™ V7 — useTTS hook (stub for Phase 1)
 * Logs voice_text to console. Does not call any API.
 * Will be replaced with ElevenLabs / browser TTS in Phase 2.
 */

import { useCallback } from "react";

export function useTTS(voiceStyle: string) {
  const speak = useCallback(
    (text: string) => {
      console.log(`[TTS][${voiceStyle}]`, text);
    },
    [voiceStyle]
  );

  const stop = useCallback(() => {
    console.log("[TTS] stop");
  }, []);

  return { speak, stop };
}
