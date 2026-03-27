/**
 * GluMira™ — Sleep Quality API Route
 *
 * POST /api/analytics/sleep-quality
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateSleepQualityReport } from "../../../../../server/analytics/sleep-quality";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { readings, window } = body;

    if (!window || !window.bedtime || !window.wakeTime) {
      return NextResponse.json(
        { error: "window with bedtime and wakeTime is required" },
        { status: 400 }
      );
    }

    const result = generateSleepQualityReport(readings ?? [], window);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
