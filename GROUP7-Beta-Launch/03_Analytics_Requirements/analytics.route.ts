/**
 * GluMira™ V7 — server/routes/analytics.route.ts
 *
 * REPLACES:
 *   04.2.67_analytics-summary-route_v1.0.ts       (Next.js + cookies())
 *   04.2.68_analytics-regime-comparison-route_v1.0.ts (Next.js + cookies())
 * REASON:   Stack is Vite + Express, not Next.js (Drive Auditor v2.0, 2026-03-28)
 * ARCHIVE:  Originals → 99_ARCHIVE/Superseded/ per GLUMIRA-V7-GLOBAL
 *
 * Routes:
 *   GET  /api/analytics/summary           — 7d + 14d TIR/GMI/CV summary
 *   POST /api/analytics/regime-comparison — side-by-side regime windows
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-03-29
 */

import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { supabase } from "../index";
import { computeAnalyticsSummary } from "../analytics/analytics-summary";
import type { GlucosePoint } from "../analytics/glucose-trend";

// ── Regime comparison import ─────────────────────────────────────────────────
// NOTE: regime-comparison.ts is a module dependency.
// When 04.2.68 referred to "@/server/analytics/regime-comparison",
// that module must exist at server/analytics/regime-comparison.ts
// The function signature used here matches that file's exports.
type RegimeWindow = {
  regimeId:   string;
  regimeName: string;
  startDate:  string;
  endDate:    string;
};
// Dynamic import — avoids crash if module isn't wired yet
async function getCompareRegimes() {
  try {
    const mod = await import("../analytics/regime-comparison");
    return mod.compareRegimes as (readings: GlucosePoint[], windows: RegimeWindow[]) => unknown;
  } catch {
    return null;
  }
}

export const analyticsRouter = Router();

// ── GET /api/analytics/summary ───────────────────────────────────────────────
//
// Returns 7-day and 14-day glucose analytics summary for the authenticated user.
// Replaces the Next.js route in 04.2.67.

analyticsRouter.get(
  "/summary",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const patientId = req.query.patientId as string | undefined;
    const userId = req.user!.id;

    const fourteenDaysAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Build query — filter by patient if provided, otherwise by user
    let query = supabase
      .from("glucose_readings")
      .select("value_mmol, recorded_at")
      .gte("recorded_at", fourteenDaysAgo)
      .order("recorded_at", { ascending: true });

    if (patientId) {
      // Clinician viewing a patient profile — verify access
      const { data: patient } = await supabase
        .from("patient_profiles")
        .select("id")
        .eq("id", patientId)
        .eq("clinician_id", userId)
        .single();

      if (!patient) {
        return res.status(403).json({ error: "Forbidden — patient not found or access denied" });
      }
      query = query.eq("patient_id", patientId);
    } else {
      // Patient viewing their own readings
      query = query.eq("patient_id", userId);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("[analytics/summary] DB error:", error.message);
      return res.status(500).json({ error: "Database error" });
    }

    const readings: GlucosePoint[] = (rows ?? []).map((r) => ({
      glucose:   r.value_mmol as number,
      timestamp: r.recorded_at as string,
    }));

    const summary = computeAnalyticsSummary(readings);

    return res.json({
      ok: true,
      summary,
      disclaimer: "GluMira™ is an educational platform, not a medical device.",
    });
  }
);

// ── POST /api/analytics/regime-comparison ────────────────────────────────────
//
// Compares glucose outcomes across multiple insulin regime windows.
// Replaces the Next.js route in 04.2.68.

const RegimeWindowSchema = z.object({
  regimeId:   z.string().min(1),
  regimeName: z.string().min(1).max(100),
  startDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"),
  endDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD"),
});

const RegimeComparisonBodySchema = z.object({
  windows:   z.array(RegimeWindowSchema).min(1).max(6),
  patientId: z.string().uuid().optional(),
});

analyticsRouter.post(
  "/regime-comparison",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const parsed = RegimeComparisonBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { windows, patientId } = parsed.data;
    const userId = req.user!.id;

    // Verify patient access if patientId provided
    if (patientId) {
      const { data: patient } = await supabase
        .from("patient_profiles")
        .select("id")
        .eq("id", patientId)
        .eq("clinician_id", userId)
        .single();

      if (!patient) {
        return res.status(403).json({ error: "Forbidden — patient not found or access denied" });
      }
    }

    // Determine the full date range across all windows
    const allDates = windows.flatMap((w) => [w.startDate, w.endDate]);
    const minDate = allDates.reduce((a, b) => (a < b ? a : b));
    const maxDate = allDates.reduce((a, b) => (a > b ? a : b));

    // Fetch glucose readings for the full range
    let query = supabase
      .from("glucose_readings")
      .select("value_mmol, recorded_at")
      .gte("recorded_at", `${minDate}T00:00:00.000Z`)
      .lte("recorded_at", `${maxDate}T23:59:59.999Z`)
      .order("recorded_at", { ascending: true });

    query = patientId
      ? query.eq("patient_id", patientId)
      : query.eq("patient_id", userId);

    const { data: rows, error: dbError } = await query;

    if (dbError) {
      console.error("[analytics/regime-comparison] DB error:", dbError.message);
      return res.status(500).json({ error: "Database error" });
    }

    const readings: GlucosePoint[] = (rows ?? []).map((r) => ({
      glucose:   r.value_mmol as number,
      timestamp: r.recorded_at as string,
    }));

    // Call regime comparison engine
    const compareRegimes = await getCompareRegimes();
    if (!compareRegimes) {
      return res.status(503).json({
        error: "Regime comparison module not yet available",
        hint: "server/analytics/regime-comparison.ts needs to be wired",
      });
    }

    const result = compareRegimes(readings, windows);

    return res.json({
      ok: true,
      ...(result as object),
      disclaimer: "GluMira™ is an educational platform, not a medical device.",
    });
  }
);
