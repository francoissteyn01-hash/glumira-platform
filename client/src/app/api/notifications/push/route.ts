/**
 * GluMira™ — /api/notifications/push
 *
 * Web Push subscription management.
 *
 * POST   /api/notifications/push  — save a push subscription
 * DELETE /api/notifications/push  — remove a push subscription
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  savePushSubscription,
  removePushSubscription,
} from "@/server/notifications/notifications";

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

// ─── POST — save push subscription ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    endpoint?: string;
    keys?: { p256dh: string; auth: string };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json(
      { error: "endpoint and keys (p256dh, auth) are required" },
      { status: 400 }
    );
  }

  savePushSubscription({
    userId: session.user.id,
    endpoint: body.endpoint,
    keys: body.keys,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, message: "Push subscription saved" }, { status: 201 });
}

// ─── DELETE — remove push subscription ───────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { endpoint?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
  }

  removePushSubscription(session.user.id, body.endpoint);

  return NextResponse.json({ ok: true, message: "Push subscription removed" });
}
