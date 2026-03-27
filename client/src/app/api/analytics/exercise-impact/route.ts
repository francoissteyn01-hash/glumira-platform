/**
 * GluMira™ — Exercise Impact API Route
 *
 * POST /api/analytics/exercise-impact
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { analyseExerciseImpact } from "../../../../../server/analytics/exercise-impact";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session, readings } = body;

    if (!session || !readings) {
      return NextResponse.json(
        { error: "session and readings are required" },
        { status: 400 }
      );
    }

    const result = analyseExerciseImpact(session, readings);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
