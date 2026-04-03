/**
 * GluMira™ V7 — server/routes/profile.route.ts
 * Patient self-service profile CRUD.
 * GET  /api/profile — fetch current user's profile
 * PUT  /api/profile — upsert current user's profile
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import { supabase } from "../db";

export const profileRouter = Router();

profileRouter.use(requireAuth);

/* ─── GET current profile ─────────────────────────────────────────────────── */
profileRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { data, error } = await supabase
      .from("patient_self_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ profile: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* ─── PUT upsert profile ──────────────────────────────────────────────────── */
profileRouter.put("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const body = req.body;

    // Coerce empty strings to null for numeric / date fields
    const toNullIfEmpty = (v: any) => (v === "" || v === undefined ? null : v);
    const toNumberOrNull = (v: any) => {
      if (v === "" || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };

    // Calculate under-18 flag from DOB
    let under18Flag = false;
    if (body.date_of_birth) {
      const dob = new Date(body.date_of_birth);
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      under18Flag = age < 18;
    }

    // Calculate profile completeness
    const profileComplete = !!(
      body.first_name &&
      body.last_name &&
      body.date_of_birth &&
      body.diabetes_type &&
      body.country &&
      body.dietary_approach
    );

    // Build row — only include nightscout fields if explicitly sent
    // (prevents profile form from wiping nightscout config set elsewhere)
    const row: Record<string, unknown> = {
      user_id:          userId,
      first_name:       body.first_name ?? null,
      last_name:        body.last_name ?? null,
      date_of_birth:    toNullIfEmpty(body.date_of_birth),
      sex:              toNullIfEmpty(body.sex),
      diabetes_type:    toNullIfEmpty(body.diabetes_type),
      diagnosis_date:   toNullIfEmpty(body.diagnosis_date),
      country:          body.country ?? null,
      language:         toNullIfEmpty(body.language),
      glucose_units:    body.glucose_units ?? "mmol",
      insulin_types:    body.insulin_types ?? [],
      delivery_method:  toNullIfEmpty(body.delivery_method),
      basal_frequency:  toNullIfEmpty(body.basal_frequency),
      basal_times:      body.basal_times ?? [],
      icr:              toNumberOrNull(body.icr),
      isf:              toNumberOrNull(body.isf),
      correction_target: toNumberOrNull(body.correction_target),
      dietary_approach: toNullIfEmpty(body.dietary_approach),
      allergens:        body.allergens ?? [],
      meals_per_day:    toNumberOrNull(body.meals_per_day) ?? 3,
      comorbidities:    body.comorbidities ?? [],
      special_conditions: body.special_conditions ?? [],
      is_caregiver:     body.is_caregiver ?? false,
      patient_name:     body.patient_name ?? null,
      relationship:     body.relationship ?? null,
      under_18_flag:    under18Flag,
      profile_complete: profileComplete,
    };

    // Only overwrite nightscout fields if explicitly provided in request
    if ("nightscout_url" in body)          row.nightscout_url = body.nightscout_url ?? null;
    if ("nightscout_api_secret" in body)   row.nightscout_api_secret = body.nightscout_api_secret ?? null;
    if ("nightscout_sync_enabled" in body) row.nightscout_sync_enabled = body.nightscout_sync_enabled ?? false;

    const { data, error } = await supabase
      .from("patient_self_profiles")
      .upsert(row, { onConflict: "user_id" })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ profile: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
