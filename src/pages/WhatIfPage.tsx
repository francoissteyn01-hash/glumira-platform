/**
 * GluMira™ V7 — What-If Scenario Engine
 *
 * Loads the user's configured basal + bolus regimen from
 * `patient_self_profiles` and renders:
 *   Score Gauge  — Basal Coverage Score rev counter
 *   Graph 1      — Total IOB (stacked basal + bolus) via WhatIfIOBChart
 *   Graph 2      — Basal activity profile via BasalActivityChart
 *
 * The basal is locked (display only); bolus entries are editable.
 * BasalScoreGauge is computed from the basal IOB analysis.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/api/supabase';
import WhatIfIOBChart from '@/components/WhatIfIOBChart';
import BasalActivityChart from '@/iob-hunter/components/BasalActivityChart';
import {
  INSULIN_PROFILES,
  findProfile,
  generatePerDoseActivityCurves,
  computeGraphBounds,
  useIOBHunter,
  BasalScoreGauge,
} from '@/iob-hunter';
import type { InsulinDose } from '@/iob-hunter';

/* ─── Local types ────────────────────────────────────────────────────────── */

type BasalInsulin = {
  insulin: string;
  dose: number;
  times: string[];
}

type BolusInsulin = {
  insulin: string;
  dose: number;
  hour: number;
}

/* ─── Helper: decimal hour → "HH:MM" ──────────────────────────────────── */

function formatHour(h: number): string {
  return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function WhatIfPage() {

  /* ── State ───────────────────────────────────────────────────────────── */
  const [basalInsulin,       setBasalInsulin]       = useState<BasalInsulin | null>(null);
  const [bolusInsulins,      setBolusInsulins]      = useState<BolusInsulin[]>([]);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);
  const [timeRangeMinutes,   setTimeRangeMinutes]   = useState(2520);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState<string | null>(null);

  // Add-bolus form fields
  const [newBolusInsulin, setNewBolusInsulin] = useState('');
  const [newBolusDose,    setNewBolusDose]    = useState('');
  const [newBolusHour,    setNewBolusHour]    = useState('');

  /* ── Derived: basal doses for IOB engine ─────────────────────────────
   * Computed here (before early returns) so useIOBHunter can be called
   * unconditionally at the top of the component per Rules of Hooks.    */
  const basalDoses = useMemo<InsulinDose[]>(() => {
    if (!basalInsulin) return [];
    return basalInsulin.times.map((time, i) => ({
      id:              `basal-${i}`,
      insulin_name:    basalInsulin.insulin,
      dose_units:      basalInsulin.dose,
      administered_at: time,
      dose_type:       'basal_injection' as const,
    }));
  }, [basalInsulin]);

  /* ── IOB analysis for the score gauge ────────────────────────────────
   * Runs at top level before early returns. Returns null values while
   * basalDoses is empty (during load / no profile).                    */
  const { basalAnalysis, kpis } = useIOBHunter(basalDoses, {
    resolutionMinutes: 15,
    patientWeightKg:   70,
  });

  /* ── Load patient profile on mount ──────────────────────────────── */
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

  /* ── Bolus management ────────────────────────────────────────────── */
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

  /* ── Loading / error / empty guards ─────────────────────────────── */
  if (loading) return (
    <div className="p-8 text-center text-slate-500" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      Loading profile…
    </div>
  );
  if (error) return (
    <div className="p-8 text-center text-red-600" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {error}
    </div>
  );
  if (!basalInsulin) return (
    <div className="p-8 text-center text-slate-500" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      No basal insulin configured. Add one in your profile.
    </div>
  );

  /* ── Basal activity curves (Graph 2) ─────────────────────────────── */
  const basalProfile = findProfile(basalInsulin.insulin);

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

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8F9FA',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Education banner */}
      <div
        style={{
          background: '#1A2A5E',
          color: '#fff',
          textAlign: 'center',
          fontSize: 11,
          padding: '10px 16px',
          fontWeight: 500,
          letterSpacing: 0.5,
        }}
      >
        PHARMACOLOGICAL EDUCATION — Educational platform, not a medical device. Always consult your care team.
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(12px, 4vw, 32px)' }}>

        {/* Page title */}
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(22px, 5vw, 30px)',
            fontWeight: 700,
            color: '#1A2A5E',
            margin: '0 0 20px',
          }}
        >
          What-If Scenarios
        </h1>

        {/* ── Main layout ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'clamp(240px, 28%, 300px) 1fr',
            gap: 16,
            alignItems: 'start',
          }}
        >

          {/* ── Left sidebar ──────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Basal score gauge */}
            <BasalScoreGauge
              basalAnalysis={basalAnalysis}
              kpis={kpis}
              compact
            />

            {/* Locked basal */}
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.35)',
                padding: '14px 16px',
              }}
            >
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#5B8FD4',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                Basal Insulin (Locked)
              </p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1A2A5E' }}>
                {basalInsulin.insulin} · {basalInsulin.dose} U
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: '#64748b' }}>
                {basalInsulin.times.length > 0
                  ? `Injections: ${basalInsulin.times.join(', ')}`
                  : 'No injection times configured'}
              </p>
              {basalProfile && (
                <p style={{ margin: '3px 0 0', fontSize: 10, color: '#94a3b8' }}>
                  DOA {Math.round(basalProfile.duration_minutes / 60)}h · {basalProfile.generic_name}
                </p>
              )}
            </div>

            {/* Editable bolus section */}
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.35)',
                padding: '14px 16px',
              }}
            >
              <p
                style={{
                  margin: '0 0 10px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#2AB5C1',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                Bolus Insulins — Editable
              </p>

              {bolusInsulins.length === 0 && (
                <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', margin: '0 0 10px' }}>
                  No bolus doses added.
                </p>
              )}

              {/* Bolus list */}
              {bolusInsulins.map((bolus, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: 6,
                    padding: '8px 10px',
                    background: '#f0fdfa',
                    borderRadius: 8,
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#1A2A5E' }}>
                    <strong>{bolus.insulin}</strong>{' '}
                    {bolus.dose} U @ {formatHour(bolus.hour)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeBolusInsulin(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontSize: 14,
                      padding: '0 2px',
                      lineHeight: 1,
                    }}
                    aria-label="Remove bolus"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Divider */}
              <div style={{ borderTop: '1px solid #f1f5f9', margin: '10px 0' }} />

              {/* Add bolus form */}
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#475569' }}>
                Add bolus dose
              </p>
              <select
                value={newBolusInsulin}
                onChange={(e) => setNewBolusInsulin(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: 12,
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  color: '#1A2A5E',
                  background: '#fff',
                  marginBottom: 6,
                }}
              >
                <option value="">Select insulin…</option>
                {INSULIN_PROFILES.filter((p) => p.category === 'rapid' || p.category === 'short')
                  .map((p) => (
                    <option key={p.brand_name} value={p.brand_name}>{p.brand_name}</option>
                  ))}
              </select>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="100"
                  placeholder="Dose (U)"
                  value={newBolusDose}
                  onChange={(e) => setNewBolusDose(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '7px 8px',
                    fontSize: 12,
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    color: '#1A2A5E',
                  }}
                />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="23.5"
                  placeholder="Hour (0–24)"
                  value={newBolusHour}
                  onChange={(e) => setNewBolusHour(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '7px 8px',
                    fontSize: 12,
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    color: '#1A2A5E',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={addBolusInsulin}
                disabled={!newBolusInsulin || !newBolusDose || !newBolusHour}
                style={{
                  width: '100%',
                  padding: '9px 0',
                  background: newBolusInsulin && newBolusDose && newBolusHour ? '#2AB5C1' : '#e2e8f0',
                  color: newBolusInsulin && newBolusDose && newBolusHour ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: newBolusInsulin && newBolusDose && newBolusHour ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
              >
                + Add Bolus
              </button>
            </div>
          </div>

          {/* ── Right: charts ─────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

            {/* Graph 1: Total IOB */}
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.35)',
                padding: '16px 20px',
              }}
            >
              <WhatIfIOBChart
                basalInsulin={basalInsulin}
                bolusInsulins={bolusInsulins}
                timeRangeMinutes={timeRangeMinutes}
                currentTimeMinutes={currentTimeMinutes}
                onTimeChange={setCurrentTimeMinutes}
              />
            </div>

            {/* Graph 2: Basal activity profile */}
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.35)',
                padding: '16px 20px',
              }}
            >
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#1A2A5E',
                  margin: '0 0 2px',
                }}
              >
                Basal Activity Profile
              </h3>
              {basalProfile && (
                <p style={{ margin: '0 0 12px', fontSize: 11, color: '#64748b' }}>
                  {basalProfile.generic_name} · {basalProfile.pk_source}
                </p>
              )}
              {/* Mobile-scrollable wrapper */}
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {bounds && basalCurves.length > 0 ? (
                  <BasalActivityChart
                    curves={basalCurves}
                    startHour={bounds.startHour}
                    endHour={bounds.endHour}
                    height={280}
                  />
                ) : (
                  <div
                    style={{
                      color: '#94a3b8',
                      fontSize: 13,
                      padding: '32px 0',
                      textAlign: 'center',
                    }}
                  >
                    {basalInsulin.times.length === 0
                      ? 'No injection times configured — add times in your profile.'
                      : 'Loading basal profile…'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: 11,
            color: '#94a3b8',
            textAlign: 'center',
            margin: '24px 0 16px',
          }}
        >
          Educational tool only. Consult your care team before making changes to your regimen.
        </p>
      </div>

      {/* Mobile: stack sidebar above charts */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: clamp(240px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
