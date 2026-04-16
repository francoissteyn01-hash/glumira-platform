export interface WhatIfDose {
  insulinType: string;
  time: string;
  units: number;
}

export interface WhatIfConstraint {
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

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function buildWhatIfConstraints(profileRegimen: any): WhatIfConstraints {
  const constraints: WhatIfConstraints = {
    basal: [],
    bolus: [],
    allowNewInsulins: false,
  };

  profileRegimen.insulins?.forEach((insulin: any) => {
    if (insulin.type !== 'basal') return;
    insulin.doses?.forEach((dose: any) => {
      const profileMinutes = timeToMinutes(dose.time);
      constraints.basal.push({
        insulinType: insulin.name,
        minTime: Math.max(0, profileMinutes - 120),
        maxTime: Math.min(1440, profileMinutes + 120),
        minUnits: dose.units * 0.5,
        maxUnits: dose.units * 1.5,
        profileTime: profileMinutes,
      });
    });
  });

  profileRegimen.insulins?.forEach((insulin: any) => {
    if (insulin.type !== 'bolus') return;
    insulin.doses?.forEach((dose: any) => {
      constraints.bolus.push({
        insulinType: insulin.name,
        minTime: 0,
        maxTime: 1440,
        minUnits: dose.typicalUnits * 0.5,
        maxUnits: dose.typicalUnits * 1.5,
        profileTime: timeToMinutes(dose.time),
      });
    });
  });

  return constraints;
}

export function validateWhatIfDose(
  dose: WhatIfDose,
  constraint: WhatIfConstraint
): { valid: boolean; reason?: string } {
  if (dose.insulinType !== constraint.insulinType) {
    return {
      valid: false,
      reason: `Insulin type is locked to ${constraint.insulinType}`,
    };
  }

  if (dose.units < constraint.minUnits || dose.units > constraint.maxUnits) {
    return {
      valid: false,
      reason: `Units must be ${constraint.minUnits.toFixed(1)}–${constraint.maxUnits.toFixed(1)} (±50% of profile)`,
    };
  }

  const doseMinutes = timeToMinutes(dose.time);
  if (doseMinutes < constraint.minTime || doseMinutes > constraint.maxTime) {
    return {
      valid: false,
      reason: `Time must be ${minutesToTime(constraint.minTime)}–${minutesToTime(constraint.maxTime)} (±2 hours of profile)`,
    };
  }

  return { valid: true };
}
