/**
 * GluMira™ — Medication Interaction API Route
 * POST /api/analytics/medication-interaction
 * Body: { medications: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { generateInteractionReport } from "../../../../../server/analytics/medication-interaction";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const medications: string[] = body.medications ?? [];

    if (!Array.isArray(medications)) {
      return NextResponse.json({ error: "medications must be an array" }, { status: 400 });
    }

    if (medications.length > 50) {
      return NextResponse.json({ error: "Maximum 50 medications per request" }, { status: 400 });
    }

    const report = generateInteractionReport(medications);
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
