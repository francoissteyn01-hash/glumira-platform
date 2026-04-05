import { describe, it, expect } from "vitest";
import { getSensoryConfig, filterHypoTreatments } from "./autism-sensory";
import { HYPO_TREATMENTS } from "@/data/hypo-treatments";

describe("autism-sensory", () => {
  describe("getSensoryConfig", () => {
    it("returns standard config", () => {
      const c = getSensoryConfig("standard");
      expect(c.animations).toBe("normal");
      expect(c.colorPalette).toBe("full");
      expect(c.maxVisibleItems).toBe(10);
      expect(c.touchTargetMin).toBe(44);
    });

    it("returns low_stimulation config", () => {
      const c = getSensoryConfig("low_stimulation");
      expect(c.animations).toBe("reduced");
      expect(c.colorPalette).toBe("muted");
      expect(c.maxVisibleItems).toBe(5);
      expect(c.touchTargetMin).toBe(56);
      expect(c.soundEnabled).toBe(false);
    });

    it("returns minimal config with animations none and 3 items", () => {
      const c = getSensoryConfig("minimal");
      expect(c.animations).toBe("none");
      expect(c.maxVisibleItems).toBe(3);
      expect(c.touchTargetMin).toBe(64);
      expect(c.colorPalette).toBe("monochrome");
    });
  });

  describe("filterHypoTreatments", () => {
    it("returns all treatments when no aversions given", () => {
      expect(filterHypoTreatments(HYPO_TREATMENTS, []).length).toBe(HYPO_TREATMENTS.length);
    });

    it("excludes treatments whose texture matches an aversion", () => {
      const filtered = filterHypoTreatments(HYPO_TREATMENTS, ["chalky"]);
      expect(filtered.every((t) => t.texture !== "chalky")).toBe(true);
      expect(filtered.length).toBeLessThan(HYPO_TREATMENTS.length);
    });

    it("excludes multiple texture aversions", () => {
      const filtered = filterHypoTreatments(HYPO_TREATMENTS, ["gel", "crunchy"]);
      expect(filtered.every((t) => t.texture !== "gel" && t.texture !== "crunchy")).toBe(true);
    });
  });
});
