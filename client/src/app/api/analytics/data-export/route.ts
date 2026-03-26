import { NextRequest, NextResponse } from "next/server";
import { exportData } from "../../../../../server/analytics/data-export";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { format, ...input } = body;
    const result = exportData(input, format ?? "csv");
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
