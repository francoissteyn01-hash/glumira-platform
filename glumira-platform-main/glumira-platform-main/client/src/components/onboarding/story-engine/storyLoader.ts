/**
 * GluMira™ StoryEngine — Dynamic Story Script Loader
 *
 * Lazy-loads the correct story-[profile].json file per profile using
 * Vite's dynamic import() for code-splitting. Each story script is
 * loaded only when that profile's onboarding is initiated.
 *
 * Onboarding 3 — Prompt 3 (Upgrade 6)
 */

import type { ProfileType, StoryScript } from "./types";

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Dynamically imports the story script for the given profile.
 *
 * Uses Vite glob imports with lazy loading so each JSON file is
 * code-split into its own chunk and never loaded until needed.
 *
 * @param profile - The ProfileType to load the story script for.
 * @returns A promise resolving to the typed StoryScript.
 * @throws Error if the profile has no matching story file.
 */
export async function loadStoryScript(
  profile: ProfileType
): Promise<StoryScript> {
  // Map profile to its JSON file via dynamic import.
  // The string literals are required for Vite's static analysis.
  switch (profile) {
    case "patient":
      return (
        await import("../../../../../content/scripts/story-patient.json")
      ).default as StoryScript;

    case "parent":
      return (
        await import("../../../../../content/scripts/story-parent.json")
      ).default as StoryScript;

    case "child":
      return (
        await import("../../../../../content/scripts/story-child.json")
      ).default as StoryScript;

    case "teen":
      return (
        await import("../../../../../content/scripts/story-teen.json")
      ).default as StoryScript;

    case "clinician":
      return (
        await import("../../../../../content/scripts/story-clinician.json")
      ).default as StoryScript;

    case "organisation":
      return (
        await import("../../../../../content/scripts/story-school.json")
      ).default as StoryScript;

    case "researcher":
      return (
        await import("../../../../../content/scripts/story-researcher.json")
      ).default as StoryScript;

    default: {
      const exhaustiveCheck: never = profile;
      throw new Error(
        `StoryLoader: No story script found for profile "${exhaustiveCheck}"`
      );
    }
  }
}

// ─── Prefetch ─────────────────────────────────────────────────────────────────

/**
 * Prefetches the story script for a profile without blocking.
 * Call this when the user hovers over or approaches the onboarding screen
 * to reduce perceived load time.
 */
export function prefetchStoryScript(profile: ProfileType): void {
  // Fire and forget — errors are silently ignored during prefetch
  loadStoryScript(profile).catch(() => {
    // Prefetch failure is non-critical
  });
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates that a loaded StoryScript has the minimum required fields.
 * Throws a descriptive error if the script is malformed.
 */
export function validateStoryScript(script: unknown): StoryScript {
  const s = script as Partial<StoryScript>;

  if (!s.profile) throw new Error("StoryScript missing: profile");
  if (!s.voice_style) throw new Error("StoryScript missing: voice_style");
  if (!s.total_duration_ms)
    throw new Error("StoryScript missing: total_duration_ms");
  if (!Array.isArray(s.scenes) || s.scenes.length === 0)
    throw new Error("StoryScript missing: scenes[]");

  const hasCta = !!s.cta;
  const hasCtaOptions = Array.isArray(s.cta_options) && s.cta_options.length > 0;

  if (!hasCta && !hasCtaOptions) {
    throw new Error("StoryScript missing: cta or cta_options");
  }

  return s as StoryScript;
}
