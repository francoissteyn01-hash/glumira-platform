/**
 * GluMira™ — Circadian Sensitivity API Route
 * GET /api/analytics/circadian-sensitivity?days=14
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const days = Number(req.nextUrl.searchParams.get("days") ?? "14");

    // In production this would pull from the glucose readings table
    // and call generateCircadianProfile from the server module.
    return NextResponse.json({
      blocks: [],
      mostSensitiveBlock: "morning",
      leastSensitiveBlock: "evening",
      dawnPhenomenonLikely: false,
      recommendations: ["Insufficient data — log more glucose readings to generate circadian profile."],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
