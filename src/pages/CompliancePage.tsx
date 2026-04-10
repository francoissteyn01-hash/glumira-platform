/**
 * GluMira™ V7 — Compliance & Performance Page
 *
 * Assembles all Stage 4.3 widgets:
 *   - Three CompliancePillarCards (HIPAA / GDPR / POPIA) from /api/compliance/status
 *   - SystemHealthCard from /api/compliance/system-health
 *   - CoreWebVitalsCard (PerformanceObserver, in-browser)
 *   - IncidentResponseCard (filters audit_log for action='incident.*')
 *   - SecurityAuditLogViewer (full audit_log table)
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";
import { DISCLAIMER } from "@/lib/constants";
import CompliancePillarCard   from "@/components/widgets/CompliancePillarCard";
import SystemHealthCard       from "@/components/widgets/SystemHealthCard";
import CoreWebVitalsCard      from "@/components/widgets/CoreWebVitalsCard";
import IncidentResponseCard   from "@/components/widgets/IncidentResponseCard";
import SecurityAuditLogViewer from "@/components/widgets/SecurityAuditLogViewer";

type Pillar = {
  items: Array<{
    id: string;
    label: string;
    state: "compliant" | "in-progress" | "not-applicable";
    source: string;
  }>;
  summary: { total: number; compliant: number; inProgress: number };
}

type ComplianceStatusResponse = {
  ok: boolean;
  hipaa: Pillar;
  gdpr: Pillar;
  popia: Pillar;
  computedAt: string;
}

export default function CompliancePage() {
  const { session } = useAuth();
  const [data, setData] = useState<ComplianceStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    fetch(`${API}/api/compliance/status`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json() as Promise<ComplianceStatusResponse>;
      })
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e: Error) => { if (!cancelled) setError(e?.message ?? "Failed"); });
    return () => { cancelled = true; };
  }, [session]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(24px, 6vw, 32px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 4px",
          }}>
            Compliance & Performance
          </h1>
          <p style={{
            fontSize: 14, color: "var(--text-secondary)", margin: 0,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            HIPAA / GDPR / POPIA controls, system health, and live performance
          </p>
        </div>

        <div style={{
          borderRadius: 8,
          background: "var(--disclaimer-bg)",
          border: "1px solid var(--disclaimer-border)",
          padding: "10px 14px",
          marginBottom: 20,
          fontSize: 12,
          color: "var(--disclaimer-text)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {DISCLAIMER}
        </div>

        {/* Compliance pillars */}
        {error && (
          <div style={{
            borderRadius: 12, padding: 20, marginBottom: 20,
            background: "var(--bg-card)", border: "1px solid var(--border-light)",
          }} role="alert">
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Unable to load compliance status.
            </p>
          </div>
        )}

        {data && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}>
            <CompliancePillarCard pillar="HIPAA" items={data.hipaa.items} summary={data.hipaa.summary} />
            <CompliancePillarCard pillar="GDPR"  items={data.gdpr.items}  summary={data.gdpr.summary} />
            <CompliancePillarCard pillar="POPIA" items={data.popia.items} summary={data.popia.summary} />
          </div>
        )}

        {/* Health + vitals + incidents */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}>
          <SystemHealthCard />
          <CoreWebVitalsCard />
          <IncidentResponseCard />
        </div>

        {/* Full audit log */}
        <div style={{ marginBottom: 20 }}>
          <SecurityAuditLogViewer />
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
