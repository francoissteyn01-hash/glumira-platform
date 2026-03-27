/**
 * GluMira — Meal Timing Dashboard Page
 *
 * Displays meal timing analysis with post-meal excursion patterns,
 * pre-bolus timing recommendations, and late-night eating detection.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useEffect } from "react";
import { useMealTiming } from "@/hooks/useMealTiming";
import { MealTimingInsights } from "@/components/MealTimingInsights";

export default function MealTimingPage() {
  const { data, loading, error, analyse } = useMealTiming();

  useEffect(() => {
    analyse([]);
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Analysing meal timing patterns...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Meal Timing Analysis</h1>
      <p className="text-gray-600">
        Understand how meal timing affects your glucose levels, with pre-bolus and late-night eating insights.
      </p>

      {data && <MealTimingInsights data={data} />}

      <p className="text-xs text-gray-400">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
      </p>
    </div>
  );
}
