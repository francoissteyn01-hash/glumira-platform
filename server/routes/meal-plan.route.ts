import { Router, Request, Response } from "express";

const router = Router();

const STANDARD_PLAN = {
  label: "Standard T1D",
  meals: [
    { time: "07:00", type: "breakfast", foods: ["Wholegrain toast", "Eggs", "Avocado"], carbs: 30, protein: 20, fat: 15 },
    { time: "10:00", type: "snack", foods: ["Apple", "Peanut butter"], carbs: 20, protein: 5, fat: 8 },
    { time: "12:30", type: "lunch", foods: ["Grilled chicken wrap", "Side salad"], carbs: 40, protein: 30, fat: 12 },
    { time: "15:30", type: "snack", foods: ["Greek yoghurt", "Berries"], carbs: 15, protein: 12, fat: 5 },
    { time: "18:30", type: "dinner", foods: ["Salmon", "Sweet potato", "Broccoli"], carbs: 45, protein: 35, fat: 18 },
    { time: "21:00", type: "supper", foods: ["Cheese", "Crackers"], carbs: 15, protein: 8, fat: 10 },
  ],
  dailyTargets: { carbs: 165, protein: 110, fat: 68, fibre: 30 },
};

router.get("/api/meal-plan/:userId", async (req: Request, res: Response) => {
  try {
    // In production: read user profile for active dietary module
    // For now, return standard plan with module badge
    const activePlan = req.query.module as string || "standard";

    const plans: Record<string, { label: string; badge: string }> = {
      standard: { label: "Standard T1D", badge: "balanced" },
      ramadan: { label: "Ramadan Fasting", badge: "ramadan" },
      kosher: { label: "Kosher", badge: "kosher" },
      halal: { label: "Halal", badge: "halal" },
      bernstein: { label: "Bernstein Protocol", badge: "bernstein" },
    };

    const planInfo = plans[activePlan] || plans.standard;

    res.json({
      ...STANDARD_PLAN,
      label: planInfo.label,
      activeBadge: planInfo.badge,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/meal-plan/:userId/log", async (req: Request, res: Response) => {
  try {
    const { mealType, foods, carbsActual, time } = req.body;
    res.json({
      logged: true,
      mealType,
      carbsActual,
      time: time || new Date().toISOString(),
      message: `${mealType} logged — ${carbsActual}g carbs`,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
