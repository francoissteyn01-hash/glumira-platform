/**
 * GluMira™ V7 — Animation component registry
 * Maps visual_id strings to placeholder components.
 */

import PlaceholderAnimation from "./PlaceholderAnimation";

const VISUAL_NOTES: Record<string, string> = {
  owl_sentinel_reveal: "The GluMira\u2122 owl appears, watching over your data",
  insulin_curve_building: "An insulin activity curve draws itself across the screen",
  stacking_overlap_reveal: "Multiple doses stack and overlap zones illuminate",
  density_map_terrain: "A terrain-style density map shows insulin pressure across 24 hours",
  quiet_tail_highlight: "The quiet tail of long-acting insulin pulses gently",
  report_preview_slide: "A two-page PDF report slides into view",
  dashboard_walkthrough: "Dashboard widgets light up one by one",
  pattern_detection_demo: "Patterns are detected and highlighted in the data",
  safety_shield: "A safety shield forms around sensitive data",
  profile_complete_celebration: "Confetti and a completion badge appear",
};

export const ANIMATION_IDS = Object.keys(VISUAL_NOTES);

export function getAnimationProps(visualId: string, visualNote?: string) {
  return {
    visualNote: visualNote ?? VISUAL_NOTES[visualId] ?? "Animation placeholder",
    label: visualId,
  };
}

export { PlaceholderAnimation };
