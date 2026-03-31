/**
 * GluMira™ — /api/admin/users
 *
 * Admin-only endpoint for listing all platform users with pagination.
 *
 * GET /api/admin/users?page=1&limit=20&role=patient
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limiter";
import { auditLog } from "@/lib/audit";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getAdminUser(token: string) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;

  // Check admin role via user metadata or profiles table
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  // ── Rate limit ────────────────────────────────────────────────────────────
  const rl = await rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  // ── Auth & role check ─────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminUser = await getAdminUser(token);
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Query params ──────────────────────────────────────────────────────────
  const url = new URL(req.url);
  const page = Math.max(parseInt(url.searchParams.get("page") ?? "1", 10), 1);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);
  const roleFilter = url.searchParams.get("role");
  const offset = (page - 1) * limit;

  // ── Fetch users ───────────────────────────────────────────────────────────
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let query = adminClient
    .from("profiles")
    .select("id, email, role, full_name, created_at, updated_at, is_active", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (roleFilter) {
    query = query.eq("role", roleFilter);
  }

  const { data: users, error: dbError, count } = await query;

  if (dbError) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  await auditLog({
    userId: adminUser.id,
    action: "admin_users_listed",
    metadata: { page, limit, roleFilter, total: count },
  });

  return NextResponse.json({
    ok: true,
    users: users ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}
