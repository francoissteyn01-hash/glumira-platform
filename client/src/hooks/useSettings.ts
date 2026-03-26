/**
 * GluMira™ — useSettings.ts
 *
 * React hook for reading and updating user application settings.
 * Wraps GET/PATCH /api/settings.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GlucoseUnit = "mmol" | "mgdl";
export type ThemeMode   = "light" | "dark" | "system";

export interface UserSettings {
  glucoseUnit:         GlucoseUnit;
  theme:               ThemeMode;
  notificationsEnabled: boolean;
  pushEnabled:         boolean;
  lowAlertThreshold:   number;   // mmol/L
  highAlertThreshold:  number;   // mmol/L
  nightscoutUrl:       string | null;
  nightscoutToken:     string | null;
  language:            string;
  timezone:            string;
}

const DEFAULT_SETTINGS: UserSettings = {
  glucoseUnit:          "mmol",
  theme:                "system",
  notificationsEnabled: true,
  pushEnabled:          false,
  lowAlertThreshold:    3.9,
  highAlertThreshold:   10.0,
  nightscoutUrl:        null,
  nightscoutToken:      null,
  language:             "en",
  timezone:             Intl.DateTimeFormat().resolvedOptions().timeZone,
};

interface UseSettingsResult {
  settings: UserSettings;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch("/api/settings")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<UserSettings>;
      })
      .then((data) => {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
        setLoading(false);
      })
      .catch((err) => {
        // Fall back to defaults on error — settings are non-critical
        setError(err.message ?? "Failed to load settings");
        setLoading(false);
      });
  }, [refreshKey]);

  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => {
    setSaving(true);
    setError(null);

    // Optimistic update
    setSettings((prev) => ({ ...prev, ...patch }));

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const updated = await res.json() as UserSettings;
      setSettings({ ...DEFAULT_SETTINGS, ...updated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings";
      setError(msg);
      // Revert optimistic update
      refresh();
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  return { settings, loading, saving, error, updateSettings, refresh };
}

export default useSettings;
