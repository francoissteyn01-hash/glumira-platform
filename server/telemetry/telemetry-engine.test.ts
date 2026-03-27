/**
 * GluMira™ Telemetry Engine — Test Suite
 * Version: 7.0.0
 * Module: TEL-ENGINE-TEST
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  validateEvent,
  validateBatch,
  batchToInserts,
  computeDailyMetrics,
  TELEMETRY_EVENTS,
  type TelemetryEvent,
  type TelemetryBatch,
  type TelemetryInsert,
} from "./telemetry-engine";

// ─── Event Validation ────────────────────────────────────────

describe("validateEvent", () => {
  it("should accept a valid event", () => {
    const event: TelemetryEvent = {
      eventName: TELEMETRY_EVENTS.IOB_CHART_VIEWED,
      eventCategory: "feature_use",
    };
    expect(validateEvent(event)).toHaveLength(0);
  });

  it("should reject missing eventName", () => {
    const event = { eventName: "", eventCategory: "feature_use" } as TelemetryEvent;
    const errors = validateEvent(event);
    expect(errors.some((e) => e.includes("eventName"))).toBe(true);
  });

  it("should reject invalid eventCategory", () => {
    const event = { eventName: "test", eventCategory: "invalid" as any };
    const errors = validateEvent(event);
    expect(errors.some((e) => e.includes("eventCategory"))).toBe(true);
  });

  it("should reject invalid deviceType", () => {
    const event: TelemetryEvent = {
      eventName: "test",
      eventCategory: "navigation",
      deviceType: "smartwatch" as any,
    };
    const errors = validateEvent(event);
    expect(errors.some((e) => e.includes("deviceType"))).toBe(true);
  });

  it("should accept valid deviceType", () => {
    const event: TelemetryEvent = {
      eventName: "test",
      eventCategory: "navigation",
      deviceType: "mobile",
    };
    expect(validateEvent(event)).toHaveLength(0);
  });

  it("should reject eventName over 100 chars", () => {
    const event: TelemetryEvent = {
      eventName: "a".repeat(101),
      eventCategory: "navigation",
    };
    const errors = validateEvent(event);
    expect(errors.some((e) => e.includes("100 characters"))).toBe(true);
  });

  it("should reject pageContext over 500 chars", () => {
    const event: TelemetryEvent = {
      eventName: "test",
      eventCategory: "navigation",
      pageContext: "x".repeat(501),
    };
    const errors = validateEvent(event);
    expect(errors.some((e) => e.includes("500 characters"))).toBe(true);
  });

  it("should accept all valid categories", () => {
    const categories = [
      "navigation", "feature_use", "data_entry", "sync",
      "ai_interaction", "feedback", "onboarding", "export", "error",
    ] as const;
    categories.forEach((cat) => {
      const event: TelemetryEvent = { eventName: "test", eventCategory: cat };
      expect(validateEvent(event)).toHaveLength(0);
    });
  });
});

// ─── Batch Validation ────────────────────────────────────────

describe("validateBatch", () => {
  const validBatch: TelemetryBatch = {
    userId: "user-123",
    sessionId: "session-456",
    events: [
      { eventName: "page_view", eventCategory: "navigation" },
    ],
    batchSentAt: new Date().toISOString(),
  };

  it("should accept a valid batch", () => {
    expect(validateBatch(validBatch)).toHaveLength(0);
  });

  it("should reject missing userId", () => {
    const batch = { ...validBatch, userId: "" };
    const errors = validateBatch(batch);
    expect(errors.some((e) => e.includes("userId"))).toBe(true);
  });

  it("should reject missing sessionId", () => {
    const batch = { ...validBatch, sessionId: "" };
    const errors = validateBatch(batch);
    expect(errors.some((e) => e.includes("sessionId"))).toBe(true);
  });

  it("should reject empty events array", () => {
    const batch = { ...validBatch, events: [] };
    const errors = validateBatch(batch);
    expect(errors.some((e) => e.includes("At least one"))).toBe(true);
  });

  it("should reject more than 100 events", () => {
    const events = Array.from({ length: 101 }, () => ({
      eventName: "test",
      eventCategory: "navigation" as const,
    }));
    const batch = { ...validBatch, events };
    const errors = validateBatch(batch);
    expect(errors.some((e) => e.includes("Maximum 100"))).toBe(true);
  });

  it("should propagate individual event errors", () => {
    const batch: TelemetryBatch = {
      ...validBatch,
      events: [{ eventName: "", eventCategory: "invalid" as any }],
    };
    const errors = validateBatch(batch);
    expect(errors.some((e) => e.includes("events[0]"))).toBe(true);
  });
});

// ─── Batch to Inserts ────────────────────────────────────────

describe("batchToInserts", () => {
  it("should transform a batch into insert rows", () => {
    const batch: TelemetryBatch = {
      userId: "user-123",
      sessionId: "session-456",
      events: [
        {
          eventName: "iob_chart_viewed",
          eventCategory: "feature_use",
          eventData: { chartType: "decay" },
          pageContext: "/dashboard",
          deviceType: "desktop",
          timestamp: "2026-03-27T10:00:00Z",
        },
      ],
      batchSentAt: "2026-03-27T10:00:05Z",
    };

    const inserts = batchToInserts(batch);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].user_id).toBe("user-123");
    expect(inserts[0].session_id).toBe("session-456");
    expect(inserts[0].event_name).toBe("iob_chart_viewed");
    expect(inserts[0].event_category).toBe("feature_use");
    expect(inserts[0].event_data).toEqual({ chartType: "decay" });
    expect(inserts[0].page_context).toBe("/dashboard");
    expect(inserts[0].device_type).toBe("desktop");
    expect(inserts[0].created_at).toBe("2026-03-27T10:00:00Z");
  });

  it("should default missing optional fields to null", () => {
    const batch: TelemetryBatch = {
      userId: "user-1",
      sessionId: "sess-1",
      events: [{ eventName: "test", eventCategory: "navigation" }],
      batchSentAt: new Date().toISOString(),
    };
    const inserts = batchToInserts(batch);
    expect(inserts[0].event_data).toEqual({});
    expect(inserts[0].page_context).toBeNull();
    expect(inserts[0].device_type).toBeNull();
  });

  it("should handle multiple events in one batch", () => {
    const batch: TelemetryBatch = {
      userId: "user-1",
      sessionId: "sess-1",
      events: [
        { eventName: "page_view", eventCategory: "navigation" },
        { eventName: "iob_chart_viewed", eventCategory: "feature_use" },
        { eventName: "feedback_submitted", eventCategory: "feedback" },
      ],
      batchSentAt: new Date().toISOString(),
    };
    const inserts = batchToInserts(batch);
    expect(inserts).toHaveLength(3);
    expect(inserts[0].event_name).toBe("page_view");
    expect(inserts[1].event_name).toBe("iob_chart_viewed");
    expect(inserts[2].event_name).toBe("feedback_submitted");
  });
});

// ─── Daily Metrics Computation ───────────────────────────────

describe("computeDailyMetrics", () => {
  const baseInsert: TelemetryInsert = {
    user_id: "user-1",
    session_id: "sess-1",
    event_name: "page_view",
    event_category: "navigation",
    event_data: {},
    page_context: null,
    device_type: null,
    created_at: "2026-03-27T08:00:00Z",
  };

  it("should compute metrics for a single user single event", () => {
    const metrics = computeDailyMetrics([baseInsert], "2026-03-27", 10, 1);
    expect(metrics.activeUsers).toBe(1);
    expect(metrics.totalEvents).toBe(1);
    expect(metrics.totalUsers).toBe(10);
    expect(metrics.newUsers).toBe(1);
  });

  it("should count unique active users", () => {
    const events: TelemetryInsert[] = [
      { ...baseInsert, user_id: "user-1" },
      { ...baseInsert, user_id: "user-1" },
      { ...baseInsert, user_id: "user-2" },
      { ...baseInsert, user_id: "user-3" },
    ];
    const metrics = computeDailyMetrics(events, "2026-03-27", 50, 3);
    expect(metrics.activeUsers).toBe(3);
    expect(metrics.totalEvents).toBe(4);
  });

  it("should count feature usage by event name", () => {
    const events: TelemetryInsert[] = [
      { ...baseInsert, event_name: "iob_chart_viewed", event_category: "feature_use" },
      { ...baseInsert, event_name: "iob_chart_viewed", event_category: "feature_use" },
      { ...baseInsert, event_name: "glucose_timeline_viewed", event_category: "feature_use" },
    ];
    const metrics = computeDailyMetrics(events, "2026-03-27", 10, 0);
    expect(metrics.featureUsage["iob_chart_viewed"]).toBe(2);
    expect(metrics.featureUsage["glucose_timeline_viewed"]).toBe(1);
  });

  it("should count sync, feedback, and AI events separately", () => {
    const events: TelemetryInsert[] = [
      { ...baseInsert, event_category: "sync" },
      { ...baseInsert, event_category: "sync" },
      { ...baseInsert, event_category: "feedback" },
      { ...baseInsert, event_category: "ai_interaction" },
      { ...baseInsert, event_category: "ai_interaction" },
      { ...baseInsert, event_category: "ai_interaction" },
    ];
    const metrics = computeDailyMetrics(events, "2026-03-27", 10, 0);
    expect(metrics.syncCount).toBe(2);
    expect(metrics.feedbackCount).toBe(1);
    expect(metrics.aiQueries).toBe(3);
  });

  it("should compute average session duration", () => {
    const events: TelemetryInsert[] = [
      { ...baseInsert, session_id: "sess-1", created_at: "2026-03-27T08:00:00Z" },
      { ...baseInsert, session_id: "sess-1", created_at: "2026-03-27T08:10:00Z" }, // 10 min session
      { ...baseInsert, session_id: "sess-2", created_at: "2026-03-27T09:00:00Z" },
      { ...baseInsert, session_id: "sess-2", created_at: "2026-03-27T09:05:00Z" }, // 5 min session
    ];
    const metrics = computeDailyMetrics(events, "2026-03-27", 10, 0);
    // Average: (600 + 300) / 2 = 450 seconds
    expect(metrics.avgSessionSec).toBe(450);
  });

  it("should handle empty events array", () => {
    const metrics = computeDailyMetrics([], "2026-03-27", 0, 0);
    expect(metrics.activeUsers).toBe(0);
    expect(metrics.totalEvents).toBe(0);
    expect(metrics.avgSessionSec).toBe(0);
  });
});

// ─── Predefined Events ──────────────────────────────────────

describe("TELEMETRY_EVENTS constants", () => {
  it("should have all expected event names defined", () => {
    expect(TELEMETRY_EVENTS.PAGE_VIEW).toBe("page_view");
    expect(TELEMETRY_EVENTS.IOB_CHART_VIEWED).toBe("iob_chart_viewed");
    expect(TELEMETRY_EVENTS.DEXCOM_SYNC_COMPLETED).toBe("dexcom_sync_completed");
    expect(TELEMETRY_EVENTS.ONBOARDING_COMPLETED).toBe("onboarding_completed");
    expect(TELEMETRY_EVENTS.FEEDBACK_SUBMITTED).toBe("feedback_submitted");
    expect(TELEMETRY_EVENTS.AI_CHAT_MESSAGE_SENT).toBe("ai_chat_message_sent");
    expect(TELEMETRY_EVENTS.BERNSTEIN_QA_QUERIED).toBe("bernstein_qa_queried");
    expect(TELEMETRY_EVENTS.CLIENT_ERROR).toBe("client_error");
  });

  it("should have unique event names", () => {
    const values = Object.values(TELEMETRY_EVENTS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
