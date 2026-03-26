/**
 * GluMira — ICR Optimizer API Route
 *
 * POST /api/analytics/icr-optimizer
 * Analyses meal events and returns ICR adjustment suggestions.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import { analyseIcr, computeMealTimeIcr, type MealEvent } from "../../../../server/doses/carb-ratio-optimizer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { meals, currentIcr, postMealTarget } = body as {
      meals: MealEvent[];
      currentIcr: number;
      postMealTarget?: number;
    };

    if (!Array.isArray(meals) || typeof currentIcr !== "number") {
      return NextResponse.json({ error: "meals (array) and currentIcr (number) required" }, { status: 400 });
    }

    const overall = analyseIcr(meals, currentIcr, postMealTarget);
    const byMealTime = computeMealTimeIcr(meals, currentIcr, postMealTarget);

    return NextResponse.json({ overall, byMealTime });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
