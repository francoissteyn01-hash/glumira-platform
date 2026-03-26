import { NextRequest, NextResponse } from "next/server";
import { analyzeCGMGaps } from "../../../../../server/analytics/cgm-gap-analysis";

export async function POST(req: NextRequest) {
  try {
    const { readings, intervalMinutes } = await req.json();
    const result = analyzeCGMGaps(readings ?? [], intervalMinutes ?? 5);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
