import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createPatientProfile, getPatientProfileByUserId, updatePatientProfile,
  createGlucoseReading, getGlucoseReadingsByPatient,
  createInsulinDose, getInsulinDosesByPatient,
  getLatestIOBCalculation, createBasalProfile, getBasalProfileByPatient,
  createIOBCalculation, createMeal, getMealsByPatient, getMealSettingsByPatient, upsertMealSettings
} from "./db";
import { calculateTotalIOB, classifyGlucose, type InsulinDose, type InsulinType, type InsulinConcentration } from "./iob";
import { MEAL_REGIMES, getMealRegime, getRegimesByCategory, getActiveRegimes, getFastingRegimes, searchRegimes, type MealCategory } from "./meal-regimes";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  /**
   * Patient Profile Management
   */
  patient: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getPatientProfileByUserId(ctx.user.id);
      return profile || null;
    }),

    createProfile: protectedProcedure
      .input(z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        diabetesType: z.enum(["type1", "type2", "gestational", "other"]).optional(),
        insulinSensitivityFactor: z.number().optional(),
        carbRatio: z.number().optional(),
        targetGlucoseMin: z.number().optional(),
        targetGlucoseMax: z.number().optional(),
        glucoseUnit: z.enum(["mg/dL", "mmol/L"]).default("mg/dL"),
        insulinUnit: z.enum(["U", "mU"]).default("U"),
        iobDecayTime: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createPatientProfile({
          userId: ctx.user.id,
          firstName: input.firstName,
          lastName: input.lastName,
          diabetesType: input.diabetesType,
          insulinSensitivityFactor: input.insulinSensitivityFactor ? input.insulinSensitivityFactor.toString() : undefined,
          carbRatio: input.carbRatio ? input.carbRatio.toString() : undefined,
          targetGlucoseMin: input.targetGlucoseMin ? input.targetGlucoseMin.toString() : undefined,
          targetGlucoseMax: input.targetGlucoseMax ? input.targetGlucoseMax.toString() : undefined,
          glucoseUnit: input.glucoseUnit,
          insulinUnit: input.insulinUnit,
          iobDecayTime: input.iobDecayTime,
        });
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        diabetesType: z.enum(["type1", "type2", "gestational", "other"]).optional(),
        insulinSensitivityFactor: z.number().optional(),
        carbRatio: z.number().optional(),
        targetGlucoseMin: z.number().optional(),
        targetGlucoseMax: z.number().optional(),
        glucoseUnit: z.enum(["mg/dL", "mmol/L"]).optional(),
        insulinUnit: z.enum(["U", "mU"]).optional(),
        iobDecayTime: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const updates: Record<string, any> = {};
        if (input.firstName !== undefined) updates.firstName = input.firstName;
        if (input.lastName !== undefined) updates.lastName = input.lastName;
        if (input.diabetesType !== undefined) updates.diabetesType = input.diabetesType;
        if (input.insulinSensitivityFactor !== undefined) updates.insulinSensitivityFactor = input.insulinSensitivityFactor.toString();
        if (input.carbRatio !== undefined) updates.carbRatio = input.carbRatio.toString();
        if (input.targetGlucoseMin !== undefined) updates.targetGlucoseMin = input.targetGlucoseMin.toString();
        if (input.targetGlucoseMax !== undefined) updates.targetGlucoseMax = input.targetGlucoseMax.toString();
        if (input.glucoseUnit !== undefined) updates.glucoseUnit = input.glucoseUnit;
        if (input.insulinUnit !== undefined) updates.insulinUnit = input.insulinUnit;
        if (input.iobDecayTime !== undefined) updates.iobDecayTime = input.iobDecayTime;
        
        return await updatePatientProfile(input.patientId, updates);
      }),
  }),

  /**
   * Glucose Data Management
   */
  glucose: router({
    addReading: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        glucoseValue: z.number(),
        glucoseUnit: z.enum(["mg/dL", "mmol/L"]).default("mg/dL"),
        readingType: z.enum(["cgm", "fingerstick", "manual"]),
        cgmSource: z.string().optional(),
        timestamp: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createGlucoseReading({
          patientId: input.patientId,
          glucoseValue: input.glucoseValue.toString(),
          glucoseUnit: input.glucoseUnit,
          readingType: input.readingType,
          cgmSource: input.cgmSource,
          timestamp: input.timestamp,
          notes: input.notes,
        });
      }),

    getReadings: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        limit: z.number().default(100),
      }))
      .query(async ({ input }) => {
        return await getGlucoseReadingsByPatient(input.patientId, input.limit);
      }),

    classify: publicProcedure
      .input(z.object({
        glucoseValue: z.number(),
      }))
      .query(({ input }) => {
        return classifyGlucose(input.glucoseValue);
      }),
  }),

  /**
   * Insulin Dose Management
   */
  insulin: router({
    addDose: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        doseType: z.enum(["bolus", "basal", "correction"]),
        insulinType: z.enum(["rapid", "short", "intermediate", "long", "ultra-long"]).optional(),
        concentration: z.enum(["U-100", "U-200", "U-500"]).default("U-100"),
        amount: z.number(),
        carbohydrates: z.number().optional(),
        reason: z.string().optional(),
        timestamp: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createInsulinDose({
          patientId: input.patientId,
          doseType: input.doseType,
          insulinType: input.insulinType,
          amount: input.amount.toString(),
          carbohydrates: input.carbohydrates ? input.carbohydrates.toString() : undefined,
          reason: input.reason,
          timestamp: input.timestamp,
          notes: input.notes,
        });
      }),

    getDoses: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        limit: z.number().default(100),
      }))
      .query(async ({ input }) => {
        return await getInsulinDosesByPatient(input.patientId, input.limit);
      }),
  }),

  /**
   * Meals & Meal Regimes
   */
  meals: router({
    getRegimes: publicProcedure.query(() => {
      return MEAL_REGIMES;
    }),

    getRegimeById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => {
        return getMealRegime(input.id) || null;
      }),

    getRegimesByCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(({ input }) => {
        return getRegimesByCategory(input.category as MealCategory);
      }),

    searchRegimes: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(({ input }) => {
        return searchRegimes(input.query);
      }),

    getFastingRegimes: publicProcedure.query(() => {
      return getFastingRegimes();
    }),

    logMeal: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        eatenAt: z.date(),
        carbsGrams: z.number(),
        mealRegime: z.string().optional(),
        mealName: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createMeal({
          patientId: input.patientId,
          userId: ctx.user.id,
          eatenAt: input.eatenAt,
          carbsGrams: input.carbsGrams.toString(),
          mealRegime: input.mealRegime,
          mealName: input.mealName,
          notes: input.notes,
        });
      }),

    getMeals: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        return await getMealsByPatient(input.patientId, input.limit);
      }),

    getSettings: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(async ({ input }) => {
        return await getMealSettingsByPatient(input.patientId) || null;
      }),

    updateSettings: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        activeRegimeId: z.string().optional(),
        customHypoThreshold: z.number().optional(),
        customHyperThreshold: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const updates: Record<string, any> = {};
        if (input.activeRegimeId !== undefined) updates.activeRegimeId = input.activeRegimeId;
        if (input.customHypoThreshold !== undefined) updates.customHypoThreshold = input.customHypoThreshold.toString();
        if (input.customHyperThreshold !== undefined) updates.customHyperThreshold = input.customHyperThreshold.toString();
        if (input.notes !== undefined) updates.notes = input.notes;
        return await upsertMealSettings(input.patientId, updates);
      }),
  }),

  /**
   * IOB Calculations
   */
  iob: router({
    getLatest: protectedProcedure
      .input(z.object({
        patientId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getLatestIOBCalculation(input.patientId);
      }),
  }),

  /**
   * Basal Profiles
   */
  basal: router({
    getProfile: protectedProcedure
      .input(z.object({
        patientId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getBasalProfileByPatient(input.patientId);
      }),

    addEntry: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        profileName: z.string().optional(),
        hour: z.number().min(0).max(23),
        basalRate: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await createBasalProfile({
          patientId: input.patientId,
          profileName: input.profileName,
          hour: input.hour,
          basalRate: input.basalRate.toString(),
        });
      }),
  }),

  /**
   * IOB Analysis & Calculations — Walsh Bilinear DIA Curve
   */
  analysis: router({
    calculateIOB: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        customDiaHours: z.number().min(2).max(8).optional(),
        doses: z.array(z.object({
          amount: z.number(),
          timestamp: z.date(),
          insulinType: z.enum(["rapid", "short", "intermediate", "long", "ultra-long"]),
          concentration: z.enum(["U-100", "U-200", "U-500"]).default("U-100"),
          category: z.enum(["bolus", "basal", "correction"]).default("bolus"),
        })),
      }))
      .mutation(async ({ input }) => {
        const doses: InsulinDose[] = input.doses.map(d => ({
          amount: d.amount,
          timestamp: d.timestamp,
          insulinType: d.insulinType as InsulinType,
          concentration: d.concentration as InsulinConcentration,
          category: d.category,
        }));
        const result = calculateTotalIOB(doses, new Date(), input.customDiaHours);

        // Store calculation in database
        await createIOBCalculation({
          patientId: input.patientId,
          timestamp: result.timestamp,
          totalIOB: result.totalIOB.toString(),
          bolusIOB: result.bolusIOB.toString(),
          basalIOB: result.basalIOB.toString(),
          decayModel: "walsh-bilinear",
          decayData: JSON.stringify(result.decayPoints),
        });

        return result;
      }),

    analyzeStacking: protectedProcedure
      .input(z.object({
        doses: z.array(z.object({
          amount: z.number(),
          timestamp: z.date(),
          insulinType: z.enum(["rapid", "short", "intermediate", "long", "ultra-long"]),
          concentration: z.enum(["U-100", "U-200", "U-500"]).default("U-100"),
          category: z.enum(["bolus", "basal", "correction"]).default("bolus"),
        })),
      }))
      .query(({ input }) => {
        const doses: InsulinDose[] = input.doses.map(d => ({
          amount: d.amount,
          timestamp: d.timestamp,
          insulinType: d.insulinType as InsulinType,
          concentration: d.concentration as InsulinConcentration,
          category: d.category,
        }));
        const result = calculateTotalIOB(doses);
        return result.stackingRisk;
      }),
  }),
});

export type AppRouter = typeof appRouter;
