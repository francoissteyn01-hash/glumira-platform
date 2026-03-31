/**
 * GluMira™ IOB (Insulin On Board) Calculation Engine
 * Version: 7.0.0
 * 
 * Implements the Walsh bilinear DIA decay curve for accurate
 * insulin-on-board calculations. This is NOT a linear or simple
 * exponential model — it uses the bilinear curve from:
 *   Walsh et al., "Guidelines for Optimal Bolus Calculator Settings
 *   in Adults", Journal of Diabetes Science and Technology, 2011.
 * 
 * Powered by IOB Hunter™
 * 
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. It is not a
 * medical device and does not provide medical advice or dosing
 * recommendations. Always consult your registered diabetes care team.
 */

// ─── Types ───────────────────────────────────────────────────

export type InsulinType = 'rapid' | 'short' | 'intermediate' | 'long' | 'ultra-long';
export type InsulinConcentration = 'U-100' | 'U-200' | 'U-500';
export type GlucoseStatus = 'hypo' | 'low' | 'target' | 'high' | 'very-high';

export interface InsulinDose {
  id?: string;
  amount: number;               // units as drawn (pen/syringe units)
  timestamp: Date;
  insulinType: InsulinType;
  concentration: InsulinConcentration;
  category: 'bolus' | 'basal' | 'correction';
  patientId?: string;
}

export interface IOBDecayPoint {
  time: number;                 // minutes since dose
  iob: number;                  // biological units remaining
  percentage: number;           // % of original biological dose
}

export interface IOBCalculationResult {
  totalIOB: number;             // biological units
  bolusIOB: number;
  basalIOB: number;
  correctionIOB: number;
  decayPoints: IOBDecayPoint[];
  stackingRisk: StackingRisk;
  timestamp: Date;
  diaUsed: number;              // DIA in hours used for calculation
}

export interface StackingRisk {
  level: 'safe' | 'moderate' | 'high';
  recentPercent: number;        // IOB from last 2 hours
  moderatePercent: number;      // IOB from 2-4 hours
  elderlyPercent: number;       // IOB from 4+ hours
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ─── Constants ───────────────────────────────────────────────

/** Insulin action profiles — DIA in hours, peak in minutes */
const INSULIN_PROFILES: Record<InsulinType, { diaHours: number; peakMinutes: number; names: string[] }> = {
  rapid:        { diaHours: 6,   peakMinutes: 75,  names: ['Humalog', 'NovoLog', 'Apidra', 'Fiasp', 'Lyumjev'] },
  short:        { diaHours: 7,   peakMinutes: 90,  names: ['Regular', 'Humulin R', 'Novolin R'] },
  intermediate: { diaHours: 12,  peakMinutes: 180, names: ['NPH', 'Humulin N', 'Novolin N'] },
  long:         { diaHours: 18,  peakMinutes: 360, names: ['Lantus', 'Levemir', 'Basaglar', 'Semglee'] },
  'ultra-long': { diaHours: 24,  peakMinutes: 540, names: ['Tresiba', 'Toujeo'] },
};

/** Concentration multipliers for biological unit conversion */
const CONCENTRATION_FACTORS: Record<InsulinConcentration, number> = {
  'U-100': 1.0,
  'U-200': 2.0,
  'U-500': 5.0,
};

/** Validation limits */
const MAX_DOSE_UNITS = 300;
const MAX_IOB_CAP = 100;
const MIN_DIA_HOURS = 2.0;
const MAX_DIA_HOURS = 8.0;

/** GluMira™ version */
export const IOB_ENGINE_VERSION = '7.0.0';

// ─── Walsh Bilinear DIA Curve ────────────────────────────────

/**
 * Walsh bilinear IOB fraction calculation.
 * 
 * This is the core algorithm from Walsh et al. (2011):
 *   - For t <= d/2:  fraction = 1 - (2/d²) × t²
 *   - For t >  d/2:  fraction = (2/d²) × (t - d)²
 *   - For t >= d:    fraction = 0
 * 
 * Where:
 *   t = elapsed time in minutes
 *   d = DIA (Duration of Insulin Action) in minutes
 * 
 * Returns a value between 0 and 1 representing the fraction
 * of insulin still active.
 * 
 * @param elapsedMinutes - Time since injection in minutes
 * @param diaMinutes - Duration of Insulin Action in minutes
 * @returns IOB fraction (0.0 to 1.0)
 */
export function walshBilinearFraction(
  elapsedMinutes: number,
  diaMinutes: number
): number {
  const t = elapsedMinutes;
  const d = diaMinutes;

  // Guard: negative time or zero DIA
  if (t <= 0) return 1.0;
  if (d <= 0) return 0.0;
  if (t >= d) return 0.0;

  const dSquared = d * d;
  const halfD = d / 2;

  if (t <= halfD) {
    // First half: rapid initial decay
    return 1 - (2 / dSquared) * t * t;
  } else {
    // Second half: slower tail decay
    const diff = t - d;
    return (2 / dSquared) * diff * diff;
  }
}

// ─── Concentration Conversion ────────────────────────────────

/**
 * Convert drawn units to biological units based on concentration.
 * 
 * U-100: 1 drawn unit = 1 biological unit (standard)
 * U-200: 1 drawn unit = 2 biological units (Tresiba 200)
 * U-500: 1 drawn unit = 5 biological units (Humulin R U-500)
 * 
 * @param drawnUnits - Units as drawn from pen/syringe
 * @param concentration - Insulin concentration
 * @returns Biological units of insulin
 */
export function toBiologicalUnits(
  drawnUnits: number,
  concentration: InsulinConcentration
): number {
  return drawnUnits * CONCENTRATION_FACTORS[concentration];
}

/**
 * Convert biological units back to drawn units.
 */
export function toDrawnUnits(
  biologicalUnits: number,
  concentration: InsulinConcentration
): number {
  return biologicalUnits / CONCENTRATION_FACTORS[concentration];
}

// ─── Core IOB Calculation ────────────────────────────────────

/**
 * Calculate IOB for a single dose using Walsh bilinear curve.
 * 
 * @param dose - Insulin dose with amount, type, concentration
 * @param elapsedMinutes - Minutes since injection
 * @param customDiaHours - Optional custom DIA override (2.0-8.0)
 * @returns IOB in biological units
 */
export function calculateSingleDoseIOB(
  dose: InsulinDose,
  elapsedMinutes: number,
  customDiaHours?: number
): number {
  const profile = INSULIN_PROFILES[dose.insulinType] || INSULIN_PROFILES.rapid;
  
  // Use custom DIA if provided (clamped to valid range), else use profile default
  let diaHours = customDiaHours ?? profile.diaHours;
  diaHours = Math.max(MIN_DIA_HOURS, Math.min(MAX_DIA_HOURS, diaHours));
  
  const diaMinutes = diaHours * 60;
  const biologicalUnits = toBiologicalUnits(dose.amount, dose.concentration);
  const fraction = walshBilinearFraction(elapsedMinutes, diaMinutes);
  
  return biologicalUnits * fraction;
}

/**
 * Generate decay curve points for chart visualization.
 * 
 * @param dose - Insulin dose
 * @param intervalMinutes - Time between points (default 5 min)
 * @param customDiaHours - Optional custom DIA
 * @returns Array of decay points for charting
 */
export function generateDecayCurve(
  dose: InsulinDose,
  intervalMinutes: number = 5,
  customDiaHours?: number
): IOBDecayPoint[] {
  const profile = INSULIN_PROFILES[dose.insulinType] || INSULIN_PROFILES.rapid;
  let diaHours = customDiaHours ?? profile.diaHours;
  diaHours = Math.max(MIN_DIA_HOURS, Math.min(MAX_DIA_HOURS, diaHours));
  
  const diaMinutes = diaHours * 60;
  const biologicalUnits = toBiologicalUnits(dose.amount, dose.concentration);
  const points: IOBDecayPoint[] = [];

  for (let time = 0; time <= diaMinutes; time += intervalMinutes) {
    const fraction = walshBilinearFraction(time, diaMinutes);
    const iob = biologicalUnits * fraction;

    points.push({
      time,
      iob: Math.round(iob * 1000) / 1000,
      percentage: Math.round(fraction * 10000) / 100,
    });
  }

  return points;
}

/**
 * Calculate total IOB from multiple doses at a given time.
 * This is the main entry point for IOB calculations.
 * 
 * @param doses - Array of insulin doses
 * @param currentTime - Time to calculate IOB at
 * @param customDiaHours - Optional custom DIA for bolus insulin
 * @returns Complete IOB calculation result
 */
export function calculateTotalIOB(
  doses: InsulinDose[],
  currentTime: Date = new Date(),
  customDiaHours?: number
): IOBCalculationResult {
  let totalIOB = 0;
  let bolusIOB = 0;
  let basalIOB = 0;
  let correctionIOB = 0;

  // Calculate IOB for each dose
  for (const dose of doses) {
    const elapsedMs = currentTime.getTime() - dose.timestamp.getTime();
    const elapsedMinutes = elapsedMs / 60000;

    if (elapsedMinutes < 0) continue; // Skip future doses

    const iob = calculateSingleDoseIOB(dose, elapsedMinutes, customDiaHours);

    switch (dose.category) {
      case 'bolus':
        bolusIOB += iob;
        break;
      case 'basal':
        basalIOB += iob;
        break;
      case 'correction':
        correctionIOB += iob;
        break;
    }
    totalIOB += iob;
  }

  // Apply IOB cap
  totalIOB = Math.min(totalIOB, MAX_IOB_CAP);

  // Generate combined decay curve for visualization
  const decayPoints = generateCombinedDecayCurve(doses, currentTime, customDiaHours);

  // Calculate stacking risk
  const stackingRisk = calculateStackingRisk(doses, currentTime, customDiaHours);

  return {
    totalIOB: round3(totalIOB),
    bolusIOB: round3(bolusIOB),
    basalIOB: round3(basalIOB),
    correctionIOB: round3(correctionIOB),
    decayPoints,
    stackingRisk,
    timestamp: currentTime,
    diaUsed: customDiaHours ?? INSULIN_PROFILES.rapid.diaHours,
  };
}

// ─── Combined Decay Curve ────────────────────────────────────

/**
 * Generate a combined decay curve from all active doses.
 * Used for the main IOB timeline chart.
 */
function generateCombinedDecayCurve(
  doses: InsulinDose[],
  currentTime: Date,
  customDiaHours?: number
): IOBDecayPoint[] {
  // Find the maximum DIA across all doses
  const maxDiaMinutes = Math.max(
    ...doses.map(d => {
      const profile = INSULIN_PROFILES[d.insulinType] || INSULIN_PROFILES.rapid;
      const dia = customDiaHours ?? profile.diaHours;
      return Math.max(MIN_DIA_HOURS, Math.min(MAX_DIA_HOURS, dia)) * 60;
    }),
    360 // minimum 6 hours for chart
  );

  const points: IOBDecayPoint[] = [];
  const intervalMinutes = 5;

  // Calculate IOB at each future time point
  for (let futureMin = 0; futureMin <= maxDiaMinutes; futureMin += intervalMinutes) {
    const futureTime = new Date(currentTime.getTime() + futureMin * 60000);
    let pointIOB = 0;

    for (const dose of doses) {
      const elapsedMs = futureTime.getTime() - dose.timestamp.getTime();
      const elapsedMinutes = elapsedMs / 60000;
      if (elapsedMinutes < 0) continue;

      pointIOB += calculateSingleDoseIOB(dose, elapsedMinutes, customDiaHours);
    }

    const initialIOB = calculateTotalIOBRaw(doses, currentTime, customDiaHours);
    points.push({
      time: futureMin,
      iob: round3(pointIOB),
      percentage: initialIOB > 0 ? round2((pointIOB / initialIOB) * 100) : 0,
    });
  }

  return points;
}

/** Raw total IOB without cap — used for percentage calculations */
function calculateTotalIOBRaw(
  doses: InsulinDose[],
  currentTime: Date,
  customDiaHours?: number
): number {
  let total = 0;
  for (const dose of doses) {
    const elapsedMs = currentTime.getTime() - dose.timestamp.getTime();
    const elapsedMinutes = elapsedMs / 60000;
    if (elapsedMinutes < 0) continue;
    total += calculateSingleDoseIOB(dose, elapsedMinutes, customDiaHours);
  }
  return total;
}

// ─── Stacking Risk Analysis ──────────────────────────────────

/**
 * Calculate insulin stacking risk based on dose timing.
 * 
 * Stacking occurs when multiple bolus doses overlap, creating
 * a higher-than-expected IOB that increases hypoglycemia risk.
 * 
 * Risk levels:
 *   - safe: recent < 60%
 *   - moderate: recent 60-80%
 *   - high: recent > 80%
 */
function calculateStackingRisk(
  doses: InsulinDose[],
  currentTime: Date,
  customDiaHours?: number
): StackingRisk {
  const totalIOB = calculateTotalIOBRaw(doses, currentTime, customDiaHours);

  if (totalIOB === 0) {
    return {
      level: 'safe',
      recentPercent: 0,
      moderatePercent: 0,
      elderlyPercent: 0,
      message: 'No active insulin on board.',
    };
  }

  let recentIOB = 0;
  let moderateIOB = 0;
  let elderlyIOB = 0;

  for (const dose of doses) {
    const elapsedMs = currentTime.getTime() - dose.timestamp.getTime();
    const elapsedMinutes = elapsedMs / 60000;
    if (elapsedMinutes < 0) continue;

    const iob = calculateSingleDoseIOB(dose, elapsedMinutes, customDiaHours);

    if (elapsedMinutes < 120) {
      recentIOB += iob;
    } else if (elapsedMinutes < 240) {
      moderateIOB += iob;
    } else {
      elderlyIOB += iob;
    }
  }

  const recentPercent = round2((recentIOB / totalIOB) * 100);
  const moderatePercent = round2((moderateIOB / totalIOB) * 100);
  const elderlyPercent = round2((elderlyIOB / totalIOB) * 100);

  let level: StackingRisk['level'];
  let message: string;

  if (recentPercent > 80) {
    level = 'high';
    message = `High stacking risk: ${recentPercent}% of IOB is from doses given in the last 2 hours. Consider waiting before additional bolus.`;
  } else if (recentPercent > 60) {
    level = 'moderate';
    message = `Moderate stacking: ${recentPercent}% of IOB is from recent doses. Monitor glucose closely.`;
  } else {
    level = 'safe';
    message = `Stacking risk is low. IOB is well-distributed across dose timing.`;
  }

  return { level, recentPercent, moderatePercent, elderlyPercent, message };
}

// ─── Predictive Functions ────────────────────────────────────

/**
 * Predict IOB at a future time point.
 */
export function predictIOB(
  doses: InsulinDose[],
  minutesInFuture: number,
  currentTime: Date = new Date(),
  customDiaHours?: number
): number {
  const futureTime = new Date(currentTime.getTime() + minutesInFuture * 60000);
  const result = calculateTotalIOB(doses, futureTime, customDiaHours);
  return result.totalIOB;
}

/**
 * Calculate time until IOB drops below a threshold.
 * Uses binary search for efficiency.
 * 
 * @returns Minutes until threshold, or null if already below
 */
export function timeToIOBThreshold(
  doses: InsulinDose[],
  threshold: number = 0.1,
  currentTime: Date = new Date(),
  customDiaHours?: number
): number | null {
  const currentIOB = calculateTotalIOB(doses, currentTime, customDiaHours).totalIOB;
  if (currentIOB <= threshold) return 0;

  // Find max possible DIA
  const maxDiaMinutes = Math.max(
    ...doses.map(d => {
      const profile = INSULIN_PROFILES[d.insulinType] || INSULIN_PROFILES.rapid;
      return (customDiaHours ?? profile.diaHours) * 60;
    })
  );

  let low = 0;
  let high = maxDiaMinutes;
  let result: number | null = null;

  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    const futureIOB = predictIOB(doses, mid, currentTime, customDiaHours);

    if (futureIOB > threshold) {
      low = mid;
    } else {
      high = mid;
      result = mid;
    }
  }

  return result;
}

// ─── Glucose Status Classification ──────────────────────────

/**
 * Classify glucose reading into clinical status categories.
 * Thresholds based on international diabetes guidelines.
 * 
 * @param mgdl - Glucose value in mg/dL
 * @returns Glucose status classification
 */
export function classifyGlucose(mgdl: number): {
  status: GlucoseStatus;
  label: string;
  cssClass: string;
} {
  if (mgdl < 54) return { status: 'hypo', label: 'Hypoglycemia', cssClass: 'glum-glucose-hypo' };
  if (mgdl < 70) return { status: 'low', label: 'Low', cssClass: 'glum-glucose-low' };
  if (mgdl <= 180) return { status: 'target', label: 'In Range', cssClass: 'glum-glucose-target' };
  if (mgdl <= 250) return { status: 'high', label: 'High', cssClass: 'glum-glucose-high' };
  return { status: 'very-high', label: 'Very High', cssClass: 'glum-glucose-very-high' };
}

/**
 * Convert mmol/L to mg/dL.
 */
export function mmolToMgdl(mmol: number): number {
  return round2(mmol * 18.0182);
}

/**
 * Convert mg/dL to mmol/L.
 */
export function mgdlToMmol(mgdl: number): number {
  return round2(mgdl / 18.0182);
}

// ─── Validation ──────────────────────────────────────────────

/**
 * Validate an insulin dose before calculation.
 * Enforces V7 safety limits.
 */
export function validateInsulinDose(dose: InsulinDose): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Amount validation
  if (dose.amount <= 0) {
    errors.push('Insulin amount must be greater than 0.');
  }
  if (dose.amount > MAX_DOSE_UNITS) {
    errors.push(`Insulin amount exceeds maximum (${MAX_DOSE_UNITS} units).`);
  }

  // Biological units check
  const bioUnits = toBiologicalUnits(dose.amount, dose.concentration);
  if (bioUnits > MAX_DOSE_UNITS) {
    errors.push(`Biological dose (${bioUnits}U) exceeds maximum. Check concentration.`);
  }

  // Type validation
  if (!INSULIN_PROFILES[dose.insulinType]) {
    errors.push(`Unknown insulin type: ${dose.insulinType}`);
  }

  // Concentration validation
  if (!CONCENTRATION_FACTORS[dose.concentration]) {
    errors.push(`Unknown concentration: ${dose.concentration}`);
  }

  // Timestamp validation
  if (dose.timestamp > new Date()) {
    errors.push('Dose timestamp cannot be in the future.');
  }

  // Category validation
  if (!['bolus', 'basal', 'correction'].includes(dose.category)) {
    errors.push(`Invalid dose category: ${dose.category}`);
  }

  // Warnings for unusual combinations
  if (dose.insulinType === 'rapid' && dose.category === 'basal') {
    warnings.push('Rapid-acting insulin is typically used for bolus, not basal.');
  }
  if (dose.insulinType === 'long' && dose.category === 'bolus') {
    warnings.push('Long-acting insulin is typically used for basal, not bolus.');
  }
  if (dose.concentration === 'U-500' && dose.amount > 50) {
    warnings.push('U-500 dose of 50+ drawn units = 250+ biological units. Please verify.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Utility Functions ───────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Get insulin profile information */
export function getInsulinProfile(type: InsulinType) {
  return INSULIN_PROFILES[type];
}

/** Get all available insulin types */
export function getInsulinTypes(): InsulinType[] {
  return Object.keys(INSULIN_PROFILES) as InsulinType[];
}

/** Get all available concentrations */
export function getConcentrations(): InsulinConcentration[] {
  return Object.keys(CONCENTRATION_FACTORS) as InsulinConcentration[];
}
