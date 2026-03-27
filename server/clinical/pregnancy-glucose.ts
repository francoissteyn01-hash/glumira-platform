/**
 * GluMira™ — Pregnancy Glucose Targets Module
 *
 * Provides trimester-specific glucose targets, risk assessment,
 * and monitoring guidance for gestational and pre-existing diabetes
 * during pregnancy.
 *
 * Clinical relevance:
 * - Pregnancy tightens glucose targets significantly
 * - First trimester: increased hypo risk
 * - Second/third trimester: increasing insulin resistance
 * - Tight control reduces macrosomia, pre-eclampsia, neonatal hypo
 *
 * NOT a medical device. Educational purposes only.
 */

export interface PregnancyGlucoseInput {
  diabetesType: "type1" | "type2" | "gestational";
  trimester: 1 | 2 | 3;
  weeksGestation: number;
  recentReadings: { timestampUtc: string; glucoseMmol: number; tag: "fasting" | "pre-meal" | "1h-post" | "2h-post" | "bedtime" }[];
  currentA1c?: number;
  onInsulin: boolean;
  hypoEventsLastWeek: number;
}

export interface PregnancyTarget {
  context: string;
  targetMmol: { low: number; high: number };
  targetMgdl: { low: number; high: number };
}

export interface PregnancyRisk {
  risk: string;
  severity: "high" | "moderate" | "low";
  explanation: string;
}

export interface PregnancyGlucoseResult {
  targets: PregnancyTarget[];
  currentPerformance: {
    fastingMean: number | null;
    oneHourPostMean: number | null;
    twoHourPostMean: number | null;
    fastingInTarget: boolean | null;
    postMealInTarget: boolean | null;
  };
  a1cTarget: string;
  a1cStatus: string | null;
  risks: PregnancyRisk[];
  monitoringSchedule: string[];
  insulinNotes: string[];
  trimesterGuidance: string;
  warnings: string[];
  disclaimer: string;
}

/* ── Targets by context ──────────────────────────────────────── */

const PREGNANCY_TARGETS: PregnancyTarget[] = [
  {
    context: "Fasting",
    targetMmol: { low: 3.5, high: 5.3 },
    targetMgdl: { low: 63, high: 95 },
  },
  {
    context: "Pre-meal",
    targetMmol: { low: 3.5, high: 5.3 },
    targetMgdl: { low: 63, high: 95 },
  },
  {
    context: "1 hour post-meal",
    targetMmol: { low: 4.0, high: 7.8 },
    targetMgdl: { low: 72, high: 140 },
  },
  {
    context: "2 hours post-meal",
    targetMmol: { low: 4.0, high: 6.7 },
    targetMgdl: { low: 72, high: 120 },
  },
  {
    context: "Bedtime",
    targetMmol: { low: 5.0, high: 7.0 },
    targetMgdl: { low: 90, high: 126 },
  },
];

/* ── Main function ───────────────────────────────────────────── */

export function assessPregnancyGlucose(input: PregnancyGlucoseInput): PregnancyGlucoseResult {
  const { recentReadings, trimester, diabetesType, currentA1c, onInsulin, hypoEventsLastWeek, weeksGestation } = input;

  // Calculate means by tag
  const byTag = new Map<string, number[]>();
  recentReadings.forEach((r) => {
    if (!byTag.has(r.tag)) byTag.set(r.tag, []);
    byTag.get(r.tag)!.push(r.glucoseMmol);
  });

  const meanOf = (tag: string): number | null => {
    const vals = byTag.get(tag);
    if (!vals || vals.length === 0) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  };

  const fastingMean = meanOf("fasting");
  const oneHourPostMean = meanOf("1h-post");
  const twoHourPostMean = meanOf("2h-post");

  const fastingInTarget = fastingMean !== null ? fastingMean <= 5.3 : null;
  const postMealInTarget = oneHourPostMean !== null
    ? oneHourPostMean <= 7.8
    : twoHourPostMean !== null
      ? twoHourPostMean <= 6.7
      : null;

  // A1c assessment
  const a1cTarget = "Below 6.5% (ideally below 6.0% if achievable without significant hypoglycemia)";
  let a1cStatus: string | null = null;
  if (currentA1c !== undefined) {
    if (currentA1c <= 6.0) a1cStatus = "Excellent — within ideal pregnancy target.";
    else if (currentA1c <= 6.5) a1cStatus = "Good — within recommended pregnancy target.";
    else if (currentA1c <= 7.0) a1cStatus = "Above target — work with your team to improve.";
    else a1cStatus = "Significantly above target — increased risk of complications.";
  }

  // Risks
  const risks: PregnancyRisk[] = [];

  if (fastingMean !== null && fastingMean > 5.3) {
    risks.push({
      risk: "Elevated fasting glucose",
      severity: fastingMean > 6.0 ? "high" : "moderate",
      explanation: "High fasting glucose increases risk of macrosomia and neonatal hypoglycemia.",
    });
  }

  if (oneHourPostMean !== null && oneHourPostMean > 7.8) {
    risks.push({
      risk: "Elevated 1-hour post-meal glucose",
      severity: oneHourPostMean > 10.0 ? "high" : "moderate",
      explanation: "Post-meal spikes are the primary driver of fetal overgrowth.",
    });
  }

  if (hypoEventsLastWeek > 2) {
    risks.push({
      risk: "Frequent hypoglycemia",
      severity: hypoEventsLastWeek > 5 ? "high" : "moderate",
      explanation: "Frequent lows may indicate insulin doses are too aggressive. Hypo unawareness can develop.",
    });
  }

  if (currentA1c !== undefined && currentA1c > 7.0) {
    risks.push({
      risk: "Elevated A1c",
      severity: currentA1c > 8.0 ? "high" : "moderate",
      explanation: "Higher A1c in pregnancy is associated with congenital anomalies (first trimester) and macrosomia.",
    });
  }

  if (trimester === 1 && onInsulin) {
    risks.push({
      risk: "First trimester hypoglycemia risk",
      severity: "moderate",
      explanation: "Insulin sensitivity increases in early pregnancy, raising hypo risk. Doses may need reduction.",
    });
  }

  if (trimester === 3 && diabetesType === "type1") {
    risks.push({
      risk: "Third trimester insulin resistance",
      severity: "low",
      explanation: "Insulin requirements typically increase 50-100% by third trimester. Frequent dose adjustments needed.",
    });
  }

  // Monitoring schedule
  const monitoringSchedule: string[] = [];
  if (diabetesType === "gestational") {
    monitoringSchedule.push("Fasting glucose every morning");
    monitoringSchedule.push("1 or 2 hours after each main meal");
    monitoringSchedule.push("Minimum 4 tests per day");
  } else {
    monitoringSchedule.push("Fasting glucose every morning");
    monitoringSchedule.push("Before and 1 hour after each meal");
    monitoringSchedule.push("Bedtime glucose");
    monitoringSchedule.push("Minimum 7 tests per day (or CGM)");
    monitoringSchedule.push("Weekly ketone check if Type 1");
  }

  // Insulin notes
  const insulinNotes: string[] = [];
  if (trimester === 1) {
    insulinNotes.push("Insulin requirements may DECREASE in first trimester due to increased insulin sensitivity.");
    insulinNotes.push("Watch for morning hypoglycemia — may need to reduce overnight basal.");
  } else if (trimester === 2) {
    insulinNotes.push("Insulin requirements typically start increasing from week 16-20.");
    insulinNotes.push("Expect to adjust doses every 1-2 weeks.");
  } else {
    insulinNotes.push("Insulin requirements peak in third trimester — may be 2-3x pre-pregnancy doses.");
    insulinNotes.push("Rapid increases in insulin needs are normal. Contact team if glucose is persistently above target.");
    insulinNotes.push("Insulin requirements may suddenly drop near delivery — monitor closely.");
  }

  if (diabetesType === "gestational" && !onInsulin) {
    insulinNotes.push("If glucose targets are not met with diet and exercise within 1-2 weeks, insulin may be needed.");
  }

  // Trimester guidance
  let trimesterGuidance = "";
  if (trimester === 1) {
    trimesterGuidance = `First trimester (week ${weeksGestation}): Focus on tight glucose control while avoiding hypoglycemia. ` +
      "This is the critical period for organ development. Nausea may affect eating patterns — keep glucose tablets nearby.";
  } else if (trimester === 2) {
    trimesterGuidance = `Second trimester (week ${weeksGestation}): Insulin resistance is increasing. ` +
      "Expect rising insulin needs. Regular dose adjustments are normal. Anatomy scan at 18-20 weeks will check fetal growth.";
  } else {
    trimesterGuidance = `Third trimester (week ${weeksGestation}): Peak insulin resistance. ` +
      "Insulin doses may be 2-3x pre-pregnancy levels. Growth scans monitor for macrosomia. " +
      "Discuss delivery planning with your obstetric team.";
  }

  // Warnings
  const warnings: string[] = [];
  if (risks.some((r) => r.severity === "high")) {
    warnings.push("High-risk factors detected — discuss with your diabetes and obstetric team urgently.");
  }
  if (hypoEventsLastWeek > 3 && onInsulin) {
    warnings.push("Frequent hypoglycemia — insulin doses likely need reduction. Contact your team.");
  }

  return {
    targets: PREGNANCY_TARGETS,
    currentPerformance: {
      fastingMean,
      oneHourPostMean,
      twoHourPostMean,
      fastingInTarget,
      postMealInTarget,
    },
    a1cTarget,
    a1cStatus,
    risks,
    monitoringSchedule,
    insulinNotes,
    trimesterGuidance,
    warnings,
    disclaimer:
      "GluMira™ is an educational platform. The science of insulin, made visible. " +
      "Pregnancy glucose management requires close supervision by your diabetes and obstetric team.",
  };
}
