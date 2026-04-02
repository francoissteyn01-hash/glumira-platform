/**
 * GluMira™ V7 — Mira AI tRPC router
 * Food search endpoint.
 */

import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { searchFood } from "../src/mira/food-search";

export const miraAIRouter = router({
  foodSearch: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input }) => {
      const results = searchFood(input.query);
      if (results.length === 0) {
        return { found: false, message: `I couldn't find "${input.query}" in my nutrition database. Try a more specific description or check the label.`, results: [] };
      }
      return { found: true, message: null, results };
    }),
});
