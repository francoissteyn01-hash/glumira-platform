/**
 * GluMira™ Client Telemetry Hook
 * Version: 7.0.0
 * Module: TEL-CLIENT
 *
 * React hook that provides event tracking for all components.
 * Events are batched in memory and flushed to the server every 30 seconds
 * or on page unload (via sendBeacon).
 *
 * Usage:
 *   const { track, trackPageView, trackFeature, trackError } = useTelemetry();
 *   track("custom_event", "feature_use", { detail: "value" });
 *   trackPageView("/dashboard");
 *   trackFeature("iob_chart_viewed");
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Types ───────────────────────────────────────────────────

type EventCategory =
  | "navigation"
  | "feature_use"
  | "data_entry"
  | "sync"
  | "ai_interaction"
  | "feedback"
  | "onboarding"
  | "export"
  | "error";

interface QueuedEvent {
  eventName: string;
  eventCategory: EventCategory;
  eventData?: Record<string, unknown>;
  pageContext?: string;
  deviceType?: "desktop" | "tablet" | "mobile";
  timestamp: string;
}

// ─── Session ID ──────────────────────────────────────────────

function getSessionId(): string {
  const key = "glumira_session_id";
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

// ─── Device Detection ────────────────────────────────────────

function detectDeviceType(): "desktop" | "tablet" | "mobile" {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

// ─── Flush Configuration ─────────────────────────────────────

const FLUSH_INTERVAL_MS = 30_000; // 30 seconds
const MAX_BATCH_SIZE = 50;
const API_ENDPOINT = "/api/telemetry/events";

// ─── Hook ────────────────────────────────────────────────────

export function useTelemetry() {
  const { user } = useAuth();
  const queueRef = useRef<QueuedEvent[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Flush to server ──

  const flush = useCallback(async () => {
    if (queueRef.current.length === 0 || !user?.id) return;

    const events = queueRef.current.splice(0, MAX_BATCH_SIZE);
    const payload = {
      userId: String(user.id),
      sessionId: getSessionId(),
      events,
      batchSentAt: new Date().toISOString(),
    };

    try {
      await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Re-queue on failure (best effort)
      queueRef.current.unshift(...events);
    }
  }, [user?.id]);

  // ── Beacon flush on unload ──

  const beaconFlush = useCallback(() => {
    if (queueRef.current.length === 0 || !user?.id) return;

    const payload = {
      userId: String(user.id),
      sessionId: getSessionId(),
      events: queueRef.current.splice(0),
      batchSentAt: new Date().toISOString(),
    };

    navigator.sendBeacon(
      API_ENDPOINT,
      new Blob([JSON.stringify(payload)], { type: "application/json" })
    );
  }, [user?.id]);

  // ── Setup interval & unload listener ──

  useEffect(() => {
    flushTimerRef.current = setInterval(flush, FLUSH_INTERVAL_MS);

    window.addEventListener("beforeunload", beaconFlush);

    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      window.removeEventListener("beforeunload", beaconFlush);
      // Final flush on unmount
      flush();
    };
  }, [flush, beaconFlush]);

  // ── Core track function ──

  const track = useCallback(
    (
      eventName: string,
      eventCategory: EventCategory,
      eventData?: Record<string, unknown>,
      pageContext?: string
    ) => {
      queueRef.current.push({
        eventName,
        eventCategory,
        eventData,
        pageContext: pageContext ?? window.location.pathname,
        deviceType: detectDeviceType(),
        timestamp: new Date().toISOString(),
      });

      // Auto-flush if queue is getting large
      if (queueRef.current.length >= MAX_BATCH_SIZE) {
        flush();
      }
    },
    [flush]
  );

  // ── Convenience methods ──

  const trackPageView = useCallback(
    (page?: string) => {
      track("page_view", "navigation", { page: page ?? window.location.pathname });
    },
    [track]
  );

  const trackFeature = useCallback(
    (featureName: string, data?: Record<string, unknown>) => {
      track(featureName, "feature_use", data);
    },
    [track]
  );

  const trackSync = useCallback(
    (eventName: string, data?: Record<string, unknown>) => {
      track(eventName, "sync", data);
    },
    [track]
  );

  const trackAI = useCallback(
    (eventName: string, data?: Record<string, unknown>) => {
      track(eventName, "ai_interaction", data);
    },
    [track]
  );

  const trackOnboarding = useCallback(
    (step: string, data?: Record<string, unknown>) => {
      track("onboarding_step_completed", "onboarding", { step, ...data });
    },
    [track]
  );

  const trackFeedback = useCallback(
    (eventName: string, data?: Record<string, unknown>) => {
      track(eventName, "feedback", data);
    },
    [track]
  );

  const trackError = useCallback(
    (errorMessage: string, data?: Record<string, unknown>) => {
      track("client_error", "error", { errorMessage, ...data });
    },
    [track]
  );

  const trackExport = useCallback(
    (format: string, data?: Record<string, unknown>) => {
      track(`${format}_exported`, "export", data);
    },
    [track]
  );

  return {
    track,
    trackPageView,
    trackFeature,
    trackSync,
    trackAI,
    trackOnboarding,
    trackFeedback,
    trackError,
    trackExport,
  };
}
