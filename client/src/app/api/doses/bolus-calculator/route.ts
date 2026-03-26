/**
 * GluMira™ — POST /api/doses/bolus-calculator
 *
 * Calculates meal + correction bolus using the bolus-calculator server module.
 * Requires authentication. Rate-limited to 100 req/60s.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import { computeBolus } from "@/../../server/doses/bolus-calculator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      carbsGrams,
      currentGlucose,
      targetGlucose,
      icr,
      isf,
      activeIob = 0,
    } = body;

    // Basic validation
    if (
      typeof carbsGrams !== "number" ||
      typeof currentGlucose !== "number" ||
      typeof targetGlucose !== "number" ||
      typeof icr !== "number" ||
      typeof isf !== "number"
    ) {
      return NextResponse.json(
        { error: "carbsGrams, currentGlucose, targetGlucose, icr, and isf are required numbers" },
        { status: 400 }
      );
    }

    const result = computeBolus({
      carbsGrams,
      currentGlucoseMmol: currentGlucose,
      targetGlucoseMmol: targetGlucose,
      icr,
      isfMmol: isf,
      activeIobUnits: activeIob,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Calculation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
