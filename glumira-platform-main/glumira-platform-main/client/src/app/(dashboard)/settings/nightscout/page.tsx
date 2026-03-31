"use client";

/**
 * GluMira™ — Nightscout Settings Page
 * /settings/nightscout
 *
 * Allows the patient to configure their Nightscout CGM integration:
 *   - Nightscout base URL
 *   - API secret (hashed before storage)
 *   - Test connection button (calls /api/nightscout/sync?test=1)
 *   - Sync interval selector
 *   - Last sync timestamp
 */

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NightscoutSettings {
  url: string;
  apiSecret: string;
  syncIntervalMinutes: number;
  lastSyncAt: string | null;
  enabled: boolean;
}

type ConnectionStatus = "idle" | "testing" | "ok" | "error";

// ─── Component ────────────────────────────────────────────────────────────────

export default function NightscoutSettingsPage() {
  const [settings, setSettings] = useState<NightscoutSettings>({
    url: "",
    apiSecret: "",
    syncIntervalMinutes: 5,
    lastSyncAt: null,
    enabled: false,
  });
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Load existing settings ─────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("patient_profiles")
        .select("nightscout_url, nightscout_enabled, nightscout_sync_interval_minutes, nightscout_last_sync_at")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSettings((prev) => ({
          ...prev,
          url: (data as any).nightscout_url ?? "",
          enabled: (data as any).nightscout_enabled ?? false,
          syncIntervalMinutes: (data as any).nightscout_sync_interval_minutes ?? 5,
          lastSyncAt: (data as any).nightscout_last_sync_at ?? null,
        }));
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── Test connection ────────────────────────────────────────────────────────
  async function testConnection() {
    if (!settings.url) {
      setStatus("error");
      setStatusMessage("Please enter your Nightscout URL first.");
      return;
    }
    setStatus("testing");
    setStatusMessage("Connecting to Nightscout…");
    try {
      const res = await fetch(
        `/api/nightscout/sync?test=1&url=${encodeURIComponent(settings.url)}`,
        { method: "GET" }
      );
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("ok");
        setStatusMessage(`Connected ✓  — Nightscout v${json.version ?? "?"}`);
      } else {
        setStatus("error");
        setStatusMessage(json.error ?? "Connection failed. Check your URL and API secret.");
      }
    } catch {
      setStatus("error");
      setStatusMessage("Network error — could not reach Nightscout.");
    }
  }

  // ── Save settings ──────────────────────────────────────────────────────────
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaveMessage("Not authenticated.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("patient_profiles")
      .update({
        nightscout_url: settings.url.trim() || null,
        nightscout_enabled: settings.enabled,
        nightscout_sync_interval_minutes: settings.syncIntervalMinutes,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      setSaveMessage("Failed to save settings. Please try again.");
    } else {
      setSaveMessage("Settings saved successfully.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const statusColour: Record<ConnectionStatus, string> = {
    idle: "text-slate-500",
    testing: "text-blue-500",
    ok: "text-emerald-600",
    error: "text-red-600",
  };

  const statusBg: Record<ConnectionStatus, string> = {
    idle: "bg-slate-50 border-slate-200",
    testing: "bg-blue-50 border-blue-200",
    ok: "bg-emerald-50 border-emerald-200",
    error: "bg-red-50 border-red-200",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nightscout Integration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connect your Nightscout CGM data source so GluMira™ can import real-time glucose readings
          automatically.
        </p>
      </div>

      {/* What is Nightscout */}
      <div className="rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-800">
        <strong>What is Nightscout?</strong> Nightscout is an open-source CGM remote monitoring
        system. If you use a Dexcom, Libre, or Medtronic CGM, your data may already be flowing
        into a Nightscout instance. Ask your diabetes care team or visit{" "}
        <a
          href="https://nightscout.github.io"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
        >
          nightscout.github.io
        </a>{" "}
        for setup instructions.
      </div>

      {/* Settings form */}
      <form onSubmit={save} className="space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="font-medium text-slate-800">Enable Nightscout sync</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically import glucose readings on the selected interval.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
              settings.enabled ? "bg-teal-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                settings.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Nightscout URL */}
        <div className="space-y-1.5">
          <label htmlFor="ns-url" className="block text-sm font-medium text-slate-700">
            Nightscout URL
          </label>
          <input
            id="ns-url"
            type="url"
            placeholder="https://yoursite.herokuapp.com"
            value={settings.url}
            onChange={(e) => setSettings((s) => ({ ...s, url: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <p className="text-xs text-slate-400">
            Your Nightscout base URL — do not include a trailing slash.
          </p>
        </div>

        {/* API Secret */}
        <div className="space-y-1.5">
          <label htmlFor="ns-secret" className="block text-sm font-medium text-slate-700">
            API Secret <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="ns-secret"
            type="password"
            placeholder="Your Nightscout API secret"
            value={settings.apiSecret}
            onChange={(e) => setSettings((s) => ({ ...s, apiSecret: e.target.value }))}
            autoComplete="new-password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <p className="text-xs text-slate-400">
            Required only if your Nightscout instance has authentication enabled. Stored encrypted.
          </p>
        </div>

        {/* Sync interval */}
        <div className="space-y-1.5">
          <label htmlFor="ns-interval" className="block text-sm font-medium text-slate-700">
            Sync interval
          </label>
          <select
            id="ns-interval"
            value={settings.syncIntervalMinutes}
            onChange={(e) =>
              setSettings((s) => ({ ...s, syncIntervalMinutes: Number(e.target.value) }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value={5}>Every 5 minutes</option>
            <option value={10}>Every 10 minutes</option>
            <option value={15}>Every 15 minutes</option>
            <option value={30}>Every 30 minutes</option>
          </select>
        </div>

        {/* Test connection */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={testConnection}
            disabled={status === "testing"}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-600 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-50 transition-colors"
          >
            {status === "testing" ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full" />
                Testing…
              </>
            ) : (
              "Test connection"
            )}
          </button>

          {statusMessage && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm font-medium ${statusBg[status]} ${statusColour[status]}`}
            >
              {statusMessage}
            </div>
          )}
        </div>

        {/* Last sync */}
        {settings.lastSyncAt && (
          <p className="text-xs text-slate-400">
            Last sync:{" "}
            {new Date(settings.lastSyncAt).toLocaleString("en-ZA", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        )}

        {/* Save */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
          {saveMessage && (
            <p
              className={`text-sm font-medium ${
                saveMessage.startsWith("Failed") ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {saveMessage}
            </p>
          )}
        </div>
      </form>

      {/* Instructions */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Setup instructions</h2>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-600">
          <li>
            Enter your Nightscout URL (e.g.{" "}
            <code className="text-xs bg-white border border-slate-200 rounded px-1">
              https://mysite.fly.dev
            </code>
            ).
          </li>
          <li>If your site requires authentication, enter your API secret.</li>
          <li>Click &quot;Test connection&quot; to verify GluMira™ can reach your data.</li>
          <li>Choose a sync interval and enable the toggle.</li>
          <li>Save — glucose readings will start appearing on your dashboard automatically.</li>
        </ol>
      </div>
    </div>
  );
}
