/**
 * GluMira™ — POST /api/analytics/isf-analysis
 *
 * Computes insulin sensitivity factor (ISF) analysis from correction events.
 * Returns ISF estimate, sensitivity classification, and adjustment suggestion.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  computeIsfFromReadings,
  classifyIsfSensitivity,
  isfAdjustmentSuggestion,
  isfConfidence,
  type IsfReadingPair,
} from "@/../../server/analytics/isf-analysis";

interface IsfRequest {
  correctionEvents: IsfReadingPair[];
  currentIsfMmol?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as IsfRequest;

    if (!Array.isArray(body.correctionEvents) || body.correctionEvents.length < 2) {
      return NextResponse.json(
        { error: "At least 2 correction events are required" },
        { status: 400 }
      );
    }

    const isfMmol = computeIsfFromReadings(body.correctionEvents);
    const sensitivity = classifyIsfSensitivity(isfMmol);
    const suggestion = isfAdjustmentSuggestion(isfMmol, body.currentIsfMmol ?? null);
    const confidence = isfConfidence(body.correctionEvents.length);

    return NextResponse.json({
      isfMmolPerUnit: isfMmol,
      sensitivity,
      suggestion,
      confidence,
      eventCount: body.correctionEvents.length,
    });
  } catch (err) {
    console.error("[isf-analysis] error:", err);
    return NextResponse.json({ error: "Failed to compute ISF analysis" }, { status: 500 });
  }
}
