/**
 * GluMira™ V7 — client/src/hooks/useTelemetry.ts
 *
 * Hook: useTelemetry
 * Fires telemetry events to /api/telemetry (writes to telemetry_events table).
 * Used by: BetaFeedbackWidget (04.2.82), BernsteinQAPanel (04.2.84)
 *
 * NOTE: "use client" directive removed — Vite+React, not Next.js.
 * Architecture: /client/src/ → Vite + React
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-03-29
 */

import { useCallback, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TelemetryCategory =
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
  eventName:     string;
  eventCategory: TelemetryCategory;
  eventData?:    Record<string, unknown>;
  pageContext?:  string;
}

export interface UseTelemetryReturn {
  track:          (event: TelemetryEvent) => void;
  trackFeedback:  (eventName: string, data?: Record<string, unknown>) => void;
  trackAI:        (eventName: string, data?: Record<string, unknown>) => void;
  trackFeature:   (featureName: string, data?: Record<string, unknown>) => void;
  trackError:     (errorName: string, data?: Record<string, unknown>) => void;
}

// ── Session ID ────────────────────────────────────────────────────────────────

function getSessionId(): string {
  let id = sessionStorage.getItem("glumira_session_id");
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem("glumira_session_id", id);
  }
  return id;
}

// ── Device type ───────────────────────────────────────────────────────────────

function getDeviceType(): "desktop" | "tablet" | "mobile" {
  const w = window.innerWidth;
  if (w < 768)  return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

// ── Auth token ────────────────────────────────────────────────────────────────

function getAuthToken(): string | null {
  try {
    const direct = localStorage.getItem("glumira_access_token");
    if (direct) return direct;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes("auth-token")) {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw)?.access_token ?? null;
      }
    }
    return null;
  } catch { return null; }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTelemetry(): UseTelemetryReturn {
  // Queue for batching — flushes every 5s or on 10 events
  const queueRef = useRef<TelemetryEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async (events: TelemetryEvent[]) => {
    if (events.length === 0) return;
    const token = getAuthToken();
    try {
      await fetch("/api/telemetry/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId:  getSessionId(),
          deviceType: getDeviceType(),
          pageContext: window.location.pathname,
          events,
        }),
      });
    } catch {
      // Telemetry failure is silent — never block UX
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const toFlush = [...queueRef.current];
      queueRef.current = [];
      flush(toFlush);
    }, 5000);
  }, [flush]);

  const track = useCallback((event: TelemetryEvent) => {
    queueRef.current.push(event);
    if (queueRef.current.length >= 10) {
      const toFlush = [...queueRef.current];
      queueRef.current = [];
      if (timerRef.current) clearTimeout(timerRef.current);
      flush(toFlush);
    } else {
      scheduleFlush();
    }
  }, [flush, scheduleFlush]);

  const trackFeedback = useCallback((eventName: string, data?: Record<string, unknown>) => {
    track({ eventName, eventCategory: "feedback", eventData: data });
  }, [track]);

  const trackAI = useCallback((eventName: string, data?: Record<string, unknown>) => {
    track({ eventName, eventCategory: "ai_interaction", eventData: data });
  }, [track]);

  const trackFeature = useCallback((featureName: string, data?: Record<string, unknown>) => {
    track({ eventName: `feature_${featureName}`, eventCategory: "feature_use", eventData: data });
  }, [track]);

  const trackError = useCallback((errorName: string, data?: Record<string, unknown>) => {
    track({ eventName: errorName, eventCategory: "error", eventData: data });
  }, [track]);

  return { track, trackFeedback, trackAI, trackFeature, trackError };
}
