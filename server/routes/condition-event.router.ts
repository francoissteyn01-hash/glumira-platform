/**
 * GluMira™ V7 — server/routes/condition-event.router.ts
 * tRPC router for condition event CRUD.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const conditionEventInput = z.object({
  event_time: z.string(),
  event_type: z.enum([
    "exercise", "illness", "sleep", "stress", "travel",
    "steroid", "menstrual", "exam", "weather", "other",
  ]),
  intensity: z.enum(["low", "moderate", "high", "severe"]).nullish(),
  duration_minutes: z.number().int().min(0).nullish(),
  notes: z.string().nullish(),
});

export const conditionEventRouter = router({
  create: protectedProcedure.input(conditionEventInput).mutation(async ({ ctx, input }) => {
    const { data, error } = await ctx.supabase
      .from("condition_events")
      .insert({
        user_id: ctx.user.id,
        event_time: input.event_time,
        event_type: input.event_type,
        intensity: input.intensity ?? null,
        duration_minutes: input.duration_minutes ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }),

  list: protectedProcedure
    .input(z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      limit: z.number().min(1).max(200).default(50),
    }))
    .query(async ({ ctx, input }) => {
      let q = ctx.supabase
        .from("condition_events")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("event_time", { ascending: false })
        .limit(input.limit);

      if (input.from) q = q.gte("event_time", input.from);
      if (input.to) q = q.lte("event_time", input.to);

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data ?? [];
    }),
});
