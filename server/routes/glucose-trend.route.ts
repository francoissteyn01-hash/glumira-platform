/**
 * GluMira™ V7 — server/routes/glucose-trend.route.ts
 *
 * REPLACES: 04.1.43_api-glucose-trend-route_v1.0.ts (Next.js App Router)
 * REASON:   Stack is Vite + Express (Drive Auditor v2.0, 2026-03-28)
 * Archive:  04.1.43 → 99_ARCHIVE/Superseded/ per GLUMIRA-V7-GLOBAL
 *
 * GET /api/glucose/trend?days=14
 * Returns 14-day (or custom) glucose trend report.
 * Auth: Bearer JWT (Supabase)
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-03-29
 */

import { Router }               from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { rateLimitMiddleware }   from "../lib/utils";
import { auditLog }              from "../lib/utils";
import { computeTrendReport }    from "../analytics/glucose-trend";
import type { GlucosePoint }     from "../analytics/glucose-trend";
import { supabase }              from "../index";

export const glucoseTrendRouter = Router();

// Rate limit: 60 requests per minute per user
const rl = rateLimitMiddleware({ limit: 60, windowMs: 60_000 });

glucoseTrendRouter.get(
  "/trend",
  requireAuth,
  rl as any,
  async (req: AuthRequest, res) => {
    const daysParam = req.query.days as string | undefined;
    const days = daysParam
      ? Math.min(Math.max(parseInt(daysParam, 10) || 14, 1), 90)
      : 14;

    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    const { data: rows, error: dbError } = await supabase
      .from("glucose_readings")
      .select("glucose_mmol, recorded_at")
      .eq("user_id", req.user!.id)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true });

    if (dbError) {
      console.error("[glucose-trend] DB error:", dbError);
      return res.status(500).json({ error: "Database error" });
    }

    const readings: GlucosePoint[] = (rows ?? []).map(r => ({
      glucose:   r.glucose_mmol as number,
      timestamp: r.recorded_at  as string,
    }));

    const report = computeTrendReport(readings);

    // Audit log (non-blocking)
    auditLog({
      userId:   req.user!.id,
      action:   "glucose_trend_viewed",
      metadata: { days, count: report.count },
    });

    return res.json({
      ok: true,
      days,
      report,
      disclaimer: "GluMira™ is an educational platform, not a medical device. Discuss all findings with your care team.",
    });
  }
);
