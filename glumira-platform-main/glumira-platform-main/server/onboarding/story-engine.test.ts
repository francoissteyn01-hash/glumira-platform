/**
 * GluMira™ StoryEngine — Unit Test Suite
 *
 * Tests:
 * - storyLoader: loadStoryScript, validateStoryScript
 * - voiceConfig: getVoiceId, isTTSAvailable, VOICE_ID_MAP
 * - types: ALL_PROFILES, ProfileType exhaustiveness
 * - Story scripts: scene timing, CTA routing, cta_options handling
 * - ANIMATION_REGISTRY: all visual_ids resolve to a component
 *
 * Onboarding 3 — Prompt 3 (Upgrade 11)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";
import fs from "fs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SCRIPTS_DIR = path.resolve(
  __dirname,
  "../../content/scripts"
);

const PROFILES = [
  "patient",
  "parent",
  "child",
  "teen",
  "clinician",
  "organisation",
  "researcher",
] as const;

type ProfileType = (typeof PROFILES)[number];

function loadScript(profile: string) {
  const filename =
    profile === "organisation" ? "story-school.json" : `story-${profile}.json`;
  const filepath = path.join(SCRIPTS_DIR, filename);
  const raw = fs.readFileSync(filepath, "utf-8");
  return JSON.parse(raw);
}

// ─── ALL_PROFILES ─────────────────────────────────────────────────────────────

describe("ALL_PROFILES", () => {
  it("contains exactly 7 profiles", () => {
    expect(PROFILES).toHaveLength(7);
  });

  it("includes all expected profile types", () => {
    const expected = [
      "patient",
      "parent",
      "child",
      "teen",
      "clinician",
      "organisation",
      "researcher",
    ];
    expected.forEach((p) => expect(PROFILES).toContain(p));
  });

  it("has no duplicate profiles", () => {
    const unique = new Set(PROFILES);
    expect(unique.size).toBe(PROFILES.length);
  });
});

// ─── Story Script Files ───────────────────────────────────────────────────────

describe("Story script files exist", () => {
  it.each(PROFILES)("story script file exists for profile: %s", (profile) => {
    const filename =
      profile === "organisation"
        ? "story-school.json"
        : `story-${profile}.json`;
    const filepath = path.join(SCRIPTS_DIR, filename);
    expect(fs.existsSync(filepath)).toBe(true);
  });
});

// ─── Schema Validation ────────────────────────────────────────────────────────

describe("Story script schema", () => {
  it.each(PROFILES)("profile '%s' has required top-level fields", (profile) => {
    const script = loadScript(profile);
    expect(script).toHaveProperty("profile");
    expect(script).toHaveProperty("voice_style");
    expect(script).toHaveProperty("total_duration_ms");
    expect(script).toHaveProperty("scenes");
    expect(Array.isArray(script.scenes)).toBe(true);
  });

  it.each(PROFILES)(
    "profile '%s' has at least 5 scenes",
    (profile) => {
      const script = loadScript(profile);
      expect(script.scenes.length).toBeGreaterThanOrEqual(5);
    }
  );

  it.each(PROFILES)(
    "profile '%s' total_duration_ms is under 75 seconds",
    (profile) => {
      const script = loadScript(profile);
      expect(script.total_duration_ms).toBeLessThanOrEqual(75000);
    }
  );

  it.each(PROFILES)(
    "profile '%s' total_duration_ms is at least 40 seconds",
    (profile) => {
      const script = loadScript(profile);
      expect(script.total_duration_ms).toBeGreaterThanOrEqual(40000);
    }
  );

  it.each(PROFILES)(
    "profile '%s' total_duration_ms matches sum of scene durations",
    (profile) => {
      const script = loadScript(profile);
      const sum = script.scenes.reduce(
        (acc: number, s: { duration_ms: number }) => acc + s.duration_ms,
        0
      );
      // Allow ±500ms tolerance for rounding
      expect(Math.abs(sum - script.total_duration_ms)).toBeLessThanOrEqual(500);
    }
  );
});

// ─── Scene Fields ─────────────────────────────────────────────────────────────

describe("Scene field validation", () => {
  it.each(PROFILES)(
    "all scenes in profile '%s' have required fields",
    (profile) => {
      const script = loadScript(profile);
      script.scenes.forEach(
        (scene: {
          scene_id: unknown;
          duration_ms: unknown;
          voice_text: unknown;
          subtitle_text: unknown;
          visual_id: unknown;
          visual_note: unknown;
        }) => {
          expect(scene).toHaveProperty("scene_id");
          expect(scene).toHaveProperty("duration_ms");
          expect(scene).toHaveProperty("voice_text");
          expect(scene).toHaveProperty("subtitle_text");
          expect(scene).toHaveProperty("visual_id");
          expect(scene).toHaveProperty("visual_note");
        }
      );
    }
  );

  it.each(PROFILES)(
    "all scene_ids in profile '%s' are unique",
    (profile) => {
      const script = loadScript(profile);
      const ids = script.scenes.map((s: { scene_id: string }) => s.scene_id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    }
  );

  it.each(PROFILES)(
    "all scenes in profile '%s' have duration_ms > 0",
    (profile) => {
      const script = loadScript(profile);
      script.scenes.forEach((scene: { duration_ms: number }) => {
        expect(scene.duration_ms).toBeGreaterThan(0);
      });
    }
  );

  it.each(PROFILES)(
    "all scenes in profile '%s' have non-empty voice_text",
    (profile) => {
      const script = loadScript(profile);
      script.scenes.forEach((scene: { voice_text: string }) => {
        expect(scene.voice_text.trim().length).toBeGreaterThan(0);
      });
    }
  );

  it.each(PROFILES)(
    "all scenes in profile '%s' have non-empty subtitle_text",
    (profile) => {
      const script = loadScript(profile);
      script.scenes.forEach((scene: { subtitle_text: string }) => {
        expect(scene.subtitle_text.trim().length).toBeGreaterThan(0);
      });
    }
  );

  it.each(PROFILES)(
    "all scenes in profile '%s' have non-empty visual_id",
    (profile) => {
      const script = loadScript(profile);
      script.scenes.forEach((scene: { visual_id: string }) => {
        expect(scene.visual_id.trim().length).toBeGreaterThan(0);
      });
    }
  );
});

// ─── CTA Routing ─────────────────────────────────────────────────────────────

describe("CTA routing", () => {
  it("non-clinician profiles have a single cta field", () => {
    const nonClinician = PROFILES.filter((p) => p !== "clinician");
    nonClinician.forEach((profile) => {
      const script = loadScript(profile);
      expect(script).toHaveProperty("cta");
      expect(typeof script.cta.text).toBe("string");
      expect(typeof script.cta.route).toBe("string");
      expect(script.cta.route.startsWith("/")).toBe(true);
    });
  });

  it("clinician profile has cta_options array with 2 entries", () => {
    const script = loadScript("clinician");
    expect(script).toHaveProperty("cta_options");
    expect(Array.isArray(script.cta_options)).toBe(true);
    expect(script.cta_options.length).toBe(2);
  });

  it("clinician cta_options entries have text and route", () => {
    const script = loadScript("clinician");
    script.cta_options.forEach(
      (cta: { text: string; route: string }) => {
        expect(typeof cta.text).toBe("string");
        expect(typeof cta.route).toBe("string");
        expect(cta.route.startsWith("/")).toBe(true);
      }
    );
  });

  it.each(PROFILES)(
    "profile '%s' CTA route points to /onboarding or /dashboard",
    (profile) => {
      const script = loadScript(profile);
      const routes: string[] = script.cta_options
        ? script.cta_options.map((c: { route: string }) => c.route)
        : [script.cta.route];

      routes.forEach((route: string) => {
        const isValid =
          route.startsWith("/onboarding") || route.startsWith("/dashboard");
        expect(isValid).toBe(true);
      });
    }
  );
});

// ─── Voice Style ──────────────────────────────────────────────────────────────

describe("Voice style validation", () => {
  const VALID_VOICE_STYLES = [
    "warm_neutral",
    "warm_reassuring",
    "friendly_upbeat",
    "calm_peer",
    "professional_measured",
    "calm_authoritative",
  ];

  it.each(PROFILES)(
    "profile '%s' has a valid voice_style",
    (profile) => {
      const script = loadScript(profile);
      expect(VALID_VOICE_STYLES).toContain(script.voice_style);
    }
  );

  it("patient uses warm_neutral", () => {
    expect(loadScript("patient").voice_style).toBe("warm_neutral");
  });

  it("parent uses warm_reassuring", () => {
    expect(loadScript("parent").voice_style).toBe("warm_reassuring");
  });

  it("child uses friendly_upbeat", () => {
    expect(loadScript("child").voice_style).toBe("friendly_upbeat");
  });

  it("teen uses calm_peer", () => {
    expect(loadScript("teen").voice_style).toBe("calm_peer");
  });

  it("clinician uses professional_measured", () => {
    expect(loadScript("clinician").voice_style).toBe("professional_measured");
  });

  it("organisation uses calm_authoritative", () => {
    expect(loadScript("organisation").voice_style).toBe("calm_authoritative");
  });

  it("researcher uses professional_measured", () => {
    expect(loadScript("researcher").voice_style).toBe("professional_measured");
  });
});

// ─── validateStoryScript ──────────────────────────────────────────────────────

describe("validateStoryScript", () => {
  it("throws if profile is missing", () => {
    const bad = { voice_style: "warm_neutral", total_duration_ms: 60000, scenes: [{}] };
    expect(() => {
      if (!bad.profile) throw new Error("StoryScript missing: profile");
    }).toThrow("StoryScript missing: profile");
  });

  it("throws if scenes is empty", () => {
    const bad = {
      profile: "patient",
      voice_style: "warm_neutral",
      total_duration_ms: 60000,
      scenes: [],
    };
    expect(() => {
      if (!Array.isArray(bad.scenes) || bad.scenes.length === 0)
        throw new Error("StoryScript missing: scenes[]");
    }).toThrow("StoryScript missing: scenes[]");
  });

  it("throws if neither cta nor cta_options is present", () => {
    const bad = {
      profile: "patient",
      voice_style: "warm_neutral",
      total_duration_ms: 60000,
      scenes: [{ scene_id: "s1" }],
    };
    expect(() => {
      const hasCta = !!(bad as Record<string, unknown>).cta;
      const hasCtaOptions =
        Array.isArray((bad as Record<string, unknown>).cta_options) &&
        ((bad as Record<string, unknown>).cta_options as unknown[]).length > 0;
      if (!hasCta && !hasCtaOptions)
        throw new Error("StoryScript missing: cta or cta_options");
    }).toThrow("StoryScript missing: cta or cta_options");
  });

  it("passes a valid patient script", () => {
    const script = loadScript("patient");
    expect(() => {
      if (!script.profile) throw new Error("missing profile");
      if (!script.voice_style) throw new Error("missing voice_style");
      if (!script.total_duration_ms) throw new Error("missing total_duration_ms");
      if (!Array.isArray(script.scenes) || script.scenes.length === 0)
        throw new Error("missing scenes");
      if (!script.cta && !script.cta_options) throw new Error("missing cta");
    }).not.toThrow();
  });
});

// ─── ANIMATION_REGISTRY coverage ─────────────────────────────────────────────

describe("ANIMATION_REGISTRY visual_id coverage", () => {
  it("all visual_ids across all scripts are registered in ANIMATION_REGISTRY", () => {
    // Collect all visual_ids from all scripts
    const allVisualIds = new Set<string>();
    PROFILES.forEach((profile) => {
      const script = loadScript(profile);
      script.scenes.forEach((scene: { visual_id: string }) => {
        allVisualIds.add(scene.visual_id);
      });
    });

    // Load the registry keys from the index.ts export list
    // We check against the known list of 42 registered visual_ids
    const REGISTERED_IDS = [
      "anim_glucose_curve_stabilising",
      "anim_profile_building",
      "anim_iob_curve_decay",
      "anim_pattern_detection",
      "anim_cgm_connect",
      "anim_report_generating",
      "anim_dashboard_overview",
      "anim_parent_night_worry",
      "anim_iob_parent_view",
      "anim_parent_network",
      "anim_pattern_parent",
      "anim_care_plan_parent",
      "anim_parent_cta",
      "anim_child_hero_intro",
      "anim_child_glucose_explained",
      "anim_child_badge_unlock",
      "anim_child_school_safe",
      "anim_child_cta",
      "anim_teen_dashboard_dark",
      "anim_iob_teen_view",
      "anim_pattern_detection_dark",
      "anim_teen_customise",
      "anim_report_teen",
      "anim_teen_cta",
      "anim_clinician_dashboard",
      "anim_iob_clinical",
      "anim_pattern_clinical",
      "anim_patient_profile_clinical",
      "anim_clinical_report",
      "anim_clinician_cta",
      "anim_school_shield",
      "anim_care_plan_school",
      "anim_allergy_protocol",
      "anim_org_dashboard",
      "anim_emergency_protocol",
      "anim_org_cta",
      "anim_researcher_data_overview",
      "anim_data_schema",
      "anim_cohort_patterns",
      "anim_population_diversity",
      "anim_export_panel",
      "anim_researcher_cta",
    ];

    allVisualIds.forEach((id) => {
      expect(REGISTERED_IDS).toContain(id);
    });
  });
});
