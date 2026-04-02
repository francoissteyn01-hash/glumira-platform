/**
 * GluMira™ V7 — server/routes/report.route.ts
 * REST endpoint for PDF report download.
 *
 * GET /api/report?date=2026-04-02
 * Returns: application/pdf
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import { supabase } from "../db";
import { generateReport, type ReportInput } from "../src/reports/generate-report";
import type { InsulinEvent } from "../src/engine/iob-hunter";

export const reportRouter = Router();

reportRouter.use(requireAuth);

reportRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;

    // Fetch all data in parallel
    const [insulinRes, mealRes, profileRes] = await Promise.all([
      supabase
        .from("insulin_events")
        .select("id, event_time, insulin_type, dose_units")
        .eq("user_id", userId)
        .gte("event_time", dayStart)
        .lte("event_time", dayEnd)
        .order("event_time", { ascending: true }),

      supabase
        .from("meal_log")
        .select("meal_time, event_type, insulin_type, units, glucose_value, food_description, comment")
        .eq("user_id", userId)
        .gte("meal_time", dayStart)
        .lte("meal_time", dayEnd)
        .order("meal_time", { ascending: true }),

      supabase
        .from("patient_self_profiles")
        .select("first_name, last_name, glucose_units")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const insulinEvents: InsulinEvent[] = (insulinRes.data ?? []).map((e) => ({
      id: e.id,
      event_time: e.event_time,
      insulin_type: e.insulin_type,
      dose_units: Number(e.dose_units),
    }));

    const mealLogs = (mealRes.data ?? []).map((m: any) => ({
      meal_time: m.meal_time,
      event_type: m.event_type,
      insulin_type: m.insulin_type,
      units: m.units != null ? Number(m.units) : null,
      glucose_value: m.glucose_value != null ? Number(m.glucose_value) : null,
      food_description: m.food_description,
      comment: m.comment,
    }));

    const glucoseUnits = profileRes.data?.glucose_units === "mg" ? "mg" as const : "mmol" as const;
    const patientName = profileRes.data
      ? `${profileRes.data.first_name ?? ""} ${profileRes.data.last_name ?? ""}`.trim()
      : undefined;

    const input: ReportInput = {
      insulinEvents,
      mealLogs,
      glucoseReadings: mealLogs
        .filter((m) => m.glucose_value != null)
        .map((m) => ({ time: m.meal_time, value: m.glucose_value! })),
      glucoseUnits,
      reportDate: date,
      patientName,
    };

    const pdfBuffer = await generateReport(input);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="GluMira-Report-${date}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (e: any) {
    console.error("[report]", e.message);
    res.status(500).json({ error: e.message });
  }
});
