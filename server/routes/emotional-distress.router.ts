/**
 * GluMira™ V7 — server/routes/emotional-distress.router.ts
 * tRPC router for daily emotional distress log.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const distressInput = z.object({
  log_date: z.string(),
  distress_level: z.number().int().min(1).max(5),
  sleep_hours: z.number().min(0).max(24).nullish(),
  overnight_alarms: z.number().int().min(0).nullish(),
  burnout_flag: z.boolean().default(false),
  anxiety_flag: z.boolean().default(false),
  caregiver_notes: z.string().nullish(),
});

export const emotionalDistressRouter = router({
  create: protectedProcedure.input(distressInput).mutation(async ({ ctx, input }) => {
    // Upsert — one entry per user per day
    const { data, error } = await ctx.supabase
      .from("emotional_distress")
      .upsert(
        {
          user_id: ctx.user.id,
          log_date: input.log_date,
          distress_level: input.distress_level,
          sleep_hours: input.sleep_hours ?? null,
          overnight_alarms: input.overnight_alarms ?? 0,
          burnout_flag: input.burnout_flag,
          anxiety_flag: input.anxiety_flag,
          caregiver_notes: input.caregiver_notes ?? null,
        },
        { onConflict: "user_id,log_date" }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }),

  list: protectedProcedure
    .input(z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      limit: z.number().min(1).max(200).default(30),
    }))
    .query(async ({ ctx, input }) => {
      let q = ctx.supabase
        .from("emotional_distress")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("log_date", { ascending: false })
        .limit(input.limit);

      if (input.from) q = q.gte("log_date", input.from);
      if (input.to) q = q.lte("log_date", input.to);

      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data ?? [];
    }),
});
