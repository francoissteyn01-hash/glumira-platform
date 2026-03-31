/**
 * GluMira™ V7 — server/routes/patient.route.ts
 * POST   /api/patients           create
 * GET    /api/patients           list (clinician's)
 * GET    /api/patients/:id       detail
 * PATCH  /api/patients/:id       update
 * DELETE /api/patients/:id       soft-delete
 * POST   /api/patients/:id/modules  activate module
 * Version: v1.0 · 2026-03-29
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { supabase } from "../index";
import { requireAuth, getUserId } from "../middleware/auth";

export const patientRouter = Router();

const CreateSchema = z.object({
  patientName:       z.string().min(1).max(255),
  dateOfBirth:       z.string(),
  gender:            z.enum(["M","F","Other"]).optional(),
  diagnosis:         z.enum(["T1D","T2D","Gestational"]),
  diagnosisDate:     z.string().optional(),
  tdd:               z.number().min(2).max(300).optional(),
  typicalBasalDose:  z.number().min(1).max(300).optional(),
  glucoseTargetLow:  z.number().default(4.4),
  glucoseTargetHigh: z.number().default(10.0),
  glucoseUnit:       z.enum(["mmol","mgdl"]).default("mmol"),
  nightscoutUrl:     z.string().url().optional(),
  modules:           z.array(z.enum(["pediatric","school","pregnancy","menstrual_cycle"])).optional(),
});

patientRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const p = CreateSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid input", details: p.error.flatten().fieldErrors });

  const { modules, ...d } = p.data;
  const { data: patient, error } = await supabase.from("patient_profiles").insert({
    clinician_id: userId, patient_name: d.patientName,
    date_of_birth: d.dateOfBirth, gender: d.gender,
    diagnosis: d.diagnosis, diagnosis_date: d.diagnosisDate,
    tdd: d.tdd, typical_basal_dose: d.typicalBasalDose,
    glucose_target_low: d.glucoseTargetLow, glucose_target_high: d.glucoseTargetHigh,
    glucose_unit: d.glucoseUnit, nightscout_url: d.nightscoutUrl,
  }).select("id, patient_name, diagnosis, created_at").single();

  if (error) return res.status(500).json({ error: "Failed to create patient" });

  if (modules?.length)
    await supabase.from("patient_modules").insert(modules.map(m => ({ patient_id: patient.id, module_type: m })));

  return res.status(201).json({ ok: true, patient });
});

patientRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const search = req.query.q as string | undefined;

  let query = supabase.from("patient_profiles")
    .select("id, patient_name, diagnosis, date_of_birth, glucose_unit, is_active, updated_at")
    .eq("clinician_id", userId).eq("is_active", true).order("patient_name");

  if (search) query = query.ilike("patient_name", `%${search}%`);

  const { data: patients, error } = await query;
  if (error) return res.status(500).json({ error: "Failed to fetch patients" });
  return res.json({ ok: true, patients: patients ?? [], count: patients?.length ?? 0 });
});

patientRouter.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const { data: patient, error } = await supabase
    .from("patient_profiles").select("*, patient_modules(*), insulin_profiles(*)")
    .eq("id", req.params.id).eq("clinician_id", getUserId(req)).single();
  if (error || !patient) return res.status(404).json({ error: "Patient not found or access denied" });
  return res.json({ ok: true, patient });
});

patientRouter.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { data: existing } = await supabase.from("patient_profiles")
    .select("id").eq("id", req.params.id).eq("clinician_id", userId).single();
  if (!existing) return res.status(404).json({ error: "Patient not found or access denied" });

  const allowed = ["patient_name","date_of_birth","gender","diagnosis","diagnosis_date",
    "tdd","typical_basal_dose","glucose_target_low","glucose_target_high","glucose_unit",
    "nightscout_url","nightscout_token"];
  const patch: Record<string,unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (req.body[k] !== undefined) patch[k] = req.body[k];

  const { data, error } = await supabase.from("patient_profiles")
    .update(patch).eq("id", req.params.id).select("id, patient_name, updated_at").single();
  if (error) return res.status(500).json({ error: "Failed to update patient" });
  return res.json({ ok: true, patient: data });
});

patientRouter.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const { error } = await supabase.from("patient_profiles")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", req.params.id).eq("clinician_id", getUserId(req));
  if (error) return res.status(500).json({ error: "Failed to archive patient" });
  return res.json({ ok: true, message: "Patient archived. Data preserved." });
});

patientRouter.post("/:id/modules", requireAuth, async (req: Request, res: Response) => {
  const { module } = req.body;
  if (!["pediatric","school","pregnancy","menstrual_cycle"].includes(module))
    return res.status(400).json({ error: "Invalid module type" });

  const { data: existing } = await supabase.from("patient_profiles")
    .select("id").eq("id", req.params.id).eq("clinician_id", getUserId(req)).single();
  if (!existing) return res.status(404).json({ error: "Patient not found or access denied" });

  const { error } = await supabase.from("patient_modules")
    .upsert({ patient_id: req.params.id, module_type: module, is_active: true }, { onConflict: "patient_id,module_type" });
  if (error) return res.status(500).json({ error: "Failed to activate module" });
  return res.json({ ok: true, module, patientId: req.params.id });
});
