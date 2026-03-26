import { NextRequest, NextResponse } from "next/server";
import { analyzeAlcoholImpact } from "../../../../../server/clinical/alcohol-impact";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = analyzeAlcoholImpact(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
