import type { InsulinDose } from "@/iob-hunter/types";

export type PressureLevel = "light" | "moderate" | "strong" | "overlap";

export interface WhatIfDose {
  insulinType: string;
  time: string;
  units: number;
}

export interface WhatIfConstraint {
  doseId: string;
  insulinType: string;
  minTime: number;
  maxTime: number;
  minUnits: number;
  maxUnits: number;
  profileTime: number;
}

export interface WhatIfConstraints {
  basal: WhatIfConstraint[];
  bolus: WhatIfConstraint[];
  allowNewInsulins: boolean;
}

function extractTimeString(value: string): string {
  if (/^\d{2}:\d{2}$/.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "00:00";

  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = extractTimeString(timeStr).split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(1439, totalMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function buildWhatIfConstraints(profileDoses: InsulinDose[]): WhatIfConstraints {
  const constraints: WhatIfConstraints = {
    basal: [],
    bolus: [],
    allowNewInsulins: false,
  };

  for (const dose of profileDoses) {
    const profileTime = timeToMinutes(dose.administered_at);
    const entry: WhatIfConstraint = {
      doseId: dose.id,
      insulinType: dose.insulin_name,
      minTime: Math.max(0, profileTime - 120),
      maxTime: Math.min(1439, profileTime + 120),
      minUnits: dose.dose_units * 0.5,
      maxUnits: dose.dose_units * 1.5,
      profileTime,
    };

    if (dose.dose_type === "basal_injection") {
      constraints.basal.push(entry);
    } else {
      constraints.bolus.push(entry);
    }
  }

  return constraints;
}

export function flattenWhatIfConstraints(constraints: WhatIfConstraints): WhatIfConstraint[] {
  return [...constraints.basal, ...constraints.bolus];
}

export function validateWhatIfDose(
  dose: WhatIfDose,
  constraint: WhatIfConstraint,
): { valid: boolean; reason?: string } {
  if (dose.insulinType !== constraint.insulinType) {
    return {
      valid: false,
      reason: `Insulin type is locked to ${constraint.insulinType}.`,
    };
  }

  if (dose.units < constraint.minUnits || dose.units > constraint.maxUnits) {
    return {
      valid: false,
      reason: `Units must stay within ${constraint.minUnits.toFixed(1)}-${constraint.maxUnits.toFixed(1)} U (plus or minus 50 percent of your profile dose).`,
    };
  }

  const doseMinutes = timeToMinutes(dose.time);
  if (doseMinutes < constraint.minTime || doseMinutes > constraint.maxTime) {
    return {
      valid: false,
      reason: `Time must stay within ${minutesToTime(constraint.minTime)}-${minutesToTime(constraint.maxTime)} (plus or minus 2 hours of your profile time).`,
    };
  }

  return { valid: true };
}