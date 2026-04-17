/**
 * GluMira™ V7 — server/routes/consent.router.ts
 * tRPC router for user consent management.
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

const consentCreateInput = z.object({
  userId:    z.string(),
  timestamp: z.string(),
  consents:  z.array(z.string()),
});

const researchUpdateInput = z.object({
  researchConsent: z.boolean(),
});

export const consentRouter = router({
  create: publicProcedure.input(consentCreateInput).mutation(async ({ ctx, input }) => {
    const researchConsent = input.consents.includes("research_programme");
    const now = new Date().toISOString();

    const { error } = await ctx.supabase
      .from("user_consents")
      .upsert({
        user_id:             input.userId,
        timestamp:           input.timestamp,
        consents:            input.consents,
        research_consent:    researchConsent,
        research_consent_ts: researchConsent ? now : null,
      }, { onConflict: "user_id" });

    if (error) throw new Error(error.message);
    return { ok: true };
  }),

  updateResearch: protectedProcedure.input(researchUpdateInput).mutation(async ({ ctx, input }) => {
    const now = new Date().toISOString();
    const { error } = await ctx.supabase
      .from("user_consents")
      .update({
        research_consent:              input.researchConsent,
        research_consent_ts:           input.researchConsent ? now : null,
        research_consent_withdrawn_ts: !input.researchConsent ? now : null,
      })
      .eq("user_id", ctx.user.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  }),

  getResearch: protectedProcedure.query(async ({ ctx }) => {
    const { data } = await ctx.supabase
      .from("user_consents")
      .select("research_consent")
      .eq("user_id", ctx.user.id)
      .single();
    return { researchConsent: data?.research_consent ?? false };
  }),
});
