/**
 * GluMira™ — /api/iob/history
 *
 * GET /api/iob/history?windowHours=6&intervalMins=15
 *
 * Returns IOB time-series data for the authenticated patient,
 * computed from dose records using the iobFraction decay model.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeActiveIob, getDoses } from "@/server/doses/dose-log";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const windowHours  = Math.min(Math.max(parseInt(searchParams.get("windowHours")  ?? "6",  10), 1), 24);
  const intervalMins = Math.min(Math.max(parseInt(searchParams.get("intervalMins") ?? "15", 10), 5), 60);

  const userId = session.user.id;
  const now    = new Date();
  const start  = new Date(now.getTime() - windowHours * 60 * 60 * 1000);

  // Build time-series points
  const points: {
    timestamp: string;
    totalIob: number;
    bolusIob: number;
    basalIob: number;
    correctionIob: number;
  }[] = [];

  const stepMs = intervalMins * 60 * 1000;
  let cursor   = new Date(start.getTime());

  while (cursor <= now) {
    const summary = computeActiveIob(userId, cursor);
    points.push({
      timestamp:     cursor.toISOString(),
      totalIob:      summary.totalIob,
      bolusIob:      summary.bolusIob,
      basalIob:      summary.basalIob,
      correctionIob: summary.correctionIob,
    });
    cursor = new Date(cursor.getTime() + stepMs);
  }

  // Aggregate stats
  const iobValues = points.map((p) => p.totalIob);
  const peakIob   = Math.max(...iobValues, 0);
  const peakIdx   = iobValues.indexOf(peakIob);
  const peakAt    = peakIdx >= 0 ? points[peakIdx].timestamp : null;
  const avgIob    = iobValues.length > 0
    ? iobValues.reduce((a, b) => a + b, 0) / iobValues.length
    : 0;
  const currentSummary = computeActiveIob(userId, now);

  return NextResponse.json({
    points,
    peakIob,
    peakAt,
    avgIob:      Math.round(avgIob * 100) / 100,
    currentIob:  currentSummary.totalIob,
    windowHours,
  });
}
