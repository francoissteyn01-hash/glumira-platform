/**
 * GluMira V7 — Autism sensory configuration helpers
 * Provides per-mode UI parameters and hypo-treatment filtering.
 */
import type { HypoTreatment } from "@/data/hypo-treatments";

export type SensoryMode = "standard" | "low_stimulation" | "minimal";

export interface SensoryConfig {
  animations: "normal" | "reduced" | "none";
  colorPalette: "full" | "muted" | "monochrome";
  soundEnabled: boolean;
  maxVisibleItems: number;
  touchTargetMin: number;
  layoutColumns: number;
  transitionSpeed: number;
  useIcons: boolean;
  fontSizeMultiplier: number;
}

export function getSensoryConfig(mode: SensoryMode): SensoryConfig {
  switch (mode) {
    case "low_stimulation":
      return {
        animations: "reduced",
        colorPalette: "muted",
        soundEnabled: false,
        maxVisibleItems: 5,
        touchTargetMin: 56,
        layoutColumns: 1,
        transitionSpeed: 500,
        useIcons: true,
        fontSizeMultiplier: 1.1,
      };
    case "minimal":
      return {
        animations: "none",
        colorPalette: "monochrome",
        soundEnabled: false,
        maxVisibleItems: 3,
        touchTargetMin: 64,
        layoutColumns: 1,
        transitionSpeed: 0,
        useIcons: false,
        fontSizeMultiplier: 1.2,
      };
    case "standard":
    default:
      return {
        animations: "normal",
        colorPalette: "full",
        soundEnabled: true,
        maxVisibleItems: 10,
        touchTargetMin: 44,
        layoutColumns: 2,
        transitionSpeed: 300,
        useIcons: true,
        fontSizeMultiplier: 1,
      };
  }
}

/**
 * Filter hypo treatments, removing any whose texture or taste matches
 * an entry in the user's aversions list (case-insensitive substring match).
 */
export function filterHypoTreatments(
  treatments: HypoTreatment[],
  aversions: string[]
): HypoTreatment[] {
  if (!aversions || aversions.length === 0) return treatments;
  const lower = aversions.map((a) => a.toLowerCase().trim()).filter(Boolean);
  if (lower.length === 0) return treatments;
  return treatments.filter((t) => {
    const tex = t.texture.toLowerCase();
    const taste = t.taste.toLowerCase();
    return !lower.some((a) => tex.includes(a) || a.includes(tex) || taste.includes(a));
  });
}
