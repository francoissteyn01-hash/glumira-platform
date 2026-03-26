/**
 * GluMira — Insulin Stacking API Route
 *
 * POST /api/analytics/insulin-stacking
 * Body: { doses: DoseEntry[] }
 * Returns: StackingAnalysis
 *
 * GluMira is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import { analyseInsulinStacking } from "../../../../../server/analytics/insulin-stacking";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { doses } = body;

    if (!Array.isArray(doses) || doses.length === 0) {
      return NextResponse.json({ error: "doses array required" }, { status: 400 });
    }

    const analysis = analyseInsulinStacking(doses);
    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
