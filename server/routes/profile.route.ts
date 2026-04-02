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

    const row = {
      user_id:          userId,
      first_name:       body.first_name ?? null,
      last_name:        body.last_name ?? null,
      date_of_birth:    body.date_of_birth ?? null,
      diabetes_type:    body.diabetes_type ?? null,
      diagnosis_date:   body.diagnosis_date ?? null,
      country:          body.country ?? null,
      insulin_types:    body.insulin_types ?? [],
      delivery_method:  body.delivery_method ?? null,
      icr:              body.icr ?? null,
      isf:              body.isf ?? null,
      dietary_approach: body.dietary_approach ?? null,
      allergens:        body.allergens ?? [],
      meals_per_day:    body.meals_per_day ?? 3,
      comorbidities:    body.comorbidities ?? [],
      is_caregiver:     body.is_caregiver ?? false,
      patient_name:     body.patient_name ?? null,
      relationship:     body.relationship ?? null,
      under_18_flag:    under18Flag,
      profile_complete: profileComplete,
    };

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
