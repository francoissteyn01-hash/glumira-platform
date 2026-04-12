/**
 * GluMira™ V7 — IOB Hunter v7 · Narrative Generator
 *
 * Converts engine outputs (KPIs, basal analysis, stacking alerts) into
 * plain-English strings for the clinical report sections. No React, no
 * JSX — pure functions returning strings or string arrays.
 *
 * Voice: calm, informed, respectful. Educational, NOT prescriptive.
 * Never recommends dose volumes — only timing observations. Per the
 * Three Owls system prompt: "You can say 'moving your dinner bolus 30
 * minutes earlier could clear the tail before midnight.' You NEVER say
 * 'reduce your dose to 2U.'"
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type {
  BasalCoverageAnalysis,
  ReportKPIs,
  StackingAlert,
} from "@/iob-hunter/types";

/* ─── Helpers ────────────────────────────────────────────────────────── */

function formatHour(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/* ═════════════════════════════════════════════════════════════════════ */
/*  1. Basal coverage summary                                           */
/* ═════════════════════════════════════════════════════════════════════ */

export function basalCoverageSummary(analysis: BasalCoverageAnalysis): string {
  const lines: string[] = [];
  lines.push(analysis.split_description);

  switch (analysis.floor_integrity) {
    case "continuous":
      lines.push(
        "Basal floor appears continuous across the 24-hour window — no obvious gaps in coverage.",
      );
      break;
    case "gapped":
      if (analysis.trough_hour != null && analysis.trough_value != null) {
        lines.push(
          `Basal trough detected at ${formatHour(analysis.trough_hour)} with ${analysis.trough_value.toFixed(1)}U remaining on board — below the expected floor.`,
        );
      }
      break;
    case "overlapping":
      lines.push(
        `${analysis.overlap_windows.length} window(s) show substantial basal overlap — multiple doses simultaneously above 80% of peak.`,
      );
      break;
  }

  for (const finding of analysis.findings) {
    lines.push(finding);
  }

  return lines.join(" ");
}

/* ═════════════════════════════════════════════════════════════════════ */
/*  2. KPI headline                                                     */
/* ═════════════════════════════════════════════════════════════════════ */

export function kpiHeadline(kpis: ReportKPIs): string {
  return (
    `Peak IOB ${kpis.peak_iob.toFixed(1)}U at ${formatHour(kpis.peak_hour)}. ` +
    `${kpis.hours_strong_or_overlap}h spent in the strong / overlap band. ` +
    `Daily totals: ${kpis.total_daily_basal.toFixed(1)}U basal, ${kpis.total_daily_bolus.toFixed(1)}U bolus.`
  );
}

/* ═════════════════════════════════════════════════════════════════════ */
/*  3. Stacking alert narratives                                        */
/* ═════════════════════════════════════════════════════════════════════ */

export function stackingAlertNarratives(alerts: StackingAlert[]): string[] {
  if (alerts.length === 0) {
    return [
      "No stacking risk windows detected in the current regimen. Overlap stays within safe bounds across the day.",
    ];
  }
  return alerts.map((alert) => {
    const severity = alert.severity === "critical" ? "Critical" : "Warning";
    return (
      `${severity}: ${alert.message}. ` +
      `Contributing doses: ${alert.contributing_doses.join(", ")}. ` +
      `A correction bolus during this window carries higher hypo risk than at other times of day — discuss with your care team.`
    );
  });
}

/* ═════════════════════════════════════════════════════════════════════ */
/*  4. Suggested improvements (timing only, never dose volume)          */
/* ═════════════════════════════════════════════════════════════════════ */

export type Improvement = {
  priority: number;      // 1 = highest
  title: string;
  body: string;
}

export function suggestedImprovements(
  basal: BasalCoverageAnalysis,
  stacking: StackingAlert[],
): Improvement[] {
  const suggestions: Improvement[] = [];
  let priority = 1;

  // Basal trough suggestions (timing, not volume)
  if (basal.floor_integrity === "gapped" && basal.trough_hour != null) {
    suggestions.push({
      priority: priority++,
      title: "Basal trough around " + formatHour(basal.trough_hour),
      body:
        `The basal floor dips around ${formatHour(basal.trough_hour)}. ` +
        `A conversation with your care team about redistributing the existing basal dose timing — ` +
        `not the total amount — may close the gap. GluMira™ does not recommend dose changes.`,
    });
  }

  // Basal overlap suggestions
  if (basal.floor_integrity === "overlapping" && basal.overlap_windows.length > 0) {
    const first = basal.overlap_windows[0];
    suggestions.push({
      priority: priority++,
      title: "Basal overlap " + formatHour(first.start_hour) + "–" + formatHour(first.end_hour),
      body:
        `Two or more basal doses are simultaneously above 80% of peak during this window. ` +
        `Shifting the next scheduled injection a little earlier or later could reduce the overlap without ` +
        `changing the total daily basal amount. Educational observation only.`,
    });
  }

  // Stacking suggestions
  for (const alert of stacking) {
    if (alert.severity === "critical") {
      suggestions.push({
        priority: priority++,
        title: "Stacking window " + formatHour(alert.start_hour) + "–" + formatHour(alert.end_hour),
        body:
          `Peak IOB of ${alert.peak_iob.toFixed(1)}U during this window suggests multiple active doses overlap substantially. ` +
          `Moving the second bolus 15-30 minutes earlier or later, if meal timing allows, could spread the peak. ` +
          `Any change should be discussed with your care team.`,
      });
    }
  }

  return suggestions;
}

/* ═════════════════════════════════════════════════════════════════════ */
/*  5. Clinical summary (1-paragraph synthesis)                         */
/* ═════════════════════════════════════════════════════════════════════ */

export function clinicalSummary(
  kpis: ReportKPIs,
  basal: BasalCoverageAnalysis,
  stacking: StackingAlert[],
): string {
  const parts: string[] = [];

  parts.push(
    `This 24-hour insulin profile shows a peak of ${kpis.peak_iob.toFixed(1)}U at ${formatHour(kpis.peak_hour)} ` +
    `with ${kpis.hours_strong_or_overlap}h in the strong/overlap band.`,
  );

  if (basal.floor_integrity === "continuous") {
    parts.push("Basal coverage is continuous with no obvious gaps.");
  } else if (basal.floor_integrity === "gapped") {
    parts.push(
      `Basal floor dips below the expected level around ${basal.trough_hour != null ? formatHour(basal.trough_hour) : "an unspecified time"}.`,
    );
  } else {
    parts.push(`Basal coverage shows ${basal.overlap_windows.length} overlap window(s).`);
  }

  if (stacking.length === 0) {
    parts.push("No stacking risk windows detected.");
  } else {
    const critical = stacking.filter((a) => a.severity === "critical").length;
    parts.push(
      `${stacking.length} stacking window(s) detected` +
      (critical > 0 ? ` (${critical} critical)` : "") + ".",
    );
  }

  parts.push(
    "All observations are educational. Any regimen adjustment must be discussed with a qualified diabetes care team.",
  );

  return parts.join(" ");
}

/* ═════════════════════════════════════════════════════════════════════ */
/*  6. Layer-by-layer analysis (step-by-step data interpretation)       */
/*     Per Rule 9/11/55: tables + step-by-step for presentation.        */
/* ═════════════════════════════════════════════════════════════════════ */

export type LayerAnalysisStep = {
  layer: number;
  label: string;
  insulinName: string;
  doseInfo: string;
  narrative: string;
}

export function generateLayerAnalysis(
  basal: BasalCoverageAnalysis,
  kpis: ReportKPIs,
  stacking: StackingAlert[],
): LayerAnalysisStep[] {
  const steps: LayerAnalysisStep[] = [];
  let layer = 1;

  // Layer 1: Basal foundation
  steps.push({
    layer: layer++,
    label: "Basal foundation",
    insulinName: "Basal",
    doseInfo: `${kpis.total_daily_basal.toFixed(1)}U/day`,
    narrative: basal.floor_integrity === "continuous"
      ? "Basal coverage is continuous — the foundation layer shows steady background insulin across 24 hours."
      : basal.floor_integrity === "gapped"
        ? `Basal trough at ${basal.trough_hour != null ? formatHour(basal.trough_hour) : "overnight"} drops to ${basal.trough_value != null ? basal.trough_value.toFixed(1) + "U" : "below floor"} — timing redistribution could close this gap.`
        : `Basal overlap detected in ${basal.overlap_windows.length} window(s) — doses stack above 80% of peak simultaneously.`,
  });

  // Layer 2: Bolus peaks
  if (kpis.total_daily_bolus > 0) {
    steps.push({
      layer: layer++,
      label: "Bolus peaks",
      insulinName: "Bolus",
      doseInfo: `${kpis.total_daily_bolus.toFixed(1)}U/day`,
      narrative: `Meal-time insulin adds ${kpis.total_daily_bolus.toFixed(1)}U across the day. Each bolus rises fast to peak then decays over its duration of action.`,
    });
  }

  // Layer 3: Combined pressure
  steps.push({
    layer: layer++,
    label: "Combined IOB pressure",
    insulinName: "Combined",
    doseInfo: `Peak ${kpis.peak_iob.toFixed(1)}U at ${formatHour(kpis.peak_hour)}`,
    narrative: `When all layers combine, peak insulin pressure reaches ${kpis.peak_iob.toFixed(1)}U at ${formatHour(kpis.peak_hour)}. ${kpis.hours_strong_or_overlap}h spent in the strong/overlap band. Your combined insulin on board will reach a peak at ${formatHour(kpis.peak_hour)} — full picture before making more treatment decisions.`,
  });

  // Layer 4: Risk zones (if any)
  if (stacking.length > 0) {
    for (const alert of stacking) {
      steps.push({
        layer: layer++,
        label: alert.severity === "critical" ? "Critical stacking zone" : "Watch zone",
        insulinName: alert.contributing_doses.join(" + "),
        doseInfo: `${formatHour(alert.start_hour)}–${formatHour(alert.end_hour)}`,
        narrative: `${alert.message}. Peak ${alert.peak_iob.toFixed(1)}U. Contributing: ${alert.contributing_doses.join(" + ")}. A timing shift of 15–30 minutes could spread this peak — discuss with your care team.`,
      });
    }
  }

  return steps;
}
