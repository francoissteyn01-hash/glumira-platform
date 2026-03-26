/**
 * GluMira — Meal Log Dashboard Page
 *
 * Displays meal history with carb totals, glycaemic load, and
 * allows adding new meal entries.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

"use client";

import { useState } from "react";
import { useMealLog } from "@/hooks/useMealLog";
import { MealLogForm } from "@/components/MealLogForm";

export default function MealLogPage() {
  const { meals, loading, error, addMeal, deleteMeal } = useMealLog();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meal Log</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-teal-700"
        >
          {showForm ? "Cancel" : "+ Add Meal"}
        </button>
      </div>

      {showForm && (
        <MealLogForm
          onSubmit={async (meal) => {
            await addMeal(meal);
            setShowForm(false);
          }}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading meals...</div>
      ) : meals.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border p-8 text-center text-gray-500">
          No meals logged yet. Tap &quot;+ Add Meal&quot; to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map((meal, i) => (
            <div key={i} className="bg-white rounded-lg border p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{meal.description || "Meal"}</p>
                <p className="text-sm text-gray-500">
                  {meal.carbs}g carbs &middot; GI {meal.gi ?? "—"} &middot;{" "}
                  {new Date(meal.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => deleteMeal(i)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        GluMira is an informational tool only. Not a medical device.
      </p>
    </div>
  );
}
