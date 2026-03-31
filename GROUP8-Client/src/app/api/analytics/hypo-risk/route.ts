/**
 * GluMira™ — POST /api/analytics/hypo-risk
 *
 * Computes a composite hypoglycaemia risk score from glucose readings.
 * Returns LBGI, hypo frequency, nocturnal hypo rate, and risk tier.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { assessHypoRisk, type HypoRiskInput } from "@/../../server/analytics/hypo-risk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as HypoRiskInput;

    if (!Array.isArray(body.readings) || body.readings.length === 0) {
      return NextResponse.json({ error: "readings array is required" }, { status: 400 });
    }

    if (!Array.isArray(body.nocturnalReadings)) {
      return NextResponse.json({ error: "nocturnalReadings array is required" }, { status: 400 });
    }

    const result = assessHypoRisk(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[hypo-risk] error:", err);
    return NextResponse.json({ error: "Failed to assess hypo risk" }, { status: 500 });
  }
}
