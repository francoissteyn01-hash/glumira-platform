/**
 * GluMira™ — Stress Response API Route
 *
 * POST /api/analytics/stress-response
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateStressReport } from "../../../../../server/analytics/stress-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { period, readings } = body;

    if (!period || !period.startTime || !period.endTime) {
      return NextResponse.json(
        { error: "period with startTime and endTime is required" },
        { status: 400 }
      );
    }

    const result = generateStressReport(readings ?? [], period);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
