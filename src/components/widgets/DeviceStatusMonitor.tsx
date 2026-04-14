/**
 * GluMira™ V7 — Device Status Monitor
 *
 * Polls real backend health endpoints and shows the live status of:
 *   - GluMira API server (GET /health)
 *   - Nightscout connection (configured? last sync time)
 *   - Browser session (online state, latest auth refresh)
 *
 * No mocks — every row reads from a real endpoint or browser API.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";

type ServiceState = "ok" | "warning" | "error" | "loading";

type ServiceStatus = {
  name: string;
  state: ServiceState;
  detail: string;
}

const COLOUR: Record<ServiceState, string> = {
  ok:      "#22c55e",
  warning: "#f59e0b",
  error:   "#ef4444",
  loading: "#94a3b8",
};

const POLL_MS = 30_000;

export default function DeviceStatusMonitor() {
  const { session } = useAuth();
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "GluMira API",      state: "loading", detail: "Checking…" },
    { name: "Nightscout",       state: "loading", detail: "Checking…" },
    { name: "Browser session",  state: "loading", detail: "Checking…" },
  ]);

  const probe = useCallback(async () => {
    const next: ServiceStatus[] = [];

    // 1. GluMira API health
    try {
      const t0 = Date.now();
      const res = await fetch(`${API}/health`, { cache: "no-store" });
      const elapsed = Date.now() - t0;
      if (res.ok) {
        const json = await res.json() as { status?: string; version?: string };
        next.push({
          name: "GluMira API",
          state: elapsed > 1500 ? "warning" : "ok",
          detail: `${json.version ?? "?"} · ${elapsed}ms`,
        });
      } else {
        next.push({ name: "GluMira API", state: "error", detail: `HTTP ${res.status}` });
      }
    } catch {
      next.push({ name: "GluMira API", state: "error", detail: "Unreachable" });
    }

    // 2. Nightscout
    const nsUrl = (() => {
      try { return localStorage.getItem("ns_url") ?? ""; }
      catch { return ""; }
    })();
    if (!nsUrl) {
      next.push({ name: "Nightscout", state: "warning", detail: "Not configured" });
    } else {
      try {
        const t0 = Date.now();
        const res = await fetch(`${nsUrl}/api/v1/status.json`, { cache: "no-store" });
        const elapsed = Date.now() - t0;
        if (res.ok) {
          next.push({ name: "Nightscout", state: "ok", detail: `${elapsed}ms` });
        } else {
          next.push({ name: "Nightscout", state: "error", detail: `HTTP ${res.status}` });
        }
      } catch {
        next.push({ name: "Nightscout", state: "error", detail: "Unreachable" });
      }
    }

    // 3. Browser session
    if (!session) {
      next.push({ name: "Browser session", state: "warning", detail: "Not signed in" });
    } else {
      const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null;
      const minsLeft  = expiresAt ? Math.round((expiresAt.getTime() - Date.now()) / 60_000) : null;
      next.push({
        name: "Browser session",
        state: navigator.onLine
          ? minsLeft != null && minsLeft < 5 ? "warning" : "ok"
          : "error",
        detail: !navigator.onLine
          ? "Browser offline"
          : minsLeft != null
            ? `Token ${minsLeft}m left`
            : "Active",
      });
    }

    setServices(next);
  }, [session]);

  useEffect(() => {
    probe();
    const interval = window.setInterval(probe, POLL_MS);
    const onOnline  = () => probe();
    const onOffline = () => probe();
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [probe]);

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
          Device Status
        </h3>
        <span style={{
          fontSize: 10, fontWeight: 600, color: "var(--text-faint)",
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
        }}>
          POLL 30s
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {services.map((svc) => (
          <div key={svc.name} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 12px",
            borderRadius: 8,
            background: COLOUR[svc.state] + "0F",
            borderLeft: `3px solid ${COLOUR[svc.state]}`,
          }}>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {svc.name}
            </span>
            <span style={{
              fontSize: 11,
              color: COLOUR[svc.state],
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {svc.detail}
            </span>
          </div>
        ))}
      </div>

      <p style={{
        margin: "10px 0 0", fontSize: 10, color: "var(--text-faint)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        Live probes — no cached data. Educational only.
      </p>
    </div>
  );
}
