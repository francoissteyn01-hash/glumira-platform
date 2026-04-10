// iob-engine.test.ts
import { describe, test, expect } from 'vitest';
import { calculateIOB, detectStacking, predictiveLowAlert, generateDecayCurve, InsulinProfile, InsulinDose, StackedCurvePoint } from './iob-engine';

// Mock data
const humalogProfile: InsulinProfile = {
  id: '1',
  brand_name: 'Humalog',
  generic_name: 'lispro',
  manufacturer: 'Lilly',
  category: 'rapid_acting',
  onset_minutes: 15,
  peak_start_minutes: 30,
  peak_end_minutes: 90,
  duration_minutes: 360,
  is_peakless: false,
  mechanism_notes: null,
  pk_source: 'FDA',
  decay_model: 'exponential',
  decay_parameters: { half_life_minutes: 90 },
  is_active: true,
  created_at: '2023-01-01',
};

const tresibaProfile: InsulinProfile = {
  id: '2',
  brand_name: 'Tresiba',
  generic_name: 'degludec',
  manufacturer: 'Novo',
  category: 'ultra_long_acting',
  onset_minutes: 60,
  peak_start_minutes: null,
  peak_end_minutes: null,
  duration_minutes: 2520,
  is_peakless: true,
  mechanism_notes: null,
  pk_source: 'FDA',
  decay_model: 'flat_depot',
  decay_parameters: { steady_rate_pct_per_hour: 2.38 },
  is_active: true,
  created_at: '2023-01-01',
};

const dose: InsulinDose = {
  id: 'd1',
  profile_id: 'p1',
  insulin_name: 'Humalog',
  dose_units: 4.0,
  administered_at: '2023-09-01T12:00:00Z',
  dose_type: 'bolus',
  carbs_grams: null,
  notes: null,
  source: 'manual',
  created_at: '2023-01-01',
};

describe('IOB Engine', () => {
  test('Rapid-acting IOB at various times', () => {
    expect(calculateIOB(dose, humalogProfile, 0)).toBeCloseTo(4.0);
    expect(calculateIOB(dose, humalogProfile, 30)).toBeCloseTo(4 * Math.exp(-Math.LN2 * 30 / 90), 2);
    expect(calculateIOB(dose, humalogProfile, 60)).toBeCloseTo(4 * Math.exp(-Math.LN2 * 60 / 90), 2);
    expect(calculateIOB(dose, humalogProfile, 120)).toBeCloseTo(4 * Math.exp(-Math.LN2 * 120 / 90), 2);
    expect(calculateIOB(dose, humalogProfile, 240)).toBeCloseTo(4 * Math.exp(-Math.LN2 * 240 / 90), 2);
    expect(calculateIOB(dose, humalogProfile, 300)).toBeCloseTo(4 * Math.exp(-Math.LN2 * 300 / 90), 2);
    expect(calculateIOB(dose, humalogProfile, 360)).toBeCloseTo(0);
  });

  test('Tresiba IOB - straight line, no peaks', () => {
    expect(calculateIOB({ ...dose, insulin_name: 'Tresiba' }, tresibaProfile, 0)).toBe(4.0);
    expect(calculateIOB({ ...dose, insulin_name: 'Tresiba' }, tresibaProfile, 500)).toBeCloseTo(4 * (1 - 500 / 2520));
    expect(calculateIOB({ ...dose, insulin_name: 'Tresiba' }, tresibaProfile, 2520)).toBe(0);
  });

  test('Stacking detection', () => {
    const doses = [
      dose,
      { ...dose, id: 'd2', administered_at: '2023-09-01T13:30:00Z' }, // 90 min later
    ];
    const alerts = detectStacking(doses, [humalogProfile], { dia_hours: 5, isf_mmol: 2.5, icr: 10, target_low_mmol: 4, target_high_mmol: 8 });
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].severity).toBe('WARNING'); // Check based on calculation
  });

  test('Predictive low alert', () => {
    const curve: StackedCurvePoint[] = [
      { time: new Date(Date.now() + 60 * 60000), totalIOB: 2.0, byInsulin: {} },
    ];
    const alert = predictiveLowAlert(curve, 5.0, 2.5, 4.0);
    expect(alert).toBeTruthy();
    if (alert) expect(alert.predictedBG).toBe(5.0 - 2.0 * 2.5); // 0.0 < 4.0
  });

  test('Decay curve generation', () => {
    const curve = generateDecayCurve(dose, humalogProfile, 5);
    expect(curve.length).toBe(73); // (360/5)+1
    expect(curve[0].iob).toBe(4.0);
    expect(curve[curve.length - 1].iob).toBe(0);
  });
});
