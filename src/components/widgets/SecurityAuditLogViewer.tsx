/**
 * GluMira™ V7 — Security Audit Log Viewer
 *
 * Paginated table of audit_log rows for the current user, sourced from
 * GET /api/compliance/audit-log. Read-only.
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

function formatRelative(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function SecurityAuditLogViewer() {
  const { session } = useAuth();
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);

  const fetchLog = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/compliance/audit-log?limit=${limit}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = (await res.json()) as AuditLogResponse;
      setData(json);
      setError(null);
    } catch (e) {
      setError((e as Error)?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }, [session, limit]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  return (
    <div style={{
      background: "var(--bg-card)",
      borderRadius: 12,
      border: "1px solid var(--border-light)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--border-divider)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <h3 style={{
          margin: 0, fontSize: 16, fontWeight: 700,
          color: "var(--text-primary)", fontFamily: "'Playfair Display', serif",
        }}>
          Security Audit Log
        </h3>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          aria-label="Limit"
          style={{
            minHeight: 32, padding: "4px 10px", borderRadius: 6,
            border: "1px solid var(--border-light)",
            background: "var(--bg-card)", color: "var(--text-primary)",
            fontSize: 12, fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="200">200</option>
        </select>
      </div>

      {loading && !data && (
        <p style={{ padding: 20, margin: 0, fontSize: 12, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Loading…
        </p>
      )}

      {error && (
        <p role="alert" style={{ padding: 20, margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Unable to load audit log.
        </p>
      )}

      {data && data.entries.length === 0 && !loading && (
        <p style={{ padding: 20, margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          No audit events recorded yet.
        </p>
      )}

      {data && data.entries.length > 0 && (
        <div role="table" aria-label="Security audit log" style={{ maxHeight: 400, overflowY: "auto" }}>
          <div role="row" style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1.2fr",
            gap: 12,
            padding: "8px 20px",
            background: "var(--card-hover, #f8fafc)",
            fontSize: 10, fontWeight: 700,
            color: "var(--text-faint)",
            textTransform: "uppercase", letterSpacing: 0.5,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            borderBottom: "1px solid var(--border-divider)",
          }}>
            <span role="columnheader">Action</span>
            <span role="columnheader">Resource</span>
            <span role="columnheader">When</span>
          </div>
          {data.entries.map((entry) => (
            <div role="row" key={entry.id} style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1.2fr",
              gap: 12,
              padding: "8px 20px",
              borderBottom: "1px solid var(--card-hover, #f1f5f9)",
              fontSize: 12,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              alignItems: "center",
            }}>
              <span role="cell" style={{ color: "var(--text-primary)", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                {entry.action}
              </span>
              <span role="cell" style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                {entry.resource_type ?? "—"}
              </span>
              <span role="cell" title={new Date(entry.created_at).toLocaleString()} style={{ color: "var(--text-faint)", fontSize: 11 }}>
                {formatRelative(entry.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}

      {data && (
        <div style={{
          padding: "8px 20px",
          borderTop: "1px solid var(--border-divider)",
          fontSize: 10, color: "var(--text-faint)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          textAlign: "right",
        }}>
          {data.total} entries · educational only
        </div>
      )}
    </div>
  );
}
