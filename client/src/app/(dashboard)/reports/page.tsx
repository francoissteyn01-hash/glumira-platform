/**
 * GluMira — Reports Dashboard Page
 *
 * Central hub for generating and downloading glucose reports,
 * progress reports, and data exports.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState } from "react";
import { useGlucoseExport } from "@/hooks/useGlucoseExport";
import { useGlucoseReport } from "@/hooks/useGlucoseReport";

type ReportType = "glucose-export" | "progress-report" | "glucose-report";

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("glucose-export");
  const [days, setDays] = useState(14);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [unit, setUnit] = useState<"mmol" | "mgdl">("mmol");
  const { download, loading: exportLoading } = useGlucoseExport();
  const { generate, loading: reportLoading } = useGlucoseReport();

  const reports: { id: ReportType; label: string; description: string }[] = [
    { id: "glucose-export", label: "Glucose Export", description: "Download raw glucose data as CSV or JSON" },
    { id: "progress-report", label: "Progress Report", description: "Generate a clinical progress summary" },
    { id: "glucose-report", label: "Glucose Report", description: "Generate a comprehensive glucose analysis report" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      <p className="text-gray-600">Generate and download reports for your diabetes care team.</p>

      {/* Report type selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveReport(r.id)}
            className={`text-left rounded-lg border p-4 transition ${
              activeReport === r.id
                ? "border-teal-600 bg-teal-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <p className="font-medium text-gray-900">{r.label}</p>
            <p className="text-sm text-gray-500 mt-1">{r.description}</p>
          </button>
        ))}
      </div>

      {/* Report configuration */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Configure Report</h2>

        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          {activeReport === "glucose-export" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as "csv" | "json")}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as "mmol" | "mgdl")}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="mmol">mmol/L</option>
                  <option value="mgdl">mg/dL</option>
                </select>
              </div>
            </>
          )}

          <button
            onClick={() => {
              if (activeReport === "glucose-export") {
                download({ days, format, unit });
              } else {
                generate({ days });
              }
            }}
            disabled={exportLoading || reportLoading}
            className="bg-teal-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {exportLoading || reportLoading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
      </p>
    </div>
  );
}
