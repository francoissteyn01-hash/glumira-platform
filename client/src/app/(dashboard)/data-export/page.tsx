"use client";

import { useState } from "react";
import { useDataExport } from "@/hooks/useDataExport";

export default function DataExportPage() {
  const { result, loading, error, exportData, download } = useDataExport();
  const [format, setFormat] = useState("csv");

  const handleExport = () => {
    exportData(
      {
        patientName: "Demo Patient",
        dateOfBirth: "1990-06-15",
        diabetesType: "type1",
        readings: [
          { timestampUtc: "2026-03-15T06:00:00Z", glucoseMmol: 6.5, glucoseMgdl: 117, source: "cgm" },
          { timestampUtc: "2026-03-15T08:00:00Z", glucoseMmol: 9.2, glucoseMgdl: 166, source: "cgm", mealTag: "post-meal" },
          { timestampUtc: "2026-03-15T12:00:00Z", glucoseMmol: 7.0, glucoseMgdl: 126, source: "cgm" },
          { timestampUtc: "2026-03-15T18:00:00Z", glucoseMmol: 5.5, glucoseMgdl: 99, source: "fingerstick" },
        ],
        doses: [
          { timestampUtc: "2026-03-15T07:00:00Z", units: 6, type: "bolus", insulinName: "Novorapid" },
          { timestampUtc: "2026-03-15T22:00:00Z", units: 22, type: "basal", insulinName: "Lantus" },
        ],
        meals: [
          { timestampUtc: "2026-03-15T07:00:00Z", carbsGrams: 45, description: "Oats with berries" },
          { timestampUtc: "2026-03-15T12:30:00Z", carbsGrams: 60, description: "Chicken wrap" },
        ],
        targetLowMmol: 4.0,
        targetHighMmol: 10.0,
      },
      format
    );
  };

  const formatInfo: Record<string, { label: string; desc: string }> = {
    csv: { label: "CSV", desc: "Universal spreadsheet format — works with Excel, Google Sheets" },
    json: { label: "JSON", desc: "Structured data format — ideal for developers and integrations" },
    agp: { label: "AGP", desc: "Ambulatory Glucose Profile — standard diabetes report format" },
    fhir: { label: "FHIR", desc: "HL7 FHIR R4 — healthcare interoperability standard" },
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Data Export</h1>
      <p className="text-gray-600">Export your glucose, insulin, and meal data in multiple formats.</p>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(formatInfo).map(([key, info]) => (
          <button key={key} onClick={() => setFormat(key)}
            className={`p-4 rounded-lg border-2 text-left transition ${
              format === key ? "border-teal-600 bg-teal-50" : "border-gray-200 hover:border-gray-300"
            }`}>
            <p className="font-bold">{info.label}</p>
            <p className="text-xs text-gray-600 mt-1">{info.desc}</p>
          </button>
        ))}
      </div>

      <button onClick={handleExport} disabled={loading}
        className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
        {loading ? "Exporting..." : `Export as ${formatInfo[format].label}`}
      </button>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-green-800">{result.filename}</p>
                <p className="text-sm text-green-600">{result.recordCount} records exported</p>
              </div>
              <button onClick={download}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                Download
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Preview</h3>
            <pre className="text-xs text-gray-600 overflow-x-auto max-h-64 whitespace-pre-wrap">
              {result.content.slice(0, 1000)}
              {result.content.length > 1000 && "\n... (truncated)"}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
