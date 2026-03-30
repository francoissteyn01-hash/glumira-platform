/**
 * GluMira™ V7 — client/src/pages/EducationPage.tsx
 */

import { useState } from "react";
import { EDUCATION_MODULES, DISCLAIMER } from "../lib/constants";

export default function EducationPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#f8f9fa]">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#1a2a5e]">Education Centre</h1>
          <p className="text-sm text-[#718096] dark:text-[#718096] mt-1">
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
              className="text-left rounded-xl border border-gray-200 dark:border-[#e2e8f0] bg-white dark:bg-white p-5 hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900 dark:text-[#1a2a5e]">{mod.title}</p>
                <span className="text-xs text-[#718096] border border-gray-200 dark:border-[#e2e8f0] rounded-full px-2 py-0.5">
                  {activeId === mod.id ? "Close" : "Open"}
                </span>
              </div>
              {activeId === mod.id && (
                <p className="mt-3 text-sm text-[#718096] dark:text-[#718096]">
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
