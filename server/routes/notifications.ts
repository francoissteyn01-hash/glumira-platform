/**
 * GluMira™ V7 — server/routes/notifications.ts
 * Uses auditLog table as notification source (action-based notifications)
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import { db } from "../db";
import { auditLog } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

// GET /api/notifications?limit=20
notificationsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const limit = Math.min(parseInt(req.query.limit as string ?? "20", 10) || 20, 100);

    const notifications = await db.select().from(auditLog)
      .where(eq(auditLog.userId, userId))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);

    res.json({
      notifications: notifications.map(n => ({
        id: n.id,
        action: n.action,
        resourceType: n.resourceType,
        resourceId: n.resourceId,
        metadata: n.metadata,
        createdAt: n.createdAt,
      })),
      total: notifications.length,
      userId,
    });
  } catch (err) {
    console.error("[notifications]", err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

// POST /api/notifications — log a user action
notificationsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { action, resourceType, resourceId, metadata } = req.body;

    if (!action) {
      return res.status(400).json({ error: "action is required" });
    }

    await db.insert(auditLog).values({
      userId,
      action,
      resourceType: resourceType ?? null,
      resourceId: resourceId ?? null,
      metadata: metadata ?? null,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("[notifications/post]", err);
    res.status(500).json({ error: "Failed to save notification" });
  }
});
