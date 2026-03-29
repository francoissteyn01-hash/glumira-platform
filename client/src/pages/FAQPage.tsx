/**
 * GluMira™ V7 — client/src/pages/FAQPage.tsx
 */

import { useState } from "react";
import { FAQ_ITEMS } from "../lib/constants";

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Can't find an answer? Ask Mira AI or contact support.
          </p>
        </div>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full text-left px-5 py-4 flex items-center justify-between"
              >
                <span className="font-medium text-gray-900 dark:text-white text-sm">{item.q}</span>
                <span className="text-gray-400 ml-4 flex-shrink-0">
                  {openIdx === idx ? "−" : "+"}
                </span>
              </button>
              {openIdx === idx && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
