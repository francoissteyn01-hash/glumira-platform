"use client";

/**
 * GluMira™ School Care Plan Page
 * Version: 7.0.0
 * Route: /school-care-plan
 *
 * Allows parents / clinicians to generate a printable School Care Plan
 * for a child with Type 1 diabetes.
 *
 * Flow:
 *  1. Select patient
 *  2. Fill in school-specific fields (school name, nurse contact, etc.)
 *  3. Click Generate
 *  4. Preview HTML output in iframe
 *  5. Print via browser (Ctrl+P / Cmd+P)
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import React, { useState } from "react";
import { SchoolCarePlanForm } from "../../../components/SchoolCarePlanForm";

// ─── Types ────────────────────────────────────────────────────

interface GeneratedPlan {
  html: string;
  patientName: string;
  generatedAt: string;
}

// ─── Page Component ───────────────────────────────────────────

export default function SchoolCarePlanPage() {
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (formData: {
    patientId: string;
    schoolName: string;
    teacherName: string;
    nurseContact: string;
    emergencyContact1: string;
    emergencyContact2: string;
    includeRegimeTable: boolean;
    includeHypoProtocol: boolean;
    includeTeacherGuide: boolean;
  }) => {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/school-care-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate plan");
      }

      const data = await res.json();
      setGeneratedPlan({
        html: data.html,
        patientName: data.patientName,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!generatedPlan) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the School Care Plan.");
      return;
    }

    printWindow.document.write(generatedPlan.html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownloadHtml = () => {
    if (!generatedPlan) return;

    const blob = new Blob([generatedPlan.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GluMira-SchoolCarePlan-${generatedPlan.patientName.replace(/\s+/g, "-")}-${
      new Date().toISOString().split("T")[0]
    }.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-glumira-bg p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">School Care Plan</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Generate a printable diabetes management plan for school staff
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <div className="glum-card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Plan Details</h2>
            <SchoolCarePlanForm
              onGenerate={handleGenerate}
              generating={generating}
            />
          </div>

          {error && (
            <div className="glum-alert-error">
              <p className="text-sm font-medium">Generation failed</p>
              <p className="text-sm mt-0.5">{error}</p>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          {generatedPlan ? (
            <>
              {/* Action bar */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Plan for {generatedPlan.patientName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Generated {new Date(generatedPlan.generatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadHtml}
                    className="glum-btn-secondary text-sm"
                  >
                    Download HTML
                  </button>
                  <button
                    onClick={handlePrint}
                    className="glum-btn-primary text-sm"
                  >
                    Print / Save PDF
                  </button>
                </div>
              </div>

              {/* Preview iframe */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-100 px-3 py-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-500 ml-2">School Care Plan Preview</span>
                </div>
                <iframe
                  srcDoc={generatedPlan.html}
                  title="School Care Plan Preview"
                  className="w-full h-[600px] bg-white"
                  sandbox="allow-same-origin"
                />
              </div>

              {/* Print tip */}
              <div className="glum-alert-info text-sm">
                <strong>To save as PDF:</strong> Click &quot;Print / Save PDF&quot; then choose
                &quot;Save as PDF&quot; in your browser&apos;s print dialog.
              </div>
            </>
          ) : (
            <div className="glum-card flex flex-col items-center justify-center h-[400px] text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                No plan generated yet
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Fill in the form on the left and click &quot;Generate Plan&quot; to create
                a printable School Care Plan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center pb-4">
        GluMira™ is an informational tool only. Not a medical device.
        School Care Plans should be reviewed and approved by your diabetes care team before distribution.
      </p>
    </div>
  );
}
