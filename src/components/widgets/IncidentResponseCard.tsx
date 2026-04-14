/**
 * GluMira™ V7 — Incident Response Card
 *
 * Reads from the same audit_log endpoint as SecurityAuditLogViewer but
 * filters only rows with action='incident.*'. If none exist (the typical
 * green state), displays an "all clear" message.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";

type AuditEntry = {
  id: string;
  action: string;
  resource_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

type AuditLogResponse = {
  ok: boolean;
  entries: AuditEntry[];
  total: number;
}

export default function IncidentResponseCard() {
  const { session } = useAuth();
  const [incidents, setIncidents] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    if (!session) return;
    try {
      // No dedicated incident endpoint — derive from audit_log by action prefix
      const res = await fetch(`${API}/api/compliance/audit-log?limit=200`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = (await res.json()) as AuditLogResponse;
      setIncidents(json.entries.filter((e) => e.action.startsWith("incident.")));
      setError(null);
    } catch (e) {
      setError((e as Error)?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  return (
    <div style={{
      background: "var(--bg-card)",
      borderRadius: 12,
      border: "1px solid var(--border-light)",
      padding: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <h3 style={{
          margin: 0, fontSize: 16, fontWeight: 700,
          color: "var(--text-primary)", fontFamily: "'Playfair Display', serif",
        }}>
          Incident Response
        </h3>
        <span style={{
          padding: "3px 10px",
          borderRadius: 999,
          fontSize: 11, fontWeight: 700,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          textTransform: "uppercase", letterSpacing: 0.4,
          background: incidents.length === 0 ? "#22c55e1A" : "#ef44441A",
          color:      incidents.length === 0 ? "#22c55e"   : "#ef4444",
        }}>
          {incidents.length === 0 ? "All clear" : `${incidents.length} active`}
        </span>
      </div>

      {loading && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Loading…
        </p>
      )}

      {error && !loading && (
        <p role="alert" style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Unable to load incident history.
        </p>
      )}

      {!loading && !error && incidents.length === 0 && (
        <>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            No security incidents recorded.
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            The incident playbook is at <code>docs/incident-response.md</code>.
            Incidents are recorded via <code>audit_log</code> rows with
            <code>action: 'incident.*'</code>.
          </p>
        </>
      )}

      {!loading && !error && incidents.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {incidents.map((inc) => (
            <div key={inc.id} style={{
              padding: "8px 12px",
              borderLeft: "3px solid #ef4444",
              background: "#ef44440F",
              borderRadius: 8,
            }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
                {inc.action}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                {new Date(inc.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <p style={{
        margin: "10px 0 0", fontSize: 10, color: "var(--text-faint)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        Educational only
      </p>
    </div>
  );
}
