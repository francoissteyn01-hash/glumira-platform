/**
 * GluMira™ V7 — server/routes/telemetry.route.ts
 *
 * POST /api/telemetry/batch   — batch event flush (used by useTelemetry hook)
 * POST /api/telemetry/events  — single event (legacy)
 * POST /api/auth/me/onboarding — save onboarding data
 *
 * Version: v1.0 · 2026-03-29
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { supabase } from "../index";
import { requireAuth, getUserId } from "../middleware/auth";

export const telemetryBatchRouter = Router();
export const onboardingRouter     = Router();

// ── POST /api/telemetry/batch ─────────────────────────────────────────────────
// Used by useTelemetry.ts hook — flushes queued events

const BatchSchema = z.object({
  sessionId:   z.string().optional(),
  deviceType:  z.enum(["desktop","tablet","mobile"]).optional(),
  pageContext: z.string().max(255).optional(),
  events:      z.array(z.object({
    eventName:     z.string().min(1).max(100),
    eventCategory: z.enum(["navigation","feature_use","data_entry","sync","ai_interaction","feedback","onboarding","export","error"]),
    eventData:     z.record(z.unknown()).optional(),
  })).min(1).max(50),
});

telemetryBatchRouter.post("/batch", async (req: Request, res: Response) => {
  const p = BatchSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid batch payload" });

  // Get user ID if authenticated (optional for telemetry)
  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const { data } = await supabase.auth.getUser(authHeader.slice(7));
    userId = data.user?.id ?? null;
  }

  const rows = p.data.events.map(e => ({
    user_id:        userId,
    session_id:     p.data.sessionId,
    event_name:     e.eventName,
    event_category: e.eventCategory,
    event_data:     e.eventData ?? {},
    page_context:   p.data.pageContext,
    device_type:    p.data.deviceType,
  }));

  // Fire and forget — telemetry never blocks the response
  supabase.from("telemetry_events").insert(rows).then(() => {});

  return res.status(202).json({ ok: true, accepted: rows.length });
});

// Legacy single-event endpoint
telemetryBatchRouter.post("/events", async (req: Request, res: Response) => {
  const { userId, sessionId, events } = req.body;
  if (!Array.isArray(events)) return res.status(400).json({ error: "events array required" });
  supabase.from("telemetry_events").insert(events.map((e: Record<string,unknown>) => ({
    user_id: userId, session_id: sessionId, ...e,
  }))).then(() => {});
  return res.status(202).json({ ok: true, accepted: events.length });
});

// ── POST /api/auth/me/onboarding ──────────────────────────────────────────────
// Saves onboarding data from OnboardingFlow.tsx

const OnboardingSchema = z.object({
  diabetesType:  z.enum(["T1D","T2D","Gestational"]).nullable(),
  insulinMethod: z.enum(["MDI","pump","oral","none"]).nullable(),
  cgmType:       z.enum(["dexcom","libre","nightscout","finger_prick","none"]).nullable(),
  nightscoutUrl: z.string().optional(),
  targetLow:     z.number().min(2).max(30),
  targetHigh:    z.number().min(5).max(30),
  glucoseUnit:   z.enum(["mmol","mgdl"]),
  consentGiven:  z.boolean(),
});

onboardingRouter.post("/onboarding", requireAuth, async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const p = OnboardingSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid onboarding data" });

  const d = p.data;

  // Update user profile
  await supabase.from("user_profiles").update({ onboarding_done: true }).eq("id", userId);

  // Update patient profile if one exists
  if (d.cgmType === "nightscout" && d.nightscoutUrl) {
    await supabase.from("patient_profiles")
      .update({ nightscout_url: d.nightscoutUrl, glucose_unit: d.glucoseUnit })
      .eq("clinician_id", userId);
  }

  // Mark onboarding checkpoints
  await supabase.from("onboarding_checkpoints").update({
    profile_created:      true,
    diabetes_type_set:    !!d.diabetesType,
    glucose_unit_set:     true,
    target_range_set:     true,
    cgm_source_connected: d.cgmType !== "none" && d.cgmType !== null,
    dashboard_viewed:     false,
    updated_at:           new Date().toISOString(),
  }).eq("user_id", userId);

  // Consent timestamp
  if (d.consentGiven) {
    await supabase.from("beta_participants")
      .update({ consent_given_at: new Date().toISOString(), status: "active" })
      .eq("user_id", userId);
  }

  // Telemetry
  await supabase.from("telemetry_events").insert({
    user_id: userId, event_name: "onboarding_complete",
    event_category: "onboarding",
    event_data: { diabetesType: d.diabetesType, cgmType: d.cgmType, glucoseUnit: d.glucoseUnit },
  });

  return res.json({ ok: true, message: "Onboarding saved." });
});
