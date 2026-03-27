/**
 * GluMira™ Beta Onboarding Gate
 * Version: 7.0.0
 * Module: BETA-ONBOARDING-GATE
 *
 * Wraps the entire app and blocks access to the dashboard until the patient
 * has completed all mandatory baseline data capture steps:
 *
 *   Step 1: Personal Info (first name, diabetes type)
 *   Step 2: Glucose Settings (unit, target range)
 *   Step 3: Insulin Settings (ISF, ICR, DIA)
 *   Step 4: CGM Connection (Dexcom Share or Nightscout)
 *   Step 5: First Sync Verification
 *
 * This ensures every beta participant has complete clinical baseline data
 * from Day 1 — critical for grant applications that require longitudinal
 * TIR improvement metrics.
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTelemetry } from "@/hooks/useTelemetry";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────

interface OnboardingCheckpoints {
  profileCreated: boolean;
  diabetesTypeSet: boolean;
  glucoseUnitSet: boolean;
  targetRangeSet: boolean;
  isfSet: boolean;
  icrSet: boolean;
  diaSet: boolean;
  cgmSourceConnected: boolean;
  firstSyncComplete: boolean;
}

interface OnboardingGateProps {
  children: React.ReactNode;
}

// ─── Steps ───────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "Personal Info", description: "Tell us about yourself" },
  { id: 2, title: "Glucose Settings", description: "Set your glucose preferences" },
  { id: 3, title: "Insulin Settings", description: "Configure your insulin parameters" },
  { id: 4, title: "Connect CGM", description: "Link your glucose data source" },
  { id: 5, title: "First Sync", description: "Verify your data is flowing" },
] as const;

// ─── Component ───────────────────────────────────────────────

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { trackOnboarding, track } = useTelemetry();

  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [diabetesType, setDiabetesType] = useState("");
  const [glucoseUnit, setGlucoseUnit] = useState("mg/dL");
  const [targetMin, setTargetMin] = useState("80");
  const [targetMax, setTargetMax] = useState("180");
  const [isf, setIsf] = useState("");
  const [icr, setIcr] = useState("");
  const [diaHours, setDiaHours] = useState("");
  const [cgmSource, setCgmSource] = useState<"dexcom" | "nightscout" | "">("");
  const [dexcomUsername, setDexcomUsername] = useState("");
  const [dexcomPassword, setDexcomPassword] = useState("");
  const [dexcomRegion, setDexcomRegion] = useState("INTERNATIONAL");
  const [nightscoutUrl, setNightscoutUrl] = useState("");
  const [nightscoutSecret, setNightscoutSecret] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "testing" | "syncing" | "success" | "error">("idle");

  // Check onboarding status on mount
  useEffect(() => {
    async function checkOnboarding() {
      try {
        const res = await fetch("/api/onboarding/status");
        if (res.ok) {
          const data = await res.json();
          if (data.onboardingComplete) {
            setIsOnboarded(true);
          } else {
            // Resume from last incomplete step
            const checkpoints = data as OnboardingCheckpoints;
            if (!checkpoints.profileCreated || !checkpoints.diabetesTypeSet) setCurrentStep(1);
            else if (!checkpoints.glucoseUnitSet || !checkpoints.targetRangeSet) setCurrentStep(2);
            else if (!checkpoints.isfSet || !checkpoints.icrSet || !checkpoints.diaSet) setCurrentStep(3);
            else if (!checkpoints.cgmSourceConnected) setCurrentStep(4);
            else setCurrentStep(5);

            track("onboarding_started", "onboarding", { resumedAt: currentStep });
          }
        }
      } catch {
        // First time — start fresh
        track("onboarding_started", "onboarding");
      } finally {
        setIsLoading(false);
      }
    }
    checkOnboarding();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step handlers ──

  const handleStep1Save = useCallback(async () => {
    if (!firstName.trim()) { toast.error("First name is required"); return; }
    if (!diabetesType) { toast.error("Please select your diabetes type"); return; }

    setIsSaving(true);
    try {
      await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, diabetesType }),
      });
      trackOnboarding("personal_info", { diabetesType });
      setCurrentStep(2);
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [firstName, diabetesType, trackOnboarding]);

  const handleStep2Save = useCallback(async () => {
    const min = parseFloat(targetMin);
    const max = parseFloat(targetMax);
    if (isNaN(min) || isNaN(max) || min >= max) {
      toast.error("Please enter a valid target range");
      return;
    }

    setIsSaving(true);
    try {
      await fetch("/api/onboarding/glucose-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ glucoseUnit, targetMin: min, targetMax: max }),
      });
      trackOnboarding("glucose_settings", { glucoseUnit, targetMin: min, targetMax: max });
      setCurrentStep(3);
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [glucoseUnit, targetMin, targetMax, trackOnboarding]);

  const handleStep3Save = useCallback(async () => {
    if (!isf || !icr || !diaHours) {
      toast.error("All insulin settings are required for accurate IOB calculations");
      return;
    }

    setIsSaving(true);
    try {
      await fetch("/api/onboarding/insulin-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insulinSensitivityFactor: parseFloat(isf),
          carbRatio: parseFloat(icr),
          iobDecayTimeMinutes: parseFloat(diaHours) * 60,
        }),
      });
      trackOnboarding("insulin_settings");
      setCurrentStep(4);
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [isf, icr, diaHours, trackOnboarding]);

  const handleTestConnection = useCallback(async () => {
    if (cgmSource === "dexcom" && (!dexcomUsername || !dexcomPassword)) {
      toast.error("Dexcom Share username and password are required");
      return;
    }
    if (cgmSource === "nightscout" && !nightscoutUrl) {
      toast.error("Nightscout URL is required");
      return;
    }

    setSyncStatus("testing");
    try {
      const endpoint = cgmSource === "dexcom"
        ? "/api/dexcom-share/test"
        : "/api/nightscout/test";

      const body = cgmSource === "dexcom"
        ? { username: dexcomUsername, password: dexcomPassword, region: dexcomRegion }
        : { baseUrl: nightscoutUrl, apiSecret: nightscoutSecret };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setSyncStatus("success");
        toast.success("Connection successful! Data source verified.");
        trackOnboarding("cgm_connected", { source: cgmSource });
      } else {
        setSyncStatus("error");
        toast.error(data.error ?? "Connection failed. Please check your credentials.");
      }
    } catch {
      setSyncStatus("error");
      toast.error("Connection test failed. Please try again.");
    }
  }, [cgmSource, dexcomUsername, dexcomPassword, dexcomRegion, nightscoutUrl, nightscoutSecret, trackOnboarding]);

  const handleStep4Save = useCallback(async () => {
    if (syncStatus !== "success") {
      toast.error("Please test your connection first");
      return;
    }

    setIsSaving(true);
    try {
      await fetch("/api/onboarding/cgm-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cgmSource,
          ...(cgmSource === "dexcom"
            ? { dexcomUsername, dexcomPassword, dexcomRegion }
            : { nightscoutUrl, nightscoutSecret }),
        }),
      });
      setCurrentStep(5);
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [cgmSource, dexcomUsername, dexcomPassword, dexcomRegion, nightscoutUrl, nightscoutSecret, syncStatus]);

  const handleFirstSync = useCallback(async () => {
    setSyncStatus("syncing");
    try {
      const endpoint = cgmSource === "dexcom"
        ? "/api/dexcom-share/sync"
        : "/api/nightscout/sync";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: 1 }), // Will be replaced with actual ID
      });

      const data = await res.json();
      if (data.success || data.sgvCount > 0 || data.readingsCount > 0) {
        setSyncStatus("success");
        trackOnboarding("first_sync_complete", { readingsCount: data.readingsCount ?? data.sgvCount });
        track("onboarding_completed", "onboarding");
        toast.success("First sync complete! Welcome to GluMira™");
        setTimeout(() => setIsOnboarded(true), 1500);
      } else {
        setSyncStatus("error");
        toast.error("No data received. Please ensure your CGM is active and sharing data.");
      }
    } catch {
      setSyncStatus("error");
      toast.error("Sync failed. Please try again.");
    }
  }, [cgmSource, trackOnboarding, track]);

  // ── Loading ──

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // ── Already onboarded — render children ──

  if (isOnboarded) {
    return <>{children}</>;
  }

  // ── Onboarding Wizard ──

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to GluMira™ Beta
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            The science of insulin, made visible
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step) => (
            <div key={step.id} className="flex items-center">
              {step.id <= currentStep ? (
                step.id < currentStep ? (
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold">
                    {step.id}
                  </div>
                )
              ) : (
                <Circle className="h-6 w-6 text-gray-300" />
              )}
              {step.id < STEPS.length && (
                <div className={`w-8 h-0.5 mx-1 ${step.id < currentStep ? "bg-teal-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="p-6 shadow-xl border-teal-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {STEPS[currentStep - 1].title}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {STEPS[currentStep - 1].description}
          </p>

          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Diabetes Type</label>
                <Select value={diabetesType} onValueChange={setDiabetesType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your diabetes type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="type1">Type 1 Diabetes</SelectItem>
                    <SelectItem value="type2">Type 2 Diabetes</SelectItem>
                    <SelectItem value="gestational">Gestational Diabetes</SelectItem>
                    <SelectItem value="lada">LADA</SelectItem>
                    <SelectItem value="mody">MODY</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleStep1Save} disabled={isSaving} className="w-full bg-teal-600 hover:bg-teal-700">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Glucose Settings */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Glucose Unit</label>
                <Select value={glucoseUnit} onValueChange={setGlucoseUnit}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mg/dL">mg/dL</SelectItem>
                    <SelectItem value="mmol/L">mmol/L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Target Low ({glucoseUnit})</label>
                  <Input value={targetMin} onChange={(e) => setTargetMin(e.target.value)} type="number" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Target High ({glucoseUnit})</label>
                  <Input value={targetMax} onChange={(e) => setTargetMax(e.target.value)} type="number" className="mt-1" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleStep2Save} disabled={isSaving} className="flex-1 bg-teal-600 hover:bg-teal-700">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Insulin Settings */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                These values are critical for accurate IOB calculations. Check with your diabetes care team if unsure.
              </p>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Insulin Sensitivity Factor (ISF) — {glucoseUnit} per unit
                </label>
                <Input value={isf} onChange={(e) => setIsf(e.target.value)} type="number" placeholder="e.g. 50" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Insulin-to-Carb Ratio (ICR) — grams per unit
                </label>
                <Input value={icr} onChange={(e) => setIcr(e.target.value)} type="number" placeholder="e.g. 10" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Duration of Insulin Action (DIA) — hours
                </label>
                <Input value={diaHours} onChange={(e) => setDiaHours(e.target.value)} type="number" step="0.5" placeholder="e.g. 4" className="mt-1" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleStep3Save} disabled={isSaving} className="flex-1 bg-teal-600 hover:bg-teal-700">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: CGM Connection */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Data Source</label>
                <Select value={cgmSource} onValueChange={(v) => { setCgmSource(v as any); setSyncStatus("idle"); }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your CGM data source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dexcom">Dexcom Share</SelectItem>
                    <SelectItem value="nightscout">Nightscout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {cgmSource === "dexcom" && (
                <>
                  <Input value={dexcomUsername} onChange={(e) => setDexcomUsername(e.target.value)} placeholder="Dexcom Share username" />
                  <Input value={dexcomPassword} onChange={(e) => setDexcomPassword(e.target.value)} type="password" placeholder="Dexcom Share password" />
                  <Select value={dexcomRegion} onValueChange={setDexcomRegion}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERNATIONAL">International (Outside US)</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}

              {cgmSource === "nightscout" && (
                <>
                  <Input value={nightscoutUrl} onChange={(e) => setNightscoutUrl(e.target.value)} placeholder="https://your-site.nightscout.me" />
                  <Input value={nightscoutSecret} onChange={(e) => setNightscoutSecret(e.target.value)} type="password" placeholder="API Secret (optional)" />
                </>
              )}

              {cgmSource && (
                <Button
                  onClick={handleTestConnection}
                  disabled={syncStatus === "testing"}
                  variant={syncStatus === "success" ? "default" : "outline"}
                  className={`w-full ${syncStatus === "success" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                >
                  {syncStatus === "testing" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {syncStatus === "success" && <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {syncStatus === "success" ? "Connected!" : "Test Connection"}
                </Button>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep(3)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleStep4Save} disabled={syncStatus !== "success" || isSaving} className="flex-1 bg-teal-600 hover:bg-teal-700">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: First Sync */}
          {currentStep === 5 && (
            <div className="space-y-4 text-center">
              <div className="py-4">
                {syncStatus === "idle" && (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      Everything is configured. Let's pull your first batch of glucose data to make sure everything works.
                    </p>
                    <Button onClick={handleFirstSync} className="bg-teal-600 hover:bg-teal-700">
                      Start First Sync
                    </Button>
                  </>
                )}
                {syncStatus === "syncing" && (
                  <div className="space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-600 mx-auto" />
                    <p className="text-sm text-gray-600">Pulling your glucose data...</p>
                  </div>
                )}
                {syncStatus === "success" && (
                  <div className="space-y-3">
                    <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
                    <p className="text-sm font-semibold text-green-700">You're all set!</p>
                    <p className="text-xs text-gray-500">Redirecting to your dashboard...</p>
                  </div>
                )}
                {syncStatus === "error" && (
                  <div className="space-y-3">
                    <p className="text-sm text-red-600">
                      Sync failed. This can happen if your CGM hasn't uploaded recent data.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => setSyncStatus("idle")}>
                        Try Again
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          track("onboarding_completed", "onboarding", { skippedSync: true });
                          setIsOnboarded(true);
                        }}
                      >
                        Skip for Now
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {syncStatus !== "success" && (
                <Button variant="ghost" onClick={() => setCurrentStep(4)} className="text-sm text-gray-400">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to CGM Settings
                </Button>
              )}
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          GluMira™ is an informational tool only. Not a medical device.
        </p>
      </div>
    </div>
  );
}
