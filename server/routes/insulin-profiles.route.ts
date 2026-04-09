/**
 * GluMira™ V7 — Insulin Profiles reference API
 * GET /api/insulin-profiles — list all active insulin profiles (PK data)
 */

import { Router, type Request, type Response } from "express";
import { supabase } from "../db";

export const insulinProfilesRouter = Router();

insulinProfilesRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("insulin_profiles")
      .select("*")
      .eq("is_active", true)
      .order("brand_name");

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ insulins: data ?? [] });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
