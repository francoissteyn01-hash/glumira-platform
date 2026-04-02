/**
 * GluMira™ V7 — Dose Reference History
 * Fuzzy-matches past meals to provide historical reference (not recommendation).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface DoseReference {
  meal_description: string;
  insulin_type: string;
  dose_units: number;
  carbs_g: number;
  pre_glucose: number;
  post_glucose: number;
  glucose_delta: number;
  meal_time: string;
  date: string;
  outcome_quality: "good" | "ok" | "poor";
}

function classifyOutcome(delta: number): "good" | "ok" | "poor" {
  const abs = Math.abs(delta);
  if (abs <= 2) return "good";
  if (abs <= 4) return "ok";
  return "poor";
}

/**
 * Find similar past meals by fuzzy matching on food_description.
 * Uses ILIKE patterns for server-side matching.
 */
export async function findSimilarMeals(
  supabase: SupabaseClient,
  currentDescription: string,
  currentMealType: string,
  userId: string,
  limit: number = 5
): Promise<DoseReference[]> {
  if (!currentDescription || currentDescription.length < 3) return [];

  // Build search terms from description
  const words = currentDescription
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 4);

  if (words.length === 0) return [];

  // Use the longest word for primary ILIKE search
  const primaryTerm = words.sort((a, b) => b.length - a.length)[0];

  const { data, error } = await supabase
    .from("meal_log")
    .select("food_description, insulin_type, units, carbs_g, glucose_value, meal_time, event_type")
    .eq("user_id", userId)
    .not("food_description", "is", null)
    .not("units", "is", null)
    .ilike("food_description", `%${primaryTerm}%`)
    .order("meal_time", { ascending: false })
    .limit(limit * 3); // fetch extra, filter client-side

  if (error || !data) return [];

  // Score and filter results
  const scored = data
    .map((row: any) => {
      const desc = (row.food_description ?? "").toLowerCase();
      let score = 0;
      for (const w of words) {
        if (desc.includes(w)) score++;
      }
      // Bonus for same meal type
      if (row.event_type === currentMealType) score += 0.5;
      return { ...row, score };
    })
    .filter((r: any) => r.score >= 1)
    .sort((a: any, b: any) => {
      // Sort by: score desc, then recency
      if (b.score !== a.score) return b.score - a.score;
      return b.meal_time.localeCompare(a.meal_time);
    })
    .slice(0, limit);

  return scored.map((row: any): DoseReference => {
    const preGlucose = row.glucose_value ?? 0;
    // For simplicity, use 0 for post_glucose — full implementation would look up the next reading
    const postGlucose = 0;
    const delta = postGlucose - preGlucose;
    return {
      meal_description: row.food_description ?? "",
      insulin_type: row.insulin_type ?? "",
      dose_units: Number(row.units ?? 0),
      carbs_g: Number(row.carbs_g ?? 0),
      pre_glucose: preGlucose,
      post_glucose: postGlucose,
      glucose_delta: delta,
      meal_time: row.meal_time,
      date: row.meal_time?.slice(0, 10) ?? "",
      outcome_quality: classifyOutcome(delta),
    };
  });
}
