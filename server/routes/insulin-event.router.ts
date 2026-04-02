/**
 * GluMira™ V7 — server/routes/insulin-event.router.ts
 * tRPC router for insulin event CRUD.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const insulinEventInput = z.object({
  event_time: z.string(),
  event_type: z.enum(["basal", "meal_bolus", "correction", "pre_bolus", "snack_cover"]),
  insulin_type: z.string().min(1),
  dose_units: z.number().min(0),
  food_linked_id: z.string().uuid().nullish(),
  is_correction: z.boolean().default(false),
  notes: z.string().nullish(),
});

export const insulinEventRouter = router({
  create: protectedProcedure.input(insulinEventInput).mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from("insulin_events")
      .insert({
        user_id: ctx.user.id,
        event_time: input.event_time,
        event_type: input.event_type,
        insulin_type: input.insulin_type,
        dose_units: input.dose_units,
        food_linked_id: input.food_linked_id ?? null,
        is_correction: input.is_correction,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }),

  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("insulin_events")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("event_time", { ascending: false })
        .limit(input.limit);

      if (error) throw new Error(error.message);
      return data ?? [];
    }),

  getByDateRange: protectedProcedure
    .input(z.object({ from: z.string(), to: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("insulin_events")
        .select("*")
        .eq("user_id", ctx.user.id)
        .gte("event_time", input.from)
        .lte("event_time", input.to)
        .order("event_time", { ascending: true });

      if (error) throw new Error(error.message);
      return data ?? [];
    }),
});
