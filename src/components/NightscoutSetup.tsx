/**
 * GluMira™ V7 — Nightscout Setup Card
 * URL, API secret, test connection, enable sync toggle, status indicator.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";

const inputStyle: React.CSSProperties = {
  width: "100%", minHeight: 44, padding: "10px 14px", borderRadius: 8,
  border: "1px solid #dee2e6", background: "#ffffff", color: "#1a2a5e",
  fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif",
  outline: "none", boxSizing: "border-box",
};

export default function NightscoutSetup() {
  const { session } = useAuth();
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [status, setStatus] = useState<"idle" | "testing" | "connected" | "error">("idle");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`${API}/api/profile`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setUrl(d.profile.nightscout_url ?? "");
          setSecret(d.profile.nightscout_api_secret ?? "");
          setSyncEnabled(d.profile.nightscout_sync_enabled ?? false);
          if (d.profile.nightscout_url) setStatus("connected");
        }
      })
      .catch(() => {});
  }, [session]);

  async function testConnection() {
    if (!url) return;
    setStatus("testing");
    try {
      const res = await fetch(`${API}/api/nightscout/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session!.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, apiSecret: secret, days: 0 }),
      });
      setStatus(res.ok ? "connected" : "error");
    } catch {
      setStatus("error");
    }
  }

  async function save() {
    if (!session) return;
    setSaving(true);
    await fetch(`${API}/api/profile`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ nightscout_url: url, nightscout_api_secret: secret, nightscout_sync_enabled: syncEnabled }),
    }).catch(() => {});
    setSaving(false);
  }

  const statusColour = status === "connected" ? "#22c55e" : status === "error" ? "#ef4444" : status === "testing" ? "#eab308" : "#94a3b8";
  const statusLabel = status === "connected" ? "Connected" : status === "error" ? "Error" : status === "testing" ? "Testing\u2026" : "Not configured";

  return (
    <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a2a5e", fontFamily: "'Playfair Display', serif" }}>
          Nightscout Integration
        </h3>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: statusColour, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColour, display: "inline-block" }} />
          {statusLabel}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yoursite.herokuapp.com" style={inputStyle} />
        <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="API Secret (optional)" style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={testConnection} disabled={!url || status === "testing"} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #dee2e6", background: "#f8f9fa", color: "#1a2a5e", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Test Connection
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1a2a5e", cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          <input type="checkbox" checked={syncEnabled} onChange={(e) => setSyncEnabled(e.target.checked)} style={{ accentColor: "#2ab5c1", width: 18, height: 18 }} />
          Enable Sync
        </label>
        <button type="button" onClick={save} disabled={saving} style={{ marginLeft: "auto", padding: "8px 18px", borderRadius: 8, border: "none", background: "#2ab5c1", color: "#ffffff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {saving ? "Saving\u2026" : "Save"}
        </button>
      </div>
    </div>
  );
}
