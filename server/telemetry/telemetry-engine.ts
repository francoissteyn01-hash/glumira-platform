/**
 * GluMira™ Telemetry Engine
 * Version: 7.0.0
 * Module: TEL-ENGINE
 *
 * Client-agnostic event tracking system that captures user actions,
 * feature utilization, session duration, and error events.
 *
 * Events are batched client-side and flushed to the server every 30 seconds
 * or on page unload. The server writes them to the telemetry_events table.
 *
 * Designed to produce grant-worthy metrics:
 *   - DAU / WAU / MAU
 *   - Feature utilization heatmaps
 *   - Session duration distribution
 *   - Onboarding funnel conversion rates
 *   - Retention curves (7d, 14d, 30d, 90d)
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ───────────────────────────────────────────────────

export type EventCategory =
  | "navigation"
  | "feature_use"
  | "data_entry"
  | "sync"
  | "ai_interaction"
  | "feedback"
  | "onboarding"
  | "export"
  | "error";

export interface TelemetryEvent {
  eventName: string;
  eventCategory: EventCategory;
  eventData?: Record<string, unknown>;
  pageContext?: string;
  deviceType?: "desktop" | "tablet" | "mobile";
  timestamp?: string;
}

export interface TelemetryBatch {
  userId: string;
  sessionId: string;
  events: TelemetryEvent[];
  batchSentAt: string;
}

export interface TelemetryInsert {
  user_id: string;
  session_id: string;
  event_name: string;
  event_category: EventCategory;
  event_data: Record<string, unknown>;
  page_context: string | null;
  device_type: string | null;
  created_at: string;
}

// ─── Predefined Event Names ─────────────────────────────────

export const TELEMETRY_EVENTS = {
  // Navigation
  PAGE_VIEW: "page_view",
  TAB_SWITCH: "tab_switch",

  // Feature Use
  IOB_CHART_VIEWED: "iob_chart_viewed",
  IOB_CHART_INTERACTED: "iob_chart_interacted",
  GLUCOSE_TIMELINE_VIEWED: "glucose_timeline_viewed",
  STACKING_CHART_VIEWED: "stacking_chart_viewed",
  TIR_CHART_VIEWED: "tir_chart_viewed",
  BOLUS_CALCULATOR_USED: "bolus_calculator_used",
  MEAL_LOGGED: "meal_logged",
  DOSE_LOGGED: "dose_logged",
  SCHOOL_CARE_PLAN_GENERATED: "school_care_plan_generated",
  REPORT_EXPORTED: "report_exported",
  PATTERN_CARD_VIEWED: "pattern_card_viewed",
  HYPO_RISK_CARD_VIEWED: "hypo_risk_card_viewed",
  WEEKLY_SUMMARY_VIEWED: "weekly_summary_viewed",

  // AI Interaction
  AI_CHAT_OPENED: "ai_chat_opened",
  AI_CHAT_MESSAGE_SENT: "ai_chat_message_sent",
  BERNSTEIN_QA_QUERIED: "bernstein_qa_queried",
  CLINICIAN_NOTES_GENERATED: "clinician_notes_generated",

  // Sync
  DEXCOM_SYNC_STARTED: "dexcom_sync_started",
  DEXCOM_SYNC_COMPLETED: "dexcom_sync_completed",
  DEXCOM_SYNC_FAILED: "dexcom_sync_failed",
  NIGHTSCOUT_SYNC_STARTED: "nightscout_sync_started",
  NIGHTSCOUT_SYNC_COMPLETED: "nightscout_sync_completed",
  NIGHTSCOUT_SYNC_FAILED: "nightscout_sync_failed",

  // Onboarding
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",
  PROFILE_CREATED: "profile_created",
  CGM_CONNECTED: "cgm_connected",
  FIRST_SYNC_COMPLETE: "first_sync_complete",

  // Feedback
  FEEDBACK_MODAL_OPENED: "feedback_modal_opened",
  FEEDBACK_SUBMITTED: "feedback_submitted",

  // Export
  PDF_EXPORTED: "pdf_exported",
  CSV_EXPORTED: "csv_exported",

  // Error
  CLIENT_ERROR: "client_error",
  SYNC_ERROR: "sync_error",
  API_ERROR: "api_error",
} as const;

// ─── Validation ──────────────────────────────────────────────

const VALID_CATEGORIES: Set<EventCategory> = new Set([
  "navigation", "feature_use", "data_entry", "sync",
  "ai_interaction", "feedback", "onboarding", "export", "error",
]);

const VALID_DEVICE_TYPES = new Set(["desktop", "tablet", "mobile"]);

export function validateEvent(event: TelemetryEvent): string[] {
  const errors: string[] = [];

  if (!event.eventName || typeof event.eventName !== "string") {
    errors.push("eventName is required and must be a string");
  }
  if (!event.eventCategory || !VALID_CATEGORIES.has(event.eventCategory)) {
    errors.push(`eventCategory must be one of: ${[...VALID_CATEGORIES].join(", ")}`);
  }
  if (event.deviceType && !VALID_DEVICE_TYPES.has(event.deviceType)) {
    errors.push(`deviceType must be one of: desktop, tablet, mobile`);
  }
  if (event.eventName && event.eventName.length > 100) {
    errors.push("eventName must be 100 characters or fewer");
  }
  if (event.pageContext && event.pageContext.length > 500) {
    errors.push("pageContext must be 500 characters or fewer");
  }

  return errors;
}

export function validateBatch(batch: TelemetryBatch): string[] {
  const errors: string[] = [];

  if (!batch.userId) errors.push("userId is required");
  if (!batch.sessionId) errors.push("sessionId is required");
  if (!Array.isArray(batch.events)) errors.push("events must be an array");
  if (batch.events && batch.events.length > 100) {
    errors.push("Maximum 100 events per batch");
  }
  if (batch.events && batch.events.length === 0) {
    errors.push("At least one event is required");
  }

  // Validate each event
  if (Array.isArray(batch.events)) {
    batch.events.forEach((event, i) => {
      const eventErrors = validateEvent(event);
      eventErrors.forEach((e) => errors.push(`events[${i}]: ${e}`));
    });
  }

  return errors;
}

// ─── Transform ───────────────────────────────────────────────

/**
 * Transform a batch of client events into database insert rows.
 */
export function batchToInserts(batch: TelemetryBatch): TelemetryInsert[] {
  return batch.events.map((event) => ({
    user_id: batch.userId,
    session_id: batch.sessionId,
    event_name: event.eventName,
    event_category: event.eventCategory,
    event_data: event.eventData ?? {},
    page_context: event.pageContext ?? null,
    device_type: event.deviceType ?? null,
    created_at: event.timestamp ?? new Date().toISOString(),
  }));
}

// ─── Metrics Computation ─────────────────────────────────────

export interface DailyMetrics {
  metricDate: string;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalEvents: number;
  syncCount: number;
  feedbackCount: number;
  aiQueries: number;
  avgSessionSec: number;
  featureUsage: Record<string, number>;
}

/**
 * Compute daily metrics from a set of telemetry inserts.
 * Used by the cron job to populate beta_metrics_daily.
 */
export function computeDailyMetrics(
  events: TelemetryInsert[],
  date: string,
  totalUserCount: number,
  newUserCount: number
): DailyMetrics {
  const uniqueUsers = new Set(events.map((e) => e.user_id));
  const featureEvents = events.filter((e) => e.event_category === "feature_use");
  const syncEvents = events.filter((e) => e.event_category === "sync");
  const feedbackEvents = events.filter((e) => e.event_category === "feedback");
  const aiEvents = events.filter((e) => e.event_category === "ai_interaction");

  // Feature usage breakdown
  const featureUsage: Record<string, number> = {};
  featureEvents.forEach((e) => {
    featureUsage[e.event_name] = (featureUsage[e.event_name] ?? 0) + 1;
  });

  // Approximate session duration from first/last event per session
  const sessions = new Map<string, { first: number; last: number }>();
  events.forEach((e) => {
    const ts = new Date(e.created_at).getTime();
    const existing = sessions.get(e.session_id);
    if (!existing) {
      sessions.set(e.session_id, { first: ts, last: ts });
    } else {
      if (ts < existing.first) existing.first = ts;
      if (ts > existing.last) existing.last = ts;
    }
  });

  let totalSessionSec = 0;
  let sessionCount = 0;
  sessions.forEach(({ first, last }) => {
    const durationSec = (last - first) / 1000;
    if (durationSec > 0) {
      totalSessionSec += durationSec;
      sessionCount++;
    }
  });

  return {
    metricDate: date,
    totalUsers: totalUserCount,
    activeUsers: uniqueUsers.size,
    newUsers: newUserCount,
    totalEvents: events.length,
    syncCount: syncEvents.length,
    feedbackCount: feedbackEvents.length,
    aiQueries: aiEvents.length,
    avgSessionSec: sessionCount > 0 ? Math.round(totalSessionSec / sessionCount) : 0,
    featureUsage,
  };
}
