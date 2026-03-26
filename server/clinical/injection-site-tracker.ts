/**
 * GluMira™ — Injection Site Rotation Tracker Module
 *
 * Tracks injection/infusion site usage and provides rotation
 * recommendations to prevent lipohypertrophy and ensure
 * consistent insulin absorption.
 *
 * Clinical relevance:
 * - Lipohypertrophy affects 30-50% of insulin users
 * - Poor rotation leads to erratic absorption and glucose variability
 * - Systematic rotation improves outcomes
 *
 * NOT a medical device. Educational purposes only.
 */

export type BodySite = "abdomen-left" | "abdomen-right" | "thigh-left" | "thigh-right" |
  "arm-left" | "arm-right" | "buttock-left" | "buttock-right";

export interface InjectionRecord {
  timestampUtc: string;
  site: BodySite;
  injectionType: "bolus" | "basal" | "infusion-set";
  units?: number;
  notes?: string;
}

export interface SiteUsage {
  site: BodySite;
  count: number;
  percentOfTotal: number;
  lastUsed: string | null;
  daysSinceLastUse: number | null;
  overused: boolean;
  underused: boolean;
}

export interface RotationResult {
  siteUsage: SiteUsage[];
  totalInjections: number;
  daysCovered: number;
  rotationScore: number;           // 0-100 (100 = perfect rotation)
  rotationQuality: "excellent" | "good" | "fair" | "poor";
  mostUsedSite: string | null;
  leastUsedSite: string | null;
  suggestedNextSite: BodySite;
  overusedSites: string[];
  warnings: string[];
  tips: string[];
  disclaimer: string;
}

const ALL_SITES: BodySite[] = [
  "abdomen-left", "abdomen-right", "thigh-left", "thigh-right",
  "arm-left", "arm-right", "buttock-left", "buttock-right",
];

/* ── Main tracker ────────────────────────────────────────────── */

export function analyzeRotation(records: InjectionRecord[]): RotationResult {
  if (records.length === 0) {
    return {
      siteUsage: ALL_SITES.map((site) => ({
        site,
        count: 0,
        percentOfTotal: 0,
        lastUsed: null,
        daysSinceLastUse: null,
        overused: false,
        underused: false,
      })),
      totalInjections: 0,
      daysCovered: 0,
      rotationScore: 0,
      rotationQuality: "poor",
      mostUsedSite: null,
      leastUsedSite: null,
      suggestedNextSite: "abdomen-left",
      overusedSites: [],
      warnings: ["No injection records found. Start logging to track rotation."],
      tips: ["Log each injection with its site to build a rotation history."],
      disclaimer: "GluMira™ is NOT a medical device.",
    };
  }

  const now = new Date();

  // ── Count per site ──
  const siteCounts = new Map<BodySite, { count: number; lastUsed: Date }>();
  ALL_SITES.forEach((s) => siteCounts.set(s, { count: 0, lastUsed: new Date(0) }));

  records.forEach((r) => {
    const entry = siteCounts.get(r.site)!;
    entry.count++;
    const ts = new Date(r.timestampUtc);
    if (ts > entry.lastUsed) entry.lastUsed = ts;
  });

  const total = records.length;
  const idealPercent = 100 / ALL_SITES.length; // 12.5% each

  // ── Site usage analysis ──
  const siteUsage: SiteUsage[] = ALL_SITES.map((site) => {
    const data = siteCounts.get(site)!;
    const percentOfTotal = total > 0 ? Math.round((data.count / total) * 1000) / 10 : 0;
    const daysSinceLastUse = data.count > 0
      ? Math.round((now.getTime() - data.lastUsed.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    return {
      site,
      count: data.count,
      percentOfTotal,
      lastUsed: data.count > 0 ? data.lastUsed.toISOString() : null,
      daysSinceLastUse,
      overused: percentOfTotal > idealPercent * 2,
      underused: data.count === 0 || percentOfTotal < idealPercent * 0.3,
    };
  });

  // ── Days covered ──
  const timestamps = records.map((r) => new Date(r.timestampUtc).getTime());
  const daysCovered = Math.max(1, Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / (24 * 60 * 60 * 1000)));

  // ── Rotation score ──
  // Perfect rotation = equal distribution across all sites
  const usedSites = siteUsage.filter((s) => s.count > 0);
  const siteVariance = siteUsage.reduce((sum, s) => {
    const diff = s.percentOfTotal - idealPercent;
    return sum + diff * diff;
  }, 0) / ALL_SITES.length;

  const diversityScore = Math.min(100, Math.round((usedSites.length / ALL_SITES.length) * 50));
  const evenScore = Math.max(0, Math.round(50 - siteVariance / 5));
  const rotationScore = Math.min(100, diversityScore + evenScore);

  let rotationQuality: RotationResult["rotationQuality"];
  if (rotationScore >= 80) rotationQuality = "excellent";
  else if (rotationScore >= 60) rotationQuality = "good";
  else if (rotationScore >= 40) rotationQuality = "fair";
  else rotationQuality = "poor";

  // ── Most/least used ──
  const sortedByCount = [...siteUsage].sort((a, b) => b.count - a.count);
  const mostUsedSite = sortedByCount[0].count > 0 ? sortedByCount[0].site : null;
  const leastUsedSite = sortedByCount[sortedByCount.length - 1].site;

  // ── Suggested next site ──
  // Pick the least recently used site that isn't overused
  const sortedByRecency = [...siteUsage]
    .filter((s) => !s.overused)
    .sort((a, b) => {
      if (a.daysSinceLastUse === null) return -1;
      if (b.daysSinceLastUse === null) return 1;
      return b.daysSinceLastUse - a.daysSinceLastUse;
    });
  const suggestedNextSite = sortedByRecency.length > 0 ? sortedByRecency[0].site : "abdomen-left";

  // ── Overused sites ──
  const overusedSites = siteUsage.filter((s) => s.overused).map((s) => s.site);

  // ── Warnings ──
  const warnings: string[] = [];
  if (overusedSites.length > 0) {
    warnings.push(`Overused sites: ${overusedSites.join(", ")}. Risk of lipohypertrophy — rotate away from these areas.`);
  }
  if (usedSites.length <= 2 && total >= 10) {
    warnings.push("Only using 1-2 sites. This significantly increases lipohypertrophy risk.");
  }

  // ── Tips ──
  const tips: string[] = [];
  tips.push("Rotate injection sites in a systematic pattern (e.g., clockwise around the abdomen).");
  tips.push("Leave at least 2cm between injection points within the same site.");
  if (usedSites.length < ALL_SITES.length) {
    const unused = siteUsage.filter((s) => s.count === 0).map((s) => s.site);
    tips.push(`Consider using these unused sites: ${unused.join(", ")}.`);
  }
  tips.push("Check injection sites regularly for lumps or hard areas (lipohypertrophy).");

  return {
    siteUsage,
    totalInjections: total,
    daysCovered,
    rotationScore,
    rotationQuality,
    mostUsedSite,
    leastUsedSite,
    suggestedNextSite,
    overusedSites,
    warnings,
    tips,
    disclaimer:
      "GluMira™ is an informational and educational tool only. It is NOT a medical device. " +
      "Discuss injection site concerns with your diabetes care team.",
  };
}
