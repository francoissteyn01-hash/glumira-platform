/**
 * GluMira™ Notifications Module
 * Version: 7.0.0
 *
 * Handles:
 *  - In-app notification queue (per user, last 50)
 *  - Hypo risk alert generation from IOB + CGM data
 *  - Push notification dispatch (Web Push API)
 *  - Notification read/dismiss state
 *
 * GluMira™ is an informational tool only. Not a medical device.
 * Alerts are educational — not clinical alarms.
 */

// ─── Types ────────────────────────────────────────────────────

export type NotificationType =
  | "hypo_risk"
  | "high_iob"
  | "stacking_alert"
  | "nightscout_sync"
  | "school_care_plan"
  | "beta_feedback"
  | "system";

export type NotificationSeverity = "info" | "warning" | "critical";

export interface GluMiraNotification {
  id: string;
  userId: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  dismissedAt: string | null;
  metadata?: Record<string, unknown>;
}

export interface HypoRiskInput {
  currentIob: number;
  currentGlucose: number; // mmol/L
  glucoseTrend: "rising" | "stable" | "falling" | "falling_fast";
  riskTier: "low" | "moderate" | "high" | "critical";
}

export interface PushSubscriptionRecord {
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: string;
}

// ─── In-memory store (replace with DB in production) ─────────

const notificationStore = new Map<string, GluMiraNotification[]>();
const pushSubscriptions = new Map<string, PushSubscriptionRecord[]>();

// ─── Core functions ───────────────────────────────────────────

/**
 * Create and store a new notification for a user.
 */
export function createNotification(
  userId: string,
  type: NotificationType,
  severity: NotificationSeverity,
  title: string,
  body: string,
  metadata?: Record<string, unknown>
): GluMiraNotification {
  const notification: GluMiraNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    type,
    severity,
    title,
    body,
    createdAt: new Date().toISOString(),
    readAt: null,
    dismissedAt: null,
    metadata,
  };

  const existing = notificationStore.get(userId) ?? [];
  // Keep last 50 per user
  const updated = [notification, ...existing].slice(0, 50);
  notificationStore.set(userId, updated);

  return notification;
}

/**
 * Get all notifications for a user (optionally filter unread only).
 */
export function getNotifications(
  userId: string,
  unreadOnly = false
): GluMiraNotification[] {
  const notifications = notificationStore.get(userId) ?? [];
  if (unreadOnly) {
    return notifications.filter((n) => !n.readAt && !n.dismissedAt);
  }
  return notifications;
}

/**
 * Mark a notification as read.
 */
export function markRead(userId: string, notificationId: string): boolean {
  const notifications = notificationStore.get(userId);
  if (!notifications) return false;

  const notification = notifications.find((n) => n.id === notificationId);
  if (!notification) return false;

  notification.readAt = new Date().toISOString();
  return true;
}

/**
 * Dismiss a notification.
 */
export function dismissNotification(
  userId: string,
  notificationId: string
): boolean {
  const notifications = notificationStore.get(userId);
  if (!notifications) return false;

  const notification = notifications.find((n) => n.id === notificationId);
  if (!notification) return false;

  notification.dismissedAt = new Date().toISOString();
  return true;
}

/**
 * Mark all notifications as read for a user.
 */
export function markAllRead(userId: string): number {
  const notifications = notificationStore.get(userId) ?? [];
  const now = new Date().toISOString();
  let count = 0;

  for (const n of notifications) {
    if (!n.readAt) {
      n.readAt = now;
      count++;
    }
  }

  return count;
}

/**
 * Get unread count for a user.
 */
export function getUnreadCount(userId: string): number {
  return getNotifications(userId, true).length;
}

// ─── Hypo risk alert generation ───────────────────────────────

/**
 * Evaluate IOB + CGM data and generate a hypo risk notification if warranted.
 * Returns the notification if one was created, otherwise null.
 */
export function evaluateHypoRisk(
  userId: string,
  input: HypoRiskInput
): GluMiraNotification | null {
  const { currentIob, currentGlucose, glucoseTrend, riskTier } = input;

  // Only alert on high or critical risk
  if (riskTier === "low" || riskTier === "moderate") return null;

  // Suppress duplicate alerts within 30 minutes
  const existing = getNotifications(userId, true).filter(
    (n) => n.type === "hypo_risk"
  );
  if (existing.length > 0) {
    const lastAlert = existing[0];
    const minutesSinceLast =
      (Date.now() - new Date(lastAlert.createdAt).getTime()) / 60_000;
    if (minutesSinceLast < 30) return null;
  }

  const severity: NotificationSeverity =
    riskTier === "critical" ? "critical" : "warning";

  const trendLabel =
    glucoseTrend === "falling_fast"
      ? "rapidly falling"
      : glucoseTrend === "falling"
      ? "falling"
      : glucoseTrend;

  const title =
    riskTier === "critical"
      ? "⚠️ Critical Hypo Risk"
      : "⚠️ High Hypo Risk";

  const body =
    `IOB: ${currentIob.toFixed(2)}U · Glucose: ${currentGlucose.toFixed(1)} mmol/L (${trendLabel}). ` +
    `Educational alert only — not a clinical alarm. Consult your diabetes care team.`;

  return createNotification(userId, "hypo_risk", severity, title, body, {
    currentIob,
    currentGlucose,
    glucoseTrend,
    riskTier,
  });
}

/**
 * Generate a stacking alert notification.
 */
export function createStackingAlert(
  userId: string,
  peakIob: number,
  riskTier: "high" | "critical"
): GluMiraNotification {
  const severity: NotificationSeverity = riskTier === "critical" ? "critical" : "warning";
  return createNotification(
    userId,
    "stacking_alert",
    severity,
    riskTier === "critical" ? "⚠️ Critical Stacking Detected" : "⚠️ High Stacking Risk",
    `Peak IOB ${peakIob.toFixed(2)}U detected from overlapping doses. Educational alert only.`,
    { peakIob, riskTier }
  );
}

// ─── Push subscription management ────────────────────────────

export function savePushSubscription(record: PushSubscriptionRecord): void {
  const existing = pushSubscriptions.get(record.userId) ?? [];
  // Deduplicate by endpoint
  const filtered = existing.filter((s) => s.endpoint !== record.endpoint);
  pushSubscriptions.set(record.userId, [...filtered, record]);
}

export function removePushSubscription(
  userId: string,
  endpoint: string
): void {
  const existing = pushSubscriptions.get(userId) ?? [];
  pushSubscriptions.set(
    userId,
    existing.filter((s) => s.endpoint !== endpoint)
  );
}

export function getPushSubscriptions(
  userId: string
): PushSubscriptionRecord[] {
  return pushSubscriptions.get(userId) ?? [];
}

// ─── Notification factory helpers ────────────────────────────

export function notifyNightscoutSync(
  userId: string,
  readingsCount: number
): GluMiraNotification {
  return createNotification(
    userId,
    "nightscout_sync",
    "info",
    "Nightscout Sync Complete",
    `${readingsCount} glucose readings imported successfully.`,
    { readingsCount }
  );
}

export function notifySchoolCarePlanGenerated(
  userId: string,
  patientName: string
): GluMiraNotification {
  return createNotification(
    userId,
    "school_care_plan",
    "info",
    "School Care Plan Ready",
    `Care plan for ${patientName} has been generated and is ready to print.`,
    { patientName }
  );
}
