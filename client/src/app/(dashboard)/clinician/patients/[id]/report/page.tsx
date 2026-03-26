"use client";
/**
 * GluMira™ Patient Report Preview Page
 * Version: 7.0.0
 *
 * Route: /clinician/patients/[id]/report
 *
 * Fetches the HTML preview of the patient report from /api/reports/patient
 * and renders it in an iframe. Provides a download PDF button.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase client (client-side) ───────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Component ────────────────────────────────────────────────

export default function PatientReportPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id as string;

  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>("Patient");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [periodDays, setPeriodDays] = useState(14);

  // ── Fetch patient name ─────────────────────────────────────

  useEffect(() => {
    if (!patientId) return;
    const supabase = getSupabase();
    supabase
      .from("patient_profiles")
      .select("display_name")
      .eq("user_id", patientId)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setPatientName(data.display_name as string);
      });
  }, [patientId]);

  // ── Fetch HTML preview ─────────────────────────────────────

  async function fetchPreview(days: number) {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const res = await fetch("/api/reports/patient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patientId, periodDays: days, format: "html" }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const html = await res.text();
      setHtmlContent(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (patientId) fetchPreview(periodDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, periodDays]);

  // ── Download PDF ───────────────────────────────────────────

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      const res = await fetch("/api/reports/patient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patientId, periodDays, format: "pdf" }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GluMira-Report-${patientName}-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDF download failed.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1 transition"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-slate-900">
            Patient Report — {patientName}
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Period selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Period:</label>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchPreview(periodDays)}
            disabled={loading}
            className="border border-slate-300 text-slate-600 hover:bg-slate-100 text-sm px-4 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Loading…" : "↻ Refresh"}
          </button>

          {/* Download PDF */}
          <button
            data-testid="download-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || loading}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-1.5 rounded-lg transition"
          >
            {downloadingPdf ? "Generating…" : "⬇ Download PDF"}
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800">
        <strong>GluMira™ is an informational tool only.</strong> This report is not a medical
        document and must not be used as the sole basis for clinical decisions. Always apply
        clinical judgement and consult the treating physician.
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-96 text-slate-400 text-sm">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Generating report…</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center h-96 text-red-600 text-sm">
            <div className="text-center space-y-2">
              <p className="text-2xl">⚠️</p>
              <p>{error}</p>
              <button
                onClick={() => fetchPreview(periodDays)}
                className="text-teal-600 hover:underline text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && htmlContent && (
          <iframe
            data-testid="report-iframe"
            srcDoc={htmlContent}
            title={`Patient Report — ${patientName}`}
            className="w-full"
            style={{ height: "calc(100vh - 220px)", border: "none" }}
            sandbox="allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}
