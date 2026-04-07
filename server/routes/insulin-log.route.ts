/**
 * GluMira™ V7 — server/routes/insulin-log.route.ts
 * Unified insulin-logging router: basal, bolus, BG, food, low-intervention,
 * Clarity import, and Nightscout integration.
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import { supabase } from "../db";

export const insulinLogRouter = Router();

insulinLogRouter.use(requireAuth);

/* ── helpers ─────────────────────────────────────────────────────────────── */

/** Return [startOfDay, startOfNextDay] ISO strings for a YYYY-MM-DD date. */
function dayBounds(dateStr: string): [string, string] {
  const start = `${dateStr}T00:00:00.000Z`;
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 1);
  return [start, next.toISOString()];
}

/* ═══════════════════════════════════════════════════════════════════════════
   BASAL ENTRIES
   ═══════════════════════════════════════════════════════════════════════════ */

insulinLogRouter.post("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { insulin_name, dose, administered_at, profile_id, notes } = req.body;

    const { data, error } = await supabase
      .from("basal_entries")
      .insert({ user_id: userId, insulin_name, dose, administered_at, profile_id: profile_id ?? null, notes: notes ?? null })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ entry: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

insulinLogRouter.get("/basal", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const date = req.query.date as string;
    if (!date) return res.status(400).json({ error: "date query param required" });

    const [start, end] = dayBounds(date);
    const { data, error } = await supabase
      .from("basal_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("administered_at", start)
      .lt("administered_at", end)
      .order("administered_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ entries: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

insulinLogRouter.put("/basal/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const { data, error } = await supabase
      .from("basal_entries")
      .update(req.body)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ entry: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

insulinLogRouter.delete("/basal/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const { error } = await supabase
      .from("basal_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).send();
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   BOLUS ENTRIES
   ═══════════════════════════════════════════════════════════════════════════ */

insulinLogRouter.post("/bolus", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { insulin_name, dose, administered_at, meal_type, food_entry_id, profile_id, notes } = req.body;

    const { data, error } = await supabase
      .from("bolus_entries")
      .insert({
        user_id: userId, insulin_name, dose, administered_at, meal_type,
        food_entry_id: food_entry_id ?? null, profile_id: profile_id ?? null, notes: notes ?? null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ entry: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

insulinLogRouter.get("/bolus", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const date = req.query.date as string;
    if (!date) return res.status(400).json({ error: "date query param required" });

    const [start, end] = dayBounds(date);
    const { data, error } = await supabase
      .from("bolus_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("administered_at", start)
      .lt("administered_at", end)
      .order("administered_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ entries: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   BG ENTRIES
   ═══════════════════════════════════════════════════════════════════════════ */

insulinLogRouter.post("/bg", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { glucose_value, glucose_unit, measured_at, context, source, profile_id, notes } = req.body;

    const { data, error } = await supabase
      .from("bg_entries")
      .insert({
        user_id: userId, glucose_value, glucose_unit, measured_at,
        context: context ?? null, source: source ?? null,
        profile_id: profile_id ?? null, notes: notes ?? null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ entry: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

insulinLogRouter.get("/bg", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const date = req.query.date as string;
    const range = req.query.range as string | undefined;
    if (!date) return res.status(400).json({ error: "date query param required" });

    let startDate: string;
    const [_, dayEnd] = dayBounds(date);

    if (range) {
      const days = parseInt(range.replace("d", ""), 10);
      if (isNaN(days)) return res.status(400).json({ error: "invalid range param, expected e.g. 7d" });
      const d = new Date(`${date}T00:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() - days + 1);
      startDate = d.toISOString();
    } else {
      startDate = `${date}T00:00:00.000Z`;
    }

    const { data, error } = await supabase
      .from("bg_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("measured_at", startDate)
      .lt("measured_at", dayEnd)
      .order("measured_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ entries: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   FOOD ENTRIES
   ═══════════════════════════════════════════════════════════════════════════ */

insulinLogRouter.post("/food", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const {
      meal_type, food_regime, carbs_g, protein_g, fat_g, fibre_g,
      description, photo_url, logged_at, profile_id,
    } = req.body;

    const { data, error } = await supabase
      .from("food_entries")
      .insert({
        user_id: userId, meal_type, logged_at,
        food_regime: food_regime ?? null, carbs_g: carbs_g ?? null,
        protein_g: protein_g ?? null, fat_g: fat_g ?? null, fibre_g: fibre_g ?? null,
        description: description ?? null, photo_url: photo_url ?? null,
        profile_id: profile_id ?? null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ entry: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

insulinLogRouter.get("/food", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const date = req.query.date as string;
    if (!date) return res.status(400).json({ error: "date query param required" });

    const [start, end] = dayBounds(date);
    const { data, error } = await supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", start)
      .lt("logged_at", end)
      .order("logged_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ entries: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   LOW INTERVENTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

insulinLogRouter.post("/low-intervention", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const {
      treatment_type, amount, amount_unit, glucose_before, glucose_after,
      glucose_unit, treated_at, resolved, profile_id, notes,
    } = req.body;

    const { data, error } = await supabase
      .from("low_interventions")
      .insert({
        user_id: userId, treatment_type, glucose_unit, treated_at,
        amount: amount ?? null, amount_unit: amount_unit ?? null,
        glucose_before: glucose_before ?? null, glucose_after: glucose_after ?? null,
        resolved: resolved ?? null, profile_id: profile_id ?? null, notes: notes ?? null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ entry: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

insulinLogRouter.get("/low-intervention", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const date = req.query.date as string;
    if (!date) return res.status(400).json({ error: "date query param required" });

    const [start, end] = dayBounds(date);
    const { data, error } = await supabase
      .from("low_interventions")
      .select("*")
      .eq("user_id", userId)
      .gte("treated_at", start)
      .lt("treated_at", end)
      .order("treated_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ entries: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   CLARITY IMPORT
   ═══════════════════════════════════════════════════════════════════════════ */

insulinLogRouter.post("/clarity/import", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { rows, filename, glucose_unit } = req.body as {
      rows: { timestamp: string; glucose_value: number; trend_arrow?: string }[];
      filename: string;
      glucose_unit: string;
    };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "rows array is required" });
    }

    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
      const ts = new Date(row.timestamp);
      const windowStart = new Date(ts.getTime() - 5 * 60_000).toISOString();
      const windowEnd = new Date(ts.getTime() + 5 * 60_000).toISOString();

      // Check for duplicate within ±5 min
      const { data: existing } = await supabase
        .from("bg_entries")
        .select("id")
        .eq("user_id", userId)
        .eq("source", "clarity_import")
        .gte("measured_at", windowStart)
        .lt("measured_at", windowEnd)
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("bg_entries").insert({
        user_id: userId,
        glucose_value: row.glucose_value,
        glucose_unit,
        measured_at: row.timestamp,
        source: "clarity_import",
        notes: row.trend_arrow ? `trend: ${row.trend_arrow}` : null,
      });

      if (!error) inserted++;
      else skipped++;
    }

    // Log to clarity_imports table
    await supabase.from("clarity_imports").insert({
      user_id: userId,
      filename,
      rows_total: rows.length,
      rows_inserted: inserted,
      rows_skipped: skipped,
    });

    return res.status(201).json({ inserted, skipped, total: rows.length });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   NIGHTSCOUT
   ═══════════════════════════════════════════════════════════════════════════ */

insulinLogRouter.post("/nightscout/test", async (req: Request, res: Response) => {
  try {
    const { site_url, api_secret } = req.body;
    if (!site_url) return res.status(400).json({ error: "site_url is required" });

    const url = `${site_url.replace(/\/$/, "")}/api/v1/status.json`;
    const headers: Record<string, string> = {};
    if (api_secret) headers["API-SECRET"] = api_secret;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Nightscout returned ${response.status}` });
    }

    const result = await response.json();
    return res.json({ status: result });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

insulinLogRouter.post("/nightscout/sync", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    // Fetch user's nightscout config
    const { data: config, error: cfgErr } = await supabase
      .from("nightscout_config")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (cfgErr) return res.status(500).json({ error: cfgErr.message });
    if (!config) return res.status(404).json({ error: "No Nightscout config found" });

    const baseUrl = config.site_url.replace(/\/$/, "");
    const headers: Record<string, string> = {};
    if (config.api_secret) headers["API-SECRET"] = config.api_secret;

    // Pull recent entries (last 24h)
    const since = new Date(Date.now() - 24 * 60 * 60_000).getTime();
    const nsUrl = `${baseUrl}/api/v1/entries.json?find[dateString][$gte]=${new Date(since).toISOString()}&count=1000`;

    const response = await fetch(nsUrl, { headers });
    if (!response.ok) {
      return res.status(502).json({ error: `Nightscout returned ${response.status}` });
    }

    const entries: any[] = await response.json() as any[];
    let inserted = 0;
    let skipped = 0;

    for (const entry of entries) {
      if (!entry.sgv && !entry.mbg) continue;

      const measuredAt = entry.dateString || new Date(entry.date).toISOString();
      const glucoseValue = entry.sgv ?? entry.mbg;

      // Deduplicate ±5 min
      const ts = new Date(measuredAt);
      const windowStart = new Date(ts.getTime() - 5 * 60_000).toISOString();
      const windowEnd = new Date(ts.getTime() + 5 * 60_000).toISOString();

      const { data: existing } = await supabase
        .from("bg_entries")
        .select("id")
        .eq("user_id", userId)
        .eq("source", "nightscout")
        .gte("measured_at", windowStart)
        .lt("measured_at", windowEnd)
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("bg_entries").insert({
        user_id: userId,
        glucose_value: glucoseValue,
        glucose_unit: "mg/dL",
        measured_at: measuredAt,
        source: "nightscout",
        notes: entry.direction ? `trend: ${entry.direction}` : null,
      });

      if (!error) inserted++;
      else skipped++;
    }

    return res.json({ inserted, skipped, total: entries.length });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

insulinLogRouter.put("/nightscout/config", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { site_url, api_secret } = req.body;

    const { data, error } = await supabase
      .from("nightscout_config")
      .upsert({ user_id: userId, site_url, api_secret: api_secret ?? null }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ config: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
