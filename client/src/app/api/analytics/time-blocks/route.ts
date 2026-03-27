/**
 * GluMira — Time-Block Analysis API Route
 *
 * GET /api/analytics/time-blocks?days=14
 * Returns glucose statistics segmented by time of day.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateTimeBlockReport, type GlucoseReading } from "../../../../server/analytics/time-block-analysis";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") ?? "14", 10);

    // In production, readings would be fetched from the database
    // Placeholder: return empty report structure
    const readings: GlucoseReading[] = [];
    const report = generateTimeBlockReport(readings);

    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
