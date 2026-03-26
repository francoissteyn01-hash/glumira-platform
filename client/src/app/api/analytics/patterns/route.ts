/**
 * GluMira™ — POST /api/analytics/patterns
 *
 * Runs the full pattern recognition suite against a set of glucose readings.
 * Returns detected patterns, dominant pattern, and recommendations.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  recognisePatterns,
  patternSeveritySummary,
} from "@/../../server/analytics/pattern-recognition";
import type { GlucosePoint } from "@/../../server/analytics/glucose-trend";

interface PatternRequest {
  readings: GlucosePoint[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as PatternRequest;

    if (!Array.isArray(body.readings) || body.readings.length === 0) {
      return NextResponse.json({ error: "readings array is required" }, { status: 400 });
    }

    const report = recognisePatterns(body.readings);
    const severitySummary = patternSeveritySummary(report);

    return NextResponse.json({ ...report, severitySummary });
  } catch (err) {
    console.error("[patterns] error:", err);
    return NextResponse.json({ error: "Failed to recognise patterns" }, { status: 500 });
  }
}
