/**
 * GluMira — A1c Estimate API Route
 *
 * POST /api/analytics/a1c-estimate
 * Body: { readings: { mmol, timestamp }[], olderReadings?: { mmol, timestamp }[] }
 * Returns: A1cEstimate or A1cProjection
 *
 * GluMira is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  estimateA1c,
  projectA1c,
  categoriseA1c,
  a1cCategoryLabel,
  a1cCategoryColour,
} from "../../../../../server/analytics/a1c-estimator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { readings, olderReadings } = body;

    if (!Array.isArray(readings) || readings.length === 0) {
      return NextResponse.json({ error: "readings array required" }, { status: 400 });
    }

    if (olderReadings && Array.isArray(olderReadings) && olderReadings.length > 0) {
      const projection = projectA1c(readings, olderReadings);
      const category = categoriseA1c(projection.current.eA1cPercent);
      return NextResponse.json({
        ...projection,
        category,
        categoryLabel: a1cCategoryLabel(category),
        categoryColour: a1cCategoryColour(category),
      });
    }

    const estimate = estimateA1c(readings);
    const category = categoriseA1c(estimate.eA1cPercent);
    return NextResponse.json({
      ...estimate,
      category,
      categoryLabel: a1cCategoryLabel(category),
      categoryColour: a1cCategoryColour(category),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
