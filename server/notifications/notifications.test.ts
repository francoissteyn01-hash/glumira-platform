/**
 * GluMira™ Notifications — Test Suite
 * Version: 7.0.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createNotification,
  getNotifications,
  markRead,
  dismissNotification,
  markAllRead,
  getUnreadCount,
  evaluateHypoRisk,
  createStackingAlert,
  savePushSubscription,
  removePushSubscription,
  getPushSubscriptions,
  notifyNightscoutSync,
  notifySchoolCarePlanGenerated,
} from "./notifications";

// ─── Helpers ──────────────────────────────────────────────────

function uid() {
  return `user_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Tests ────────────────────────────────────────────────────

describe("createNotification", () => {
  it("creates a notification with correct fields", () => {
    const userId = uid();
    const n = createNotification(userId, "system", "info", "Test", "Test body");
    expect(n.userId).toBe(userId);
    expect(n.type).toBe("system");
    expect(n.severity).toBe("info");
    expect(n.title).toBe("Test");
    expect(n.body).toBe("Test body");
    expect(n.readAt).toBeNull();
    expect(n.dismissedAt).toBeNull();
    expect(n.id).toMatch(/^notif_/);
  });

  it("stores notification in the queue", () => {
    const userId = uid();
    createNotification(userId, "system", "info", "T1", "B1");
    createNotification(userId, "system", "info", "T2", "B2");
    const all = getNotifications(userId);
    expect(all.length).toBe(2);
  });

  it("caps queue at 50 notifications", () => {
    const userId = uid();
    for (let i = 0; i < 55; i++) {
      createNotification(userId, "system", "info", `T${i}`, `B${i}`);
    }
    expect(getNotifications(userId).length).toBe(50);
  });

  it("stores metadata correctly", () => {
    const userId = uid();
    const n = createNotification(userId, "hypo_risk", "critical", "T", "B", {
      iob: 4.5,
    });
    expect(n.metadata?.iob).toBe(4.5);
  });
});

describe("getNotifications", () => {
  it("returns all notifications by default", () => {
    const userId = uid();
    createNotification(userId, "system", "info", "T1", "B1");
    createNotification(userId, "system", "info", "T2", "B2");
    expect(getNotifications(userId).length).toBe(2);
  });

  it("returns only unread when unreadOnly=true", () => {
    const userId = uid();
    const n1 = createNotification(userId, "system", "info", "T1", "B1");
    createNotification(userId, "system", "info", "T2", "B2");
    markRead(userId, n1.id);
    expect(getNotifications(userId, true).length).toBe(1);
  });

  it("returns empty array for unknown user", () => {
    expect(getNotifications("unknown_user")).toEqual([]);
  });
});

describe("markRead", () => {
  it("marks a notification as read", () => {
    const userId = uid();
    const n = createNotification(userId, "system", "info", "T", "B");
    const result = markRead(userId, n.id);
    expect(result).toBe(true);
    expect(getNotifications(userId)[0].readAt).not.toBeNull();
  });

  it("returns false for unknown notification", () => {
    const userId = uid();
    expect(markRead(userId, "nonexistent")).toBe(false);
  });
});

describe("dismissNotification", () => {
  it("dismisses a notification", () => {
    const userId = uid();
    const n = createNotification(userId, "system", "info", "T", "B");
    const result = dismissNotification(userId, n.id);
    expect(result).toBe(true);
    expect(getNotifications(userId)[0].dismissedAt).not.toBeNull();
  });

  it("dismissed notifications excluded from unread count", () => {
    const userId = uid();
    const n = createNotification(userId, "system", "info", "T", "B");
    dismissNotification(userId, n.id);
    expect(getUnreadCount(userId)).toBe(0);
  });
});

describe("markAllRead", () => {
  it("marks all unread notifications as read", () => {
    const userId = uid();
    createNotification(userId, "system", "info", "T1", "B1");
    createNotification(userId, "system", "info", "T2", "B2");
    createNotification(userId, "system", "info", "T3", "B3");
    const count = markAllRead(userId);
    expect(count).toBe(3);
    expect(getUnreadCount(userId)).toBe(0);
  });

  it("does not double-count already-read notifications", () => {
    const userId = uid();
    const n1 = createNotification(userId, "system", "info", "T1", "B1");
    createNotification(userId, "system", "info", "T2", "B2");
    markRead(userId, n1.id);
    const count = markAllRead(userId);
    expect(count).toBe(1);
  });
});

describe("getUnreadCount", () => {
  it("returns correct unread count", () => {
    const userId = uid();
    createNotification(userId, "system", "info", "T1", "B1");
    createNotification(userId, "system", "info", "T2", "B2");
    expect(getUnreadCount(userId)).toBe(2);
  });

  it("returns 0 for user with no notifications", () => {
    expect(getUnreadCount("brand_new_user")).toBe(0);
  });
});

describe("evaluateHypoRisk", () => {
  it("returns null for low risk", () => {
    const userId = uid();
    const result = evaluateHypoRisk(userId, {
      currentIob: 1.0,
      currentGlucose: 6.5,
      glucoseTrend: "stable",
      riskTier: "low",
    });
    expect(result).toBeNull();
  });

  it("returns null for moderate risk", () => {
    const userId = uid();
    const result = evaluateHypoRisk(userId, {
      currentIob: 2.0,
      currentGlucose: 5.0,
      glucoseTrend: "falling",
      riskTier: "moderate",
    });
    expect(result).toBeNull();
  });

  it("creates a warning notification for high risk", () => {
    const userId = uid();
    const result = evaluateHypoRisk(userId, {
      currentIob: 3.5,
      currentGlucose: 4.2,
      glucoseTrend: "falling",
      riskTier: "high",
    });
    expect(result).not.toBeNull();
    expect(result?.severity).toBe("warning");
    expect(result?.type).toBe("hypo_risk");
  });

  it("creates a critical notification for critical risk", () => {
    const userId = uid();
    const result = evaluateHypoRisk(userId, {
      currentIob: 5.0,
      currentGlucose: 3.0,
      glucoseTrend: "falling_fast",
      riskTier: "critical",
    });
    expect(result).not.toBeNull();
    expect(result?.severity).toBe("critical");
    expect(result?.title).toContain("Critical");
  });

  it("suppresses duplicate alerts within 30 minutes", () => {
    const userId = uid();
    const input = {
      currentIob: 4.0,
      currentGlucose: 3.5,
      glucoseTrend: "falling" as const,
      riskTier: "high" as const,
    };
    evaluateHypoRisk(userId, input);
    const second = evaluateHypoRisk(userId, input);
    expect(second).toBeNull();
  });
});

describe("createStackingAlert", () => {
  it("creates a warning for high stacking", () => {
    const userId = uid();
    const n = createStackingAlert(userId, 4.2, "high");
    expect(n.severity).toBe("warning");
    expect(n.type).toBe("stacking_alert");
    expect(n.metadata?.peakIob).toBe(4.2);
  });

  it("creates a critical for critical stacking", () => {
    const userId = uid();
    const n = createStackingAlert(userId, 7.5, "critical");
    expect(n.severity).toBe("critical");
    expect(n.title).toContain("Critical");
  });
});

describe("push subscription management", () => {
  it("saves and retrieves a push subscription", () => {
    const userId = uid();
    savePushSubscription({
      userId,
      endpoint: "https://push.example.com/sub1",
      keys: { p256dh: "key1", auth: "auth1" },
      createdAt: new Date().toISOString(),
    });
    const subs = getPushSubscriptions(userId);
    expect(subs.length).toBe(1);
    expect(subs[0].endpoint).toBe("https://push.example.com/sub1");
  });

  it("deduplicates subscriptions by endpoint", () => {
    const userId = uid();
    savePushSubscription({
      userId,
      endpoint: "https://push.example.com/sub1",
      keys: { p256dh: "key1", auth: "auth1" },
      createdAt: new Date().toISOString(),
    });
    savePushSubscription({
      userId,
      endpoint: "https://push.example.com/sub1",
      keys: { p256dh: "key2", auth: "auth2" },
      createdAt: new Date().toISOString(),
    });
    expect(getPushSubscriptions(userId).length).toBe(1);
  });

  it("removes a push subscription", () => {
    const userId = uid();
    savePushSubscription({
      userId,
      endpoint: "https://push.example.com/sub2",
      keys: { p256dh: "key1", auth: "auth1" },
      createdAt: new Date().toISOString(),
    });
    removePushSubscription(userId, "https://push.example.com/sub2");
    expect(getPushSubscriptions(userId).length).toBe(0);
  });
});

describe("notification factory helpers", () => {
  it("notifyNightscoutSync creates correct notification", () => {
    const userId = uid();
    const n = notifyNightscoutSync(userId, 288);
    expect(n.type).toBe("nightscout_sync");
    expect(n.body).toContain("288");
  });

  it("notifySchoolCarePlanGenerated creates correct notification", () => {
    const userId = uid();
    const n = notifySchoolCarePlanGenerated(userId, "Emma Thompson");
    expect(n.type).toBe("school_care_plan");
    expect(n.body).toContain("Emma Thompson");
  });
});
