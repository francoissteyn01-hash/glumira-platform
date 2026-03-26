/**
 * GluMira™ — /api/admin/users/[id]/role
 *
 * Admin-only endpoint for updating a user's role.
 *
 * PATCH /api/admin/users/:id/role
 * Body: { role: "patient" | "clinician" | "admin" }
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rate-limiter";
import { auditLog } from "@/lib/audit";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const VALID_ROLES = ["patient", "clinician", "admin"] as const;
type Role = (typeof VALID_ROLES)[number];

async function getAdminUser(token: string) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ── Rate limit ────────────────────────────────────────────────────────────
  const rl = await rateLimit(req, { limit: 20, windowMs: 60_000 });
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

  // ── Validate target user ──────────────────────────────────────────────────
  const targetId = params.id;
  if (!targetId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  // Prevent self-demotion
  if (targetId === adminUser.id) {
    return NextResponse.json(
      { error: "Cannot modify your own role" },
      { status: 400 }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { role?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const role = body.role as Role;
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  // ── Update role ───────────────────────────────────────────────────────────
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data, error: dbError } = await adminClient
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", targetId)
    .select("id, email, role")
    .single();

  if (dbError) {
    if (dbError.code === "PGRST116") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  await auditLog({
    userId: adminUser.id,
    action: "admin_user_role_updated",
    metadata: { targetId, newRole: role },
  });

  return NextResponse.json({ ok: true, user: data });
}
