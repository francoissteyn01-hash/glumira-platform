/**
 * GluMira™ V7 — Sync Queue Viewer
 *
 * Reads recent Nightscout sync events from the audit_log via the existing
 * /api/notifications endpoint, which already returns audit_log rows for the
 * authenticated user. Filters for `nightscout_sync` action rows and renders
 * them as a compact timeline showing readings added per sync.
 *
 * No new server endpoint needed — reuses notifications router.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";

type AuditNotification = {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

type NotificationsResponse = {
  notifications: AuditNotification[];
  total: number;
  userId: string;
}

type SyncEntry = {
  id: string;
  at: string;
  readingsAdded: number;
}

function formatRelative(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function SyncQueueViewer() {
  const { session } = useAuth();
  const [entries, setEntries] = useState<SyncEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API}/api/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = (await res.json()) as NotificationsResponse;
      const syncEntries: SyncEntry[] = json.notifications
        .filter((n) => n.action === "nightscout_sync")
        .slice(0, 20)
        .map((n) => ({
          id: n.id,
          at: n.createdAt,
          readingsAdded:
            typeof n.metadata?.readingsAdded === "number"
              ? (n.metadata.readingsAdded as number)
              : 0,
        }));
      setEntries(syncEntries);
      setError(null);
    } catch (e) {
      setError((e as Error)?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchEntries();
    const interval = window.setInterval(fetchEntries, 60_000);
    return () => window.clearInterval(interval);
  }, [fetchEntries]);

  const totalReadings = entries.reduce((s, e) => s + e.readingsAdded, 0);
  const successCount  = entries.filter((e) => e.readingsAdded > 0).length;

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
          Sync Queue
        </h3>
        <span style={{
          fontSize: 10, fontWeight: 600, color: "var(--text-faint)",
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
        }}>
          LAST 50
        </span>
      </div>

      {loading && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Loading…
        </p>
      )}

      {error && !loading && (
        <p role="alert" style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Unable to load sync history.
        </p>
      )}

      {!loading && !error && entries.length === 0 && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          No syncs recorded yet. Connect Nightscout from the dashboard to start.
        </p>
      )}

      {!loading && !error && entries.length > 0 && (
        <>
          {/* Summary metrics */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 12,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.4, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                Successful syncs
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
                {successCount}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.4, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                Readings added
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
                {totalReadings}
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
            {entries.map((e) => (
              <div key={e.id} style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 11,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                padding: "4px 0",
                borderBottom: "1px solid var(--card-hover, #f1f5f9)",
              }}>
                <span style={{ color: "var(--text-secondary)" }}>{formatRelative(e.at)}</span>
                <span style={{
                  color: e.readingsAdded > 0 ? "#22c55e" : "var(--text-faint)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                }}>
                  +{e.readingsAdded} reading{e.readingsAdded === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <p style={{
        margin: "10px 0 0", fontSize: 10, color: "var(--text-faint)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        Updates every 60s · educational only
      </p>
    </div>
  );
}
