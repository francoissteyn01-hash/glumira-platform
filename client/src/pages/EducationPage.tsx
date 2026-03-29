/**
 * GluMira™ V7 — client/src/pages/EducationPage.tsx
 */

import { useState } from "react";
import { EDUCATION_MODULES, DISCLAIMER } from "../lib/constants";

export default function EducationPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Education Centre</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Learn at your own pace. Completing modules earns you badges.
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3">
          <p className="text-xs text-amber-800 dark:text-amber-300">{DISCLAIMER}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EDUCATION_MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveId(activeId === mod.id ? null : mod.id)}
              className="text-left rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900 dark:text-white">{mod.title}</p>
                <span className="text-xs text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-0.5">
                  {activeId === mod.id ? "Close" : "Open"}
                </span>
              </div>
              {activeId === mod.id && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Module content for <strong>{mod.title}</strong> will load here from the CMS or static MDX files.
                  Complete this module to unlock the associated badge.
                </p>
              )}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
