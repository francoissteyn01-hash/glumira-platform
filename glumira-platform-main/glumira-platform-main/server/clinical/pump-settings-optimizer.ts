/**
 * GluMira™ — Insulin Pump Settings Optimizer Module
 *
 * Analyzes CGM and pump data to suggest optimized basal rates,
 * ICR, ISF, and active insulin time settings.
 *
 * Clinical relevance:
 * - Basal rates should keep glucose stable when fasting
 * - ICR determines bolus for carbs
 * - ISF determines correction dose
 * - Active insulin time prevents insulin stacking
 *
 * NOT a medical device. Educational purposes only.
 */

export interface PumpReading {
  timestampUtc: string;
  glucoseMmol: number;
}

export interface BasalSegment {
  startHour: number;  // 0-23
  endHour: number;    // 0-23
  rateUnitsPerHour: number;
}

export interface PumpSettingsInput {
  currentBasalSegments: BasalSegment[];
  currentICR: number;        // 1 unit per X grams
  currentISF: number;        // mmol/L drop per unit
  currentDIA: number;        // hours
  currentTDD: number;
  weightKg: number;
  overnightReadings: PumpReading[];  // 10pm-6am, no food/bolus
  preMealReadings: PumpReading[];    // fasting pre-meal
  postMealReadings: PumpReading[];   // 2-4h post-meal
  correctionReadings: PumpReading[]; // after correction bolus only
  hyposLastWeek: number;
  hypersLastWeek: number;
}

export interface BasalSuggestion {
  segment: string;
  currentRate: number;
  suggestedRate: number;
  change: string;
  reason: string;
}

export interface SettingSuggestion {
  setting: string;
  currentValue: number | string;
  suggestedValue: number | string;
  reason: string;
  confidence: "high" | "medium" | "low";
}

export interface PumpOptimizationResult {
  basalSuggestions: BasalSuggestion[];
  settingSuggestions: SettingSuggestion[];
  totalBasalChange: number;  // % change
  overallAssessment: string;
  priorities: string[];
  safetyNotes: string[];
  disclaimer: string;
}

/* ── helpers ─────────────────────────────────────────────────── */

function meanGlucose(readings: PumpReading[]): number {
  if (readings.length === 0) return 0;
  return Math.round((readings.reduce((a, r) => a + r.glucoseMmol, 0) / readings.length) * 10) / 10;
}

function glucoseTrend(readings: PumpReading[]): number {
  // Returns mmol/L change from first to last reading
  if (readings.length < 2) return 0;
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestampUtc).getTime() - new Date(b.timestampUtc).getTime()
  );
  return Math.round((sorted[sorted.length - 1].glucoseMmol - sorted[0].glucoseMmol) * 10) / 10;
}

function getHour(ts: string): number {
  return new Date(ts).getUTCHours();
}

/* ── main optimizer ──────────────────────────────────────────── */

export function optimizePumpSettings(input: PumpSettingsInput): PumpOptimizationResult {
  const basalSuggestions: BasalSuggestion[] = [];
  const settingSuggestions: SettingSuggestion[] = [];
  const priorities: string[] = [];
  const safetyNotes: string[] = [];

  // ── Analyze overnight basal ──
  if (input.overnightReadings.length >= 4) {
    const overnightMean = meanGlucose(input.overnightReadings);
    const overnightTrend = glucoseTrend(input.overnightReadings);

    // Group overnight readings by hour ranges
    const lateEvening = input.overnightReadings.filter((r) => {
      const h = getHour(r.timestampUtc);
      return h >= 22 || h < 1;
    });
    const earlyMorning = input.overnightReadings.filter((r) => {
      const h = getHour(r.timestampUtc);
      return h >= 3 && h < 6;
    });

    // Check for dawn phenomenon
    const lateEveningMean = meanGlucose(lateEvening);
    const earlyMorningMean = meanGlucose(earlyMorning);

    if (earlyMorningMean > 0 && lateEveningMean > 0 && earlyMorningMean - lateEveningMean > 1.5) {
      // Dawn phenomenon — need more basal 3-6am
      const currentNightSegment = input.currentBasalSegments.find(
        (s) => s.startHour <= 3 && (s.endHour >= 6 || s.endHour === 0)
      ) ?? input.currentBasalSegments[0];

      if (currentNightSegment) {
        const increase = Math.round(currentNightSegment.rateUnitsPerHour * 0.2 * 100) / 100;
        basalSuggestions.push({
          segment: "03:00-06:00",
          currentRate: currentNightSegment.rateUnitsPerHour,
          suggestedRate: Math.round((currentNightSegment.rateUnitsPerHour + increase) * 100) / 100,
          change: `+${increase} U/hr`,
          reason: `Dawn phenomenon detected: glucose rises ${Math.round((earlyMorningMean - lateEveningMean) * 10) / 10} mmol/L overnight.`,
        });
        priorities.push("Address dawn phenomenon with increased early-morning basal.");
      }
    }

    if (overnightTrend < -1.5) {
      // Dropping overnight — too much basal
      const nightSegment = input.currentBasalSegments.find(
        (s) => s.startHour >= 22 || s.startHour < 3
      ) ?? input.currentBasalSegments[0];

      if (nightSegment) {
        const decrease = Math.round(nightSegment.rateUnitsPerHour * 0.15 * 100) / 100;
        basalSuggestions.push({
          segment: "22:00-03:00",
          currentRate: nightSegment.rateUnitsPerHour,
          suggestedRate: Math.round((nightSegment.rateUnitsPerHour - decrease) * 100) / 100,
          change: `-${decrease} U/hr`,
          reason: `Glucose drops ${Math.abs(overnightTrend)} mmol/L overnight — basal may be too high.`,
        });
        priorities.push("Reduce overnight basal to prevent nocturnal hypoglycemia.");
      }
    }
  }

  // ── Analyze pre-meal (fasting basal test) ──
  if (input.preMealReadings.length >= 3) {
    const preMealMean = meanGlucose(input.preMealReadings);

    if (preMealMean > 8.0) {
      // Daytime basal too low
      const daySegment = input.currentBasalSegments.find(
        (s) => s.startHour >= 6 && s.startHour < 18
      ) ?? input.currentBasalSegments[0];

      if (daySegment) {
        const increase = Math.round(daySegment.rateUnitsPerHour * 0.1 * 100) / 100;
        basalSuggestions.push({
          segment: "06:00-18:00",
          currentRate: daySegment.rateUnitsPerHour,
          suggestedRate: Math.round((daySegment.rateUnitsPerHour + increase) * 100) / 100,
          change: `+${increase} U/hr`,
          reason: `Pre-meal glucose averages ${preMealMean} mmol/L — daytime basal may be insufficient.`,
        });
      }
    } else if (preMealMean < 4.5) {
      const daySegment = input.currentBasalSegments.find(
        (s) => s.startHour >= 6 && s.startHour < 18
      ) ?? input.currentBasalSegments[0];

      if (daySegment) {
        const decrease = Math.round(daySegment.rateUnitsPerHour * 0.1 * 100) / 100;
        basalSuggestions.push({
          segment: "06:00-18:00",
          currentRate: daySegment.rateUnitsPerHour,
          suggestedRate: Math.round((daySegment.rateUnitsPerHour - decrease) * 100) / 100,
          change: `-${decrease} U/hr`,
          reason: `Pre-meal glucose averages ${preMealMean} mmol/L — daytime basal may be too high.`,
        });
      }
    }
  }

  // ── Analyze ICR ──
  if (input.postMealReadings.length >= 3) {
    const postMealMean = meanGlucose(input.postMealReadings);

    if (postMealMean > 10.0) {
      const newICR = Math.max(Math.round(input.currentICR * 0.85), 1);
      settingSuggestions.push({
        setting: "ICR (Insulin-to-Carb Ratio)",
        currentValue: `1:${input.currentICR}`,
        suggestedValue: `1:${newICR}`,
        reason: `Post-meal glucose averages ${postMealMean} mmol/L — more insulin per carb needed.`,
        confidence: "medium",
      });
      priorities.push("Tighten ICR to reduce post-meal spikes.");
    } else if (postMealMean < 5.0) {
      const newICR = Math.round(input.currentICR * 1.15);
      settingSuggestions.push({
        setting: "ICR (Insulin-to-Carb Ratio)",
        currentValue: `1:${input.currentICR}`,
        suggestedValue: `1:${newICR}`,
        reason: `Post-meal glucose averages ${postMealMean} mmol/L — less insulin per carb needed to prevent lows.`,
        confidence: "medium",
      });
    }
  }

  // ── Analyze ISF ──
  if (input.correctionReadings.length >= 3) {
    const corrMean = meanGlucose(input.correctionReadings);
    const corrTrend = glucoseTrend(input.correctionReadings);

    if (corrMean > 8.0 && corrTrend > -1.0) {
      const newISF = Math.round(input.currentISF * 0.85 * 10) / 10;
      settingSuggestions.push({
        setting: "ISF (Insulin Sensitivity Factor)",
        currentValue: `${input.currentISF} mmol/L`,
        suggestedValue: `${newISF} mmol/L`,
        reason: "Correction doses are not bringing glucose down enough.",
        confidence: "medium",
      });
    } else if (corrTrend < -4.0) {
      const newISF = Math.round(input.currentISF * 1.15 * 10) / 10;
      settingSuggestions.push({
        setting: "ISF (Insulin Sensitivity Factor)",
        currentValue: `${input.currentISF} mmol/L`,
        suggestedValue: `${newISF} mmol/L`,
        reason: "Correction doses are dropping glucose too aggressively.",
        confidence: "medium",
      });
    }
  }

  // ── DIA check ──
  if (input.currentDIA < 3.0) {
    settingSuggestions.push({
      setting: "DIA (Duration of Insulin Action)",
      currentValue: `${input.currentDIA}h`,
      suggestedValue: "3.5-4.0h",
      reason: "DIA below 3 hours increases insulin stacking risk. Most rapid insulins act for 3.5-5 hours.",
      confidence: "high",
    });
  } else if (input.currentDIA > 5.5) {
    settingSuggestions.push({
      setting: "DIA (Duration of Insulin Action)",
      currentValue: `${input.currentDIA}h`,
      suggestedValue: "4.0-5.0h",
      reason: "DIA above 5.5 hours may under-dose corrections. Consider reducing.",
      confidence: "low",
    });
  }

  // ── Total basal change ──
  const currentTotalBasal = input.currentBasalSegments.reduce(
    (a, s) => a + s.rateUnitsPerHour * ((s.endHour > s.startHour ? s.endHour - s.startHour : 24 - s.startHour + s.endHour) || 24),
    0
  );
  const suggestedChanges = basalSuggestions.reduce((a, s) => {
    const hours = parseInt(s.segment.split("-")[1].split(":")[0]) - parseInt(s.segment.split("-")[0].split(":")[0]);
    return a + (s.suggestedRate - s.currentRate) * Math.abs(hours);
  }, 0);
  const totalBasalChange = currentTotalBasal > 0
    ? Math.round((suggestedChanges / currentTotalBasal) * 100)
    : 0;

  // ── Safety notes ──
  safetyNotes.push("Only change one setting at a time. Wait 2-3 days to evaluate each change.");
  safetyNotes.push("Never change basal rates by more than 0.1 U/hr at a time.");

  if (input.hyposLastWeek > 3) {
    safetyNotes.push("Frequent hypoglycemia detected — prioritize reducing doses before increasing any.");
    priorities.unshift("Address frequent hypoglycemia first.");
  }

  if (Math.abs(totalBasalChange) > 20) {
    safetyNotes.push("Large total basal change suggested — implement gradually over multiple days.");
  }

  // ── Overall assessment ──
  let overallAssessment = "Pump settings appear well-optimized. Minor adjustments suggested.";
  if (basalSuggestions.length > 2 || settingSuggestions.length > 2) {
    overallAssessment = "Multiple settings need adjustment. Work with your diabetes team to prioritize changes.";
  } else if (basalSuggestions.length === 0 && settingSuggestions.length === 0) {
    overallAssessment = "Current pump settings appear appropriate based on available data. Continue monitoring.";
  }

  return {
    basalSuggestions,
    settingSuggestions,
    totalBasalChange,
    overallAssessment,
    priorities,
    safetyNotes,
    disclaimer:
      "GluMira™ is an educational platform. The science of insulin, made visible. " +
      "Pump setting changes must be approved by your diabetes team.",
  };
}
