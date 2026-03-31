/**
 * GluMira™ — /api/analytics/regime-comparison
 *
 * Compares glucose outcomes across multiple meal regime windows.
 *
 * POST /api/analytics/regime-comparison
 * Body: { windows: RegimeWindow[] }
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { compareRegimes } from "@/server/analytics/regime-comparison";
import type { RegimeWindow } from "@/server/analytics/regime-comparison";
import type { GlucosePoint } from "@/server/analytics/glucose-trend";

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getSession() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { windows?: RegimeWindow[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.windows) || body.windows.length === 0) {
    return NextResponse.json(
      { error: "windows array is required and must not be empty" },
      { status: 400 }
    );
  }

  if (body.windows.length > 6) {
    return NextResponse.json(
      { error: "Maximum 6 regime windows per comparison" },
      { status: 400 }
    );
  }

  // Validate each window
  for (const w of body.windows) {
    if (!w.regimeId || !w.regimeName || !w.startDate || !w.endDate) {
      return NextResponse.json(
        { error: "Each window requires regimeId, regimeName, startDate, endDate" },
        { status: 400 }
      );
    }
  }

  // Fetch glucose readings from Supabase
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Determine the full date range across all windows
  const allDates = body.windows.flatMap((w) => [w.startDate, w.endDate]);
  const minDate = allDates.reduce((a, b) => (a < b ? a : b));
  const maxDate = allDates.reduce((a, b) => (a > b ? a : b));

  const { data: rows, error: dbError } = await supabase
    .from("glucose_readings")
    .select("glucose_mmol, recorded_at")
    .eq("user_id", session.user.id)
    .gte("recorded_at", `${minDate}T00:00:00.000Z`)
    .lte("recorded_at", `${maxDate}T23:59:59.999Z`)
    .order("recorded_at", { ascending: true });

  if (dbError) {
    // In development, fall back to empty readings
    if (process.env.NODE_ENV === "development") {
      const result = compareRegimes([], body.windows);
      return NextResponse.json({ ok: true, ...result });
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const readings: GlucosePoint[] = (rows ?? []).map((r) => ({
    glucose: r.glucose_mmol,
    timestamp: r.recorded_at,
  }));

  const result = compareRegimes(readings, body.windows);

  return NextResponse.json({ ok: true, ...result });
}
