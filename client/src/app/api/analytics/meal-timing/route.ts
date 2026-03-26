/**
 * GluMira™ — POST /api/analytics/meal-timing
 *
 * Analyses meal timing patterns from a set of meal records.
 * Returns timing score, late-night eating flag, and post-meal glucose rise.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  analyzeMealTiming,
  type MealTimingInput,
} from "@/../../server/meals/meal-timing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as MealTimingInput;

    if (!Array.isArray(body.meals) || body.meals.length === 0) {
      return NextResponse.json({ error: "meals array is required" }, { status: 400 });
    }

    const result = analyzeMealTiming(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[meal-timing] error:", err);
    return NextResponse.json({ error: "Failed to analyse meal timing" }, { status: 500 });
  }
}
