/**
 * GluMira™ Cron — Key Rotation API Route
 * Version: 7.0.0
 * Route: POST /api/cron/key-rotation
 *
 * Triggered by Vercel Cron (every Sunday at 02:00 UTC).
 * Forwards the rotation request to the Supabase Edge Function.
 * Protected by CRON_SECRET header.
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Validate cron secret
  const cronSecret = req.headers.get("X-Cron-Secret");
  if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (!SUPABASE_URL) {
    return NextResponse.json({ error: "Supabase URL not configured" }, { status: 503 });
  }

  const edgeFnUrl = `${SUPABASE_URL}/functions/v1/key-rotation`;

  try {
    const response = await fetch(edgeFnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cron-Secret": CRON_SECRET,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Key rotation Edge Function failed:", data);
      return NextResponse.json(
        { error: "Key rotation failed", details: data },
        { status: response.status }
      );
    }

    console.log(`Key rotation complete: ${data.rotatedCount} keys rotated, ${data.skippedCount} skipped`);

    return NextResponse.json({
      success: true,
      rotatedAt: data.rotatedAt,
      rotatedCount: data.rotatedCount,
      skippedCount: data.skippedCount,
      errorCount: data.errorCount,
    });
  } catch (err) {
    console.error("Key rotation cron error:", err);
    return NextResponse.json({ error: "Internal error during key rotation" }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
