/**
 * GluMira™ — NotificationsPanel.tsx
 *
 * Slide-in panel displaying in-app notifications with severity badges.
 * Supports mark-all-read and individual dismiss actions.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import React, { useCallback } from "react";
import { useNotifications } from "../hooks/useNotifications";
import type { GluMiraNotification, NotificationSeverity } from "../hooks/useNotifications";

// ─── Severity badge ───────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<NotificationSeverity, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

const SEVERITY_LABELS: Record<NotificationSeverity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

function SeverityBadge({ severity }: { severity: NotificationSeverity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[severity]}`}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

// ─── Notification item ────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: GluMiraNotification;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const isUnread = !notification.readAt;
  const isDismissed = !!notification.dismissedAt;

  if (isDismissed) return null;

  return (
    <li
      className={`flex flex-col gap-1 rounded-lg border p-3 transition-colors ${
        isUnread
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isUnread && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
          )}
          <span className="text-sm font-semibold text-slate-800">{notification.title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <SeverityBadge severity={notification.severity} />
          <button
            onClick={() => onDismiss(notification.id)}
            className="ml-1 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Dismiss notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-600">{notification.body}</p>
      <time className="text-xs text-slate-400">
        {new Date(notification.createdAt).toLocaleString()}
      </time>
    </li>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface NotificationsPanelProps {
  /** Whether the panel is visible */
  open: boolean;
  /** Callback to close the panel */
  onClose: () => void;
}

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const { notifications, unreadCount, loading, error, markAllRead } = useNotifications();

  const handleDismiss = useCallback(async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss", notificationId: id }),
      });
    } catch {
      // Silent
    }
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
        role="dialog"
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-800">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                {unreadCount}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close notifications"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && (
            <p className="text-sm text-slate-500">Loading notifications…</p>
          )}
          {error && (
            <p className="text-sm text-red-600">Error: {error}</p>
          )}
          {!loading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg
                className="mb-3 h-10 w-10 text-slate-300"
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
              <p className="text-sm text-slate-500">No notifications</p>
            </div>
          )}
          {!loading && !error && notifications.length > 0 && (
            <ul className="flex flex-col gap-2">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onDismiss={handleDismiss}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-4 py-2 text-center">
          <p className="text-xs text-slate-400">
            GluMira™ alerts are educational — not clinical alarms.
          </p>
        </div>
      </aside>
    </>
  );
}

export default NotificationsPanel;
