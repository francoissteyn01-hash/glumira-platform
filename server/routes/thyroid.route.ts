import { Router, Request, Response } from "express";

const router = Router();

router.post("/api/modules/thyroid/assessment", async (req: Request, res: Response) => {
  try {
    const { userId, thyroidCondition, tshLevel, t4Level, thyroidMedication, insulinRegimen } = req.body;

    // TSH reference: 0.4-4.0 mIU/L
    const isHypo = tshLevel > 4.0;
    const isHyper = tshLevel < 0.4;
    const isNormal = !isHypo && !isHyper;

    // Hypothyroid → insulin resistance increases (need ~10-20% more insulin)
    // Hyperthyroid → metabolism speeds up (need ~10-20% less insulin, more hypos)
    let insulinSensitivityAdjustment = 0;
    if (isHypo) {
      insulinSensitivityAdjustment = -(Math.min((tshLevel - 4.0) / 4.0, 1) * 20);
    } else if (isHyper) {
      insulinSensitivityAdjustment = Math.min((0.4 - tshLevel) / 0.4, 1) * 20;
    }

    // Hypo risk scoring
    let hypoRiskScore = 0;
    if (isHyper) hypoRiskScore += 3;
    if (thyroidMedication === "levothyroxine" && isHypo) hypoRiskScore += 1;
    if (t4Level && t4Level > 12) hypoRiskScore += 1;

    // Hashimoto's overlap
    const hashimotoOverlapWarning = thyroidCondition === "hashimotos"
      ? "Hashimoto's thyroiditis and Type 1 diabetes are both autoimmune conditions. When one flares, the other may be affected. Monitor both closely during thyroid level changes."
      : null;

    res.json({
      tshStatus: isHypo ? "hypothyroid" : isHyper ? "hyperthyroid" : "euthyroid",
      insulinSensitivityAdjustment: Math.round(insulinSensitivityAdjustment),
      hypoRiskScore,
      hashimotoOverlapWarning,
      recommendations: [
        isHypo && "Your insulin needs may be higher than usual. Monitor for persistent highs.",
        isHyper && "Your insulin may work faster than expected. Watch for lows.",
        thyroidCondition === "hashimotos" && "Both conditions share autoimmune origins. Regular antibody monitoring recommended.",
        "Recheck TSH every 6-8 weeks when adjusting thyroid medication.",
        "Review insulin doses 2-4 weeks after any thyroid medication change.",
      ].filter(Boolean),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/api/modules/thyroid/monitoring/:userId", async (req: Request, res: Response) => {
  try {
    const checklist = {
      regular: [
        { test: "TSH level", frequency: "Every 6-8 weeks during dose changes, then every 3-6 months", priority: "high" },
        { test: "Free T4", frequency: "With each TSH check", priority: "high" },
        { test: "Thyroid antibodies (TPO, TG)", frequency: "Annually if Hashimoto's", priority: "medium" },
        { test: "HbA1c", frequency: "Every 3 months", priority: "high" },
        { test: "Weight check", frequency: "Monthly — weight changes affect insulin needs", priority: "medium" },
      ],
      triggers: [
        "New thyroid medication or dose change → review insulin in 2-4 weeks",
        "Unexplained BG pattern change → check thyroid levels",
        "Significant weight change → assess both thyroid and insulin",
        "Pregnancy → thyroid needs increase 30-50%, check every 4 weeks",
        "Seasonal change → thyroid function can shift slightly",
      ],
    };
    res.json(checklist);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
