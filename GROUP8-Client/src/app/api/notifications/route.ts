/**
 * GluMira™ Notifications API Route
 * Version: 7.0.0
 * Routes:
 *   GET  /api/notifications          — list notifications (unread=true query param)
 *   POST /api/notifications/read     — mark one or all as read
 *   POST /api/notifications/dismiss  — dismiss a notification
 *   POST /api/notifications/push     — save push subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getNotifications,
  markRead,
  markAllRead,
  dismissNotification,
  getUnreadCount,
  savePushSubscription,
} from "../../../../../server/notifications/notifications";

// ─── Auth helper ──────────────────────────────────────────────

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
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── GET /api/notifications ───────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";
  const notifications = getNotifications(session.user.id, unreadOnly);
  const unreadCount = getUnreadCount(session.user.id);

  return NextResponse.json({ notifications, unreadCount }, { status: 200 });
}

// ─── POST /api/notifications ──────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, notificationId, pushSubscription } = body;

  switch (action) {
    case "read": {
      if (notificationId) {
        const ok = markRead(session.user.id, notificationId);
        return NextResponse.json({ success: ok }, { status: ok ? 200 : 404 });
      }
      // Mark all read
      const count = markAllRead(session.user.id);
      return NextResponse.json({ success: true, markedRead: count }, { status: 200 });
    }

    case "dismiss": {
      if (!notificationId) {
        return NextResponse.json({ error: "notificationId required" }, { status: 400 });
      }
      const ok = dismissNotification(session.user.id, notificationId);
      return NextResponse.json({ success: ok }, { status: ok ? 200 : 404 });
    }

    case "subscribe_push": {
      if (!pushSubscription?.endpoint || !pushSubscription?.keys) {
        return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
      }
      savePushSubscription({
        userId: session.user.id,
        endpoint: pushSubscription.endpoint,
        keys: pushSubscription.keys,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
