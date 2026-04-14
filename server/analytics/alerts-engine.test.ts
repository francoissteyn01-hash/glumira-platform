/**
 * GluMira™ V7 — server/analytics/alerts-engine.test.ts
 *
 * Unit tests for the pure alert detection functions and history shaping.
 * No DB, no Express — every function is fed plain arrays.
 */

import { describe, expect, test } from "vitest";
import {
  detectHypo,
  detectHyper,
  detectFastTrend,
  detectStacking,
  computeAlerts,
  shapeHistory,
  HYPO_THRESHOLD,
  HYPER_THRESHOLD,
  FAST_TREND_DELTA,
  FAST_TREND_WINDOW_MIN,
  STACKING_THRESHOLD,
  type GlucoseReading,
  type InsulinDose,
  type AuditLogRow,
} from "./alerts-engine";

/* ─── Fixtures ─────────────────────────────────────────────────────────── */

const NOW_MS = new Date("2026-04-10T12:00:00Z").getTime();
const ago = (mins: number) => new Date(NOW_MS - mins * 60_000).toISOString();

function readings(...pairs: Array<[number, number]>): GlucoseReading[] {
  // pairs are [valueMmol, minutesAgo] — newest first
  return pairs.map(([value, mins]) => ({ value, at: ago(mins) }));
}

function doses(...minutesAgoList: number[]): InsulinDose[] {
  return minutesAgoList.map((mins) => ({ units: 4, at: ago(mins) }));
}

/* ─── detectHypo ───────────────────────────────────────────────────────── */
describe("detectHypo", () => {
  test("returns null on empty input", () => {
    expect(detectHypo([])).toBeNull();
  });

  test("returns null when latest is at the threshold", () => {
    expect(detectHypo(readings([HYPO_THRESHOLD, 0]))).toBeNull();
  });

  test("fires when latest is below threshold", () => {
    const alert = detectHypo(readings([3.5, 0]));
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("hypo");
    expect(alert!.severity).toBe("critical");
    expect(alert!.metadata).toMatchObject({ value: 3.5 });
  });

  test("body includes the formatted value to one decimal", () => {
    const alert = detectHypo(readings([3.42, 0]));
    expect(alert!.body).toContain("3.4");
  });

  test("only the latest reading matters (older lows ignored)", () => {
    const out = detectHypo(readings([5.0, 0], [3.0, 5]));
    expect(out).toBeNull();
  });
});

/* ─── detectHyper ──────────────────────────────────────────────────────── */
describe("detectHyper", () => {
  test("returns null on empty input", () => {
    expect(detectHyper([])).toBeNull();
  });

  test("returns null at the threshold", () => {
    expect(detectHyper(readings([HYPER_THRESHOLD, 0]))).toBeNull();
  });

  test("fires when latest is above threshold", () => {
    const alert = detectHyper(readings([15.0, 0]));
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("hyper");
    expect(alert!.severity).toBe("warning");
  });
});

/* ─── detectFastTrend ──────────────────────────────────────────────────── */
describe("detectFastTrend", () => {
  test("returns null with fewer than 2 readings", () => {
    expect(detectFastTrend(readings([6.0, 0]), NOW_MS)).toBeNull();
  });

  test("fires rising_fast when delta exceeds +threshold", () => {
    const alert = detectFastTrend(
      readings([10.0, 0], [7.0, FAST_TREND_WINDOW_MIN]),
      NOW_MS,
    );
    expect(alert?.type).toBe("rising_fast");
    expect(alert?.metadata?.delta).toBeCloseTo(3.0, 5);
  });

  test("fires falling_fast when delta exceeds -threshold", () => {
    const alert = detectFastTrend(
      readings([5.0, 0], [8.0, FAST_TREND_WINDOW_MIN]),
      NOW_MS,
    );
    expect(alert?.type).toBe("falling_fast");
    expect(alert!.metadata!.delta as number).toBeCloseTo(-3.0, 5);
  });

  test("returns null when delta is below threshold", () => {
    const alert = detectFastTrend(
      readings([7.0, 0], [6.0, FAST_TREND_WINDOW_MIN]),
      NOW_MS,
    );
    expect(alert).toBeNull();
  });

  test("just above the threshold fires rising (>= boundary check)", () => {
    // Note: 7.0 + 2.2 in IEEE 754 yields 9.199999999999999, so we use a
    // delta that reliably represents above the 2.2 threshold without
    // hitting binary floating-point gotchas.
    const alert = detectFastTrend(
      readings([9.3, 0], [7.0, FAST_TREND_WINDOW_MIN]),
      NOW_MS,
    );
    expect(alert?.type).toBe("rising_fast");
    expect(alert!.metadata!.delta as number).toBeGreaterThanOrEqual(FAST_TREND_DELTA);
  });
});

/* ─── detectStacking ───────────────────────────────────────────────────── */
describe("detectStacking", () => {
  test("returns null when below threshold", () => {
    expect(detectStacking(doses(10, 60))).toBeNull();
  });

  test("fires at exactly the threshold", () => {
    const alert = detectStacking(doses(10, 60, 120));
    expect(alert?.type).toBe("stacking");
    expect(alert!.metadata!.count).toBe(STACKING_THRESHOLD);
  });

  test("fires above threshold", () => {
    const alert = detectStacking(doses(10, 30, 60, 120, 180));
    expect(alert!.metadata!.count).toBe(5);
  });
});

/* ─── computeAlerts orchestrator ───────────────────────────────────────── */
describe("computeAlerts", () => {
  test("emits all four detector outputs in deterministic order", () => {
    const alerts = computeAlerts(
      // 3.5 mmol/L now (hypo); rising fast not possible because hypo is the only reading group;
      // need a second reading to enable trend; rising fast won't fire because direction is unclear.
      // So craft: latest hyper + earlier low → falling_fast + hyper + (no hypo).
      readings([15.0, 0], [10.0, FAST_TREND_WINDOW_MIN]),
      doses(5, 30, 90),
      NOW_MS,
    );
    const types = alerts.map((a) => a.type);
    // hyper, rising_fast, stacking — in that fixed order
    expect(types).toEqual(["hyper", "rising_fast", "stacking"]);
  });

  test("returns empty array when nothing triggers", () => {
    const alerts = computeAlerts(readings([6.0, 0], [6.0, 15]), doses(60), NOW_MS);
    expect(alerts).toEqual([]);
  });
});

/* ─── shapeHistory ─────────────────────────────────────────────────────── */
describe("shapeHistory", () => {
  // Note: production rows store alertId in metadata.alertId, not resource_id
  // (resource_id is a uuid column and can't hold composite alert IDs).
  // The fallback to resource_id exists for legacy rows from before that fix.
  const baseRow = (over: Partial<AuditLogRow>): AuditLogRow => ({
    id: over.id ?? "row-" + Math.random().toString(36).slice(2, 8),
    user_id: "u1",
    action: "alert.dismiss",
    resource_type: "alert",
    resource_id: null,
    metadata: { alertId: "hypo:2026-04-10T12:00:00Z" },
    created_at: "2026-04-10T12:01:00Z",
    ...over,
  });

  test("filters out unrelated audit_log actions", () => {
    const out = shapeHistory([
      baseRow({ action: "user.login" }),
      baseRow({ action: "alert.dismiss" }),
      baseRow({ action: "profile.update" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].action).toBe("dismiss");
  });

  test("recovers alert type from metadata.alertId prefix", () => {
    const out = shapeHistory([
      baseRow({ metadata: { alertId: "hypo:t1" } }),
      baseRow({ metadata: { alertId: "stacking:t2" } }),
      baseRow({ metadata: { alertId: "rising_fast:t3" } }),
    ]);
    expect(out.map((e) => e.alertType)).toEqual(["hypo", "stacking", "rising_fast"]);
  });

  test("falls back to resource_id for legacy rows without metadata.alertId", () => {
    const out = shapeHistory([
      baseRow({ metadata: null, resource_id: "hyper:legacy1" }),
    ]);
    expect(out[0].alertType).toBe("hyper");
    expect(out[0].alertId).toBe("hyper:legacy1");
  });

  test("falls back to 'unknown' for malformed alertId", () => {
    const out = shapeHistory([
      baseRow({ metadata: { alertId: "weirdo" } }),
      baseRow({ metadata: null, resource_id: null }),
    ]);
    expect(out[0].alertType).toBe("unknown");
    expect(out[1].alertType).toBe("unknown");
  });

  test("snooze rows expose snoozedUntil from metadata", () => {
    const out = shapeHistory([
      baseRow({
        action: "alert.snooze",
        metadata: { alertId: "hypo:t1", snoozedUntil: "2026-04-10T13:00:00Z" },
      }),
    ]);
    expect(out[0].action).toBe("snooze");
    expect(out[0].snoozedUntil).toBe("2026-04-10T13:00:00Z");
  });

  test("dismiss rows have null snoozedUntil even if metadata leaks through", () => {
    const out = shapeHistory([
      baseRow({
        action: "alert.dismiss",
        metadata: { alertId: "hypo:t1", snoozedUntil: "2026-04-10T13:00:00Z" },
      }),
    ]);
    expect(out[0].action).toBe("dismiss");
    expect(out[0].snoozedUntil).toBeNull();
  });

  test("preserves audit_log id and created_at", () => {
    const out = shapeHistory([
      baseRow({ id: "abc", created_at: "2026-04-10T11:30:00Z" }),
    ]);
    expect(out[0].id).toBe("abc");
    expect(out[0].recordedAt).toBe("2026-04-10T11:30:00Z");
  });

  test("alertId mirrors metadata.alertId verbatim", () => {
    const out = shapeHistory([baseRow({ metadata: { alertId: "hyper:t9" } })]);
    expect(out[0].alertId).toBe("hyper:t9");
  });

  test("handles mixed dismiss + snooze in one batch", () => {
    const out = shapeHistory([
      baseRow({ action: "alert.dismiss", id: "d1" }),
      baseRow({ action: "alert.snooze", id: "s1", metadata: { snoozedUntil: "2026-04-10T14:00:00Z" } }),
      baseRow({ action: "alert.dismiss", id: "d2" }),
    ]);
    expect(out.map((e) => e.action)).toEqual(["dismiss", "snooze", "dismiss"]);
  });

  test("returns empty array for empty input", () => {
    expect(shapeHistory([])).toEqual([]);
  });

  test("missing metadata is treated as no snooze info", () => {
    const out = shapeHistory([baseRow({ action: "alert.snooze", metadata: null })]);
    expect(out[0].snoozedUntil).toBeNull();
  });
});
