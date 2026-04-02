/**
 * GluMira™ V7 — Pattern Intelligence tRPC router
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { analysePatterns } from "../src/engine/pattern-engine";
import { enrichPatterns } from "../src/engine/pattern-language";

export const patternRouter = router({
  analyse: protectedProcedure
    .input(z.object({ from: z.string(), to: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const fetchSince = new Date(new Date(input.from).getTime() - 7 * 24 * 3_600_000).toISOString();

      const [insulinRes, glucoseRes, mealRes, conditionRes, profileRes] = await Promise.all([
        ctx.supabase.from("insulin_events").select("event_time, event_type, insulin_type, dose_units").eq("user_id", userId).gte("event_time", fetchSince).lte("event_time", input.to).order("event_time"),
        ctx.supabase.from("meal_log").select("meal_time, glucose_value").eq("user_id", userId).gte("meal_time", fetchSince).lte("meal_time", input.to).not("glucose_value", "is", null).order("meal_time"),
        ctx.supabase.from("meal_log").select("meal_time, event_type, glucose_value, carbs_g").eq("user_id", userId).gte("meal_time", fetchSince).lte("meal_time", input.to).order("meal_time"),
        ctx.supabase.from("condition_events").select("event_time, event_type, intensity").eq("user_id", userId).gte("event_time", fetchSince).lte("event_time", input.to),
        ctx.supabase.from("patient_self_profiles").select("comorbidities, special_conditions, dietary_approach").eq("user_id", userId).maybeSingle(),
      ]);

      const insulinEvents = (insulinRes.data ?? []).map((e: any) => ({ event_time: e.event_time, event_type: e.event_type, insulin_type: e.insulin_type, dose_units: Number(e.dose_units) }));
      const glucoseReadings = (glucoseRes.data ?? []).map((r: any) => ({ time: r.meal_time, value: Number(r.glucose_value) }));
      const mealLogs = (mealRes.data ?? []).map((m: any) => ({ meal_time: m.meal_time, event_type: m.event_type, glucose_value: m.glucose_value != null ? Number(m.glucose_value) : null, carbs_g: m.carbs_g != null ? Number(m.carbs_g) : null }));
      const conditionEvents = (conditionRes.data ?? []).map((c: any) => ({ event_time: c.event_time, event_type: c.event_type, intensity: c.intensity }));
      const profile = { comorbidities: profileRes.data?.comorbidities ?? [], special_conditions: profileRes.data?.special_conditions ?? [], dietary_approach: profileRes.data?.dietary_approach ?? "" };

      const raw = analysePatterns(insulinEvents, glucoseReadings, mealLogs, conditionEvents, profile);
      return enrichPatterns(raw);
    }),
});
