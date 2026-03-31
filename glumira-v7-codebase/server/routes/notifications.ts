/**
 * GluMira™ V7 — server/routes/notifications.ts
 * Adapts: 04.2.14_useNotifications_v1.0.ts
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

// GET /api/notifications?unread=true
notificationsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const unreadOnly = req.query.unread === "true";
    const userId = getUserId(req);
    // TODO: Drizzle fetch from notifications table
    res.json({ notifications: [], unreadCount: 0, userId });
  } catch (err) {
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

// POST /api/notifications { action: "read" }
notificationsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { action } = req.body;
    if (action === "read") {
      const userId = getUserId(req);
      // TODO: Drizzle update all unread → readAt = now
      res.json({ ok: true });
    } else {
      res.status(400).json({ error: "Unknown action" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update notifications" });
  }
});
