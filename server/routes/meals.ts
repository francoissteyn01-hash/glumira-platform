/**
 * GluMira™ V7 — server/routes/meals.ts
 * Adapts: 04.1.36_carb-lookup-route, 04.2.17_useMealTiming
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth";
import {
  lookupFood,
  estimateCarbs,
  classifyGlycaemicLoad,
  recommendIcrDose,
} from "../meals/carb-counter";

export const mealsRouter = Router();
mealsRouter.use(requireAuth);

// GET /api/meals/carb-lookup?q=&grams=&icr=
// Adapts 04.1.36_carb-lookup-route_v1.0.ts
mealsRouter.get("/carb-lookup", (req: Request, res: Response) => {
  try {
    const { q, grams, icr } = req.query as Record<string, string>;
    if (!q) return res.status(400).json({ error: "Query parameter 'q' is required" });

    const food = lookupFood(q.trim());
    if (!food) return res.status(404).json({ error: `Food not found: ${q}` });

    const servingGrams = grams ? parseFloat(grams) : food.servingGrams;
    const icrNum = icr ? parseFloat(icr) : null;
    const carbEstimate = estimateCarbs(food, servingGrams);
    const glLoad = classifyGlycaemicLoad(carbEstimate.glycaemicLoad);
    const dose = icrNum ? recommendIcrDose(carbEstimate.totalCarbs, icrNum) : null;

    res.json({
      food: food.name,
      grams: servingGrams,
      carbsGrams: carbEstimate.totalCarbs,
      netCarbs: carbEstimate.netCarbs,
      glycaemicLoad: glLoad,
      suggestedDoseUnits: dose?.suggestedDose ?? null,
      disclaimer: "GluMira™ is an educational platform, not a medical device.",
    });
  } catch (err) {
    console.error("[meals/carb-lookup]", err);
    res.status(500).json({ error: "Failed to look up food" });
  }
});

// POST /api/meals/bolus (bolus calculator)
mealsRouter.post("/bolus", async (req: Request, res: Response) => {
  try {
    const { computeBolus } = await import("../analytics/bolus-calculator");
    const result = computeBolus(req.body);
    res.json({
      ...result,
      disclaimer: "GluMira™ never recommends dosing. Discuss with your care team.",
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? "Calculation failed" });
  }
});

// POST /api/analytics/meal-timing (mounted via analyticsRouter but also exported here)
mealsRouter.post("/timing", async (req: Request, res: Response) => {
  try {
    const { meals = [], doses = [], postMeal = [] } = req.body;
    const { analyseMealTiming } = await import("../analytics/meal-timing");
    res.json(analyseMealTiming(meals, doses, postMeal));
  } catch (err) {
    res.status(500).json({ error: "Failed to analyse meal timing" });
  }
});
