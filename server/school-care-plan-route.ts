/**
 * GluMira™ School Care Plan — Express API Route
 * Version: 7.0.0
 * Module: MOD-SCHOOL
 *
 * POST /api/school-care-plan/generate
 *
 * Accepts a SchoolCarePlanInput payload and returns:
 *   { html, patientName, generatedAt, regimeName, hypoThresholdMgdl }
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { Router, type Request, type Response } from "express";
import {
  generateSchoolCarePlan,
  validateSchoolCarePlanInput,
  type SchoolCarePlanInput,
} from "./school-care-plan";

export const schoolCarePlanRouter = Router();

/**
 * POST /api/school-care-plan/generate
 *
 * Body: SchoolCarePlanInput (JSON)
 * Returns: { html, patientName, generatedAt, regimeName, hypoThresholdMgdl }
 */
schoolCarePlanRouter.post("/generate", (req: Request, res: Response) => {
  try {
    const input = req.body as Partial<SchoolCarePlanInput>;

    // Validate input
    const errors = validateSchoolCarePlanInput(input);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    // Generate care plan
    const result = generateSchoolCarePlan(input as SchoolCarePlanInput);

    return res.status(200).json(result);
  } catch (err: any) {
    if (err.message?.startsWith("INVALID_INPUT")) {
      return res.status(400).json({ error: err.message });
    }
    console.error("[school-care-plan] Generation error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
