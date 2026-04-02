import { useState } from "react";
import { EDUCATION_MODULES, DISCLAIMER } from "@/lib/constants";

export default function EducationPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Education Centre</h1>
          <p className="text-sm text-gray-300 mt-1">
            Learn at your own pace. Completing modules earns badges.
          </p>
        </div>
        <div className="rounded-lg bg-amber-950/40 border border-amber-800 px-4 py-3">
          <p className="text-xs text-amber-400">{DISCLAIMER}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EDUCATION_MODULES.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveId(activeId === mod.id ? null : mod.id)}
              className="text-left rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-brand-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{mod.title}</p>
                <span className="text-xs text-gray-300 border border-gray-700 rounded-full px-2 py-0.5">
                  {activeId === mod.id ? "Close" : "Open"}
                </span>
              </div>
              {activeId === mod.id && (
                <p className="mt-3 text-sm text-gray-300">
                  Complete this module to unlock the associated badge. Content
                  loads from the CMS.
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
