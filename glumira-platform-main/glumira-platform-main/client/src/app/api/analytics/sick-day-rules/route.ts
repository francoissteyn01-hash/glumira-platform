/**
 * GluMira™ — Sick Day Rules API Route
 * POST /api/analytics/sick-day-rules
 */

import { NextRequest, NextResponse } from "next/server";
import { generateSickDayAdvice, type SickDayInput } from "../../../../../server/analytics/sick-day-rules";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input: SickDayInput = {
      currentGlucoseMmol: Number(body.currentGlucoseMmol),
      ketonesMmol: body.ketonesMmol !== null && body.ketonesMmol !== undefined ? Number(body.ketonesMmol) : null,
      temperature: body.temperature !== null && body.temperature !== undefined ? Number(body.temperature) : null,
      vomiting: Boolean(body.vomiting),
      diarrhoea: Boolean(body.diarrhoea),
      ableToEat: body.ableToEat !== false,
      hoursIll: Number(body.hoursIll) || 0,
    };

    if (isNaN(input.currentGlucoseMmol) || input.currentGlucoseMmol <= 0) {
      return NextResponse.json({ error: "currentGlucoseMmol is required" }, { status: 400 });
    }

    const advice = generateSickDayAdvice(input);
    return NextResponse.json(advice);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
