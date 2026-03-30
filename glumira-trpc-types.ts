// ============================================================
// GluMira™ V7 — tRPC Procedures + TypeScript Types
// Stack: Express + tRPC + Drizzle + Supabase
// Version: v1.0 · 2026-03-29
// Source: Phase 2 Master Execution Plan §1.3–1.8
// ============================================================

// ── FILE: server/types/glumira.ts ───────────────────────────

export type UserRole         = 'user' | 'clinician' | 'admin';
export type DiagnosisType    = 'T1D' | 'T2D' | 'Gestational';
export type GenderType       = 'M' | 'F' | 'Other';
export type ModuleType       = 'pediatric' | 'school' | 'pregnancy' | 'menstrual_cycle';
export type TierType         = 'free' | 'pro' | 'ai';
export type RegionType       = 'AF' | 'UAE' | 'UK' | 'EU' | 'US' | 'INT';
export type RiskZone         = 'safe' | 'caution' | 'elevated' | 'high';
export type CyclePhase       = 'follicular' | 'ovulation' | 'luteal' | 'menstruation';
export type PermissionLevel  = 'view' | 'edit';

export type InsulinType =
  | 'glargine_u100' | 'glargine_u300' | 'degludec' | 'detemir' | 'nph'
  | 'aspart' | 'lispro' | 'glulisine' | 'regular';

// ── Insulin pharmacokinetics reference (spec 01.1) ──
export const INSULIN_PARAMS: Record<InsulinType, {
  name: string; type: 'basal' | 'bolus'; doa: number; onset: number; peak: number;
}> = {
  glargine_u100: { name: 'Glargine (Lantus)',      type: 'basal',  doa: 24,  onset: 1,    peak: 0    },
  glargine_u300: { name: 'Glargine U300 (Toujeo)', type: 'basal',  doa: 36,  onset: 2,    peak: 0    },
  degludec:      { name: 'Degludec (Tresiba)',     type: 'basal',  doa: 42,  onset: 1,    peak: 0    },
  detemir:       { name: 'Detemir (Levemir)',      type: 'basal',  doa: 20,  onset: 1.5,  peak: 0    },
  nph:           { name: 'NPH',                    type: 'basal',  doa: 14,  onset: 3,    peak: 6    },
  aspart:        { name: 'Aspart (NovoRapid)',     type: 'bolus',  doa: 4,   onset: 0.25, peak: 1.25 },
  lispro:        { name: 'Lispro (Humalog)',       type: 'bolus',  doa: 4,   onset: 0.25, peak: 1    },
  glulisine:     { name: 'Glulisine (Apidra)',     type: 'bolus',  doa: 3.5, onset: 0.25, peak: 1    },
  regular:       { name: 'Regular (Actrapid)',     type: 'bolus',  doa: 7,   onset: 0.75, peak: 2.5  },
};

export interface PatientProfile {
  id:              string;
  clinicianId:     string;
  patientName:     string;
  dateOfBirth:     string;
  gender:          GenderType;
  diagnosis:       DiagnosisType;
  diagnosisDate?:  string;
  photoUrl?:       string;
  nightscoutUrl?:  string;
  tdd?:            number;
  typicalBasalDose?: number;
  glucoseTargetLow:  number;
  glucoseTargetHigh: number;
  glucoseUnit:     'mmol' | 'mgdl';
  isActive:        boolean;
  createdAt:       string;
  updatedAt:       string;
}

export interface DoseLogEntry {
  id:             string;
  patientId:      string;
  insulinType:    InsulinType;
  doseUnits:      number;
  administeredAt: string;
  doseReason?:    'basal' | 'meal_bolus' | 'correction';
  carbsG?:        number;
  glucoseAtTime?: number;
  notes?:         string;
  iobAtTime?:     number;
  createdBy:      string;
  createdAt:      string;
}

export interface IOBResult {
  totalIOB:        number;
  stackingScore:   number;
  riskZone:        RiskZone;
  isf:             number;
  icr:             number;
  correctionDose:  number;
  netCorrection:   number;
  mealBolus:       number;
  totalBolus:      number;
  optimalNextDoseH: number;
  doseBreakdown:   Array<{
    doseId:        string;
    insulinType:   InsulinType;
    doseUnits:     number;
    hoursElapsed:  number;
    residualIOB:   number;
    pctRemaining:  number;
  }>;
  calculatedAt:    string;
}


// ── FILE: server/lib/iob-engine.ts ──────────────────────────
// IOB Hunter™ Core Engine (spec 01.1) — server-side implementation

/**
 * Decay constant: λ = ln(2) / (DOA × 0.5)
 */
export function getLambda(doa: number): number {
  return Math.LN2 / (doa * 0.5);
}

/**
 * IOB(t) = dose × e^(−λt)
 * First-order exponential decay model per spec 01.1 §2.1
 */
export function calcIOB(dose: number, hoursElapsed: number, doa: number): number {
  const lambda = getLambda(doa);
  return Math.max(0, dose * Math.exp(-lambda * hoursElapsed));
}

/**
 * Total IOB from all doses
 */
export function calcTotalIOB(doses: Array<{
  doseUnits: number;
  hoursElapsed: number;
  insulinType: InsulinType;
}>): number {
  return doses.reduce((sum, d) => {
    const doa = INSULIN_PARAMS[d.insulinType].doa;
    return sum + calcIOB(d.doseUnits, d.hoursElapsed, doa);
  }, 0);
}

/**
 * Stacking score: min(100, (totalIOB / typicalBasalDose) × 100)
 * Spec 01.1 §4.2
 */
export function calcStackingScore(totalIOB: number, typicalBasalDose: number): number {
  return Math.min(100, (totalIOB / typicalBasalDose) * 100);
}

export function getStackingRiskZone(score: number): RiskZone {
  if (score <= 30) return 'safe';
  if (score <= 55) return 'caution';
  if (score <= 75) return 'elevated';
  return 'high';
}

/**
 * ISF — 100 Rule (mmol/L) for rapid-acting analogues
 * Spec 01.3 §3.1
 */
export function calcISF(tdd: number): number {
  return 100 / tdd;
}

/**
 * ICR — 500 Rule
 * Spec 01.3 §4.1
 */
export function calcICR(tdd: number): number {
  return 500 / tdd;
}

/**
 * Correction dose calculation
 * Spec 01.3 §5
 */
export function calcCorrectionDose(
  currentGlucose: number,
  targetGlucose: number,
  isf: number
): number {
  return (currentGlucose - targetGlucose) / isf;
}

/**
 * Net correction after subtracting active IOB
 * Spec 01.1 §6
 */
export function calcNetCorrection(correctionDose: number, totalIOB: number): number {
  return Math.max(0, correctionDose - totalIOB);
}

/**
 * Meal bolus: carbGrams / ICR
 * Spec 01.1 §7
 */
export function calcMealBolus(carbGrams: number, icr: number): number {
  return carbGrams / icr;
}

/**
 * Total bolus = mealBolus + netCorrection (clamped to ≥0)
 * Spec 01.1 §7
 */
export function calcTotalBolus(mealBolus: number, netCorrection: number): number {
  return Math.max(0, mealBolus + netCorrection);
}

/**
 * Optimal timing: binary search for when totalIOB < 20% of basal
 * Spec 01.1 §5 — solved with 0.1h resolution
 */
export function calcOptimalDoseTime(
  doses: Array<{ doseUnits: number; hoursElapsed: number; insulinType: InsulinType }>,
  typicalBasalDose: number,
  maxHours = 48
): number {
  const safeThreshold = typicalBasalDose * 0.20;
  const totalAtT = (t: number) =>
    doses.reduce((sum, d) => {
      const doa = INSULIN_PARAMS[d.insulinType].doa;
      return sum + calcIOB(d.doseUnits, d.hoursElapsed + t, doa);
    }, 0);

  if (totalAtT(0) <= safeThreshold) return 0;

  let lo = 0, hi = maxHours;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (totalAtT(mid) <= safeThreshold) hi = mid;
    else lo = mid;
  }
  return Math.round(hi * 10) / 10; // 0.1h resolution
}

/**
 * Full IOB calculation — main entry point
 */
export function runIOBEngine(params: {
  doses: DoseLogEntry[];
  tdd: number;
  typicalBasalDose: number;
  currentGlucose: number;
  targetGlucose: number;
  carbGrams?: number;
  isfOverride?: number;
  icrOverride?: number;
}): IOBResult {
  const now = new Date();
  const { doses, tdd, typicalBasalDose, currentGlucose, targetGlucose, carbGrams = 0 } = params;

  const isf = params.isfOverride ?? calcISF(tdd);
  const icr = params.icrOverride ?? calcICR(tdd);

  const doseBreakdown = doses.map(d => {
    const hoursElapsed = (now.getTime() - new Date(d.administeredAt).getTime()) / 3_600_000;
    const doa = INSULIN_PARAMS[d.insulinType].doa;
    const residualIOB = calcIOB(d.doseUnits, hoursElapsed, doa);
    return {
      doseId:        d.id,
      insulinType:   d.insulinType,
      doseUnits:     d.doseUnits,
      hoursElapsed:  Math.round(hoursElapsed * 10) / 10,
      residualIOB:   Math.round(residualIOB * 1000) / 1000,
      pctRemaining:  d.doseUnits > 0 ? Math.round((residualIOB / d.doseUnits) * 100) : 0,
    };
  });

  const totalIOB = doseBreakdown.reduce((sum, d) => sum + d.residualIOB, 0);
  const stackingScore = calcStackingScore(totalIOB, typicalBasalDose);
  const riskZone = getStackingRiskZone(stackingScore);
  const correctionDose = calcCorrectionDose(currentGlucose, targetGlucose, isf);
  const netCorrection = calcNetCorrection(correctionDose, totalIOB);
  const mealBolus = carbGrams > 0 ? calcMealBolus(carbGrams, icr) : 0;
  const totalBolus = calcTotalBolus(mealBolus, netCorrection);
  const optimalNextDoseH = calcOptimalDoseTime(
    doseBreakdown.map(d => ({ doseUnits: d.doseUnits, hoursElapsed: d.hoursElapsed, insulinType: d.insulinType })),
    typicalBasalDose
  );

  return {
    totalIOB:         Math.round(totalIOB * 1000) / 1000,
    stackingScore:    Math.round(stackingScore * 10) / 10,
    riskZone,
    isf:              Math.round(isf * 100) / 100,
    icr:              Math.round(icr * 100) / 100,
    correctionDose:   Math.round(correctionDose * 100) / 100,
    netCorrection:    Math.round(netCorrection * 100) / 100,
    mealBolus:        Math.round(mealBolus * 100) / 100,
    totalBolus:       Math.round(totalBolus * 100) / 100,
    optimalNextDoseH,
    doseBreakdown,
    calculatedAt:     now.toISOString(),
  };
}


// ── FILE: server/router.ts ───────────────────────────────────
// tRPC router — all procedures from spec Phase 2 §1.3–1.8

import { z } from 'zod';
// import { router, publicProcedure, clinicianProcedure, caregiverProcedure } from './trpc';
// import { db } from './db'; // Drizzle instance

// ─ Input validators ──────────────────────────────────────────

const CreatePatientInput = z.object({
  patientName:    z.string().min(1).max(255),
  dateOfBirth:    z.string(),  // ISO date
  gender:         z.enum(['M', 'F', 'Other']),
  diagnosis:      z.enum(['T1D', 'T2D', 'Gestational']),
  diagnosisDate:  z.string().optional(),
  tdd:            z.number().min(2).max(300).optional(),
  typicalBasalDose: z.number().min(1).max(300).optional(),
  glucoseTargetLow:  z.number().min(3.0).max(7.0).default(4.4),
  glucoseTargetHigh: z.number().min(7.0).max(14.0).default(10.0),
  glucoseUnit:    z.enum(['mmol', 'mgdl']).default('mmol'),
  modules:        z.array(z.enum(['pediatric','school','pregnancy','menstrual_cycle'])).optional(),
});

const UpdateCurvesInput = z.object({
  patientId:   z.string().uuid(),
  profileName: z.string().min(1).max(100),
  carbRatio:   z.number().min(2).max(50).optional(),    // ICR: g/U
  isf:         z.number().min(0.5).max(15).optional(),  // ISF: mmol/L per U
  glucoseTargetLow:  z.number().optional(),
  glucoseTargetHigh: z.number().optional(),
  basalRates:  z.array(z.object({
    hour: z.number().int().min(0).max(23),
    rate: z.number().min(0).max(20),
  })).optional(),
});

const LogDoseInput = z.object({
  patientId:      z.string().uuid(),
  insulinType:    z.enum(['glargine_u100','glargine_u300','degludec','detemir','nph','aspart','lispro','glulisine','regular']),
  doseUnits:      z.number().min(0.5).max(200),
  administeredAt: z.string(),  // ISO datetime
  doseReason:     z.enum(['basal','meal_bolus','correction']).optional(),
  carbsG:         z.number().min(0).max(500).optional(),
  glucoseAtTime:  z.number().min(0).max(40).optional(),
  notes:          z.string().max(1000).optional(),
});

const CalcIOBInput = z.object({
  patientId:        z.string().uuid(),
  currentGlucose:   z.number().min(0).max(40).optional(),
  targetGlucose:    z.number().min(3.5).max(12).optional(),
  carbGrams:        z.number().min(0).max(500).optional().default(0),
  isfOverride:      z.number().min(0.5).max(15).optional(),
  icrOverride:      z.number().min(2).max(50).optional(),
});

const CreateShareLinkInput = z.object({
  patientId:       z.string().uuid(),
  caregiverEmail:  z.string().email(),
  permissionLevel: z.enum(['view','edit']).default('view'),
  expiresInDays:   z.number().int().min(1).max(90).optional().default(90),
});

const BookAppointmentInput = z.object({
  patientId:       z.string().uuid(),
  appointmentDate: z.string(),  // ISO datetime
  purpose:         z.string().max(255).optional(),
  notes:           z.string().max(1000).optional(),
});

const UpdateMenstrualInput = z.object({
  patientId:        z.string().uuid(),
  cycleStartDate:   z.string(),
  cycleLengthDays:  z.number().int().min(21).max(45).default(28),
  follicularISFMult: z.number().min(0.5).max(2.0).optional(),
  lutealISFMult:    z.number().min(0.5).max(2.0).optional(),
  notes:            z.string().max(1000).optional(),
});

// ─ tRPC Procedures ───────────────────────────────────────────
// NOTE: Uncomment and connect to your Drizzle db instance.

/*
export const appRouter = router({

  // ── 1.3 clinician.createPatient ─────────────────────────
  'clinician.createPatient': clinicianProcedure
    .input(CreatePatientInput)
    .mutation(async ({ input, ctx }) => {
      const patient = await db.insert(patientProfiles).values({
        clinicianId:   ctx.user.id,
        patientName:   input.patientName,
        dateOfBirth:   input.dateOfBirth,
        gender:        input.gender,
        diagnosis:     input.diagnosis,
        diagnosisDate: input.diagnosisDate,
        tdd:           input.tdd,
        typicalBasalDose: input.typicalBasalDose,
        glucoseTargetLow:  input.glucoseTargetLow,
        glucoseTargetHigh: input.glucoseTargetHigh,
        glucoseUnit:   input.glucoseUnit,
      }).returning();

      // Activate requested modules
      if (input.modules?.length) {
        await db.insert(patientModules).values(
          input.modules.map(m => ({ patientId: patient[0].id, moduleType: m }))
        );
      }

      return patient[0];
    }),

  // ── 1.4 clinician.updateCurves ──────────────────────────
  'clinician.updateCurves': clinicianProcedure
    .input(UpdateCurvesInput)
    .mutation(async ({ input, ctx }) => {
      await assertPatientAccess(ctx.user.id, input.patientId, db);
      return db.insert(insulinProfiles).values({
        patientId:    input.patientId,
        profileName:  input.profileName,
        carbRatio:    input.carbRatio,
        isf:          input.isf,
        glucoseTargetLow:  input.glucoseTargetLow,
        glucoseTargetHigh: input.glucoseTargetHigh,
        basalRates:   input.basalRates,
      }).onConflictDoUpdate({ target: [insulinProfiles.patientId, insulinProfiles.profileName], set: { ...input } })
        .returning();
    }),

  // ── 1.5 clinician.uploadMedia ───────────────────────────
  'clinician.uploadMedia': clinicianProcedure
    .input(z.object({
      patientId:   z.string().uuid(),
      mediaType:   z.enum(['photo','file']),
      fileType:    z.string().max(10),
      storagePath: z.string(),
      description: z.string().max(255).optional(),
      fileSizeBytes: z.number().int().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await assertPatientAccess(ctx.user.id, input.patientId, db);
      const tier = await getUserTier(ctx.user.id, db);
      const expiresAt = tier === 'free' ? addMonths(new Date(), 3) : null;

      return db.insert(patientMedia).values({
        ...input,
        uploadedBy: ctx.user.id,
        expiresAt,
      }).returning();
    }),

  // ── 1.6 sharing.createLink ──────────────────────────────
  'sharing.createLink': clinicianProcedure
    .input(CreateShareLinkInput)
    .mutation(async ({ input, ctx }) => {
      await assertPatientAccess(ctx.user.id, input.patientId, db);
      const expiresAt = addDays(new Date(), input.expiresInDays ?? 90);
      return db.insert(caregiverShares).values({
        patientId:      input.patientId,
        caregiverEmail: input.caregiverEmail,
        permissionLevel: input.permissionLevel,
        createdBy:      ctx.user.id,
        expiresAt,
      }).returning();
    }),

  // ── 1.7 appointments.book ───────────────────────────────
  'appointments.book': clinicianProcedure
    .input(BookAppointmentInput)
    .mutation(async ({ input, ctx }) => {
      await assertPatientAccess(ctx.user.id, input.patientId, db);
      return db.insert(appointments).values({
        patientId:       input.patientId,
        clinicianId:     ctx.user.id,
        appointmentDate: new Date(input.appointmentDate),
        purpose:         input.purpose,
        notes:           input.notes,
      }).returning();
    }),

  // ── 1.8 menstrual.updateCycle ───────────────────────────
  'menstrual.updateCycle': clinicianProcedure
    .input(UpdateMenstrualInput)
    .mutation(async ({ input, ctx }) => {
      await assertPatientAccess(ctx.user.id, input.patientId, db);
      return db.insert(menstrualCycles).values({
        patientId:         input.patientId,
        cycleStartDate:    input.cycleStartDate,
        cycleLengthDays:   input.cycleLengthDays,
        follicularISFMult: input.follicularISFMult,
        lutealISFMult:     input.lutealISFMult,
        notes:             input.notes,
      }).onConflictDoUpdate({ target: [menstrualCycles.patientId, menstrualCycles.cycleStartDate], set: { ...input } })
        .returning();
    }),

  // ── IOB Engine procedure ─────────────────────────────────
  'iob.calculate': clinicianProcedure
    .input(CalcIOBInput)
    .query(async ({ input, ctx }) => {
      await assertPatientAccess(ctx.user.id, input.patientId, db);

      const patient = await db.query.patientProfiles.findFirst({
        where: eq(patientProfiles.id, input.patientId),
      });

      if (!patient) throw new TRPCError({ code: 'NOT_FOUND' });

      // Fetch last 48h doses
      const recentDoses = await db.select().from(doseLog)
        .where(
          and(
            eq(doseLog.patientId, input.patientId),
            gt(doseLog.administeredAt, subHours(new Date(), 48))
          )
        )
        .orderBy(desc(doseLog.administeredAt));

      const result = runIOBEngine({
        doses:            recentDoses,
        tdd:              patient.tdd ?? 18,
        typicalBasalDose: patient.typicalBasalDose ?? 18,
        currentGlucose:   input.currentGlucose ?? patient.glucoseTargetHigh,
        targetGlucose:    input.targetGlucose ?? patient.glucoseTargetLow,
        carbGrams:        input.carbGrams,
        isfOverride:      input.isfOverride,
        icrOverride:      input.icrOverride,
      });

      // Cache snapshot
      await db.insert(iobSnapshots).values({
        patientId:       input.patientId,
        totalIob:        result.totalIOB,
        stackingScore:   result.stackingScore,
        riskZone:        result.riskZone,
        doseBreakdown:   result.doseBreakdown,
        isfUsed:         result.isf,
        icrUsed:         result.icr,
        optimalNextDoseH: result.optimalNextDoseH,
      });

      return result;
    }),

  // ── Dose log procedure ───────────────────────────────────
  'dose.log': clinicianProcedure
    .input(LogDoseInput)
    .mutation(async ({ input, ctx }) => {
      await assertPatientAccess(ctx.user.id, input.patientId, db);
      return db.insert(doseLog).values({
        ...input,
        createdBy: ctx.user.id,
      }).returning();
    }),

  // ── Caregiver: validate token ────────────────────────────
  'caregiver.validateToken': publicProcedure
    .input(z.object({
      token: z.string().min(10),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const share = await db.query.caregiverShares.findFirst({
        where: and(
          eq(caregiverShares.shareToken, input.token),
          eq(caregiverShares.caregiverEmail, input.email.toLowerCase()),
          eq(caregiverShares.isActive, true),
          or(
            isNull(caregiverShares.expiresAt),
            gt(caregiverShares.expiresAt, new Date())
          )
        ),
        with: { patient: true }
      });

      if (!share) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired token.' });

      return {
        patientId:       share.patientId,
        patientName:     share.patient.patientName,
        permissionLevel: share.permissionLevel,
        validUntil:      share.expiresAt,
      };
    }),
});

// ─ Helpers ───────────────────────────────────────────────────

async function assertPatientAccess(userId: string, patientId: string, db: any) {
  const patient = await db.query.patientProfiles.findFirst({
    where: and(
      eq(patientProfiles.id, patientId),
      eq(patientProfiles.clinicianId, userId)
    )
  });
  if (!patient) throw new TRPCError({ code: 'FORBIDDEN', message: 'Patient not found or access denied.' });
  return patient;
}

async function getUserTier(userId: string, db: any): Promise<TierType> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId)
  });
  return sub?.tier ?? 'free';
}

export type AppRouter = typeof appRouter;
*/

// ── CLINICAL SAFETY NOTE ─────────────────────────────────────
//
// GluMira™ is an educational platform, not a medical device.
// These procedures calculate pharmacokinetic models based on
// entered data. They do not account for:
//   - Illness or infection
//   - Exercise and activity levels
//   - Injection site variation and absorption
//   - Individual physiological differences
//   - Drug interactions
//
// NEVER present calculated doses as prescriptions or
// clinical recommendations. All insights must include:
// "Discuss this with your care team."
//
// GluMira™ never says "dose" or "inject" as an instruction.
// GluMira™ never says "you should".
// GluMira™ never uses fear as motivation.
//
// ── Powered by IOB Hunter™ ─────────────────
