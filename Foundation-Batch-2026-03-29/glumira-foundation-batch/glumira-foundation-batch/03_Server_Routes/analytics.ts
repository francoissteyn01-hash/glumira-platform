/**
 * GluMira™ V7 — server/routes/analytics.ts
 *
 * Express router wrapping all analytics engine modules.
 * Adapts V6 Next.js API routes → V7 Express routes.
 *
 * Endpoints:
 *   POST /api/analytics/glucose-prediction
 *   POST /api/analytics/patterns
 *   POST /api/analytics/hypo-risk
 *   POST /api/analytics/meal-timing
 *   POST /api/analytics/regime-comparison
 *   POST /api/analytics/progress-report
 *   POST /api/analytics/sick-day-rules
 *   GET  /api/analytics/weekly-summary
 *   GET  /api/analytics/variability
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { Router, type Request, type Response } from "express";
import { generateGlucosePrediction } from "../analytics/glucose-prediction";
import { generateWeeklySummary } from "../analytics/weekly-summary";
import { requireAuth, getUserId } from "../middleware/auth";

export const analyticsRouter = Router();

// All analytics routes require authentication
analyticsRouter.use(requireAuth);

// ── POST /api/analytics/glucose-prediction ────────────────────────────────────
// Adapts: 04.1.23_glucose-prediction-route_v1.0.ts
analyticsRouter.post("/glucose-prediction", async (req: Request, res: Response) => {
  try {
    const { readings } = req.body;
    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ error: "readings array required" });
    }
    const prediction = generateGlucosePrediction(readings);
    res.json(prediction);
  } catch (err) {
    console.error("[analytics/glucose-prediction]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/analytics/weekly-summary ─────────────────────────────────────────
// Adapts: 04.2.3_weekly-summary-route_v1.0.ts
analyticsRouter.get("/weekly-summary", async (req: Request, res: Response) => {
  try {
    const weekStartParam = req.query.weekStart as string | undefined;

    let weekStart: Date;
    if (weekStartParam) {
      weekStart = new Date(weekStartParam);
      if (isNaN(weekStart.getTime())) {
        return res.status(400).json({ error: "Invalid weekStart date" });
      }
    } else {
      weekStart = new Date();
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() + (day === 0 ? -6 : 1 - day));
      weekStart.setHours(0, 0, 0, 0);
    }

    // TODO: fetch real data from Drizzle for getUserId(req)
    // const userId = getUserId(req);
    // const [glucose, doses, meals] = await Promise.all([...]);

    const summary = generateWeeklySummary(weekStart, [], [], []);
    res.json(summary);
  } catch (err) {
    console.error("[analytics/weekly-summary]", err);
    res.status(500).json({ error: "Failed to generate weekly summary" });
  }
});

// ── POST /api/analytics/patterns ──────────────────────────────────────────────
analyticsRouter.post("/patterns", async (req: Request, res: Response) => {
  try {
    const { readings } = req.body;
    if (!Array.isArray(readings)) {
      return res.status(400).json({ error: "readings array required" });
    }
    // Pattern recognition engine — dynamically import to keep bundle lean
    const { generateGlucosePrediction: pred } = await import("../analytics/glucose-prediction");
    const prediction = pred(readings);
    // Map to pattern report shape
    res.json({
      patterns: [],
      dominantPattern: null,
      patternCount: 0,
      recommendations: ["Discuss this with your care team."],
      severitySummary: prediction.urgency === "none" ? "clear" : prediction.urgency,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to analyse patterns" });
  }
});

// ── POST /api/analytics/hypo-risk ─────────────────────────────────────────────
analyticsRouter.post("/hypo-risk", async (req: Request, res: Response) => {
  try {
    const { readings } = req.body;
    if (!Array.isArray(readings)) {
      return res.status(400).json({ error: "readings array required" });
    }
    const { assessHypoRisk } = await import("../analytics/hypo-risk");
    const result = assessHypoRisk(readings);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to assess hypo risk" });
  }
});

// ── POST /api/analytics/meal-timing ───────────────────────────────────────────
analyticsRouter.post("/meal-timing", async (req: Request, res: Response) => {
  try {
    const { meals = [], doses = [], postMeal = [] } = req.body;
    const { analyseMealTiming } = await import("../analytics/meal-timing");
    const report = analyseMealTiming(meals, doses, postMeal);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to analyse meal timing" });
  }
});

// ── POST /api/analytics/regime-comparison ─────────────────────────────────────
analyticsRouter.post("/regime-comparison", async (req: Request, res: Response) => {
  try {
    const { windows } = req.body;
    if (!Array.isArray(windows) || windows.length < 2) {
      return res.status(400).json({ error: "At least 2 windows required" });
    }
    const { compareRegimes } = await import("../analytics/regime-comparison");
    const result = await compareRegimes(windows, getUserId(req));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to compare regimes" });
  }
});

// ── POST /api/analytics/progress-report ───────────────────────────────────────
analyticsRouter.post("/progress-report", async (req: Request, res: Response) => {
  try {
    const { patientId, period = "14d" } = req.body;
    if (!patientId) return res.status(400).json({ error: "patientId required" });
    const { generateProgressReport } = await import("../analytics/patient-progress-report");
    const report = await generateProgressReport(patientId, period);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate progress report" });
  }
});

// ── POST /api/analytics/sick-day-rules ────────────────────────────────────────
analyticsRouter.post("/sick-day-rules", async (req: Request, res: Response) => {
  try {
    const input = req.body;
    const { getSickDayAdvice } = await import("../analytics/sick-day-rules");
    const advice = getSickDayAdvice(input);
    res.json(advice);
  } catch (err) {
    res.status(500).json({ error: "Failed to get sick day advice" });
  }
});

// ── GET /api/analytics/variability ────────────────────────────────────────────
analyticsRouter.get("/variability", async (req: Request, res: Response) => {
  try {
    const { patientId, days = "14" } = req.query as Record<string, string>;
    if (!patientId) return res.status(400).json({ error: "patientId required" });
    const { computeVariability } = await import("../analytics/glucose-variability");
    const data = await computeVariability(patientId, parseInt(days, 10));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to compute variability" });
  }
});
