/**
 * GluMira™ V7 — server/db/schema.ts
 * Re-exports main schema + adds badges & mira tables.
 * GluMira™ is an educational platform, not a medical device.
 */
export * from "../../drizzle/schema";

// ── Additional tables not yet in drizzle/schema.ts ────────────────────────────
import { pgTable, pgEnum, uuid, varchar, text, timestamp, jsonb, integer, boolean, unique } from "drizzle-orm/pg-core";
import { patientProfiles, userProfiles } from "../../drizzle/schema";

export const badgeTierEnum = pgEnum("badge_tier", ["bronze", "silver", "gold", "platinum"]);

export const badges = pgTable("badges", {
  id:          uuid("id").primaryKey().defaultRandom(),
  slug:        varchar("slug", { length: 100 }).notNull().unique(),
  name:        varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  tier:        badgeTierEnum("tier").notNull().default("bronze"),
  iconEmoji:   varchar("icon_emoji", { length: 10 }).notNull().default("🏅"),
  criteria:    jsonb("criteria"),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userBadges = pgTable("user_badges", {
  id:        uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").notNull().references(() => patientProfiles.id, { onDelete: "cascade" }),
  badgeId:   uuid("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
  earnedAt:  timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniqueBadge: unique().on(t.patientId, t.badgeId) }));

export const miraConversations = pgTable("mira_conversations", {
  id:         uuid("id").primaryKey().defaultRandom(),
  patientId:  uuid("patient_id").references(() => patientProfiles.id, { onDelete: "set null" }),
  userId:     uuid("user_id").references(() => userProfiles.id, { onDelete: "set null" }),
  messages:   jsonb("messages").notNull().default([]),
  tokenCount: integer("token_count").default(0),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
