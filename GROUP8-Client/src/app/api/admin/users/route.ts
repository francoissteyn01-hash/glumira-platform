/**
 * GluMira™ — GET /api/admin/users
 *
 * Returns paginated user list for admin dashboard.
 *
 * Query params:
 *   page      — page number (default 1)
 *   pageSize  — items per page (default 25, max 100)
 *   search    — filter by email or display name
 *   role      — patient | clinician | admin
 *   status    — active | suspended
 *
 * Requires admin role.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getAdminUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, supabase };

  // Check admin role
  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") return { user: null, supabase };
  return { user, supabase };
}

export async function GET(req: NextRequest) {
  const { user, supabase } = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "25")));
  const search = url.searchParams.get("search") ?? "";
  const role = url.searchParams.get("role") ?? "";
  const status = url.searchParams.get("status") ?? "";

  const offset = (page - 1) * pageSize;

  // Build query
  let query = supabase
    .from("patient_profiles")
    .select(
      `
      user_id,
      display_name,
      diabetes_type,
      role,
      status,
      created_at,
      last_sign_in_at,
      reading_count:glucose_readings(count),
      feedback_count:beta_feedback(count)
    `,
      { count: "exact" }
    );

  if (search) {
    query = query.or(`display_name.ilike.%${search}%`);
  }
  if (role) {
    query = query.eq("role", role);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch emails from auth.users via admin API (service role needed in prod)
  const users = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.user_id,
    email: `user-${String(row.user_id).slice(0, 8)}@glumira.app`, // placeholder — real impl uses service role
    displayName: row.display_name ?? null,
    role: row.role ?? "patient",
    status: row.status ?? "active",
    diabetesType: row.diabetes_type ?? null,
    createdAt: row.created_at,
    lastSignInAt: row.last_sign_in_at ?? null,
    readingCount: Array.isArray(row.reading_count) ? row.reading_count[0]?.count ?? 0 : 0,
    feedbackCount: Array.isArray(row.feedback_count) ? row.feedback_count[0]?.count ?? 0 : 0,
  }));

  return NextResponse.json({
    users,
    total: count ?? 0,
    page,
    pageSize,
  });
}
