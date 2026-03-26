/**
 * GluMira™ — Travel Zone Management Module
 *
 * Helps insulin-dependent diabetics manage timezone transitions.
 * Calculates basal insulin timing adjustments, meal timing shifts,
 * and monitoring frequency for travel across time zones.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type TravelDirection = "east" | "west";
export type TravelRisk = "low" | "moderate" | "high";

export interface TravelInput {
  originTimezoneOffset: number;   // hours from UTC (e.g., +2 for SAST)
  destinationTimezoneOffset: number;
  departureHour: number;          // 0-23 local departure time
  flightDurationHours: number;
  basalDoseTime: number;          // hour of day for basal injection (0-23)
  basalDoseUnits: number;
}

export interface TravelAdvice {
  direction: TravelDirection;
  hoursDifference: number;
  risk: TravelRisk;
  basalAdjustment: BasalAdjustment;
  monitoringFrequencyHours: number;
  mealTimingAdvice: string;
  warnings: string[];
  recommendations: string[];
}

export interface BasalAdjustment {
  adjustmentType: "none" | "extra_units" | "reduce_units" | "split_dose";
  unitsChange: number;
  newDoseTime: number;            // hour of day at destination
  explanation: string;
}

// ─── Direction ────────────────────────────────────────────────────────────────

export function travelDirection(originOffset: number, destOffset: number): TravelDirection {
  return destOffset > originOffset ? "east" : "west";
}

// ─── Hours difference ─────────────────────────────────────────────────────────

export function hoursDifference(originOffset: number, destOffset: number): number {
  return Math.abs(destOffset - originOffset);
}

// ─── Risk classification ──────────────────────────────────────────────────────

export function classifyTravelRisk(hours: number): TravelRisk {
  if (hours <= 3) return "low";
  if (hours <= 8) return "moderate";
  return "high";
}

// ─── Risk colour ──────────────────────────────────────────────────────────────

export function travelRiskColour(risk: TravelRisk): string {
  switch (risk) {
    case "low": return "#22c55e";
    case "moderate": return "#f59e0b";
    case "high": return "#ef4444";
  }
}

// ─── Basal adjustment calculation ─────────────────────────────────────────────

export function computeBasalAdjustment(input: TravelInput): BasalAdjustment {
  const diff = hoursDifference(input.originTimezoneOffset, input.destinationTimezoneOffset);
  const dir = travelDirection(input.originTimezoneOffset, input.destinationTimezoneOffset);

  // New dose time at destination (keep same local time)
  const newDoseTime = input.basalDoseTime;

  if (diff <= 3) {
    return {
      adjustmentType: "none",
      unitsChange: 0,
      newDoseTime,
      explanation: "Small timezone change — take basal at your usual local time at destination.",
    };
  }

  if (dir === "east") {
    // Day is shorter — may need extra units to bridge the gap
    const extraHours = diff;
    const hourlyRate = input.basalDoseUnits / 24;
    const extraUnits = Math.round(hourlyRate * extraHours * 10) / 10;

    if (diff <= 8) {
      return {
        adjustmentType: "extra_units",
        unitsChange: extraUnits,
        newDoseTime,
        explanation: `Travelling east (shorter day). Add ${extraUnits}u of rapid-acting insulin to cover the ${extraHours}-hour gap, split across meals.`,
      };
    }

    return {
      adjustmentType: "split_dose",
      unitsChange: extraUnits,
      newDoseTime,
      explanation: `Large eastward shift. Consider splitting basal dose: take 2/3 before departure, 1/3 on arrival, then resume normal schedule next day.`,
    };
  }

  // West — day is longer — may need to reduce to avoid overlap
  const extraHours = diff;
  const hourlyRate = input.basalDoseUnits / 24;
  const reduceUnits = Math.round(hourlyRate * extraHours * 10) / 10;

  if (diff <= 8) {
    return {
      adjustmentType: "reduce_units",
      unitsChange: -reduceUnits,
      newDoseTime,
      explanation: `Travelling west (longer day). You may need to delay your next basal dose. Monitor glucose and give correction doses if needed.`,
    };
  }

  return {
    adjustmentType: "split_dose",
    unitsChange: -reduceUnits,
    newDoseTime,
    explanation: `Large westward shift. Consider an intermediate small basal dose mid-journey, then resume normal schedule at destination.`,
  };
}

// ─── Generate full travel advice ──────────────────────────────────────────────

export function generateTravelAdvice(input: TravelInput): TravelAdvice {
  const dir = travelDirection(input.originTimezoneOffset, input.destinationTimezoneOffset);
  const diff = hoursDifference(input.originTimezoneOffset, input.destinationTimezoneOffset);
  const risk = classifyTravelRisk(diff);
  const basalAdjustment = computeBasalAdjustment(input);
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Monitoring frequency
  let monitoringFrequencyHours: number;
  if (risk === "high") monitoringFrequencyHours = 2;
  else if (risk === "moderate") monitoringFrequencyHours = 3;
  else monitoringFrequencyHours = 4;

  // Meal timing
  let mealTimingAdvice: string;
  if (diff <= 3) {
    mealTimingAdvice = "Adjust meals gradually to destination time. No special precautions needed.";
  } else if (dir === "east") {
    mealTimingAdvice = "You will lose hours — skip or reduce one meal. Adjust bolus accordingly.";
  } else {
    mealTimingAdvice = "You will gain hours — you may need an extra snack or small meal. Cover with bolus.";
  }

  // Warnings
  if (diff > 8) {
    warnings.push("Large timezone shift — discuss insulin plan with your diabetes team before travel.");
  }
  if (input.flightDurationHours > 10) {
    warnings.push("Long flight — check glucose every 2-3 hours during the flight.");
  }

  // Recommendations
  recommendations.push("Carry all insulin and supplies in hand luggage.");
  recommendations.push("Keep a written record of your insulin doses during travel.");
  recommendations.push("Set alarms for glucose checks during the flight.");
  if (risk !== "low") {
    recommendations.push("Carry fast-acting glucose (juice, glucose tablets) at all times.");
  }
  recommendations.push("Stay hydrated — drink water regularly during the flight.");

  return {
    direction: dir,
    hoursDifference: diff,
    risk,
    basalAdjustment,
    monitoringFrequencyHours,
    mealTimingAdvice,
    warnings,
    recommendations,
  };
}
