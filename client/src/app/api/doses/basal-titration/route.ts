/**
 * GluMira™ — POST /api/doses/basal-titration
 *
 * Computes basal titration recommendation from fasting glucose readings.
 * Uses the 3-0-3 and 2-0-2 rules with dawn phenomenon detection.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  apply303Rule,
  classifyFastingGlucose,
  scoreBasalAdequacy,
  type FastingGlucoseEntry,
} from "@/../../server/doses/basal-titration";

interface TitrationRequest {
  fastingGlucoseReadings: number[];
  currentBasalDose?: number;
  targetFastingMmol?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as TitrationRequest;

    if (!Array.isArray(body.fastingGlucoseReadings) || body.fastingGlucoseReadings.length < 3) {
      return NextResponse.json(
        { error: "At least 3 fasting glucose readings are required" },
        { status: 400 }
      );
    }

    const targetFasting = body.targetFastingMmol ?? 5.5;

    // Build FastingGlucoseEntry array (use synthetic timestamps)
    const now = Date.now();
    const entries: FastingGlucoseEntry[] = body.fastingGlucoseReadings.map((mmol, i) => ({
      mmol,
      recordedAt: new Date(now - (body.fastingGlucoseReadings.length - i) * 86_400_000).toISOString(),
    }));

    // Apply 3-0-3 rule for titration
    const titration303 = apply303Rule(entries, body.currentBasalDose ?? null, targetFasting);

    // Classify fasting glucose pattern
    const classification = classifyFastingGlucose(entries);

    // Score basal adequacy
    const adequacy = scoreBasalAdequacy(entries, targetFasting);

    const result = {
      averageFastingMmol: adequacy.averageFastingMmol,
      pattern: classification.pattern,
      suggestedAdjustmentUnits: titration303.adjustmentUnits,
      newBasalDose: titration303.newDose,
      riskTier: adequacy.riskTier,
      riskLabel: adequacy.riskLabel,
      confidence: titration303.confidence,
      recommendations: [
        ...titration303.recommendations,
        ...classification.recommendations,
      ].filter((v, i, arr) => arr.indexOf(v) === i), // deduplicate
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[basal-titration] error:", err);
    return NextResponse.json({ error: "Failed to compute titration" }, { status: 500 });
  }
}
