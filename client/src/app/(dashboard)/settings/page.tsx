/**
 * GluMira™ Settings Page
 * Version: 7.0.0
 * Route: /settings
 *
 * User-facing settings with three sections:
 *   1. Nightscout Connection (URL, API secret, test connection)
 *   2. Patient Profile (name, diabetes type, insulin type, target range)
 *   3. Notifications (beta feedback reminders, sync alerts)
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import React, { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────

interface NightscoutSettings {
  baseUrl: string;
  apiSecret: string;
  syncEnabled: boolean;
  syncIntervalMinutes: number;
}

interface PatientProfile {
  displayName: string;
  diabetesType: "T1D" | "T2D" | "LADA" | "Other";
  insulinType: "Rapid-acting" | "Long-acting" | "Mixed" | "Pump";
  targetLow: number;
  targetHigh: number;
  carbRatio: number;
  correctionFactor: number;
  timezone: string;
}

interface NotificationSettings {
  betaFeedbackReminders: boolean;
  syncErrorAlerts: boolean;
  lowGlucoseAlerts: boolean;
  highGlucoseAlerts: boolean;
  weeklyReportEmail: boolean;
}

interface ConnectionTestResult {
  status: "idle" | "testing" | "success" | "error";
  message?: string;
  latencyMs?: number;
}

// ─── Section Wrapper ──────────────────────────────────────────

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────

function FormField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────

export default function SettingsPage() {
  const [nightscout, setNightscout] = useState<NightscoutSettings>({
    baseUrl: "",
    apiSecret: "",
    syncEnabled: true,
    syncIntervalMinutes: 5,
  });

  const [profile, setProfile] = useState<PatientProfile>({
    displayName: "",
    diabetesType: "T1D",
    insulinType: "Rapid-acting",
    targetLow: 70,
    targetHigh: 180,
    carbRatio: 10,
    correctionFactor: 50,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    betaFeedbackReminders: true,
    syncErrorAlerts: true,
    lowGlucoseAlerts: true,
    highGlucoseAlerts: true,
    weeklyReportEmail: false,
  });

  const [connectionTest, setConnectionTest] = useState<ConnectionTestResult>({ status: "idle" });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const testConnection = useCallback(async () => {
    if (!nightscout.baseUrl) return;
    setConnectionTest({ status: "testing" });
    const start = Date.now();
    try {
      const res = await fetch("/api/nightscout/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testOnly: true, baseUrl: nightscout.baseUrl }),
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        setConnectionTest({ status: "success", message: "Connection successful", latencyMs });
      } else {
        const body = await res.json().catch(() => ({}));
        setConnectionTest({ status: "error", message: body.error ?? `HTTP ${res.status}` });
      }
    } catch {
      setConnectionTest({ status: "error", message: "Could not reach Nightscout instance" });
    }
  }, [nightscout.baseUrl]);

  const handleSave = useCallback(async () => {
    setSaveState("saving");
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nightscout, profile, notifications }),
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 4000);
    }
  }, [nightscout, profile, notifications]);

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-[10px] text-glumira-blue font-medium">The science of insulin, made visible</p>
            <p className="text-xs text-gray-400 mt-0.5">GluMira™ v7.0.0</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveState === "saving"}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              saveState === "saved"
                ? "bg-green-600 text-white"
                : saveState === "error"
                ? "bg-red-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            }`}
          >
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved" : saveState === "error" ? "Error" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* 1. Nightscout Connection */}
        <SettingsSection
          title="Nightscout Connection"
          description="Connect your Nightscout CGM data source to display real-time glucose readings."
        >
          <FormField
            label="Nightscout URL"
            htmlFor="ns-url"
            hint="e.g. https://yourname.ns.10be.de"
          >
            <input
              id="ns-url"
              type="url"
              value={nightscout.baseUrl}
              onChange={(e) => setNightscout((n) => ({ ...n, baseUrl: e.target.value }))}
              placeholder="https://your-nightscout.example.com"
              className={inputClass}
            />
          </FormField>

          <FormField
            label="API Secret"
            htmlFor="ns-secret"
            hint="Your Nightscout API_SECRET (stored encrypted, never logged)"
          >
            <input
              id="ns-secret"
              type="password"
              value={nightscout.apiSecret}
              onChange={(e) => setNightscout((n) => ({ ...n, apiSecret: e.target.value }))}
              placeholder="••••••••••••"
              className={inputClass}
            />
          </FormField>

          <div className="flex items-center gap-3">
            <button
              onClick={testConnection}
              disabled={!nightscout.baseUrl || connectionTest.status === "testing"}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {connectionTest.status === "testing" ? "Testing…" : "Test Connection"}
            </button>
            {connectionTest.status === "success" && (
              <span className="text-sm text-green-600">
                ✓ {connectionTest.message} ({connectionTest.latencyMs}ms)
              </span>
            )}
            {connectionTest.status === "error" && (
              <span className="text-sm text-red-600">✗ {connectionTest.message}</span>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <Toggle
              id="sync-enabled"
              label="Auto-sync enabled"
              description="Automatically pull CGM data every 5 minutes"
              checked={nightscout.syncEnabled}
              onChange={(v) => setNightscout((n) => ({ ...n, syncEnabled: v }))}
            />
          </div>
        </SettingsSection>

        {/* 2. Patient Profile */}
        <SettingsSection
          title="Patient Profile"
          description="Your diabetes management parameters. Used to calculate IOB and personalise insights."
        >
          <FormField label="Display Name" htmlFor="display-name">
            <input
              id="display-name"
              type="text"
              value={profile.displayName}
              onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="e.g. NAM-001"
              className={inputClass}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Diabetes Type" htmlFor="diabetes-type">
              <select
                id="diabetes-type"
                value={profile.diabetesType}
                onChange={(e) => setProfile((p) => ({ ...p, diabetesType: e.target.value as PatientProfile["diabetesType"] }))}
                className={inputClass}
              >
                {["T1D", "T2D", "LADA", "Other"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Insulin Type" htmlFor="insulin-type">
              <select
                id="insulin-type"
                value={profile.insulinType}
                onChange={(e) => setProfile((p) => ({ ...p, insulinType: e.target.value as PatientProfile["insulinType"] }))}
                className={inputClass}
              >
                {["Rapid-acting", "Long-acting", "Mixed", "Pump"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Target Low (mg/dL)" htmlFor="target-low">
              <input
                id="target-low"
                type="number"
                min={54}
                max={100}
                value={profile.targetLow}
                onChange={(e) => setProfile((p) => ({ ...p, targetLow: Number(e.target.value) }))}
                className={inputClass}
              />
            </FormField>
            <FormField label="Target High (mg/dL)" htmlFor="target-high">
              <input
                id="target-high"
                type="number"
                min={120}
                max={300}
                value={profile.targetHigh}
                onChange={(e) => setProfile((p) => ({ ...p, targetHigh: Number(e.target.value) }))}
                className={inputClass}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Carb Ratio (g/U)" htmlFor="carb-ratio" hint="Grams of carbs per unit of insulin">
              <input
                id="carb-ratio"
                type="number"
                min={1}
                max={50}
                value={profile.carbRatio}
                onChange={(e) => setProfile((p) => ({ ...p, carbRatio: Number(e.target.value) }))}
                className={inputClass}
              />
            </FormField>
            <FormField label="Correction Factor (mg/dL/U)" htmlFor="correction-factor" hint="How much 1U lowers glucose">
              <input
                id="correction-factor"
                type="number"
                min={10}
                max={200}
                value={profile.correctionFactor}
                onChange={(e) => setProfile((p) => ({ ...p, correctionFactor: Number(e.target.value) }))}
                className={inputClass}
              />
            </FormField>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="text-xs text-amber-700">
              These values are for educational visualisation only. GluMira™ does not use them to calculate or recommend insulin doses. Always consult your diabetes care team.
            </p>
          </div>
        </SettingsSection>

        {/* 3. Notifications */}
        <SettingsSection
          title="Notifications"
          description="Control which alerts and reminders GluMira™ sends."
        >
          {[
            { id: "beta-reminders", key: "betaFeedbackReminders" as const, label: "Beta feedback reminders", description: "Periodic prompts to submit beta feedback" },
            { id: "sync-alerts", key: "syncErrorAlerts" as const, label: "Sync error alerts", description: "Alert when Nightscout sync fails" },
            { id: "low-alerts", key: "lowGlucoseAlerts" as const, label: "Low glucose alerts", description: "Alert when glucose drops below target" },
            { id: "high-alerts", key: "highGlucoseAlerts" as const, label: "High glucose alerts", description: "Alert when glucose exceeds target" },
            { id: "weekly-report", key: "weeklyReportEmail" as const, label: "Weekly report email", description: "Summary of TIR, GMI, and patterns every Monday" },
          ].map(({ id, key, label, description }) => (
            <Toggle
              key={id}
              id={id}
              label={label}
              description={description}
              checked={notifications[key]}
              onChange={(v) => setNotifications((n) => ({ ...n, [key]: v }))}
            />
          ))}
        </SettingsSection>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center pb-4">
          GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice. Not a dosing tool.
          Always consult your diabetes care team before making any changes to your management.
        </p>
      </div>
    </div>
  );
}
