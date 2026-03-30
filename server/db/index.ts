/**
 * GluMira™ V7 — server/db/index.ts
 * Drizzle ORM + Supabase client singletons.
 * GluMira™ is an educational platform, not a medical device.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";
import * as schema from "../../drizzle/schema";

// ── Drizzle (Postgres via pg Pool) ────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// ── Supabase (service-role — server only) ─────────────────────────────────────
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
