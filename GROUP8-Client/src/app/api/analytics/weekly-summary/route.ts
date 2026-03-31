/**
 * GluMira™ — GET /api/analytics/weekly-summary
 *
 * Returns a weekly summary comparing this week vs last week
 * across glucose, doses, and meal metrics.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateWeeklySummary } from "@/../../server/analytics/weekly-summary";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekStartParam = searchParams.get("weekStart");

    // Determine week start (default: most recent Monday)
    let weekStart: Date;
    if (weekStartParam) {
      weekStart = new Date(weekStartParam);
      if (isNaN(weekStart.getTime())) {
        return NextResponse.json({ error: "Invalid weekStart date" }, { status: 400 });
      }
    } else {
      weekStart = new Date();
      const day = weekStart.getDay(); // 0=Sun, 1=Mon...
      const diff = (day === 0 ? -6 : 1 - day);
      weekStart.setDate(weekStart.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);
    }

    // In production these would be fetched from the database.
    // Here we return a structured empty summary as a scaffold.
    const summary = generateWeeklySummary(
      weekStart,
      [], // currentGlucose — populated from DB in production
      [], // currentDoses
      [], // currentMeals
    );

    return NextResponse.json(summary);
  } catch (err) {
    console.error("[weekly-summary] error:", err);
    return NextResponse.json(
      { error: "Failed to generate weekly summary" },
      { status: 500 }
    );
  }
}
