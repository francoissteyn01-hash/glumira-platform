import { NextRequest, NextResponse } from "next/server";
import { analyzeCycleImpact } from "../../../../../server/clinical/menstrual-cycle-impact";

export async function POST(req: NextRequest) {
  try {
    const { cycleDays, cycleLength } = await req.json();
    const result = analyzeCycleImpact(cycleDays ?? [], cycleLength ?? 28);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
