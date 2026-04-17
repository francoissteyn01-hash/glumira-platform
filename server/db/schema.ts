/**
 * GluMira™ V7 — server/db/schema.ts
 *
 * Single source of truth for the ORM schema lives in drizzle/schema.ts.
 * This file is a pure re-export so server routes can import from either
 * path without diverging. Do NOT add table definitions here.
 *
 * GluMira™ is an educational platform, not a medical device.
 */
export * from "../../drizzle/schema";
