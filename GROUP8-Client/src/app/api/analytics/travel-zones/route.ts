/**
 * GluMira™ — Travel Zones API Route
 * POST /api/analytics/travel-zones
 */

import { NextRequest, NextResponse } from "next/server";
import { generateTravelAdvice, type TravelInput } from "../../../../../server/analytics/travel-zones";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input: TravelInput = {
      originTimezoneOffset: Number(body.originTimezoneOffset),
      destinationTimezoneOffset: Number(body.destinationTimezoneOffset),
      departureHour: Number(body.departureHour) || 0,
      flightDurationHours: Number(body.flightDurationHours) || 0,
      basalDoseTime: Number(body.basalDoseTime) || 22,
      basalDoseUnits: Number(body.basalDoseUnits) || 0,
    };

    if (isNaN(input.originTimezoneOffset) || isNaN(input.destinationTimezoneOffset)) {
      return NextResponse.json({ error: "timezone offsets are required" }, { status: 400 });
    }

    const advice = generateTravelAdvice(input);
    return NextResponse.json(advice);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
