/**
 * GluMira™ V7 — server/routes/iob-hunter.router.ts
 * tRPC router for IOB Hunter™ engine endpoints.
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  FORMULARY,
  FORMULARY_MAP,
  calculateStackingScore,
  generateStackingCurve,
  getActiveIOB,
  type InsulinEvent,
} from "../src/engine/iob-hunter";
import { getFormularyForRegion } from "../src/engine/region-logic";

export const iobHunterRouter = router({
  /**
   * Calculate current IOB for the authenticated user.
   * Pulls insulin_events from the last 48 hours and sums active IOB at `atTime`.
   */
  calculateIOB: protectedProcedure
    .input(z.object({ atTime: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const atTime = input.atTime ? new Date(input.atTime) : new Date();

      // Fetch events from the last 48 hours (covers ultra-long insulins)
      const since = new Date(atTime.getTime() - 48 * 60 * 60_000).toISOString();

      const { data, error } = await ctx.supabase
        .from("insulin_events")
        .select("id, event_time, insulin_type, dose_units")
        .eq("user_id", ctx.user.id)
        .gte("event_time", since)
        .order("event_time", { ascending: true });

      if (error) throw new Error(error.message);

      const events: InsulinEvent[] = (data ?? []).map((e) => ({
        id: e.id,
        event_time: e.event_time,
        insulin_type: e.insulin_type,
        dose_units: Number(e.dose_units),
      }));

      const totalIOB = calculateStackingScore(events, atTime);

      return {
        atTime: atTime.toISOString(),
        totalIOB: Math.round(totalIOB * 1000) / 1000,
        eventCount: events.length,
      };
    }),

  /**
   * Generate stacking curve for a date range.
   */
  getStackingCurve: protectedProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startTime = new Date(input.from);
      const endTime = new Date(input.to);

      // Fetch events from 48h before start to capture tail IOB
      const fetchSince = new Date(startTime.getTime() - 48 * 60 * 60_000).toISOString();

      const { data, error } = await ctx.supabase
        .from("insulin_events")
        .select("id, event_time, insulin_type, dose_units")
        .eq("user_id", ctx.user.id)
        .gte("event_time", fetchSince)
        .lte("event_time", input.to)
        .order("event_time", { ascending: true });

      if (error) throw new Error(error.message);

      const events: InsulinEvent[] = (data ?? []).map((e) => ({
        id: e.id,
        event_time: e.event_time,
        insulin_type: e.insulin_type,
        dose_units: Number(e.dose_units),
      }));

      return generateStackingCurve(events, startTime, endTime);
    }),

  /**
   * Return the insulin formulary, optionally filtered by region.
   */
  getFormulary: publicProcedure
    .input(z.object({ countryCode: z.string().optional() }).optional())
    .query(({ input }) => {
      if (input?.countryCode) {
        return getFormularyForRegion(input.countryCode);
      }
      return FORMULARY;
    }),
});
