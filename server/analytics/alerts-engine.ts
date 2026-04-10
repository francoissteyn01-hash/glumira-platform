/**
 * GluMira™ V7 — server/analytics/alerts-engine.ts
 *
 * Pure functions that derive active alerts from glucose readings + insulin
 * events. Extracted from alerts.route.ts so the algorithms are testable
 * without spinning up Express or hitting Supabase.
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-04-10
 */

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertType = "hypo" | "hyper" | "stacking" | "rising_fast" | "falling_fast";

export type ActiveAlert = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  body: string;
  triggeredAt: string;
  metadata?: Record<string, unknown>;
}

export type GlucoseReading = {
  value: number;     // mmol/L
  at: string;        // ISO timestamp
}

export type InsulinDose = {
  units: number;
  at: string;        // ISO timestamp
}

/* ─── Tunable thresholds (also exported for tests) ───────────────────────── */
export const HYPO_THRESHOLD     = 3.9;
export const HYPER_THRESHOLD    = 13.9;
export const FAST_TREND_WINDOW_MIN = 15;
export const FAST_TREND_DELTA      = 2.2;
export const STACKING_THRESHOLD    = 3;
export const STACKING_LOOKBACK_HOURS = 6;

export function alertId(type: string, bucketIso: string): string {
  return `${type}:${bucketIso}`;
}

/* ─── Per-detector pure functions ────────────────────────────────────────── */

/**
 * Hypoglycaemia: latest reading is below the hypo threshold.
 * Returns null if no readings or latest is at/above threshold.
 */
export function detectHypo(readings: GlucoseReading[]): ActiveAlert | null {
  if (readings.length === 0) return null;
  const latest = readings[0];
  if (!(latest.value < HYPO_THRESHOLD)) return null;
  return {
    id: alertId("hypo", latest.at),
    type: "hypo",
    severity: "critical",
    title: "Low glucose detected",
    body:  `${latest.value.toFixed(1)} mmol/L — confirm and treat per your hypo plan.`,
    triggeredAt: latest.at,
    metadata: { value: latest.value },
  };
}

/**
 * Hyperglycaemia: latest reading exceeds the hyper threshold.
 */
export function detectHyper(readings: GlucoseReading[]): ActiveAlert | null {
  if (readings.length === 0) return null;
  const latest = readings[0];
  if (!(latest.value > HYPER_THRESHOLD)) return null;
  return {
    id: alertId("hyper", latest.at),
    type: "hyper",
    severity: "warning",
    title: "High glucose detected",
    body:  `${latest.value.toFixed(1)} mmol/L — review with your care team.`,
    triggeredAt: latest.at,
    metadata: { value: latest.value },
  };
}

/**
 * Fast trend (rising or falling): compares the latest reading to the closest
 * reading ~FAST_TREND_WINDOW_MIN earlier. Needs at least 2 readings.
 *
 * `readings` must be sorted DESCENDING by time (newest first), matching the
 * shape returned by alerts.route.ts.
 */
export function detectFastTrend(
  readings: GlucoseReading[],
  nowMs: number = Date.now(),
): ActiveAlert | null {
  if (readings.length < 2) return null;
  const latest = readings[0];
  const targetMs = nowMs - FAST_TREND_WINDOW_MIN * 60_000;

  // First reading at-or-before the target time, falling back to oldest.
  const earlier =
    readings.find((r) => new Date(r.at).getTime() <= targetMs) ??
    readings[readings.length - 1];

  // If "earlier" is the same point as "latest", we have no signal.
  if (earlier === latest) return null;

  const delta = latest.value - earlier.value;

  if (delta >= FAST_TREND_DELTA) {
    return {
      id: alertId("rising_fast", latest.at),
      type: "rising_fast",
      severity: "warning",
      title: "Glucose rising fast",
      body:  `+${delta.toFixed(1)} mmol/L in the last ${FAST_TREND_WINDOW_MIN} min.`,
      triggeredAt: latest.at,
      metadata: { delta, windowMin: FAST_TREND_WINDOW_MIN },
    };
  }
  if (delta <= -FAST_TREND_DELTA) {
    return {
      id: alertId("falling_fast", latest.at),
      type: "falling_fast",
      severity: "warning",
      title: "Glucose falling fast",
      body:  `${delta.toFixed(1)} mmol/L in the last ${FAST_TREND_WINDOW_MIN} min.`,
      triggeredAt: latest.at,
      metadata: { delta, windowMin: FAST_TREND_WINDOW_MIN },
    };
  }
  return null;
}

/**
 * Stacking: simple proxy — count distinct doses inside the lookback window.
 * Caller is responsible for filtering `doses` to the lookback window.
 */
export function detectStacking(doses: InsulinDose[]): ActiveAlert | null {
  if (doses.length < STACKING_THRESHOLD) return null;
  const bucket = doses[0]?.at ?? new Date().toISOString();
  return {
    id: alertId("stacking", bucket),
    type: "stacking",
    severity: "warning",
    title: "Insulin stacking detected",
    body:  `${doses.length} doses in the last ${STACKING_LOOKBACK_HOURS}h — IOB tails may overlap.`,
    triggeredAt: bucket,
    metadata: { count: doses.length, hours: STACKING_LOOKBACK_HOURS },
  };
}

/**
 * Run all detectors and return the active alerts in deterministic order:
 * hypo, hyper, fast trend, stacking. nulls are filtered.
 */
export function computeAlerts(
  readings: GlucoseReading[],
  doses: InsulinDose[],
  nowMs: number = Date.now(),
): ActiveAlert[] {
  const out: ActiveAlert[] = [];
  const hypo = detectHypo(readings);              if (hypo)     out.push(hypo);
  const hyper = detectHyper(readings);            if (hyper)    out.push(hyper);
  const trend = detectFastTrend(readings, nowMs); if (trend)    out.push(trend);
  const stack = detectStacking(doses);            if (stack)    out.push(stack);
  return out;
}

/* ─── Alert history shaping ──────────────────────────────────────────────── */

export type AuditLogRow = {
  id: string;
  user_id: string;
  action: string;             // "alert.dismiss" | "alert.snooze"
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type HistoryAction = "dismiss" | "snooze";

export type HistoryEntry = {
  id: string;
  alertId: string;             // resource_id from audit_log
  action: HistoryAction;
  alertType: AlertType | "unknown";
  recordedAt: string;
  snoozedUntil: string | null; // populated for snooze rows
}

const HISTORY_ACTIONS = new Set(["alert.dismiss", "alert.snooze"]);

/**
 * Convert audit_log rows into a typed alert history list, filtering only
 * the alert.* actions and parsing metadata into typed fields.
 *
 * The alert.id from the resource_id has the form `${type}:${bucketIso}`,
 * so we can recover the alert type without joining anything.
 */
export function shapeHistory(rows: AuditLogRow[]): HistoryEntry[] {
  return rows
    .filter((r) => HISTORY_ACTIONS.has(r.action))
    .map((r) => {
      const action: HistoryAction = r.action === "alert.snooze" ? "snooze" : "dismiss";
      const rid = r.resource_id ?? "";
      const colonIdx = rid.indexOf(":");
      const typeRaw  = colonIdx > 0 ? rid.slice(0, colonIdx) : "unknown";
      const knownTypes: ReadonlySet<string> = new Set([
        "hypo", "hyper", "stacking", "rising_fast", "falling_fast",
      ]);
      const alertType = (knownTypes.has(typeRaw) ? typeRaw : "unknown") as HistoryEntry["alertType"];

      const meta = r.metadata ?? {};
      const snoozedUntil =
        action === "snooze" && typeof meta.snoozedUntil === "string"
          ? (meta.snoozedUntil as string)
          : null;

      return {
        id: r.id,
        alertId: rid,
        action,
        alertType,
        recordedAt: r.created_at,
        snoozedUntil,
      };
    });
}
