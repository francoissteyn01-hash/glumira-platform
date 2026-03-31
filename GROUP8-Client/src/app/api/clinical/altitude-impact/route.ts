import { NextRequest, NextResponse } from "next/server";
import { analyzeAltitudeImpact } from "../../../../../server/clinical/altitude-impact";

export async function POST(req: NextRequest) {
  try {
    const { readings, baselineAltitude } = await req.json();
    const result = analyzeAltitudeImpact(readings ?? [], baselineAltitude ?? 0);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
