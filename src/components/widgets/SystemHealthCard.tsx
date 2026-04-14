/**
 * GluMira™ V7 — System Health Card
 *
 * Polls /api/compliance/system-health every 30s and displays live server +
 * database snapshot. Real metrics (process.uptime, heap usage, DB ping
 * latency) — no mocks.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";

type HealthResponse = {
  ok: boolean;
  server: {
    version: string;
    startedAt: string;
    uptimeSec: number;
    memoryHeapMB: number;
    nodeVersion: string;
  };
  database: {
    state: "ok" | "error";
    latencyMs: number;
    error: string | null;
  };
  computedAt: string;
}

function formatUptime(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  return `${Math.floor(sec / 86400)}d ${Math.floor((sec % 86400) / 3600)}h`;
}

export default function SystemHealthCard() {
  const { session } = useAuth();
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const probe = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API}/api/compliance/system-health`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = (await res.json()) as HealthResponse;
      setData(json);
      setError(null);
    } catch (e) {
      setError((e as Error)?.message ?? "Failed");
    }
  }, [session]);

  useEffect(() => {
    probe();
    const interval = window.setInterval(probe, 30_000);
    return () => window.clearInterval(interval);
  }, [probe]);

  const dbColour =
    !data ? "#94a3b8" :
    data.database.state === "ok"
      ? data.database.latencyMs > 500 ? "#f59e0b" : "#22c55e"
      : "#ef4444";

  const memColour =
    !data ? "#94a3b8" :
    data.server.memoryHeapMB > 400 ? "#f59e0b"
      : data.server.memoryHeapMB > 700 ? "#ef4444"
      : "#22c55e";

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
          System Health
        </h3>
        <span style={{
          fontSize: 10, fontWeight: 600, color: "var(--text-faint)",
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
        }}>
          POLL 30s
        </span>
      </div>

      {error && !data && (
        <p role="alert" style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Unable to reach health endpoint.
        </p>
      )}

      {!data && !error && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Loading…
        </p>
      )}

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Metric label="Version"  value={data.server.version} />
          <Metric label="Uptime"   value={formatUptime(data.server.uptimeSec)} />
          <Metric label="Heap"     value={`${data.server.memoryHeapMB} MB`}      colour={memColour} />
          <Metric label="DB ping"  value={data.database.state === "ok" ? `${data.database.latencyMs}ms` : "error"} colour={dbColour} />
          <Metric label="Node"     value={data.server.nodeVersion} />
          <Metric label="DB state" value={data.database.state}            colour={dbColour} />
        </div>
      )}

      <p style={{
        margin: "10px 0 0", fontSize: 10, color: "var(--text-faint)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        Live process metrics · educational only
      </p>
    </div>
  );
}

function Metric({ label, value, colour }: { label: string; value: string; colour?: string }) {
  return (
    <div>
      <p style={{
        margin: 0, fontSize: 10, fontWeight: 600,
        color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.4,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {label}
      </p>
      <p style={{
        margin: "2px 0 0", fontSize: 14, fontWeight: 700,
        color: colour ?? "var(--text-primary)",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {value}
      </p>
    </div>
  );
}
