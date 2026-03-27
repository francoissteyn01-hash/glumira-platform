/**
 * GluMira™ — GET /api/analytics/variability
 *
 * Returns glucose variability metrics for a patient over a given period.
 * Uses the glucose-variability server module.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  computeVariabilityMetrics,
  computeTirBreakdown,
  cvStatusLabel,
  griZone,
} from "@/../../server/analytics/glucose-variability";

// Minimal GlucoseReading shape for this route
interface GlucoseReading {
  recordedAt: string;
  glucoseMmol: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const days = Math.min(90, Math.max(1, Number(searchParams.get("days") ?? "14")));

    if (!patientId) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 });
    }

    // In production this would query the database. For now return mock data
    // that exercises the variability module.
    const mockReadings: GlucoseReading[] = Array.from({ length: days * 12 }, (_, i) => ({
      recordedAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
      glucoseMmol: 5.5 + Math.sin(i / 4) * 2.5 + (Math.random() - 0.5) * 1.5,
    }));

    const values = mockReadings.map((r) => r.glucoseMmol);

    const metrics = computeVariabilityMetrics(values);
    const tir = computeTirBreakdown(values);

    return NextResponse.json({
      ...metrics,
      tirBreakdown: tir,
      cvStatus: cvStatusLabel(metrics.cv),
      griZone: griZone(metrics.gri),
      readingCount: values.length,
      periodDays: days,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to compute variability";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
