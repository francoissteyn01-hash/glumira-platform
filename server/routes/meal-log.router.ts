/**
 * GluMira™ V7 — server/routes/meal-log.router.ts
 * tRPC router for meal log CRUD.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const mealLogInput = z.object({
  meal_time: z.string(),
  event_type: z.enum(["basal", "meal_bolus", "correction", "low_intervention", "meal", "snack"]),
  insulin_type: z.string().nullish(),
  units: z.number().nullish(),
  glucose_value: z.number().nullish(),
  glucose_units: z.enum(["mmol", "mg"]).default("mmol"),
  protein_g: z.number().nullish(),
  carbs_g: z.number().nullish(),
  fat_g: z.number().nullish(),
  fibre_g: z.number().nullish(),
  food_description: z.string().nullish(),
  low_treatment_type: z
    .enum(["dextab_quarter", "dextab_half", "dextab_full", "juice", "coke", "jelly_beans", "glucose_gel", "honey"])
    .nullish(),
  low_treatment_grams: z.number().nullish(),
  comment: z.string().nullish(),
  photo_url: z.string().nullish(),
});

export const mealLogRouter = router({
  create: protectedProcedure.input(mealLogInput).mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from("meal_log")
      .insert({
        user_id: ctx.user.id,
        meal_time: input.meal_time,
        event_type: input.event_type,
        insulin_type: input.insulin_type ?? null,
        units: input.units ?? null,
        glucose_value: input.glucose_value ?? null,
        glucose_units: input.glucose_units,
        protein_g: input.protein_g ?? null,
        carbs_g: input.carbs_g ?? null,
        fat_g: input.fat_g ?? null,
        fibre_g: input.fibre_g ?? null,
        food_description: input.food_description ?? null,
        low_treatment_type: input.low_treatment_type ?? null,
        low_treatment_grams: input.low_treatment_grams ?? null,
        comment: input.comment ?? null,
        photo_url: input.photo_url ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Auto-create linked insulin_event for meal_bolus / correction entries
    if (
      (input.event_type === "meal_bolus" || input.event_type === "correction") &&
      input.insulin_type &&
      input.units != null &&
      input.units > 0
    ) {
      await ctx.supabase.from("insulin_events").insert({
        user_id: ctx.user.id,
        event_time: input.meal_time,
        event_type: input.event_type,
        insulin_type: input.insulin_type,
        dose_units: input.units,
        food_linked_id: data.id,
        is_correction: input.event_type === "correction",
        notes: null,
      });
    }

    return data;
  }),

  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("meal_log")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("meal_time", { ascending: false })
        .limit(input.limit);

      if (error) throw new Error(error.message);
      return data ?? [];
    }),

  getByDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      const start = `${input.date}T00:00:00`;
      const end = `${input.date}T23:59:59`;

      const { data, error } = await ctx.supabase
        .from("meal_log")
        .select("*")
        .eq("user_id", ctx.user.id)
        .gte("meal_time", start)
        .lte("meal_time", end)
        .order("meal_time", { ascending: true });

      if (error) throw new Error(error.message);
      return data ?? [];
    }),
});
