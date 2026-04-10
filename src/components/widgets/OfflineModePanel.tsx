/**
 * GluMira™ V7 — Offline Mode Panel
 *
 * Displays real, browser-API-derived offline status:
 *   - Online/offline state (navigator.onLine + online/offline events)
 *   - LocalStorage usage (rough cap of 5MB per browser convention)
 *   - Cache API status (whether any service worker caches exist)
 *
 * No service worker is currently registered in this codebase, so the
 * Cache API row will report "Not configured" — this is the truthful
 * state, not a stub.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useEffect, useState } from "react";

type OfflineState = {
  online: boolean;
  storageUsedKB: number;
  storageLimitKB: number;
  cacheCount: number | null;
}

const STORAGE_LIMIT_KB = 5120; // ~5 MB browser default

function readStorageUsage(): number {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key) ?? "";
      total += key.length + val.length;
    }
    return Math.round(total / 1024);
  } catch {
    return 0;
  }
}

async function readCacheCount(): Promise<number | null> {
  if (typeof caches === "undefined") return null;
  try {
    const keys = await caches.keys();
    return keys.length;
  } catch {
    return null;
  }
}

export default function OfflineModePanel() {
  const [state, setState] = useState<OfflineState>({
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    storageUsedKB: 0,
    storageLimitKB: STORAGE_LIMIT_KB,
    cacheCount: null,
  });

  useEffect(() => {
    const refresh = async () => {
      setState({
        online: navigator.onLine,
        storageUsedKB: readStorageUsage(),
        storageLimitKB: STORAGE_LIMIT_KB,
        cacheCount: await readCacheCount(),
      });
    };
    refresh();

    const onOnline  = () => setState((s) => ({ ...s, online: true }));
    const onOffline = () => setState((s) => ({ ...s, online: false }));
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);

    const interval = window.setInterval(() => {
      setState((s) => ({ ...s, storageUsedKB: readStorageUsage() }));
    }, 5_000);

    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(interval);
    };
  }, []);

  const usagePct = Math.min(100, Math.round((state.storageUsedKB / state.storageLimitKB) * 100));
  const usageColour = usagePct > 80 ? "#ef4444" : usagePct > 50 ? "#f59e0b" : "#22c55e";

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
          Offline Mode
        </h3>
        <span style={{
          padding: "3px 10px",
          borderRadius: 999,
          fontSize: 11, fontWeight: 700,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          textTransform: "uppercase", letterSpacing: 0.4,
          background: state.online ? "#22c55e1A" : "#94a3b81A",
          color:      state.online ? "#22c55e"   : "#94a3b8",
        }}>
          {state.online ? "Online" : "Offline"}
        </span>
      </div>

      {/* Storage usage bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: 11, color: "var(--text-secondary)",
          fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: 4,
        }}>
          <span>Local storage</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {state.storageUsedKB} / {state.storageLimitKB} KB
          </span>
        </div>
        <div style={{
          height: 6, borderRadius: 3,
          background: "var(--card-hover, #f1f5f9)",
          overflow: "hidden",
        }}>
          <div style={{
            width: `${usagePct}%`, height: "100%",
            background: usageColour, transition: "width 200ms",
          }} />
        </div>
      </div>

      {/* Cache API row */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 12, color: "var(--text-secondary)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        paddingTop: 12,
        borderTop: "1px solid var(--border-divider, var(--border-light))",
      }}>
        <span>Service worker cache</span>
        <span style={{ color: state.cacheCount && state.cacheCount > 0 ? "#22c55e" : "var(--text-faint)" }}>
          {state.cacheCount === null
            ? "API unavailable"
            : state.cacheCount === 0
              ? "Not configured"
              : `${state.cacheCount} cache${state.cacheCount === 1 ? "" : "s"}`}
        </span>
      </div>

      <p style={{
        margin: "10px 0 0", fontSize: 10, color: "var(--text-faint)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        Status from your browser. Educational only.
      </p>
    </div>
  );
}
