/**
 * GluMira™ Meal Regime Library
 * Version: 7.0.0
 * 
 * 20 culturally-aware meal profiles with hypo thresholds,
 * carb ranges, and timing patterns. Supports Ramadan fasting,
 * Yom Kippur, shift work, pregnancy, pediatric, and more.
 * 
 * Free Tier: MOD-MEAL — all 20 profiles accessible
 * 
 * DISCLAIMER: These profiles are educational references only.
 * Always follow your healthcare team's guidance.
 */

// ─── Types ───────────────────────────────────────────────────

export interface MealRegime {
  id: string;
  name: string;
  description: string;
  category: MealCategory;
  meals: MealSlot[];
  hypoThreshold: number;       // mg/dL — below this triggers hypo alert
  hyperThreshold: number;      // mg/dL — above this triggers hyper alert
  targetRange: { min: number; max: number }; // mg/dL
  culturalNotes?: string;
  fasting?: FastingConfig;
  isActive: boolean;
}

export interface MealSlot {
  name: string;
  timeWindow: { start: string; end: string }; // HH:MM format
  carbRange: { min: number; max: number };     // grams
  insulinTiming: 'before' | 'with' | 'after';
  preBolusMinutes?: number;                    // minutes before meal
  notes?: string;
}

export interface FastingConfig {
  type: 'intermittent' | 'religious' | 'medical';
  fastingHours: number;
  suhoorTime?: string;   // Pre-dawn meal (Ramadan)
  iftarTime?: string;    // Sunset meal (Ramadan)
  breakFastTime?: string; // General fast-breaking time
}

export type MealCategory =
  | 'standard'
  | 'pediatric'
  | 'pregnancy'
  | 'elderly'
  | 'shift-work'
  | 'religious-fasting'
  | 'athletic'
  | 'low-carb'
  | 'cultural';

// ─── Meal Regime Library (20 Profiles) ───────────────────────

export const MEAL_REGIMES: MealRegime[] = [
  // ── 1. Standard 3-Meal ──
  {
    id: 'standard-3meal',
    name: 'Standard 3-Meal',
    description: 'Traditional breakfast, lunch, dinner pattern with optional snacks.',
    category: 'standard',
    hypoThreshold: 70,
    hyperThreshold: 180,
    targetRange: { min: 70, max: 180 },
    meals: [
      { name: 'Breakfast', timeWindow: { start: '06:30', end: '08:30' }, carbRange: { min: 30, max: 60 }, insulinTiming: 'before', preBolusMinutes: 15 },
      { name: 'Lunch', timeWindow: { start: '11:30', end: '13:30' }, carbRange: { min: 40, max: 75 }, insulinTiming: 'before', preBolusMinutes: 15 },
      { name: 'Dinner', timeWindow: { start: '17:30', end: '19:30' }, carbRange: { min: 40, max: 75 }, insulinTiming: 'before', preBolusMinutes: 15 },
    ],
    isActive: true,
  },

  // ── 2. Standard 5-Meal (with snacks) ──
  {
    id: 'standard-5meal',
    name: 'Standard 5-Meal with Snacks',
    description: '3 main meals plus mid-morning and afternoon snacks.',
    category: 'standard',
    hypoThreshold: 70,
    hyperThreshold: 180,
    targetRange: { min: 70, max: 180 },
    meals: [
      { name: 'Breakfast', timeWindow: { start: '06:30', end: '08:00' }, carbRange: { min: 30, max: 50 }, insulinTiming: 'before', preBolusMinutes: 15 },
      { name: 'Mid-Morning Snack', timeWindow: { start: '10:00', end: '10:30' }, carbRange: { min: 10, max: 20 }, insulinTiming: 'with' },
      { name: 'Lunch', timeWindow: { start: '12:00', end: '13:00' }, carbRange: { min: 40, max: 65 }, insulinTiming: 'before', preBolusMinutes: 15 },
      { name: 'Afternoon Snack', timeWindow: { start: '15:00', end: '15:30' }, carbRange: { min: 10, max: 20 }, insulinTiming: 'with' },
      { name: 'Dinner', timeWindow: { start: '18:00', end: '19:30' }, carbRange: { min: 40, max: 65 }, insulinTiming: 'before', preBolusMinutes: 15 },
    ],
    isActive: true,
  },

  // ── 3. Pediatric (Ages 2–12) ──
  {
    id: 'pediatric-standard',
    name: 'Pediatric Standard',
    description: 'Adapted for children ages 2–12 with smaller portions and frequent snacks.',
    category: 'pediatric',
    hypoThreshold: 70,
    hyperThreshold: 200,
    targetRange: { min: 70, max: 180 },
    meals: [
      { name: 'Breakfast', timeWindow: { start: '07:00', end: '08:00' }, carbRange: { min: 20, max: 40 }, insulinTiming: 'after', notes: 'Dose after eating for unpredictable intake' },
      { name: 'Morning Snack', timeWindow: { start: '10:00', end: '10:30' }, carbRange: { min: 10, max: 20 }, insulinTiming: 'with' },
      { name: 'Lunch', timeWindow: { start: '12:00', end: '12:45' }, carbRange: { min: 25, max: 50 }, insulinTiming: 'after', notes: 'Dose after for school-age children' },
      { name: 'Afternoon Snack', timeWindow: { start: '15:00', end: '15:30' }, carbRange: { min: 10, max: 20 }, insulinTiming: 'with' },
      { name: 'Dinner', timeWindow: { start: '17:30', end: '18:30' }, carbRange: { min: 25, max: 50 }, insulinTiming: 'before', preBolusMinutes: 10 },
      { name: 'Bedtime Snack', timeWindow: { start: '19:30', end: '20:00' }, carbRange: { min: 10, max: 15 }, insulinTiming: 'with', notes: 'Prevents overnight lows' },
    ],
    isActive: true,
  },

  // ── 4. Pediatric Toddler (Ages 1–3) ──
  {
    id: 'pediatric-toddler',
    name: 'Pediatric Toddler',
    description: 'For toddlers with very unpredictable eating. Always dose AFTER meals.',
    category: 'pediatric',
    hypoThreshold: 70,
    hyperThreshold: 200,
    targetRange: { min: 80, max: 200 },
    meals: [
      { name: 'Breakfast', timeWindow: { start: '07:00', end: '08:30' }, carbRange: { min: 10, max: 25 }, insulinTiming: 'after', notes: 'Always dose after — toddlers are unpredictable' },
      { name: 'Morning Snack', timeWindow: { start: '09:30', end: '10:30' }, carbRange: { min: 5, max: 15 }, insulinTiming: 'after' },
      { name: 'Lunch', timeWindow: { start: '11:30', end: '12:30' }, carbRange: { min: 15, max: 30 }, insulinTiming: 'after' },
      { name: 'Afternoon Snack', timeWindow: { start: '14:30', end: '15:30' }, carbRange: { min: 5, max: 15 }, insulinTiming: 'after' },
      { name: 'Dinner', timeWindow: { start: '17:00', end: '18:00' }, carbRange: { min: 15, max: 30 }, insulinTiming: 'after' },
    ],
    isActive: true,
  },

  // ── 5. Pregnancy (Gestational / T1D in Pregnancy) ──
  {
    id: 'pregnancy',
    name: 'Pregnancy',
    description: 'Tighter targets for gestational diabetes or T1D during pregnancy.',
    category: 'pregnancy',
    hypoThreshold: 63,
    hyperThreshold: 140,
    targetRange: { min: 63, max: 140 },
    meals: [
      { name: 'Breakfast', timeWindow: { start: '06:30', end: '07:30' }, carbRange: { min: 15, max: 30 }, insulinTiming: 'before', preBolusMinutes: 20, notes: 'Dawn phenomenon often stronger in pregnancy' },
      { name: 'Mid-Morning Snack', timeWindow: { start: '09:30', end: '10:00' }, carbRange: { min: 10, max: 20 }, insulinTiming: 'with' },
      { name: 'Lunch', timeWindow: { start: '12:00', end: '13:00' }, carbRange: { min: 30, max: 50 }, insulinTiming: 'before', preBolusMinutes: 15 },
      { name: 'Afternoon Snack', timeWindow: { start: '15:00', end: '15:30' }, carbRange: { min: 10, max: 20 }, insulinTiming: 'with' },
      { name: 'Dinner', timeWindow: { start: '18:00', end: '19:00' }, carbRange: { min: 30, max: 50 }, insulinTiming: 'before', preBolusMinutes: 15 },
      { name: 'Bedtime Snack', timeWindow: { start: '21:00', end: '21:30' }, carbRange: { min: 10, max: 20 }, insulinTiming: 'with', notes: 'Protein-rich to prevent overnight lows' },
    ],
    isActive: true,
  },

  // ── 6. Ramadan Fasting ──
  {
    id: 'ramadan',
    name: 'Ramadan Fasting',
    description: 'Adapted for Ramadan with Suhoor (pre-dawn) and Iftar (sunset) meals.',
    category: 'religious-fasting',
    hypoThreshold: 70,
    hyperThreshold: 200,
    targetRange: { min: 70, max: 180 },
    culturalNotes: 'During Ramadan, insulin doses typically need 20-30% reduction. Monitor glucose frequently. Break fast immediately if glucose < 70 mg/dL.',
    fasting: {
      type: 'religious',
      fastingHours: 14,
      suhoorTime: '04:30',
      iftarTime: '18:30',
    },
    meals: [
      { name: 'Suhoor (Pre-Dawn)', timeWindow: { start: '03:30', end: '04:45' }, carbRange: { min: 40, max: 60 }, insulinTiming: 'before', preBolusMinutes: 10, notes: 'Complex carbs + protein for sustained energy. Reduce rapid insulin by 20-30%.' },
      { name: 'Iftar (Sunset)', timeWindow: { start: '18:15', end: '19:00' }, carbRange: { min: 50, max: 80 }, insulinTiming: 'before', preBolusMinutes: 10, notes: 'Start with dates and water. Main meal follows.' },
      { name: 'Late Evening Snack', timeWindow: { start: '21:00', end: '22:00' }, carbRange: { min: 20, max: 40 }, insulinTiming: 'with' },
    ],
    isActive: true,
  },

  // ── 7. Yom Kippur / 25-Hour Fast ──
  {
    id: 'yom-kippur',
    name: 'Yom Kippur Fast',
    description: '25-hour complete fast. Requires significant insulin adjustment.',
    category: 'religious-fasting',
    hypoThreshold: 70,
    hyperThreshold: 200,
    targetRange: { min: 70, max: 200 },
    culturalNotes: 'Reduce basal by 20-30%. No bolus during fast. Monitor every 2-4 hours. Break fast if glucose < 70 mg/dL.',
    fasting: {
      type: 'religious',
      fastingHours: 25,
      breakFastTime: '19:30',
    },
    meals: [
      { name: 'Pre-Fast Meal', timeWindow: { start: '17:00', end: '18:00' }, carbRange: { min: 50, max: 80 }, insulinTiming: 'before', preBolusMinutes: 15, notes: 'Complex carbs. Full bolus.' },
      { name: 'Break-Fast Meal', timeWindow: { start: '19:30', end: '20:30' }, carbRange: { min: 50, max: 80 }, insulinTiming: 'before', preBolusMinutes: 10, notes: 'Start slowly. Resume normal insulin.' },
    ],
    isActive: true,
  },

  // ── 8. Shift Work — Night Shift ──
  {
    id: 'shift-night',
    name: 'Night Shift Worker',
    description: 'Adapted for overnight workers (7PM–7AM pattern).',
    category: 'shift-work',
    hypoThreshold: 70,
    hyperThreshold: 180,
    targetRange: { min: 70, max: 180 },
    meals: [
      { name: 'Pre-Shift Dinner', timeWindow: { start: '17:30', end: '18:30' }, carbRange: { min: 40, max: 65 }, insulinTiming: 'before', preBolusMinutes: 15 },
      { name: 'Midnight Meal', timeWindow: { start: '23:30', end: '00:30' }, carbRange: { min: 30, max: 50 }, insulinTiming: 'before', preBolusMinutes: 10 },
      { name: 'End-of-Shift Snack', timeWindow: { start: '06:00', end: '07:00' }, carbRange: { min: 20, max: 35 }, insulinTiming: 'with' },
      { name: 'Post-Shift Breakfast', timeWindow: { start: '08:00', end: '09:00' }, carbRange: { min: 30, max: 50 }, insulinTiming: 'before', preBolusMinutes: 10 },
    ],
    isActive: true,
  },

  // ── 9. Shift Work — Rotating Shift ──
  {
    id: 'shift-rotating',
    name: 'Rotating Shift Worker',
    description: 'For workers alternating between day and night shifts.',
    category: 'shift-work',
    hypoThreshold: 70,
    hyperThreshold: 180,
    targetRange: { min: 70, max: 180 },
    meals: [
      { name: 'Meal 1', timeWindow: { start: '06:00', end: '08:00' }, carbRange: { min: 30, max: 55 }, insulinTiming: 'before', preBolusMinutes: 15, notes: 'Adjust timing based on current shift' },
      { name: 'Meal 2', timeWindow: { start: '12:00', end: '14:00' }, carbRange: { min: 35, max: 60 }, insulinTiming: 'before', preBolusMinutes: 15 },
      { name: 'Meal 3', timeWindow: { start: '18:00', end: '20:00' }, carbRange: { min: 35, max: 60 }, insulinTiming: 'before', preBolusMinutes: 15 },
    ],
    isActive: true,
  },

  // ── 10. Elderly (65+) ──
  {
    id: 'elderly',
    name: 'Elderly (65+)',
    description: 'Relaxed targets to reduce hypoglycemia risk in older adults.',
    category: 'elderly',
    hypoThreshold: 80,
    hyperThreshold: 200,
    targetRange: { min: 80, max: 200 },
    meals: [
      { name: 'Breakfast', timeWindow: { start: '07:00', end: '09:00' }, carbRange: { min: 25, max: 45 }, insulinTiming: 'with', notes: 'Dose with meal to reduce hypo risk' },
      { name: 'Lunch', timeWindow: { start: '11:30', end: '13:00' }, carbRange: { min: 30, max: 55 }, insulinTiming: 'with' },
      { name: 'Afternoon Snack', timeWindow: { start: '15:00', end: '16:00' }, carbRange: { min: 10, max: 20 }, insulinTiming: 'with' },
      { name: 'Dinner', timeWindow: { start: '17:00', end: '18:30' }, carbRange: { min: 30, max: 55 }, insulinTiming: 'with' },
    ],
    isActive: true,
  },

  // ── 11. Low-Carb / Keto ──
  {
    id: 'low-carb',
    name: 'Low-Carb / Keto',
    description: 'Under 50g carbs/day. Requires significant insulin reduction.',
    category: 'low-carb',
    hypoThreshold: 70,
    hyperThreshold: 160,
    targetRange: { min: 70, max: 140 },
    meals: [
      { name: 'Breakfast', timeWindow: { start: '07:00', end: '09:00' }, carbRange: { min: 5, max: 15 }, insulinTiming: 'with', notes: 'Protein-heavy. Minimal bolus needed.' },
      { name: 'Lunch', timeWindow: { start: '12:00', end: '13:30' }, carbRange: { min: 5, max: 15 }, insulinTiming: 'with' },
      { name: 'Dinner', timeWindow: { start: '18:00', end: '19:30' }, carbRange: { min: 5, max: 20 }, insulinTiming: 'with' },
    ],
    isActive: true,
  },

  // ── 12. Mediterranean ──
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    description: 'Olive oil, whole grains, fish, vegetables. Moderate carb, high fiber.',
    category: 'cultural',
    hypoThreshold: 70,
    hyperThreshold: 180,
    targetRange: { min: 70, max: 180 },
    meals: [
      { name: 'Breakfast', timeWindow: { start: '07:00', end: '08:30' }, carbRange: { min: 25, max: 45 }, insulinTiming: 'before', preBolusMinutes: 10, notes: 'Whole grain bread, olive oil, fruit' },
      { name: 'Lunch (Main Meal)', timeWindow: { start: '13:00', end: '14:30' }, carbRange: { min: 45, max: 70 }, insulinTiming: 'before', preBolusMinutes: 15, notes: 'Largest meal of the day' },
      { name: 'Light Dinner', timeWindow: { start: '20:00', end: '21:00' }, carbRange: { min: 20, max: 40 }, insulinTiming: 'before', preBolusMinutes: 10 },
    ],
    isActive: true,
  },

  // ── 13. South Asian ──
  {
    id: 'south-asian',
    name: 'South Asian',
    description: 'Rice/roti-based meals with higher glycemic index. Adjusted timing.',
    category: 'cultural',
    hypoThreshold: 70,
    hyperThreshold: 180,
    targetRange: { min: 70, max: 180 },
    culturalNotes: 'Rice and roti have high GI. Extended pre-bolus recommended.',
    meals: [
      { name: 'Breakfast', timeWindow: { start: '07:00', end: '08:30' }, carbRange: { min: 35, max: 60 }, insulinTiming: 'before', preBolusMinutes: 20, notes: 'Paratha/roti — high GI, longer pre-bolus' },
      { name: 'Lunch', timeWindow: { start: '12:30', end: '14:00' }, carbRange: { min: 50, max: 80 }, insulinTiming: 'before', preBolusMinutes: 20, notes: 'Rice-based — consider extended bolus' },
      { name: 'Tea Time', timeWindow: { start: '16:00', end: '17:00' }, carbRange: { min: 15, max: 30 }, insulinTiming: 'with' },
      { name: 'Dinner', timeWindow: { start: '20:00', end: '21:30' }, carbRange: { min: 50, max: 80 }, insulinTiming: 'before', preBolusMinutes: 20 },
    ],
    isActive: true,
  },

  // ── 14. East African ──
  {
    id: 'east-african',
    name: 'East African',
    description: 'Ugali, injera, stew-based meals common in Kenya, Tanzania, Ethiopia.',
    category: 'cultural',
    hypoThreshold: 70,
    hyperThreshold: 180,
    targetRange: { min: 70, max: 180 },
    meals: [
      { name: 'Breakfast', timeWindow: { start: '06:30', end: '08:00' }, carbRange: { min: 30, max: 50 }, insulinTiming: 'before', preBolusMinutes: 15, notes: 'Mandazi, chai, porridge' },
      { name: 'Lunch', timeWindow: { start: '12:00', end: '13:30' }, carbRange: { min: 45, max: 75 }, insulinTiming: 'before', preBolusMinutes: 15, notes: 'Ugali/rice with stew' },
      { name: 'Dinner', timeWindow: { start: '18:30', end: '20:00' }, carbRange: { min: 45, max: 75 }, insulinTiming: 'before', preBolusMinutes: 15 },
    ],
    isActive: true,
  },

  // ── 15. Southern African / Namibian ──
  {
    id: 'southern-african',
    name: 'Southern African / Namibian',
    description: 'Pap, braai, biltong-based meals. Built in Namibia, designed for the world.',
    category: 'cultural',
    hypoThreshold: 70,
    hyperThreshold: 180,
    targetRange: { min: 70, max: 180 },
    culturalNotes: 'Pap (maize porridge) has very high GI. Pre-bolus essential.',
    meals: [
      { name: 'Breakfast', timeWindow: { start: '06:30', end: '08:00' }, carbRange: { min: 30, max: 55 }, insulinTiming: 'before', preBolusMinutes: 15, notes: 'Pap with milk, or bread with tea' },
      { name: 'Lunch', timeWindow: { start: '12:00', end: '13:30' }, carbRange: { min: 40, max: 70 }, insulinTiming: 'before', preBolusMinutes: 20, notes: 'Pap with meat/relish — high GI' },
      { name: 'Dinner', timeWindow: { start: '18:00', end: '19:30' }, carbRange: { min: 40, max: 70 }, insulinTiming: 'before', preBolusMinutes: 15, notes: 'Braai or stew with pap/rice' },
    ],
    isActive: true,
  },

  // ── 16. Athletic / High Activity ──
  {
    id: 'athletic',
    name: 'Athletic / High Activity',
    description: 'For active individuals. Higher carb intake, adjusted insulin timing.',
    category: 'athletic',
    hypoThreshold: 80,
    hyperThreshold: 200,
    targetRange: { min: 80, max: 180 },
    meals: [
      { name: 'Pre-Exercise Meal', timeWindow: { start: '06:00', end: '07:00' }, carbRange: { min: 40, max: 70 }, insulinTiming: 'before', preBolusMinutes: 30, notes: 'Reduce bolus by 25-50% before exercise' },
      { name: 'Post-Exercise Recovery', timeWindow: { start: '09:00', end: '10:00' }, carbRange: { min: 30, max: 50 }, insulinTiming: 'with', notes: 'Fast carbs + protein. Reduced insulin.' },
      { name: 'Lunch', timeWindow: { start: '12:30', end: '13:30' }, carbRange: { min: 50, max: 80 }, insulinTiming: 'before', preBolusMinutes: 15 },
      { name: 'Afternoon Snack', timeWindow: { start: '15:30', end: '16:00' }, carbRange: { min: 20, max: 35 }, insulinTiming: 'with' },
      { name: 'Dinner', timeWindow: { start: '18:30', end: '19:30' }, carbRange: { min: 50, max: 80 }, insulinTiming: 'before', preBolusMinutes: 15 },
    ],
    isActive: true,
  },

  // ── 17. Intermittent Fasting (16:8) ──
  {
    id: 'intermittent-fasting-16-8',
    name: 'Intermittent Fasting 16:8',
    description: '16 hours fasting, 8-hour eating window.',
    category: 'standard',
    hypoThreshold: 70,
    hyperThreshold: 180,
    targetRange: { min: 70, max: 180 },
    fasting: {
      type: 'intermittent',
      fastingHours: 16,
    },
    meals: [
      { name: 'First Meal', timeWindow: { start: '12:00', end: '13:00' }, carbRange: { min: 40, max: 65 }, insulinTiming: 'before', preBolusMinutes: 15, notes: 'Break fast gently' },
      { name: 'Snack', timeWindow: { start: '15:00', end: '16:00' }, carbRange: { min: 15, max: 30 }, insulinTiming: 'with' },
      { name: 'Last Meal', timeWindow: { start: '19:00', end: '20:00' }, carbRange: { min: 40, max: 65 }, insulinTiming: 'before', preBolusMinutes: 15 },
    ],
    isActive: true,
  },

  // ── 18. School-Age Child (6–12) ──
  {
    id: 'school-age',
    name: 'School-Age Child',
    description: 'Structured around school hours with teacher/nurse-assisted dosing.',
    category: 'pediatric',
    hypoThreshold: 70,
    hyperThreshold: 200,
    targetRange: { min: 70, max: 200 },
    meals: [
      { name: 'Breakfast (Home)', timeWindow: { start: '06:30', end: '07:30' }, carbRange: { min: 25, max: 45 }, insulinTiming: 'before', preBolusMinutes: 10 },
      { name: 'Morning Break (School)', timeWindow: { start: '10:00', end: '10:30' }, carbRange: { min: 10, max: 20 }, insulinTiming: 'with', notes: 'School nurse may assist' },
      { name: 'Lunch (School)', timeWindow: { start: '12:30', end: '13:15' }, carbRange: { min: 30, max: 50 }, insulinTiming: 'before', preBolusMinutes: 5, notes: 'Pre-packed lunch with known carbs' },
      { name: 'After-School Snack', timeWindow: { start: '15:00', end: '16:00' }, carbRange: { min: 15, max: 25 }, insulinTiming: 'with' },
      { name: 'Dinner', timeWindow: { start: '18:00', end: '19:00' }, carbRange: { min: 30, max: 50 }, insulinTiming: 'before', preBolusMinutes: 10 },
    ],
    isActive: true,
  },

  // ── 19. Gastroparesis ──
  {
    id: 'gastroparesis',
    name: 'Gastroparesis',
    description: 'Delayed gastric emptying. Smaller, more frequent meals with delayed bolus.',
    category: 'standard',
    hypoThreshold: 70,
    hyperThreshold: 200,
    targetRange: { min: 70, max: 180 },
    meals: [
      { name: 'Breakfast', timeWindow: { start: '07:00', end: '08:00' }, carbRange: { min: 15, max: 30 }, insulinTiming: 'after', notes: 'Dose 15-20 min AFTER eating due to delayed absorption' },
      { name: 'Mid-Morning', timeWindow: { start: '10:00', end: '10:30' }, carbRange: { min: 10, max: 20 }, insulinTiming: 'after' },
      { name: 'Lunch', timeWindow: { start: '12:00', end: '13:00' }, carbRange: { min: 15, max: 30 }, insulinTiming: 'after' },
      { name: 'Afternoon', timeWindow: { start: '15:00', end: '15:30' }, carbRange: { min: 10, max: 20 }, insulinTiming: 'after' },
      { name: 'Dinner', timeWindow: { start: '18:00', end: '19:00' }, carbRange: { min: 15, max: 30 }, insulinTiming: 'after' },
      { name: 'Evening', timeWindow: { start: '21:00', end: '21:30' }, carbRange: { min: 10, max: 15 }, insulinTiming: 'after' },
    ],
    isActive: true,
  },

  // ── 20. Lent / Christian Fasting ──
  {
    id: 'lent-fasting',
    name: 'Lent / Christian Fasting',
    description: 'Reduced meals during Lent. One full meal, two smaller meals.',
    category: 'religious-fasting',
    hypoThreshold: 70,
    hyperThreshold: 180,
    targetRange: { min: 70, max: 180 },
    culturalNotes: 'During Lent, one full meal and two smaller meals that together do not equal a full meal.',
    meals: [
      { name: 'Light Breakfast', timeWindow: { start: '07:00', end: '08:00' }, carbRange: { min: 15, max: 25 }, insulinTiming: 'with' },
      { name: 'Main Meal (Lunch)', timeWindow: { start: '12:00', end: '13:00' }, carbRange: { min: 45, max: 70 }, insulinTiming: 'before', preBolusMinutes: 15 },
      { name: 'Light Supper', timeWindow: { start: '18:00', end: '19:00' }, carbRange: { min: 15, max: 25 }, insulinTiming: 'with' },
    ],
    isActive: true,
  },
];

// ─── Helper Functions ────────────────────────────────────────

/** Get a meal regime by ID */
export function getMealRegime(id: string): MealRegime | undefined {
  return MEAL_REGIMES.find(r => r.id === id);
}

/** Get all regimes for a specific category */
export function getRegimesByCategory(category: MealCategory): MealRegime[] {
  return MEAL_REGIMES.filter(r => r.category === category);
}

/** Get all active regimes */
export function getActiveRegimes(): MealRegime[] {
  return MEAL_REGIMES.filter(r => r.isActive);
}

/** Get all fasting regimes */
export function getFastingRegimes(): MealRegime[] {
  return MEAL_REGIMES.filter(r => r.fasting !== undefined);
}

/** Get all categories */
export function getMealCategories(): MealCategory[] {
  return Array.from(new Set(MEAL_REGIMES.map(r => r.category)));
}

/** Search regimes by name or description */
export function searchRegimes(query: string): MealRegime[] {
  const lower = query.toLowerCase();
  return MEAL_REGIMES.filter(r =>
    r.name.toLowerCase().includes(lower) ||
    r.description.toLowerCase().includes(lower) ||
    r.category.toLowerCase().includes(lower)
  );
}
