/**
 * GluMira™ V7 — Export Report Button
 * Triggers server-side PDF generation and downloads the file.
 */

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";

interface Props {
  date?: string; // YYYY-MM-DD, defaults to today
}

export default function ExportReportButton({ date }: Props) {
  const { session } = useAuth();
  const [downloading, setDownloading] = useState(false);

  async function download() {
    if (!session) return;
    setDownloading(true);
    try {
      const reportDate = date || new Date().toISOString().slice(0, 10);
      const res = await fetch(`${API}/api/report?date=${reportDate}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Download failed" }));
        throw new Error(err.error ?? "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GluMira-Report-${reportDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error("[export]", e.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={downloading}
      style={{
        minHeight: 44,
        padding: "0 24px",
        borderRadius: 8,
        border: "none",
        background: downloading ? "var(--text-faint)" : "var(--accent-teal)",
        color: "#ffffff",
        fontSize: 13,
        fontWeight: 700,
        cursor: downloading ? "not-allowed" : "pointer",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: "background 0.2s",
      }}
    >
      {downloading ? "Generating\u2026" : "Export Report"}
    </button>
  );
}
