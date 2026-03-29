/**
 * GluMira™ V7 — server/routes/badges.route.ts
 * Badge catalogue + user earned badges
 */

import { Router } from "express";
import { db } from "../db";
import { badges, userBadges, patientProfiles } from "../db/schema";
import { eq, and } from "drizzle-orm";

export const badgesRouter = Router();

/* ── Catalogue ───────────────────────────────────────────────────── */

/**
 * GET /api/badges
 * Returns all badges, with earnedAt if the authed user has earned them.
 */
badgesRouter.get("/", async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    const allBadges = await db.select().from(badges).orderBy(badges.tier, badges.name);

    if (!userId) {
      return res.json(allBadges.map((b) => ({ ...b, earnedAt: null })));
    }

    const patient = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.clinicianId, userId))
      .limit(1);

    const patientId = patient[0]?.id;

    const earned = patientId
      ? await db.select().from(userBadges).where(eq(userBadges.patientId, patientId))
      : [];

    const earnedMap = new Map(earned.map((e) => [e.badgeId, e.earnedAt]));

    return res.json(
      allBadges.map((b) => ({
        ...b,
        earnedAt: earnedMap.get(b.id) ?? null,
      }))
    );
  } catch (err: any) {
    console.error("[badges] GET /", err.message);
    return res.status(500).json({ error: "Failed to fetch badges" });
  }
});

/* ── Award (internal / cron) ─────────────────────────────────────── */

/**
 * POST /api/badges/award
 * Body: { patientId, badgeSlug }
 * Awards a badge to a patient if not already earned.
 */
badgesRouter.post("/award", async (req, res) => {
  try {
    const { patientId, badgeSlug } = req.body as {
      patientId: string;
      badgeSlug: string;
    };

    if (!patientId || !badgeSlug) {
      return res.status(400).json({ error: "patientId and badgeSlug required" });
    }

    const badge = await db
      .select()
      .from(badges)
      .where(eq(badges.slug, badgeSlug))
      .limit(1);

    if (!badge[0]) {
      return res.status(404).json({ error: "Badge not found" });
    }

    const existing = await db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.patientId, patientId), eq(userBadges.badgeId, badge[0].id)))
      .limit(1);

    if (existing[0]) {
      return res.json({ awarded: false, message: "Already earned" });
    }

    await db.insert(userBadges).values({
      patientId,
      badgeId: badge[0].id,
      earnedAt: new Date(),
    });

    return res.json({ awarded: true, badge: badge[0] });
  } catch (err: any) {
    console.error("[badges] POST /award", err.message);
    return res.status(500).json({ error: "Failed to award badge" });
  }
});

/* ── Patient badges ──────────────────────────────────────────────── */

/**
 * GET /api/badges/patient/:patientId
 * Returns only the badges this patient has earned.
 */
badgesRouter.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;

    const earned = await db
      .select({ badge: badges, earnedAt: userBadges.earnedAt })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.patientId, patientId));

    return res.json(earned.map(({ badge, earnedAt }) => ({ ...badge, earnedAt })));
  } catch (err: any) {
    console.error("[badges] GET /patient/:id", err.message);
    return res.status(500).json({ error: "Failed to fetch patient badges" });
  }
});
