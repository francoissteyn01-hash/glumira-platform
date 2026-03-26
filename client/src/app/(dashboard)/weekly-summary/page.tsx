/**
 * GluMira™ — Weekly Summary Dashboard Page
 *
 * Displays the 7-day glucose and dose summary with score, trend delta,
 * and pattern highlights.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useEffect } from "react";
import { useWeeklySummary } from "@/hooks/useWeeklySummary";
import { WeeklySummaryCard } from "@/components/WeeklySummaryCard";

export default function WeeklySummaryPage() {
  const { summary, loading, error, fetch: fetchSummary } = useWeeklySummary();

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Weekly Summary</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Your 7-day glucose and insulin overview
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-40 bg-gray-100 rounded-xl" />
          <div className="h-24 bg-gray-100 rounded-xl" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : summary ? (
        <WeeklySummaryCard summary={summary} />
      ) : (
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-8 text-center">
          <p className="text-gray-500 font-medium">No weekly data available</p>
          <p className="text-sm text-gray-400 mt-1">
            Log glucose readings for 7 days to see your weekly summary.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-300 text-center">
        GluMira™ is an informational tool only. Not a medical device.
      </p>
    </div>
  );
}
