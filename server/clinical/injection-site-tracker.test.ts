import { describe, it, expect } from "vitest";
import { analyzeRotation, type InjectionRecord, type BodySite } from "./injection-site-tracker";

/* ── helpers ─────────────────────────────────────────────────── */
function mkRecords(site: BodySite, count: number, daysAgo: number = 0): InjectionRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    timestampUtc: new Date(Date.now() - (daysAgo * 24 + i) * 60 * 60 * 1000).toISOString(),
    site,
    injectionType: "bolus" as const,
    units: 5,
  }));
}

function mkBalancedRecords(): InjectionRecord[] {
  const sites: BodySite[] = [
    "abdomen-left", "abdomen-right", "thigh-left", "thigh-right",
    "arm-left", "arm-right", "buttock-left", "buttock-right",
  ];
  return sites.flatMap((site, i) => mkRecords(site, 5, i));
}

/* ── Empty ───────────────────────────────────────────────────── */
describe("analyzeRotation — empty", () => {
  it("handles no records", () => {
    const r = analyzeRotation([]);
    expect(r.totalInjections).toBe(0);
    expect(r.rotationScore).toBe(0);
  });
});

/* ── Site usage ──────────────────────────────────────────────── */
describe("analyzeRotation — site usage", () => {
  it("counts injections per site", () => {
    const records = mkRecords("abdomen-left", 10);
    const r = analyzeRotation(records);
    const abdLeft = r.siteUsage.find((s) => s.site === "abdomen-left")!;
    expect(abdLeft.count).toBe(10);
  });

  it("calculates percentage", () => {
    const records = mkRecords("abdomen-left", 10);
    const r = analyzeRotation(records);
    const abdLeft = r.siteUsage.find((s) => s.site === "abdomen-left")!;
    expect(abdLeft.percentOfTotal).toBe(100);
  });

  it("tracks last used", () => {
    const records = mkRecords("abdomen-left", 5);
    const r = analyzeRotation(records);
    const abdLeft = r.siteUsage.find((s) => s.site === "abdomen-left")!;
    expect(abdLeft.lastUsed).not.toBeNull();
  });
});

/* ── Overuse detection ───────────────────────────────────────── */
describe("analyzeRotation — overuse", () => {
  it("flags overused sites", () => {
    const records = [
      ...mkRecords("abdomen-left", 20),
      ...mkRecords("abdomen-right", 2),
      ...mkRecords("thigh-left", 2),
    ];
    const r = analyzeRotation(records);
    expect(r.overusedSites).toContain("abdomen-left");
  });

  it("no overuse for balanced rotation", () => {
    const r = analyzeRotation(mkBalancedRecords());
    expect(r.overusedSites.length).toBe(0);
  });
});

/* ── Rotation score ──────────────────────────────────────────── */
describe("analyzeRotation — rotation score", () => {
  it("high score for balanced rotation", () => {
    const r = analyzeRotation(mkBalancedRecords());
    expect(r.rotationScore).toBeGreaterThanOrEqual(60);
    expect(["excellent", "good"]).toContain(r.rotationQuality);
  });

  it("low score for single-site use", () => {
    const records = mkRecords("abdomen-left", 20);
    const r = analyzeRotation(records);
    expect(r.rotationScore).toBeLessThan(40);
    expect(r.rotationQuality).toBe("poor");
  });
});

/* ── Most/least used ─────────────────────────────────────────── */
describe("analyzeRotation — most/least used", () => {
  it("identifies most used site", () => {
    const records = [
      ...mkRecords("abdomen-left", 15),
      ...mkRecords("thigh-left", 5),
    ];
    const r = analyzeRotation(records);
    expect(r.mostUsedSite).toBe("abdomen-left");
  });

  it("identifies least used site", () => {
    const r = analyzeRotation(mkBalancedRecords());
    expect(r.leastUsedSite).not.toBeNull();
  });
});

/* ── Suggested next site ─────────────────────────────────────── */
describe("analyzeRotation — suggestion", () => {
  it("suggests unused site", () => {
    const records = mkRecords("abdomen-left", 10);
    const r = analyzeRotation(records);
    expect(r.suggestedNextSite).not.toBe("abdomen-left");
  });

  it("returns a valid site", () => {
    const r = analyzeRotation(mkBalancedRecords());
    const allSites = ["abdomen-left", "abdomen-right", "thigh-left", "thigh-right", "arm-left", "arm-right", "buttock-left", "buttock-right"];
    expect(allSites).toContain(r.suggestedNextSite);
  });
});

/* ── Warnings ────────────────────────────────────────────────── */
describe("analyzeRotation — warnings", () => {
  it("warns for overused sites", () => {
    const records = [
      ...mkRecords("abdomen-left", 20),
      ...mkRecords("abdomen-right", 2),
    ];
    const r = analyzeRotation(records);
    expect(r.warnings.some((w) => w.includes("Overused") || w.includes("lipohypertrophy"))).toBe(true);
  });

  it("warns for limited site usage", () => {
    const records = [
      ...mkRecords("abdomen-left", 8),
      ...mkRecords("abdomen-right", 8),
    ];
    const r = analyzeRotation(records);
    expect(r.warnings.some((w) => w.includes("1-2 sites"))).toBe(true);
  });
});

/* ── Tips ────────────────────────────────────────────────────── */
describe("analyzeRotation — tips", () => {
  it("always provides rotation tips", () => {
    const r = analyzeRotation(mkBalancedRecords());
    expect(r.tips.length).toBeGreaterThan(0);
  });

  it("suggests unused sites", () => {
    const records = mkRecords("abdomen-left", 10);
    const r = analyzeRotation(records);
    expect(r.tips.some((t) => t.includes("unused sites"))).toBe(true);
  });
});

/* ── Disclaimer ──────────────────────────────────────────────── */
describe("analyzeRotation — disclaimer", () => {
  it("includes disclaimer", () => {
    const r = analyzeRotation([]);
    expect(r.disclaimer).toContain("educational platform");
  });
});
