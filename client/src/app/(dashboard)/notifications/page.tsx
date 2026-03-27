/**
 * GluMira™ — Notifications Page
 * Route: /notifications
 *
 * Full-page view of all notifications with filter by severity.
 * Supports mark-all-read and individual dismiss.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import React, { useState, useCallback } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import type { GluMiraNotification, NotificationSeverity } from "@/hooks/useNotifications";

// ─── Severity badge ───────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<NotificationSeverity, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

function SeverityBadge({ severity }: { severity: NotificationSeverity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_STYLES[severity]}`}
    >
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

// ─── Notification row ─────────────────────────────────────────────────────────

interface NotificationRowProps {
  notification: GluMiraNotification;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}

function NotificationRow({ notification, onDismiss, onMarkRead }: NotificationRowProps) {
  if (notification.dismissedAt) return null;

  const isUnread = !notification.readAt;

  return (
    <div
      className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
        isUnread ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
      }`}
    >
      {isUnread && (
        <span
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500"
          aria-hidden="true"
        />
      )}
      {!isUnread && <span className="mt-1.5 h-2.5 w-2.5 shrink-0" />}

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-slate-800">{notification.title}</span>
          <SeverityBadge severity={notification.severity} />
        </div>
        <p className="text-sm text-slate-600">{notification.body}</p>
        <time className="mt-1 block text-xs text-slate-400">
          {new Date(notification.createdAt).toLocaleString()}
        </time>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isUnread && (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="text-xs text-blue-600 hover:underline"
          >
            Mark read
          </button>
        )}
        <button
          onClick={() => onDismiss(notification.id)}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SeverityFilter = "all" | NotificationSeverity;

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, error, markAllRead, refresh } =
    useNotifications();
  const [filter, setFilter] = useState<SeverityFilter>("all");

  const handleDismiss = useCallback(async (id: string) => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss", notificationId: id }),
    });
    refresh();
  }, [refresh]);

  const handleMarkRead = useCallback(async (id: string) => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", notificationId: id }),
    });
    refresh();
  }, [refresh]);

  const filtered = notifications.filter(
    (n) => !n.dismissedAt && (filter === "all" || n.severity === filter)
  );

  const filterButtons: { label: string; value: SeverityFilter }[] = [
    { label: "All", value: "all" },
    { label: "Critical", value: "critical" },
    { label: "Warning", value: "warning" },
    { label: "Info", value: "info" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {filterButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filter === btn.value
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            className="mb-4 h-12 w-12 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <p className="text-sm font-medium text-slate-500">No notifications</p>
          <p className="mt-1 text-xs text-slate-400">
            {filter !== "all" ? "Try changing the filter." : "You're all caught up."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              onDismiss={handleDismiss}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-slate-400">
        GluMira™ alerts are educational — not clinical alarms.
      </p>
    </div>
  );
}
