/**
 * GluMira™ — GET /api/alerts
 *
 * Returns active glucose alerts for the current user.
 * Evaluates the most recent glucose readings against thresholds
 * using the glucose-alert-engine.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateReadingStream,
  DEFAULT_THRESHOLDS,
  type AlertThresholds,
} from "@/../../server/alerts/glucose-alert-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 200) : 50;

    // Custom threshold overrides from query params
    const thresholds: AlertThresholds = {
      ...DEFAULT_THRESHOLDS,
      hypoMmol: parseFloat(searchParams.get("hypoMmol") ?? String(DEFAULT_THRESHOLDS.hypoMmol)),
      hyperMmol: parseFloat(searchParams.get("hyperMmol") ?? String(DEFAULT_THRESHOLDS.hyperMmol)),
    };

    // In production, readings would be fetched from the database.
    // This scaffold returns an empty alert list.
    const alerts = evaluateReadingStream([], thresholds);

    return NextResponse.json({
      alerts: alerts.slice(0, limit),
      total: alerts.length,
      thresholds,
    });
  } catch (err) {
    console.error("[alerts] error:", err);
    return NextResponse.json({ error: "Failed to evaluate alerts" }, { status: 500 });
  }
}
