'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase as supabaseClient } from '@/hooks/useAuth';

interface Regimen {
  id: string;
  insulin_name: string;
  regimen_type: 'basal' | 'bolus' | 'mixed' | 'pump_basal' | 'pump_bolus';
  dose_units: number | null;
  dose_time: string | null;
  notes: string | null;
}

interface InsulinProfile {
  name: string;
}

const PatientProfileWizard: React.FC = () => {
  const supabase = createClient();

  // Wizard state
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    display_name: '',
    diabetes_type: 'type_1' as 'type_1' | 'type_2' | 'gestational' | 'lada' | 'other',
    diagnosis_date: '',
    regimens: [] as Regimen[],
    dia_hours: 5.0,
    isf_mmol: null as number | null,
    icr: null as number | null,
    target_low_mmol: 4.0,
    target_high_mmol: 8.0,
    preferred_unit: 'mmol' as 'mmol' | 'mgdl',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch insulin names for selection
  const [insulinNames, setInsulinNames] = useState<string[]>([]);
  useEffect(() => {
    const fetchInsulins = async () => {
      const { data } = await supabase.from('insulin_profiles').select('name').order('name');
      if (data) setInsulinNames(data.map((i: InsulinProfile) => i.name));
    };
    fetchInsulins();
  }, []);

  // New regimen for adding
  const [newRegimen, setNewRegimen] = useState({
    insulin_name: '',
    regimen_type: 'basal' as 'basal' | 'bolus' | 'mixed' | 'pump_basal' | 'pump_bolus',
    dose_units: null as number | null,
    dose_time: '',
    notes: '',
  });

  // Computed values
  const conversions = useMemo(
    () => ({
      isf_mgdl: formData.isf_mmol ? formData.isf_mmol * 18.0182 : null,
      target_low_mgdl: formData.target_low_mmol * 18.0182,
      target_high_mgdl: formData.target_high_mmol * 18.0182,
    }),
    [formData.isf_mmol, formData.target_low_mmol, formData.target_high_mmol]
  );

  const hasTresiba = formData.regimens.some((r) => r.insulin_name.toLowerCase().includes('tresiba'));

  // Validation
  const validateStep = (s: number) => {
    if (s === 0) {
      return !formData.diabetes_type || !formData.diagnosis_date ? 'Please fill all required fields.' : '';
    }
    if (s === 1) {
      if (!formData.regimens.length) return 'Add at least one insulin regimen.';
    }
    if (s === 2) {
      if (formData.dia_hours < 2 || formData.dia_hours > 8) return 'DIA must be between 2 and 8 hours.';
      if (formData.isf_mmol && formData.isf_mmol <= 0) return 'ISF must be greater than 0.';
      if (formData.icr && formData.icr <= 0) return 'ICR must be greater than 0.';
      if (formData.target_low_mmol >= formData.target_high_mmol) return 'Target low must be less than target high.';
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handlePrev = () => setStep(step - 1);

  const addRegimen = () => {
    if (!newRegimen.insulin_name) return;
    const reg: Regimen = {
      ...newRegimen,
      id: crypto.randomUUID(),
    };
    const updated = [...formData.regimens, reg].sort((a, b) => a.insulin_name.localeCompare(b.insulin_name));
    setFormData({ ...formData, regimens: updated });
    setNewRegimen({
      insulin_name: '',
      regimen_type: 'basal',
      dose_units: null,
      dose_time: '',
      notes: '',
    });
  };

  const removeRegimen = (id: string) => {
    const updated = formData.regimens.filter((r) => r.id !== id);
    setFormData({ ...formData, regimens: updated });
  };

  const handleSubmit = async () => {
    const err = validateStep(2);
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('patient_profiles')
        .insert({
          display_name: formData.display_name || null,
          diabetes_type: formData.diabetes_type,
          diagnosis_date: formData.diagnosis_date || null,
        })
        .select('id')
        .single();

      if (profileError) throw profileError;

      const regimensToInsert = formData.regimens.map((r) => ({
        profile_id: profile.id,
        insulin_name: r.insulin_name,
        regimen_type: r.regimen_type,
        dose_units: r.dose_units,
        dose_time: r.dose_time || null,
        notes: r.notes || null,
        is_active: true,
      }));

      if (regimensToInsert.length) {
        const { error: regimenError } = await supabase.from('insulin_regimens').insert(regimensToInsert);
        if (regimenError) throw regimenError;
      }

      const { error: settingsError } = await supabase.from('patient_settings').insert({
        profile_id: profile.id,
        dia_hours: formData.dia_hours,
        isf_mmol: formData.isf_mmol,
        isf_mgdl: conversions.isf_mgdl,
        icr: formData.icr,
        target_low_mmol: formData.target_low_mmol,
        target_high_mmol: formData.target_high_mmol,
        target_low_mgdl: conversions.target_low_mgdl,
        target_high_mgdl: conversions.target_high_mgdl,
        preferred_unit: formData.preferred_unit,
      });

      if (settingsError) throw settingsError;

      window.location.href = '/profile';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const gradient = 'linear-gradient(to right, #0A2A5E, #22AABB)';
  const accent = '#BA7517';
  const primary = '#0d1b3e';

  return (
    <div style={{ padding: '16px', fontFamily: 'Arial, sans-serif', background: primary, minHeight: '100vh', color: 'white' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Patient Profile Setup</h1>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '20px', borderRadius: '8px', color: 'black' }}>
        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          {['Basics', 'Insulins', 'Settings', 'Review'].map((label, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px',
                background: i <= step ? gradient : '#CCC',
                color: 'white',
                borderRadius: '4px',
              }}
            >
              {label}
            </div>
          ))}
        </div>
        {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

        {/* Step 0: Basics */}
        {step === 0 && (
          <div>
            <label>Anonymous Display Name (optional):</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <label>Diabetes Type:</label>
            <select
              value={formData.diabetes_type}
              onChange={(e) => setFormData({ ...formData, diabetes_type: e.target.value as any })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            >
              <option value="type_1">Type 1</option>
              <option value="type_2">Type 2</option>
              <option value="gestational">Gestational</option>
              <option value="lada">LADA</option>
              <option value="other">Other</option>
            </select>
            <label>Diagnosis Date:</label>
            <input
              type="date"
              value={formData.diagnosis_date}
              onChange={(e) => setFormData({ ...formData, diagnosis_date: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
          </div>
        )}

        {/* Step 1: Regimens */}
        {step === 1 && (
          <div>
            <h3>Add Insulin Regimen</h3>
            <select
              value={newRegimen.insulin_name}
              onChange={(e) => setNewRegimen({ ...newRegimen, insulin_name: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            >
              <option value="">Select Insulin</option>
              {insulinNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={newRegimen.regimen_type}
              onChange={(e) => setNewRegimen({ ...newRegimen, regimen_type: e.target.value as any })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            >
              <option value="basal">Basal</option>
              <option value="bolus">Bolus</option>
              <option value="mixed">Mixed</option>
              <option value="pump_basal">Pump Basal</option>
              <option value="pump_bolus">Pump Bolus</option>
            </select>
            <input
              type="number"
              placeholder="Dose Units (optional)"
              value={newRegimen.dose_units || ''}
              onChange={(e) => setNewRegimen({ ...newRegimen, dose_units: e.target.value ? parseFloat(e.target.value) : null })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <input
              type="time"
              value={newRegimen.dose_time}
              onChange={(e) => setNewRegimen({ ...newRegimen, dose_time: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <textarea
              placeholder="Notes (optional)"
              value={newRegimen.notes}
              onChange={(e) => setNewRegimen({ ...newRegimen, notes: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <button onClick={addRegimen} style={{ background: gradient, color: 'white', border: 'none', padding: '10px', width: '100%' }}>
              Add Regimen
            </button>
            <ul style={{ marginTop: '20px', listStyle: 'none', padding: 0 }}>
              {formData.regimens.map((r) => (
                <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #ccc' }}>
                  <span>{r.insulin_name} ({r.regimen_type}) {r.dose_units && `${r.dose_units}U`} {r.dose_time}</span>
                  <button onClick={() => removeRegimen(r.id)} style={{ background: accent, color: 'white', border: 'none', padding: '4px' }}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Step 2: Settings */}
        {step === 2 && (
          <div>
            <label>Duration of Insulin Action (DIA) Hours: 2-8</label>
            <input
              type="number"
              min="2"
              max="8"
              step="0.1"
              value={formData.dia_hours}
              onChange={(e) => setFormData({ ...formData, dia_hours: parseFloat(e.target.value) })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            {hasTresiba && (
              <p style={{ fontSize: '12px', color: '#666' }}>
                Tresiba has a flat activity profile lasting ~42 hours. DIA setting applies to bolus insulins only.
              </p>
            )}
            <label>Preferred Unit:</label>
            <select
              value={formData.preferred_unit}
              onChange={(e) => setFormData({ ...formData, preferred_unit: e.target.value as any })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            >
              <option value="mmol">mmol/L</option>
              <option value="mgdl">mg/dL</option>
            </select>
            <label>Insulin Sensitivity Factor (ISF) - {formData.preferred_unit === 'mmol' ? 'mmol/L' : 'mg/dL'} per unit</label>
            <input
              type="number"
              step="0.01"
              value={formData.isf_mmol || ''}
              onChange={(e) => setFormData({ ...formData, isf_mmol: e.target.value ? parseFloat(e.target.value) : null })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            {conversions.isf_mgdl && (
              <p>Equivalent: {conversions.isf_mgdl.toFixed(2)} mmol/L per unit</p>
            )}
            <label>Insulin-to-Carb Ratio (ICR) grams per unit</label>
            <input
              type="number"
              step="0.01"
              value={formData.icr || ''}
              onChange={(e) => setFormData({ ...formData, icr: e.target.value ? parseFloat(e.target.value) : null })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <label>Target Blood Glucose Low - mmol/L</label>
            <input
              type="number"
              step="0.1"
              value={formData.target_low_mmol}
              onChange={(e) => setFormData({ ...formData, target_low_mmol: parseFloat(e.target.value) })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            {conversions.target_low_mgdl !== undefined && (
              <p>Equivalent: {conversions.target_low_mgdl.toFixed(1)} mg/dL</p>
            )}
            <label>Target Blood Glucose High - mmol/L</label>
            <input
              type="number"
              step="0.1"
              value={formData.target_high_mmol}
              onChange={(e) => setFormData({ ...formData, target_high_mmol: parseFloat(e.target.value) })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            {conversions.target_high_mgdl !== undefined && (
              <p>Equivalent: {conversions.target_high_mgdl.toFixed(1)} mg/dL</p>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <h3>Review Your Profile</h3>
            <p><strong>Type:</strong> {formData.diabetes_type}</p>
            <p><strong>Date:</strong> {formData.diagnosis_date}</p>
            <p><strong>DIA:</strong> {formData.dia_hours}h</p>
            <p><strong>Insulins:</strong></p>
            <ul>
              {formData.regimens.map((r) => <li key={r.id}>{r.insulin_name} - {r.regimen_type} {r.dose_units ? `(${r.dose_units}U)` : ''}</li>)}
            </ul>
            <p><strong>Range:</strong> {formData.target_low_mmol} - {formData.target_high_mmol} mmol/L</p>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          {step > 0 && (
            <button onClick={handlePrev} style={{ background: '#CCC', border: 'none', padding: '10px 20px' }}>
              Previous
            </button>
          )}
          {step < 3 && (
            <button onClick={handleNext} style={{ background: gradient, color: 'white', border: 'none', padding: '10px 20px' }}>
              Next
            </button>
          )}
          {step === 3 && (
            <button onClick={handleSubmit} disabled={loading} style={{ background: gradient, color: 'white', border: 'none', padding: '10px 20px' }}>
              {loading ? 'Saving...' : 'Confirm & Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfileWizard;
