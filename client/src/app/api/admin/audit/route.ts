/**
 * GluMira™ — /api/admin/audit
 *
 * Returns recent audit log entries for the admin dashboard.
 * Admin role required.
 *
 * GET /api/admin/audit?limit=100
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getRecentAuditLog } from "@/server/security/audit";

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

async function isAdmin(userId: string): Promise<boolean> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", userId)
    .single();
  return data?.role === "admin";
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await isAdmin(session.user.id);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam ?? "100", 10) || 100, 1), 500);

  const entries = getRecentAuditLog(limit);

  return NextResponse.json({ ok: true, entries, count: entries.length });
}
