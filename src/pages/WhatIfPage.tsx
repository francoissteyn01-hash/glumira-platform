/**
 * GluMira™ V7 — What-If Scenario Engine
 *
 * Loads the user's configured basal + bolus regimen from
 * `patient_self_profiles` and renders:
 *   Graph 1 — Total IOB (stacked basal + bolus) via WhatIfIOBChart
 *   Graph 2 — Basal activity profile via BasalActivityChart
 *
 * The basal is locked (display only); bolus entries are editable.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase';
import WhatIfIOBChart from '@/components/WhatIfIOBChart';
import BasalActivityChart from '@/iob-hunter/components/BasalActivityChart';
import {
  INSULIN_PROFILES,
  findProfile,
  generatePerDoseActivityCurves,
  computeGraphBounds,
} from '@/iob-hunter';
import type { InsulinDose } from '@/iob-hunter';

/* ─── Local types ────────────────────────────────────────────────────────── */

interface BasalInsulin {
  insulin: string;
  dose: number;
  times: string[];
}

interface BolusInsulin {
  insulin: string;
  dose: number;
  hour: number;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function WhatIfPage() {

  /* ── State ───────────────────────────────────────────────────────────── */
  const [basalInsulin,       setBasalInsulin]       = useState<BasalInsulin | null>(null);
  const [bolusInsulins,      setBolusInsulins]      = useState<BolusInsulin[]>([]);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);
  const [timeRangeMinutes,   setTimeRangeMinutes]   = useState(2520); // 42h default (Tresiba)
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState<string | null>(null);

  // Add-bolus form fields
  const [newBolusInsulin, setNewBolusInsulin] = useState('');
  const [newBolusDose,    setNewBolusDose]    = useState('');
  const [newBolusHour,    setNewBolusHour]    = useState('');

  /* ── Load patient profile on mount ──────────────────────────────────── */
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) throw new Error('Not authenticated');

        const { data, error: fetchError } = await supabase
          .from('patient_self_profiles')
          .select('insulin_types')
          .eq('user_id', authData.user.id)
          .single();

        if (fetchError) throw fetchError;

        if (data?.insulin_types) {
          const insulinTypes = data.insulin_types as Record<string, unknown>;

          // Locked basal
          const basalEntry = insulinTypes.basal as { insulin?: string; dose?: number; times?: string[] } | undefined;
          if (basalEntry?.insulin) {
            setBasalInsulin({
              insulin: basalEntry.insulin,
              dose:    basalEntry.dose ?? 0,
              times:   basalEntry.times ?? [],
            });

            // Set time range from profile DOA
            const profile = findProfile(basalEntry.insulin);
            if (profile) setTimeRangeMinutes(profile.duration_minutes);
          }

          // Editable bolus
          const bolusEntries = insulinTypes.bolus;
          if (Array.isArray(bolusEntries)) {
            setBolusInsulins(
              (bolusEntries as Array<{ insulin?: string; typicalDose?: string | number }>)
                .map((b, i) => ({
                  insulin: b.insulin ?? '',
                  dose:    parseFloat(String(b.typicalDose ?? 0)) || 0,
                  hour:    7 + i * 5, // Default spacing: 07:00, 12:00, 17:00
                })),
            );
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  /* ── Bolus management ────────────────────────────────────────────────── */
  const addBolusInsulin = () => {
    if (newBolusInsulin && newBolusDose && newBolusHour) {
      setBolusInsulins((prev) => [
        ...prev,
        {
          insulin: newBolusInsulin,
          dose:    parseFloat(newBolusDose),
          hour:    parseFloat(newBolusHour),
        },
      ]);
      setNewBolusInsulin('');
      setNewBolusDose('');
      setNewBolusHour('');
    }
  };

  const removeBolusInsulin = (index: number) =>
    setBolusInsulins((prev) => prev.filter((_, i) => i !== index));

  /* ── Loading / error / empty guards ─────────────────────────────────── */
  if (loading) return <div className="p-8 text-center text-slate-500">Loading profile…</div>;
  if (error)   return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!basalInsulin) return <div className="p-8 text-center text-slate-500">No basal insulin configured.</div>;

  /* ── Basal activity curves (Graph 2) ─────────────────────────────────── */
  const basalProfile = findProfile(basalInsulin.insulin);

  // InsulinDose[] requires id + insulin_name + dose_units + administered_at + dose_type
  const basalDoses: InsulinDose[] = basalInsulin.times.map((time, i) => ({
    id:             `basal-${i}`,
    insulin_name:   basalInsulin.insulin,
    dose_units:     basalInsulin.dose,
    administered_at: time,
    dose_type:      'basal_injection' as const,
  }));

  const bounds = basalDoses.length > 0
    ? computeGraphBounds(basalDoses, INSULIN_PROFILES)
    : null;

  const basalCurves =
    bounds
      ? generatePerDoseActivityCurves(
          basalDoses,
          INSULIN_PROFILES,
          bounds.startHour,
          bounds.endHour,
          15,
          bounds.cycles,
        )
      : [];

  /* ── Helper: format decimal hour as "HH:MM" ─────────────────────────── */
  const formatHour = (h: number) =>
    `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">

      {/* Education banner */}
      <div className="bg-[#1A2A5E] text-white text-center text-xs px-4 py-3 font-medium tracking-wide mb-6">
        PHARMACOLOGICAL EDUCATION — Educational platform, not a medical device. Always consult your care team.
      </div>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[#1A2A5E]"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          What-If Scenarios
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left sidebar: configuration ─────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-[#1A2A5E] mb-4">Configuration</h2>

              {/* Locked basal */}
              <div className="mb-6 p-4 bg-[#f0f4ff] rounded-xl border border-[#c7d2fe]">
                <p className="text-xs uppercase tracking-wider text-[#5B8FD4] font-semibold mb-2">
                  Basal Insulin (Locked)
                </p>
                <p className="text-sm font-semibold text-[#1A2A5E]">
                  {basalInsulin.insulin} · {basalInsulin.dose} U
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {basalInsulin.times.length > 0
                    ? `Times: ${basalInsulin.times.join(', ')}`
                    : 'No injection times configured'}
                </p>
                {basalProfile && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    DOA: {Math.round(basalProfile.duration_minutes / 60)}h ·{' '}
                    {basalProfile.generic_name}
                  </p>
                )}
              </div>

              {/* Editable bolus list */}
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wider text-[#2AB5C1] font-semibold mb-3">
                  Bolus Insulins
                </p>

                {bolusInsulins.length === 0 && (
                  <p className="text-xs text-slate-400 italic mb-3">No bolus doses added.</p>
                )}

                {bolusInsulins.map((bolus, index) => (
                  <div
                    key={index}
                    className="mb-2 px-3 py-2 bg-[#f0fdfa] rounded-lg border border-[#a7f3d0] flex justify-between items-center text-sm"
                  >
                    <span className="text-[#1A2A5E]">
                      <span className="font-medium">{bolus.insulin}</span>{' '}
                      {bolus.dose} U @ {formatHour(bolus.hour)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBolusInsulin(index)}
                      className="text-red-400 hover:text-red-600 text-xs ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Add bolus form */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <select
                  value={newBolusInsulin}
                  onChange={(e) => setNewBolusInsulin(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-[#1A2A5E] bg-white"
                >
                  <option value="">Select bolus insulin…</option>
                  {INSULIN_PROFILES.filter((p) => p.category === 'rapid' || p.category === 'short')
                    .map((p) => (
                      <option key={p.brand_name} value={p.brand_name}>{p.brand_name}</option>
                    ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="100"
                    placeholder="Dose (U)"
                    value={newBolusDose}
                    onChange={(e) => setNewBolusDose(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-[#1A2A5E]"
                  />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="23.5"
                    placeholder="Hour (0–24)"
                    value={newBolusHour}
                    onChange={(e) => setNewBolusHour(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg text-[#1A2A5E]"
                  />
                </div>
                <button
                  type="button"
                  onClick={addBolusInsulin}
                  className="w-full py-1.5 bg-[#2AB5C1] text-white text-xs font-medium rounded-lg hover:bg-[#229eaa] transition-colors"
                >
                  + Add Bolus
                </button>
              </div>
            </div>
          </div>

          {/* ── Right content: charts ────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Graph 1: Total IOB */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <WhatIfIOBChart
                basalInsulin={basalInsulin}
                bolusInsulins={bolusInsulins}
                timeRangeMinutes={timeRangeMinutes}
                currentTimeMinutes={currentTimeMinutes}
                onTimeChange={setCurrentTimeMinutes}
              />
            </div>

            {/* Graph 2: Basal activity profile */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-semibold text-[#1A2A5E] mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Basal Activity Profile
              </h3>
              {basalProfile && (
                <p className="text-xs text-slate-500 mb-4">
                  {basalProfile.generic_name} · {basalProfile.pk_source}
                </p>
              )}
              {bounds && basalCurves.length > 0 ? (
                <BasalActivityChart
                  curves={basalCurves}
                  startHour={bounds.startHour}
                  endHour={bounds.endHour}
                  height={280}
                />
              ) : (
                <div className="text-slate-400 text-sm py-8 text-center">
                  {basalInsulin.times.length === 0
                    ? 'No injection times configured — add times in your profile.'
                    : 'Loading basal profile…'}
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center mt-8 pb-4">
          Educational tool only. Consult your care team before making changes to your regimen.
        </p>
      </div>
    </div>
  );
}
