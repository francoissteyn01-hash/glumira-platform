import { Router, Request, Response } from "express";

const router = Router();

// ADHD-T1D impact assessment
router.post("/api/modules/adhd/assessment", async (req: Request, res: Response) => {
  try {
    const { userId, adhdMedication, stimulantType, doseTime, insulinRegimen } = req.body;

    // Stimulant peak windows (hours after dose)
    const stimulantPeaks: Record<string, { onset: number; peak: number; duration: number }> = {
      methylphenidate: { onset: 0.5, peak: 2, duration: 4 },
      "methylphenidate-er": { onset: 1, peak: 4, duration: 8 },
      amphetamine: { onset: 0.5, peak: 2.5, duration: 5 },
      "amphetamine-er": { onset: 1.5, peak: 5, duration: 10 },
      lisdexamfetamine: { onset: 1.5, peak: 4, duration: 12 },
      atomoxetine: { onset: 1, peak: 3, duration: 24 },
    };

    const stimulant = stimulantPeaks[stimulantType] || stimulantPeaks.methylphenidate;
    const doseHour = new Date(doseTime).getHours();

    // Calculate risk windows where stimulant suppresses appetite during insulin activity
    const riskWindows = [];
    const appetiteSuppStart = doseHour + stimulant.onset;
    const appetiteSuppEnd = doseHour + stimulant.duration;

    // If rapid insulin is active during appetite suppression → hypo risk
    if (insulinRegimen?.bolusTime) {
      const bolusHour = new Date(insulinRegimen.bolusTime).getHours();
      const bolusEnd = bolusHour + 4; // Rapid insulin duration ~4h
      if (appetiteSuppStart < bolusEnd && appetiteSuppEnd > bolusHour) {
        riskWindows.push({
          start: Math.max(appetiteSuppStart, bolusHour),
          end: Math.min(appetiteSuppEnd, bolusEnd),
          risk: "high",
          reason: "Stimulant appetite suppression overlaps with active rapid insulin",
        });
      }
    }

    // Generate meal reminders during stimulant activity
    const mealReminders = [];
    for (let h = Math.ceil(appetiteSuppStart); h < appetiteSuppEnd; h += 2) {
      mealReminders.push({
        time: `${h % 24}:00`,
        type: "small-snack",
        message: "Small snack reminder — appetite may be suppressed by medication",
        suggestedCarbs: 15,
      });
    }

    const insulinTimingAdjustments = [];
    if (stimulant.duration >= 8) {
      insulinTimingAdjustments.push({
        type: "bolus-delay",
        message: "Consider delaying lunch bolus until food is eaten — stimulant may delay meal",
      });
    }

    res.json({ riskWindows, mealReminders, insulinTimingAdjustments });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ADHD-adapted meal schedule
router.get("/api/modules/adhd/meal-schedule/:userId", async (req: Request, res: Response) => {
  try {
    const schedule = {
      blocks: [
        { time: "07:00", type: "breakfast", label: "Before medication", carbs: 30, note: "Eat BEFORE taking stimulant for best absorption" },
        { time: "10:00", type: "snack", label: "Mid-morning", carbs: 15, note: "Small snack — appetite may be low" },
        { time: "12:30", type: "lunch", label: "Lunch window", carbs: 25, note: "Eat even if not hungry — set a timer" },
        { time: "15:00", type: "snack", label: "Afternoon", carbs: 15, note: "Medication wearing off — appetite returning" },
        { time: "18:00", type: "dinner", label: "Evening meal", carbs: 45, note: "Largest meal — appetite usually best" },
        { time: "21:00", type: "snack", label: "Supper", carbs: 15, note: "Prevent overnight hypo" },
      ],
    };
    res.json(schedule);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Simplified logging for executive function support
router.post("/api/modules/adhd/executive-function", async (req: Request, res: Response) => {
  try {
    const { userId, action } = req.body; // action: "ate" | "dosed" | "checked"
    const timestamp = new Date().toISOString();
    // In production, this would write to the database
    res.json({
      logged: true,
      action,
      timestamp,
      message: action === "ate" ? "Meal logged ✓" : action === "dosed" ? "Insulin logged ✓" : "BG check logged ✓",
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
