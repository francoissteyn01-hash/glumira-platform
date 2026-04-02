/**
 * GluMira™ V7 — useStoryPlayer hook
 * State machine: LOADING | PLAYING | TRANSITIONING | REPLAYING | PAUSED | COMPLETE | ERROR
 */

import { useState, useRef, useCallback, useEffect } from "react";

export type StoryState = "LOADING" | "PLAYING" | "TRANSITIONING" | "REPLAYING" | "PAUSED" | "COMPLETE" | "ERROR";

export interface Scene {
  id: string;
  visual_id: string;
  visual_note: string;
  subtitle_text: string;
  voice_text: string;
  duration_ms: number;
  cta?: { label: string; href: string };
  cta_options?: { label: string; href: string }[];
}

export interface StoryData {
  profile_type: string;
  voice_style: string;
  total_duration_ms: number;
  scenes: Scene[];
}

interface PlayerState {
  state: StoryState;
  sceneIndex: number;
  elapsed: number;          // ms elapsed in current scene
  totalElapsed: number;     // ms elapsed across all scenes
  scenesViewed: string[];
  scenesSkipped: string[];
  scenesReplayed: string[];
}

export function useStoryPlayer(story: StoryData | null, reducedMotion: boolean) {
  const [player, setPlayer] = useState<PlayerState>({
    state: story ? "PLAYING" : "LOADING",
    sceneIndex: 0,
    elapsed: 0,
    totalElapsed: 0,
    scenesViewed: [],
    scenesSkipped: [],
    scenesReplayed: [],
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const TICK = 100; // ms

  const scene = story?.scenes[player.sceneIndex] ?? null;
  const sceneDuration = reducedMotion ? 4000 : (scene?.duration_ms ?? 5000);
  const totalDuration = story?.total_duration_ms ?? 1;
  const progress = Math.min(1, player.totalElapsed / totalDuration);

  // Start / resume ticking
  useEffect(() => {
    if (!story) return;
    if (player.state !== "PLAYING" && player.state !== "REPLAYING") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setPlayer((p) => {
        const newElapsed = p.elapsed + TICK;
        const newTotalElapsed = p.totalElapsed + TICK;

        if (newElapsed >= sceneDuration) {
          // Auto-advance
          const nextIndex = p.sceneIndex + 1;
          if (nextIndex >= (story?.scenes.length ?? 0)) {
            return { ...p, state: "COMPLETE", elapsed: newElapsed, totalElapsed: newTotalElapsed };
          }
          const nextScene = story!.scenes[nextIndex];
          return {
            ...p,
            state: "PLAYING",
            sceneIndex: nextIndex,
            elapsed: 0,
            totalElapsed: newTotalElapsed,
            scenesViewed: [...p.scenesViewed, nextScene.id],
          };
        }

        return { ...p, elapsed: newElapsed, totalElapsed: newTotalElapsed };
      });
    }, TICK);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [player.state, player.sceneIndex, story, sceneDuration]);

  // Mark first scene as viewed on load
  useEffect(() => {
    if (story && player.scenesViewed.length === 0 && story.scenes.length > 0) {
      setPlayer((p) => ({ ...p, state: "PLAYING", scenesViewed: [story.scenes[0].id] }));
    }
  }, [story]);

  const advance = useCallback(() => {
    if (!story) return;
    setPlayer((p) => {
      if (p.state === "COMPLETE") return p;
      const nextIndex = p.sceneIndex + 1;
      if (nextIndex >= story.scenes.length) {
        return { ...p, state: "COMPLETE", scenesSkipped: [...p.scenesSkipped, scene?.id ?? ""] };
      }
      const nextScene = story.scenes[nextIndex];
      return {
        ...p,
        state: "PLAYING",
        sceneIndex: nextIndex,
        elapsed: 0,
        scenesViewed: [...p.scenesViewed, nextScene.id],
        scenesSkipped: [...p.scenesSkipped, scene?.id ?? ""],
      };
    });
  }, [story, scene]);

  const replay = useCallback(() => {
    if (!scene) return;
    setPlayer((p) => ({
      ...p,
      state: "REPLAYING",
      elapsed: 0,
      scenesReplayed: [...p.scenesReplayed, scene.id],
    }));
  }, [scene]);

  const pause = useCallback(() => {
    setPlayer((p) => (p.state === "PLAYING" ? { ...p, state: "PAUSED" } : p));
  }, []);

  const resume = useCallback(() => {
    setPlayer((p) => (p.state === "PAUSED" ? { ...p, state: "PLAYING" } : p));
  }, []);

  return {
    ...player,
    scene,
    progress,
    totalDuration,
    advance,
    replay,
    pause,
    resume,
  };
}
