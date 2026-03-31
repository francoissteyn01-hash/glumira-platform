/**
 * GluMira™ — ExportButton.tsx
 *
 * Reusable export button with format/unit selector dropdown.
 * Uses useGlucoseExport hook to trigger browser download.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useGlucoseExport } from "@/hooks/useGlucoseExport";
import type { ExportFormat, ExportUnit } from "@/server/analytics/glucose-export";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExportButtonProps {
  days?: number;
  startDate?: string;
  endDate?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExportButton({
  days = 14,
  startDate,
  endDate,
  className = "",
}: ExportButtonProps) {
  const { exporting, error, triggerExport } = useGlucoseExport();
  const [open, setOpen]     = useState(false);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [unit, setUnit]     = useState<ExportUnit>("mmol");
  const dropdownRef         = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleExport() {
    setOpen(false);
    await triggerExport({ format, unit, days, startDate, endDate });
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Main button */}
      <div className="flex rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {exporting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border border-teal-500 border-t-transparent" />
              Exporting…
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </>
          )}
        </button>
        {/* Chevron toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          disabled={exporting}
          className="border-l border-slate-200 bg-white px-2 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          aria-label="Export options"
        >
          <svg className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          {/* Format */}
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Format</p>
          <div className="mb-3 flex gap-2">
            {(["csv", "json"] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 rounded-lg border py-1 text-xs font-medium transition-colors ${
                  format === f
                    ? "border-teal-400 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Unit */}
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Unit</p>
          <div className="mb-3 flex gap-2">
            {(["mmol", "mgdl"] as ExportUnit[]).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`flex-1 rounded-lg border py-1 text-xs font-medium transition-colors ${
                  unit === u
                    ? "border-teal-400 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {u === "mmol" ? "mmol/L" : "mg/dL"}
              </button>
            ))}
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="w-full rounded-lg bg-teal-500 py-1.5 text-xs font-semibold text-white hover:bg-teal-600 transition-colors"
          >
            Download {format.toUpperCase()}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

export default ExportButton;
