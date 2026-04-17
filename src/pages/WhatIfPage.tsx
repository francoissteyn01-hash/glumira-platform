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
import type { InsulinDose, StackingAlert } from '@/iob-hunter';

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

/* ─── Risk countdown helper ─────────────────────────────────────────────
 * Given the current wall-clock hour (decimal) and the stacking alerts for
 * the active schedule, returns a human-readable countdown to the next
 * pharmacokinetic overlap window — or a "clear" message if none found.   */

type RiskLevel = 'none' | 'imminent' | 'soon' | 'later';

function riskCountdown(
  alerts: StackingAlert[],
  nowHour: number,
): { label: string; hoursUntil: number | null; level: RiskLevel } {
  const upcoming = alerts
    .filter((a) => a.start_hour > nowHour)
    .sort((a, b) => a.start_hour - b.start_hour);

  if (upcoming.length === 0) {
    return {
      label: 'No pharmacokinetic overlap detected in this regimen',
      hoursUntil: null,
      level: 'none',
    };
  }

  const h = upcoming[0].start_hour - nowHour;
  const level: RiskLevel = h < 2 ? 'imminent' : h < 5 ? 'soon' : 'later';
  const hh = Math.floor(h);
  const mm = Math.round((h % 1) * 60);
  const timeStr = hh > 0
    ? `${hh}h${mm > 0 ? ` ${mm}m` : ''}`
    : `${mm}m`;

  const label = level === 'imminent'
    ? `Pharmacokinetic overlap in ${timeStr} — monitor glucose closely`
    : level === 'soon'
      ? `Next overlap window in ${timeStr}`
      : `Next overlap window in ${timeStr} (low immediate risk)`;

  return { label, hoursUntil: h, level };
}

/* ─── Suggested bolus hours (standard meal-time anchors) ────────────────
 * 07:30 → 12:30 → 18:00 for first 3 doses; +5h per additional dose.    */
const SUGGESTED_HOURS = [7.5, 12.5, 18.0];

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

  /* ── Bolus doses (current) for combined IOB ─────────────────────────── */
  const currentBolusDoses = useMemo<InsulinDose[]>(
    () => bolusInsulins.map((b, i) => ({
      id:              `bolus-${i}`,
      insulin_name:    b.insulin,
      dose_units:      b.dose,
      administered_at: formatHour(b.hour),
      dose_type:       'bolus' as const,
    })),
    [bolusInsulins],
  );

  const currentDoses = useMemo(
    () => [...basalDoses, ...currentBolusDoses],
    [basalDoses, currentBolusDoses],
  );

  /* ── Suggested schedule: standard meal-time spacing ─────────────────── */
  const suggestedBolusInsulins = useMemo(
    () => bolusInsulins.map((b, i) => ({
      ...b,
      hour: SUGGESTED_HOURS[i] ?? 7.5 + i * 5,
    })),
    [bolusInsulins],
  );

  const suggestedDoses = useMemo<InsulinDose[]>(
    () => [
      ...basalDoses,
      ...suggestedBolusInsulins.map((b, i) => ({
        id:              `suggested-bolus-${i}`,
        insulin_name:    b.insulin,
        dose_units:      b.dose,
        administered_at: formatHour(b.hour),
        dose_type:       'bolus' as const,
      })),
    ],
    [basalDoses, suggestedBolusInsulins],
  );

  /* ── IOB analysis for the score gauge ────────────────────────────────
   * Runs at top level before early returns. Returns null values while
   * basalDoses is empty (during load / no profile).                    */
  const { basalAnalysis, kpis } = useIOBHunter(basalDoses, {
    resolutionMinutes: 15,
    patientWeightKg:   70,
  });

  /* ── IOB analysis for scenario comparison ────────────────────────────
   * currentResult: basal + current bolus timing
   * suggestedResult: basal + suggested meal-time timing                */
  const currentResult   = useIOBHunter(currentDoses,   { resolutionMinutes: 15, patientWeightKg: 70 });
  const suggestedResult = useIOBHunter(suggestedDoses, { resolutionMinutes: 15, patientWeightKg: 70 });

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

  /* ── Apply suggested timing (one-tap) ───────────────────────────── */
  const applySuggestedTiming = () => setBolusInsulins(suggestedBolusInsulins);

  const isAlreadyOptimal = bolusInsulins.length > 0 &&
    suggestedBolusInsulins.every((s, i) => Math.abs(s.hour - bolusInsulins[i].hour) < 0.1);

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

        {/* ── Scenario Comparison + Risk Countdown ─────────────────────── */}
        {(() => {
          const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
          const risk = riskCountdown(currentResult.stackingAlerts, nowHour);
          const ck = currentResult.kpis;
          const sk = suggestedResult.kpis;

          const RISK_BG:     Record<RiskLevel, string> = {
            none:     '#f0fdf4',
            later:    '#eff6ff',
            soon:     '#fffbeb',
            imminent: '#fef2f2',
          };
          const RISK_COLOUR: Record<RiskLevel, string> = {
            none:     '#16a34a',
            later:    '#2563eb',
            soon:     '#d97706',
            imminent: '#dc2626',
          };
          const RISK_ICON: Record<RiskLevel, string> = {
            none:     '✓',
            later:    '◷',
            soon:     '⚠',
            imminent: '⚡',
          };

          // Delta helpers — positive = improvement
          const peakDelta    = ck.peak_iob - sk.peak_iob;               // lower = better
          const overlapDelta = ck.hours_strong_or_overlap - sk.hours_strong_or_overlap; // lower = better
          const troughDelta  = sk.trough_iob - ck.trough_iob;           // higher = better

          function deltaChip(value: number, unit: string, label: string) {
            const improved = value > 0.05;
            const worse    = value < -0.05;
            const colour   = improved ? '#16a34a' : worse ? '#dc2626' : '#94a3b8';
            const arrow    = improved ? '↓' : worse ? '↑' : '–';
            return (
              <div key={label} style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: colour }}>
                  {arrow} {Math.abs(value).toFixed(1)}{unit}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{label}</div>
              </div>
            );
          }

          function kpiPills(
            peak: number, overlap: number, trough: number,
            comparePeak?: number, compareOverlap?: number, compareTrough?: number,
          ) {
            function pill(value: string, sub: string, improved?: boolean) {
              return (
                <div
                  key={sub}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: improved === true ? '#f0fdf4' : improved === false ? '#fef2f2' : '#f8fafc',
                    border: `1px solid ${improved === true ? '#bbf7d0' : improved === false ? '#fecaca' : '#e2e8f0'}`,
                    textAlign: 'center',
                    flex: 1,
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2A5E' }}>{value}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{sub}</div>
                </div>
              );
            }
            const peakImproved    = comparePeak    !== undefined ? peak < comparePeak - 0.05          : undefined;
            const overlapImproved = compareOverlap !== undefined ? overlap < compareOverlap - 0.05     : undefined;
            const troughImproved  = compareTrough  !== undefined ? trough > compareTrough + 0.05       : undefined;
            return (
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {pill(`${peak.toFixed(1)} U`,    'Peak IOB',      peakImproved)}
                {pill(`${overlap.toFixed(1)} h`, 'Overlap hours', overlapImproved)}
                {pill(`${trough.toFixed(1)} U`,  'Trough IOB',    troughImproved)}
              </div>
            );
          }

          const hasBolus = bolusInsulins.length > 0;

          return (
            <div style={{ marginTop: 20 }}>

              {/* Risk countdown banner */}
              <div
                style={{
                  background:   RISK_BG[risk.level],
                  border:       `1px solid ${RISK_COLOUR[risk.level]}33`,
                  borderRadius: 12,
                  padding:      '12px 20px',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          14,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize:   22,
                    color:      RISK_COLOUR[risk.level],
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {RISK_ICON[risk.level]}
                </span>
                <div>
                  <p
                    style={{
                      margin:     0,
                      fontSize:   13,
                      fontWeight: 600,
                      color:      RISK_COLOUR[risk.level],
                    }}
                  >
                    {risk.label}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                    Risk window analysis · current schedule · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Comparison panel — only when bolus doses exist */}
              {hasBolus && (
                <div
                  style={{
                    display:             'grid',
                    gridTemplateColumns: '1fr 90px 1fr',
                    gap:                 12,
                    alignItems:          'start',
                  }}
                >

                  {/* Current schedule card */}
                  <div
                    style={{
                      background:   '#fff',
                      borderRadius: 12,
                      border:       '1px solid rgba(148,163,184,0.35)',
                      padding:      '16px 18px',
                    }}
                  >
                    <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                      Current Schedule
                    </p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1A2A5E' }}>
                      Your bolus timing
                    </p>
                    {kpiPills(ck.peak_iob, ck.hours_strong_or_overlap, ck.trough_iob)}
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {bolusInsulins.map((b, i) => (
                        <div key={i} style={{ fontSize: 11, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{b.insulin} · {b.dose} U</span>
                          <span style={{ fontWeight: 700, color: '#1A2A5E', fontFamily: 'monospace' }}>
                            {formatHour(b.hour)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delta column */}
                  <div
                    style={{
                      display:        'flex',
                      flexDirection:  'column',
                      justifyContent: 'center',
                      alignItems:     'center',
                      gap:            4,
                      paddingTop:     48,
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textAlign: 'center' }}>vs suggested</div>
                    {deltaChip(peakDelta,    'U', 'Peak IOB')}
                    {deltaChip(overlapDelta, 'h', 'Overlap')}
                    {deltaChip(troughDelta,  'U', 'Trough')}
                  </div>

                  {/* Suggested schedule card */}
                  <div
                    style={{
                      background:   '#fff',
                      borderRadius: 12,
                      border:       '1px solid rgba(42,181,193,0.4)',
                      padding:      '16px 18px',
                    }}
                  >
                    <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: '#2AB5C1', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                      Suggested Schedule
                    </p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1A2A5E' }}>
                      Standard meal anchors
                    </p>
                    {kpiPills(sk.peak_iob, sk.hours_strong_or_overlap, sk.trough_iob, ck.peak_iob, ck.hours_strong_or_overlap, ck.trough_iob)}
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {suggestedBolusInsulins.map((b, i) => {
                        const changed = Math.abs(b.hour - bolusInsulins[i].hour) > 0.1;
                        return (
                          <div key={i} style={{ fontSize: 11, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{b.insulin} · {b.dose} U</span>
                            <span style={{ fontWeight: 700, color: changed ? '#2AB5C1' : '#1A2A5E', fontFamily: 'monospace' }}>
                              {formatHour(b.hour)}{changed ? ' ←' : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={applySuggestedTiming}
                      disabled={isAlreadyOptimal}
                      style={{
                        marginTop:    12,
                        width:        '100%',
                        padding:      '9px 0',
                        background:   isAlreadyOptimal ? '#e2e8f0' : '#2AB5C1',
                        color:        isAlreadyOptimal ? '#94a3b8' : '#fff',
                        border:       'none',
                        borderRadius: 8,
                        fontSize:     12,
                        fontWeight:   600,
                        cursor:       isAlreadyOptimal ? 'default' : 'pointer',
                        transition:   'background 0.15s',
                      }}
                    >
                      {isAlreadyOptimal ? 'Already at suggested timing' : 'Apply Suggested Timing'}
                    </button>
                    <p style={{ margin: '8px 0 0', fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
                      Educational suggestion only — confirm with your care team
                    </p>
                  </div>
                </div>
              )}

              {!hasBolus && (
                <div
                  style={{
                    background:   '#f8fafc',
                    borderRadius: 12,
                    border:       '1px solid #e2e8f0',
                    padding:      '20px',
                    textAlign:    'center',
                    color:        '#94a3b8',
                    fontSize:     13,
                  }}
                >
                  Add bolus doses above to see timing comparison and suggested schedule
                </div>
              )}
            </div>
          );
        })()}

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
