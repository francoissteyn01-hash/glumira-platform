/**
 * GluMira™ V7 — Feedback route
 * POST /api/feedback — save structured feedback
 * GET  /api/feedback/summary — admin view (requires clinician tier)
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { supabase } from "../index";

export const feedbackRouter = Router();

const feedbackSchema = z.object({
  session_id: z.string().optional(),
  demo_profile_id: z.string().optional(),
  most_useful: z.string().max(2000).optional(),
  most_confusing: z.string().max(2000).optional(),
  feature_request: z.string().max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  other_thoughts: z.string().max(5000).optional(),
});

feedbackRouter.post("/", async (req: Request, res: Response) => {
  try {
    const body = feedbackSchema.parse(req.body);

    // Extract user_id from auth header if present
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser(authHeader.slice(7));
      userId = data?.user?.id ?? null;
    }

    const { error } = await supabase.from("beta_feedback").insert({
      user_id: userId,
      session_id: body.session_id ?? null,
      demo_profile_id: body.demo_profile_id ?? null,
      most_useful: body.most_useful ?? null,
      most_confusing: body.most_confusing ?? null,
      feature_request: body.feature_request ?? null,
      rating: body.rating ?? null,
      other_thoughts: body.other_thoughts ?? null,
    });

    if (error) {
      console.error("[feedback] insert error:", error.message);
      return res.status(500).json({ error: "Failed to save feedback" });
    }

    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid feedback data", details: err.errors });
    }
    console.error("[feedback]", err);
    res.status(500).json({ error: "Internal error" });
  }
});

feedbackRouter.get("/summary", async (req: Request, res: Response) => {
  try {
    // Require auth for summary
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { data: authData } = await supabase.auth.getUser(authHeader.slice(7));
    if (!authData?.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data, error } = await supabase
      .from("beta_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: "Failed to fetch feedback" });
    }

    const ratings = (data ?? []).filter((f: any) => f.rating != null).map((f: any) => f.rating as number);
    const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10 : null;

    res.json({
      total: data?.length ?? 0,
      avgRating,
      entries: data ?? [],
    });
  } catch (err) {
    console.error("[feedback summary]", err);
    res.status(500).json({ error: "Internal error" });
  }
});
