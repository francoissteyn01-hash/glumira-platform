import { NextRequest, NextResponse } from "next/server";
import { generateFastingProtocol } from "../../../../../server/clinical/fasting-protocol";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = generateFastingProtocol(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
