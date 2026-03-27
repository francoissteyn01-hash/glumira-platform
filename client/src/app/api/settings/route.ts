/**
 * GluMira™ — /api/settings
 *
 * GET  /api/settings  — fetch current user settings
 * PATCH /api/settings — update user settings (partial update)
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

// ─── Default settings ─────────────────────────────────────────────────────────

const DEFAULTS = {
  glucose_unit:          "mmol",
  theme:                 "system",
  notifications_enabled: true,
  push_enabled:          false,
  low_alert_threshold:   3.9,
  high_alert_threshold:  10.0,
  nightscout_url:        null,
  nightscout_token:      null,
  language:              "en",
  timezone:              "UTC",
};

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  if (error || !data) {
    // Return defaults if no settings row exists yet
    return NextResponse.json({
      glucoseUnit:          DEFAULTS.glucose_unit,
      theme:                DEFAULTS.theme,
      notificationsEnabled: DEFAULTS.notifications_enabled,
      pushEnabled:          DEFAULTS.push_enabled,
      lowAlertThreshold:    DEFAULTS.low_alert_threshold,
      highAlertThreshold:   DEFAULTS.high_alert_threshold,
      nightscoutUrl:        DEFAULTS.nightscout_url,
      nightscoutToken:      DEFAULTS.nightscout_token,
      language:             DEFAULTS.language,
      timezone:             DEFAULTS.timezone,
    });
  }

  return NextResponse.json({
    glucoseUnit:          data.glucose_unit          ?? DEFAULTS.glucose_unit,
    theme:                data.theme                 ?? DEFAULTS.theme,
    notificationsEnabled: data.notifications_enabled ?? DEFAULTS.notifications_enabled,
    pushEnabled:          data.push_enabled          ?? DEFAULTS.push_enabled,
    lowAlertThreshold:    data.low_alert_threshold   ?? DEFAULTS.low_alert_threshold,
    highAlertThreshold:   data.high_alert_threshold  ?? DEFAULTS.high_alert_threshold,
    nightscoutUrl:        data.nightscout_url        ?? null,
    nightscoutToken:      data.nightscout_token      ?? null,
    language:             data.language              ?? DEFAULTS.language,
    timezone:             data.timezone              ?? DEFAULTS.timezone,
  });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

const ALLOWED_FIELDS = new Set([
  "glucoseUnit", "theme", "notificationsEnabled", "pushEnabled",
  "lowAlertThreshold", "highAlertThreshold", "nightscoutUrl",
  "nightscoutToken", "language", "timezone",
]);

const FIELD_MAP: Record<string, string> = {
  glucoseUnit:          "glucose_unit",
  theme:                "theme",
  notificationsEnabled: "notifications_enabled",
  pushEnabled:          "push_enabled",
  lowAlertThreshold:    "low_alert_threshold",
  highAlertThreshold:   "high_alert_threshold",
  nightscoutUrl:        "nightscout_url",
  nightscoutToken:      "nightscout_token",
  language:             "language",
  timezone:             "timezone",
};

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Build update payload with only allowed fields
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      update[FIELD_MAP[key]] = value;
    }
  }

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ user_id: session.user.id, ...update }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    glucoseUnit:          data.glucose_unit          ?? DEFAULTS.glucose_unit,
    theme:                data.theme                 ?? DEFAULTS.theme,
    notificationsEnabled: data.notifications_enabled ?? DEFAULTS.notifications_enabled,
    pushEnabled:          data.push_enabled          ?? DEFAULTS.push_enabled,
    lowAlertThreshold:    data.low_alert_threshold   ?? DEFAULTS.low_alert_threshold,
    highAlertThreshold:   data.high_alert_threshold  ?? DEFAULTS.high_alert_threshold,
    nightscoutUrl:        data.nightscout_url        ?? null,
    nightscoutToken:      data.nightscout_token      ?? null,
    language:             data.language              ?? DEFAULTS.language,
    timezone:             data.timezone              ?? DEFAULTS.timezone,
  });
}
