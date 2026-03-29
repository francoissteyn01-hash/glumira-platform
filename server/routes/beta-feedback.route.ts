/**
 * GluMira™ V7 — server/routes/beta-feedback.route.ts
 *
 * REPLACES: 04.2.64_api-beta-feedback_v1.0.txt (Next.js)
 * REASON:   Stack is Vite + Express, not Next.js (Drive Auditor v2.0, 2026-03-28)
 *
 * POST /api/beta/feedback
 * Body: { participantId, category, rating, comment }
 * Rate limited: 5 submissions per participant per day.
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-03-29
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { supabase } from "../index";

export const betaFeedbackRouter = Router();

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  "iob_chart",
  "glucose_timeline",
  "school_care_plan",
  "general",
  "bug",
] as const;

const FeedbackSchema = z.object({
  participantId: z.string().min(2).max(255),
  category:      z.enum(VALID_CATEGORIES),
  rating:        z.number().int().min(1).max(5),
  comment:       z.string().min(5).max(2000).trim(),
});

// ── POST /api/beta/feedback ───────────────────────────────────────────────────

betaFeedbackRouter.post(
  "/feedback",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    // Validate body
    const parsed = FeedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { participantId, category, rating, comment } = parsed.data;

    // Rate limit: max 5 submissions per participant per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from("beta_feedback")
      .select("id", { count: "exact", head: true })
      .eq("participant_id", participantId)
      .gte("created_at", todayStart.toISOString());

    if (countError) {
      console.error("[beta-feedback] Rate limit check failed:", countError.message);
      return res.status(500).json({ error: "Service error" });
    }

    if ((count ?? 0) >= 5) {
      return res.status(429).json({
        error: "Rate limit — maximum 5 feedback submissions per day",
      });
    }

    // Insert feedback
    const { data: inserted, error: insertError } = await supabase
      .from("beta_feedback")
      .insert({
        participant_id: participantId,
        category,
        rating,
        comment,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[beta-feedback] Insert failed:", insertError.message);
      return res.status(500).json({ error: "Failed to save feedback" });
    }

    // Audit log
    await supabase.from("audit_log").insert({
      user_id:       req.user?.id,
      action:        "beta_feedback_submitted",
      resource_type: "beta_feedback",
      resource_id:   inserted.id,
      metadata:      { category, rating },
    });

    return res.status(201).json({
      success: true,
      feedbackId: inserted.id,
    });
  }
);

// ── GET /api/beta/feedback — admin summary ────────────────────────────────────
// (Admin only — attach requireClinician middleware in production)

betaFeedbackRouter.get(
  "/feedback",
  requireAuth,
  async (_req: AuthRequest, res: Response) => {
    const { data, error } = await supabase
      .from("beta_feedback")
      .select("category, rating, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return res.status(500).json({ error: "Failed to fetch feedback" });
    }

    // Compute summary stats
    const total = data?.length ?? 0;
    const avgRating = total > 0
      ? (data!.reduce((s, r) => s + r.rating, 0) / total).toFixed(2)
      : 0;

    const byCategory = (data ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + 1;
      return acc;
    }, {});

    return res.json({ total, avgRating: Number(avgRating), byCategory });
  }
);
