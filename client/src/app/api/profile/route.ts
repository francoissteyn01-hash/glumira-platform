/**
 * GluMira™ — Profile API Route
 * GET  /api/profile  — fetch authenticated user's patient profile
 * PATCH /api/profile — update patient profile fields
 *
 * Auth: Supabase session cookie (httpOnly)
 * Rate limit: 60 GET / 20 PATCH per hour per user
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/../../supabase/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function supabase() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

// Allowed PATCH fields — whitelist to prevent mass assignment
const PATCHABLE_FIELDS = new Set([
  "display_name",
  "dob",
  "diabetes_type",
  "insulin_type",
  "insulin_concentration",
  "weight_kg",
  "height_cm",
  "glucose_units",
  "active_meal_regime",
  "notifications_enabled",
  "hypo_alert_threshold",
  "hyper_alert_threshold",
]);

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET() {
  const sb = supabase();

  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await sb
    .from("patient_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    console.error("[GET /api/profile]", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }

  // Camel-case the response for the client
  return NextResponse.json({
    id: data.id,
    displayName: data.display_name,
    dob: data.dob,
    diabetesType: data.diabetes_type,
    insulinType: data.insulin_type,
    insulinConcentration: data.insulin_concentration,
    weightKg: data.weight_kg,
    heightCm: data.height_cm,
    glucoseUnits: data.glucose_units,
    activeMealRegime: data.active_meal_regime,
    notificationsEnabled: data.notifications_enabled,
    hypoAlertThreshold: data.hypo_alert_threshold,
    hyperAlertThreshold: data.hyper_alert_threshold,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const sb = supabase();

  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Map camelCase → snake_case and whitelist
  const camelToSnake: Record<string, string> = {
    displayName: "display_name",
    dob: "dob",
    diabetesType: "diabetes_type",
    insulinType: "insulin_type",
    insulinConcentration: "insulin_concentration",
    weightKg: "weight_kg",
    heightCm: "height_cm",
    glucoseUnits: "glucose_units",
    activeMealRegime: "active_meal_regime",
    notificationsEnabled: "notifications_enabled",
    hypoAlertThreshold: "hypo_alert_threshold",
    hyperAlertThreshold: "hyper_alert_threshold",
  };

  const patch: Record<string, unknown> = {};
  for (const [camel, value] of Object.entries(body)) {
    const snake = camelToSnake[camel];
    if (snake && PATCHABLE_FIELDS.has(snake)) {
      patch[snake] = value;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Validate thresholds
  if (patch.hypo_alert_threshold !== undefined) {
    const v = Number(patch.hypo_alert_threshold);
    if (isNaN(v) || v < 2.0 || v > 5.0) {
      return NextResponse.json(
        { error: "hypoAlertThreshold must be between 2.0 and 5.0 mmol/L" },
        { status: 422 }
      );
    }
  }
  if (patch.hyper_alert_threshold !== undefined) {
    const v = Number(patch.hyper_alert_threshold);
    if (isNaN(v) || v < 8.0 || v > 20.0) {
      return NextResponse.json(
        { error: "hyperAlertThreshold must be between 8.0 and 20.0 mmol/L" },
        { status: 422 }
      );
    }
  }

  patch.updated_at = new Date().toISOString();

  const { data, error } = await sb
    .from("patient_profiles")
    .update(patch)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    console.error("[PATCH /api/profile]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    displayName: data.display_name,
    dob: data.dob,
    diabetesType: data.diabetes_type,
    insulinType: data.insulin_type,
    insulinConcentration: data.insulin_concentration,
    weightKg: data.weight_kg,
    heightCm: data.height_cm,
    glucoseUnits: data.glucose_units,
    activeMealRegime: data.active_meal_regime,
    notificationsEnabled: data.notifications_enabled,
    hypoAlertThreshold: data.hypo_alert_threshold,
    hyperAlertThreshold: data.hyper_alert_threshold,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
}
