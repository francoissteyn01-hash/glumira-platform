/**
 * GluMira — Glucose Prediction API Route
 *
 * POST /api/glucose/prediction
 * Body: { readings: { mmol, timestamp }[] }
 * Returns: GlucosePrediction
 *
 * GluMira is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateGlucosePrediction } from "../../../../../server/analytics/glucose-prediction";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { readings } = body;

    if (!Array.isArray(readings) || readings.length === 0) {
      return NextResponse.json({ error: "readings array required" }, { status: 400 });
    }

    const prediction = generateGlucosePrediction(readings);
    return NextResponse.json(prediction);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
