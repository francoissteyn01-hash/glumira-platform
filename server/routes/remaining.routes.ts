/**
 * GluMira™ V7 — server/routes/remaining.routes.ts
 *
 * Express routes for:
 *   GET  /api/glucose/export       replaces Next.js 04.1.27
 *   POST /api/telemetry            required by useTelemetry hook
 *   POST /api/beta/feedback        required by BetaFeedbackWidget + Modal
 *   POST /api/bernstein/ask        required by BernsteinQAPanel
 *   GET  /api/analytics/summary    required by AnalyticsSummaryCard
 *   GET  /api/doses/history        replaces Next.js 04.1.30
 *   GET  /api/meals/carb-lookup    replaces Next.js 04.1.36
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-03-29
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { requireFeature }                from "../middleware/subscription";
import { exportGlucoseData }             from "../analytics/glucose-export";
import { generateAnalyticsSummary }      from "../analytics/analytics-summary";
import { lookupFood, estimateCarbs, classifyGlycaemicLoad, recommendIcrDose } from "../meals/carb-counter";
import { supabase } from "../index";
import type { GlucosePoint } from "../analytics/analytics-summary";

// ── glucose/export ────────────────────────────────────────────────────────────
export const glucoseExportRouter = Router();

glucoseExportRouter.get("/export", requireAuth, requireFeature("pdf_export"), async (req: AuthRequest, res) => {
  const format = (req.query.format as string) ?? "csv";
  const unit   = (req.query.unit   as string) ?? "mmol";
  const days   = Math.min(parseInt(req.query.days as string ?? "14", 10) || 14, 90);
  const since  = req.query.start
    ? new Date((req.query.start as string) + "T00:00:00Z").toISOString()
    : new Date(Date.now() - days*86400000).toISOString();

  if (!["csv","json"].includes(format)) return res.status(400).json({ error: "format must be csv or json" });
  if (!["mmol","mgdl"].includes(unit))  return res.status(400).json({ error: "unit must be mmol or mgdl" });

  const { data: rows } = await supabase
    .from("glucose_readings").select("glucose_mmol, recorded_at")
    .eq("user_id", req.user!.id).gte("recorded_at", since).order("recorded_at");

  const readings: GlucosePoint[] = (rows ?? []).map(r => ({ glucose: r.glucose_mmol, timestamp: r.recorded_at }));
  const result = exportGlucoseData(readings, { format: format as "csv"|"json", unit: unit as "mmol"|"mgdl", includeStats: true });

  res.set("Content-Type", result.mimeType);
  res.set("Content-Disposition", `attachment; filename="${result.filename}"`);
  res.set("X-Row-Count", String(result.rowCount));
  return res.send(result.content);
});

// ── telemetry ─────────────────────────────────────────────────────────────────
export const telemetryRouter = Router();

const TelSchema = z.object({
  event_name:     z.string().min(1).max(100),
  event_category: z.enum(["navigation","feature_use","data_entry","sync","ai_interaction","feedback","onboarding","export","error"]),
  event_data:     z.record(z.unknown()).optional().default({}),
  page_context:   z.string().max(255).optional(),
  device_type:    z.enum(["desktop","tablet","mobile"]).optional(),
  session_id:     z.string().optional(),
});

telemetryRouter.post("/", requireAuth, async (req: AuthRequest, res) => {
  const p = TelSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid telemetry payload" });
  await supabase.from("telemetry_events").insert({ user_id: req.user!.id, ...p.data });
  return res.json({ ok: true });
});

// ── beta/feedback ─────────────────────────────────────────────────────────────
export const betaFeedbackRouter = Router();

const FbSchema = z.object({
  category:      z.enum(["iob_chart","glucose_timeline","bolus_calculator","school_care_plan","ai_assistant","data_sync","general","bug"]),
  rating:        z.number().int().min(1).max(5),
  comment:       z.string().max(2000).optional(),
  npsScore:      z.number().int().min(0).max(10).optional(),
  pageContext:   z.string().max(255).optional(),
  sessionId:     z.string().optional(),
  deviceType:    z.enum(["desktop","tablet","mobile"]).optional(),
  participantId: z.string().max(30).optional(),
});

betaFeedbackRouter.post("/feedback", requireAuth, async (req: AuthRequest, res) => {
  const p = FbSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid feedback", details: p.error.flatten() });
  const { error } = await supabase.from("beta_feedback").insert({
    user_id: req.user!.id, participant_id: p.data.participantId,
    category: p.data.category, rating: p.data.rating, comment: p.data.comment,
    nps_score: p.data.npsScore, page_context: p.data.pageContext,
    session_id: p.data.sessionId, device_type: p.data.deviceType,
  });
  if (error) return res.status(500).json({ error: "Failed to save feedback" });
  return res.json({ ok: true });
});

// ── bernstein/ask ─────────────────────────────────────────────────────────────
export const bernsteinRouter = Router();

const BERNSTEIN_SYSTEM = `You are the GluMira™ Bernstein AI — an educational assistant grounded in Dr. Bernstein's diabetes methodology.

RULES:
- Plain language only. No jargon unless explained.
- Every response MUST end with: "Discuss this with your care team."
- Never recommend specific insulin doses or say "inject" or "dose" as instructions.
- Never use fear as motivation.
- You are EDUCATIONAL ONLY — not a medical device.
- Reference Bernstein principles where relevant (Law of Small Numbers, low-carb, precision testing).

Respond ONLY in this exact JSON format:
{"answer": "...(ends with: Discuss this with your care team.)", "principleReferenced": "..." | null}`;

bernsteinRouter.post("/ask", requireAuth, async (req: AuthRequest, res) => {
  const { question, patientContext, conversationHistory = [] } = req.body;
  if (!question?.trim()) return res.status(400).json({ error: "question is required" });

  try {
    const messages = [
      ...conversationHistory.slice(-8).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
      { role: "user", content: patientContext ? `[Context: ${JSON.stringify(patientContext)}]\n\n${question}` : question },
    ];

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type":"application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version":"2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600, system: BERNSTEIN_SYSTEM, messages }),
    });

    if (!r.ok) throw new Error(`Anthropic ${r.status}`);
    const d    = (await r.json()) as Record<string, any>;
    const text = d.content?.[0]?.text ?? "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    await supabase.from("telemetry_events").insert({
      user_id: req.user!.id, event_name: "bernstein_ai_query",
      event_category: "ai_interaction", event_data: { q_len: question.length },
    });

    return res.json({ answer: parsed.answer, principleReferenced: parsed.principleReferenced ?? null,
      disclaimer: "GluMira™ is an educational platform, not a medical device." });
  } catch (err) {
    console.error("[bernstein]", err);
    return res.status(500).json({ error: "AI temporarily unavailable." });
  }
});

// ── analytics/summary ─────────────────────────────────────────────────────────
export const analyticsRouter = Router();

analyticsRouter.get("/summary", requireAuth, async (req: AuthRequest, res) => {
  const { data: rows } = await supabase
    .from("glucose_readings").select("glucose_mmol, recorded_at")
    .eq("user_id", req.user!.id)
    .gte("recorded_at", new Date(Date.now() - 14*86400000).toISOString())
    .order("recorded_at");

  const readings: GlucosePoint[] = (rows ?? []).map(r => ({ glucose: r.glucose_mmol, timestamp: r.recorded_at }));
  return res.json({ ok: true, summary: generateAnalyticsSummary(readings) });
});

// ── doses/history ─────────────────────────────────────────────────────────────
export const doseHistoryRouter = Router();

doseHistoryRouter.get("/history", requireAuth, async (req: AuthRequest, res) => {
  const days  = Math.min(parseInt(req.query.days as string ?? "7", 10) || 7, 90);
  const since = new Date(Date.now() - days*86400000).toISOString();

  const { data: doses } = await supabase
    .from("dose_log").select("*")
    .eq("created_by", req.user!.id).gte("administered_at", since)
    .order("administered_at", { ascending: false });

  const rows = doses ?? [];
  const map  = new Map<string, typeof rows>();
  for (const d of rows) {
    const date = new Date(d.administered_at).toISOString().slice(0,10);
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(d);
  }

  const groups = Array.from(map.entries()).sort(([a],[b]) => b.localeCompare(a)).map(([date, dd]) => ({
    date,
    doses:           dd,
    totalUnits:      parseFloat(dd.reduce((s,d) => s+d.dose_units, 0).toFixed(1)),
    bolusUnits:      parseFloat(dd.filter(d => d.dose_reason==="meal_bolus").reduce((s,d) => s+d.dose_units, 0).toFixed(1)),
    basalUnits:      parseFloat(dd.filter(d => d.dose_reason==="basal").reduce((s,d) => s+d.dose_units, 0).toFixed(1)),
    correctionUnits: parseFloat(dd.filter(d => d.dose_reason==="correction").reduce((s,d) => s+d.dose_units, 0).toFixed(1)),
  }));

  return res.json({ ok:true, days, totalDoses: rows.length, totalUnits: parseFloat(rows.reduce((s,d)=>s+d.dose_units,0).toFixed(1)), groups });
});

// ── meals/carb-lookup ─────────────────────────────────────────────────────────
export const carbLookupRouter = Router();

carbLookupRouter.get("/carb-lookup", requireAuth, async (req: AuthRequest, res) => {
  const query = (req.query.q as string)?.trim();
  if (!query) return res.status(400).json({ error: "Query param 'q' is required" });

  const food = lookupFood(query);
  if (!food)  return res.status(404).json({ error: `Food not found: ${query}` });

  const grams        = req.query.grams ? parseFloat(req.query.grams as string) : food.servingGrams;
  const icr          = req.query.icr   ? parseFloat(req.query.icr   as string) : null;
  const carbEstimate = estimateCarbs(food, grams);
  const glCategory   = classifyGlycaemicLoad(carbEstimate.glycaemicLoad);
  const dose         = icr ? recommendIcrDose(carbEstimate.totalCarbs, icr) : null;

  return res.json({
    food: food.name, grams, carbEstimate, glycaemicLoadCategory: glCategory, suggestedDose: dose,
    disclaimer: "GluMira™ is an educational platform, not a medical device. Discuss with your care team.",
  });
});
