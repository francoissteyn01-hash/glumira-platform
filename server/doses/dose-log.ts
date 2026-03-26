/**
 * GluMira™ Dose Log Module
 * Version: 7.0.0
 *
 * Manages insulin dose records:
 *  - Log a new dose (bolus or basal)
 *  - List doses for a user (last N hours)
 *  - Delete a dose
 *  - Compute active IOB across all logged doses using the IOB Hunter™ engine
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

// ─── Types ────────────────────────────────────────────────────

export type InsulinType =
  | "NovoRapid"
  | "Humalog"
  | "Apidra"
  | "Fiasp"
  | "Tresiba"
  | "Lantus";

export type DoseType = "bolus" | "basal" | "correction";

export interface DoseRecord {
  id: string;
  userId: string;
  insulinType: InsulinType;
  doseType: DoseType;
  units: number;
  administeredAt: string; // ISO 8601
  notes?: string | null;
  createdAt: string;
}

export interface ActiveIobSummary {
  totalIob: number;
  doses: Array<{
    doseId: string;
    insulinType: InsulinType;
    units: number;
    remainingIob: number;
    administeredAt: string;
    minutesElapsed: number;
  }>;
  computedAt: string;
}

// ─── Biexponential decay parameters (IOB Hunter™) ─────────────

const IOB_PARAMS: Record<InsulinType, { alpha: number; beta: number; durationMin: number }> = {
  NovoRapid: { alpha: 0.0116, beta: 0.0173, durationMin: 240 },
  Humalog:   { alpha: 0.0116, beta: 0.0173, durationMin: 240 },
  Apidra:    { alpha: 0.0130, beta: 0.0190, durationMin: 210 },
  Fiasp:     { alpha: 0.0150, beta: 0.0210, durationMin: 180 },
  Tresiba:   { alpha: 0.0003, beta: 0.0005, durationMin: 1440 },
  Lantus:    { alpha: 0.0004, beta: 0.0006, durationMin: 1320 },
};

/**
 * Compute the fraction of insulin remaining at `minutesElapsed` using
 * the biexponential decay model.
 */
export function iobFraction(insulinType: InsulinType, minutesElapsed: number): number {
  const { alpha, beta, durationMin } = IOB_PARAMS[insulinType];
  if (minutesElapsed <= 0) return 1.0;
  if (minutesElapsed >= durationMin) return 0.0;
  const raw = Math.exp(-alpha * minutesElapsed) - Math.exp(-beta * minutesElapsed);
  const peak = Math.exp(-alpha * (1 / (beta - alpha)) * Math.log(beta / alpha)) -
               Math.exp(-beta * (1 / (beta - alpha)) * Math.log(beta / alpha));
  return Math.max(0, Math.min(1, raw / peak));
}

// ─── In-memory store (replace with Supabase in production) ───

const doseStore = new Map<string, DoseRecord[]>();

// ─── Core functions ───────────────────────────────────────────

/**
 * Log a new insulin dose for a user.
 */
export function logDose(
  userId: string,
  insulinType: InsulinType,
  doseType: DoseType,
  units: number,
  administeredAt?: string,
  notes?: string
): DoseRecord {
  if (units <= 0 || units > 100) {
    throw new Error(`Invalid dose: ${units}U. Must be between 0.1 and 100U.`);
  }

  const dose: DoseRecord = {
    id: `dose_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    insulinType,
    doseType,
    units,
    administeredAt: administeredAt ?? new Date().toISOString(),
    notes: notes ?? null,
    createdAt: new Date().toISOString(),
  };

  const existing = doseStore.get(userId) ?? [];
  doseStore.set(userId, [dose, ...existing]);
  return dose;
}

/**
 * Get doses for a user within the last `hours` hours.
 */
export function getDoses(userId: string, hours = 24): DoseRecord[] {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const doses = doseStore.get(userId) ?? [];
  return doses.filter((d) => d.administeredAt >= since);
}

/**
 * Delete a dose by ID.
 */
export function deleteDose(userId: string, doseId: string): boolean {
  const doses = doseStore.get(userId);
  if (!doses) return false;
  const filtered = doses.filter((d) => d.id !== doseId);
  if (filtered.length === doses.length) return false;
  doseStore.set(userId, filtered);
  return true;
}

/**
 * Compute the total active IOB across all doses for a user.
 */
export function computeActiveIob(userId: string, atTime?: Date): ActiveIobSummary {
  const now = atTime ?? new Date();
  const doses = getDoses(userId, 48); // look back 48h to catch long-acting

  let totalIob = 0;
  const breakdown = [];

  for (const dose of doses) {
    const administeredAt = new Date(dose.administeredAt);
    const minutesElapsed = (now.getTime() - administeredAt.getTime()) / 60_000;
    const fraction = iobFraction(dose.insulinType, minutesElapsed);
    const remainingIob = +(dose.units * fraction).toFixed(3);

    if (remainingIob > 0.001) {
      totalIob += remainingIob;
      breakdown.push({
        doseId: dose.id,
        insulinType: dose.insulinType,
        units: dose.units,
        remainingIob,
        administeredAt: dose.administeredAt,
        minutesElapsed: Math.round(minutesElapsed),
      });
    }
  }

  return {
    totalIob: +totalIob.toFixed(3),
    doses: breakdown,
    computedAt: now.toISOString(),
  };
}

/**
 * Get all doses for a user (no time filter — for export/audit).
 */
export function getAllDoses(userId: string): DoseRecord[] {
  return doseStore.get(userId) ?? [];
}

/**
 * Clear all doses for a user (GDPR erase support).
 */
export function clearDoses(userId: string): number {
  const count = (doseStore.get(userId) ?? []).length;
  doseStore.delete(userId);
  return count;
}
