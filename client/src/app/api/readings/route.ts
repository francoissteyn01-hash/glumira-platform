/**
 * GluMira™ Readings API Route
 * Version: 7.0.0
 * Routes:
 *   GET  /api/readings          — list recent readings for authenticated user
 *   POST /api/readings          — log a manual glucose reading
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

// ─── Validation schema ────────────────────────────────────────

const ReadingSchema = z.object({
  glucose: z
    .number()
    .min(1.0, "Glucose must be at least 1.0 mmol/L")
    .max(30.0, "Glucose must be at most 30.0 mmol/L"),
  unit: z.enum(["mmol/L", "mg/dL"]).default("mmol/L"),
  source: z.enum(["manual", "nightscout", "cgm"]).default("manual"),
  recordedAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

// ─── Auth helper ──────────────────────────────────────────────

async function getSessionAndClient() {
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
  return { session, supabase };
}

// ─── GET /api/readings ────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { session, supabase } = await getSessionAndClient();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "288"), 1440); // max 5 days at 5-min intervals
  const hours = parseInt(searchParams.get("hours") ?? "24");
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("glucose_readings")
    .select("id, glucose, unit, source, recorded_at, notes")
    .eq("user_id", session.user.id)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[GluMira] Readings GET error:", error.message);
    return NextResponse.json({ error: "Failed to fetch readings" }, { status: 500 });
  }

  // Compute simple stats
  const glucoseValues = (data ?? []).map((r) => r.glucose as number);
  const stats =
    glucoseValues.length > 0
      ? {
          count: glucoseValues.length,
          mean: +(glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length).toFixed(1),
          min: +Math.min(...glucoseValues).toFixed(1),
          max: +Math.max(...glucoseValues).toFixed(1),
          inRange: glucoseValues.filter((g) => g >= 3.9 && g <= 10.0).length,
          tir: +(
            (glucoseValues.filter((g) => g >= 3.9 && g <= 10.0).length /
              glucoseValues.length) *
            100
          ).toFixed(1),
        }
      : null;

  return NextResponse.json({ readings: data ?? [], stats }, { status: 200 });
}

// ─── POST /api/readings ───────────────────────────────────────

export async function POST(req: NextRequest) {
  const { session, supabase } = await getSessionAndClient();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ReadingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { glucose, unit, source, recordedAt, notes } = parsed.data;

  // Convert mg/dL to mmol/L for storage
  const glucoseMmol = unit === "mg/dL" ? +(glucose / 18.0182).toFixed(1) : glucose;

  const { data, error } = await supabase
    .from("glucose_readings")
    .insert({
      user_id: session.user.id,
      glucose: glucoseMmol,
      unit: "mmol/L",
      source,
      recorded_at: recordedAt ?? new Date().toISOString(),
      notes: notes ?? null,
    })
    .select("id, glucose, unit, source, recorded_at")
    .single();

  if (error) {
    console.error("[GluMira] Readings POST error:", error.message);
    return NextResponse.json({ error: "Failed to log reading" }, { status: 500 });
  }

  return NextResponse.json({ reading: data }, { status: 201 });
}
