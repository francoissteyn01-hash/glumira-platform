export type MenopauseStage = "perimenopause" | "menopause" | "postmenopause";
export type HrtType = "none" | "oestrogen-only" | "combined";
export type Symptom =
  | "hot_flashes"
  | "insomnia"
  | "mood_changes"
  | "weight_gain"
  | "brain_fog"
  | "vaginal_dryness";

export type MenopauseInput = {
  stage: MenopauseStage;
  hrtType: HrtType;
  yearsSinceLastPeriod: number;
  symptoms: Symptom[];
  avgFastingMmol: number;
  avgPostMealMmol: number;
  basalDoseUnits: number;
  hypoEventsLast7Days: number;
  currentISF?: number;
  unit: "mmol" | "mg";
}

export type MenopauseAnalysisResult = {
  isfImpactLow: number;
  isfImpactHigh: number;
  resistanceLevel: "low" | "moderate" | "high";
  nocturnalHypoRisk: "low" | "elevated" | "high";
  dawnPhenomenonFlag: boolean;
  hrtInteractionNote?: string;
  hotFlashCorrelationNote?: string;
  monitoringPlan: string[];
  doctorTalkingPoints: string[];
  citations: string[];
}

const STAGE_BANDS: Record<MenopauseStage, { low: number; high: number }> = {
  perimenopause: { low: -0.10, high: -0.25 },
  menopause:     { low: -0.15, high: -0.30 },
  postmenopause: { low: -0.20, high: -0.35 },
};

const HRT_MODIFIER: Record<HrtType, number> = {
  "none":           0,
  "oestrogen-only": 0.10,
  "combined":       0.05,
};

export function analyseMenopause(input: MenopauseInput): MenopauseAnalysisResult {
  const base = STAGE_BANDS[input.stage];
  const mod  = HRT_MODIFIER[input.hrtType];

  const isfImpactLow  = base.low  + mod;
  const isfImpactHigh = base.high + mod;

  const avgImpact = (Math.abs(isfImpactLow) + Math.abs(isfImpactHigh)) / 2;
  const resistanceLevel: MenopauseAnalysisResult["resistanceLevel"] =
    avgImpact >= 0.275 ? "high" : avgImpact >= 0.175 ? "moderate" : "low";

  const nocturnalHypoRisk: MenopauseAnalysisResult["nocturnalHypoRisk"] =
    input.hypoEventsLast7Days >= 3
      ? "high"
      : input.hypoEventsLast7Days >= 2
      ? "elevated"
      : "low";

  const dawnPhenomenonFlag = input.avgFastingMmol > 7.0 && input.avgPostMealMmol < input.avgFastingMmol + 2;

  const hrtInteractionNote =
    input.hrtType !== "none"
      ? input.hrtType === "oestrogen-only"
        ? "Oestrogen-only HRT is associated with improved insulin sensitivity. Monitor for hypoglycaemia, especially in the first weeks of a new dose."
        : "Combined HRT (oestrogen + progestogen) may have a variable effect on insulin sensitivity depending on the progestogen type. Work with your endocrinologist to monitor trends."
      : undefined;

  const hotFlashCorrelationNote = input.symptoms.includes("hot_flashes")
    ? "Hot flushes trigger adrenaline release, which can cause temporary glucose spikes. Consider checking glucose during and after hot flush episodes."
    : undefined;

  const monitoringPlan: string[] = [
    "Check fasting glucose every morning and log the result",
    "Record glucose 2 hours after each main meal",
    "Note any hot flush or night sweat episodes and the time of day",
    "Track basal dose adjustments weekly with your diabetes team",
    "Review nocturnal readings if waking frequently — consider a CGM if not already using one",
  ];

  const doctorTalkingPoints: string[] = [
    `My ISF may be reduced by ${Math.round(Math.abs(isfImpactLow) * 100)}–${Math.round(Math.abs(isfImpactHigh) * 100)}% due to ${input.stage}`,
    `I have had ${input.hypoEventsLast7Days} hypoglycaemic event(s) in the past 7 days`,
    input.hrtType !== "none"
      ? `I am using ${input.hrtType} HRT — I would like to understand the expected effect on my insulin sensitivity`
      : "I am not currently using HRT — should we discuss whether it may help manage my glucose variability?",
    "I would like a plan for adjusting my basal dose if my insulin resistance worsens",
    "Can we schedule a review in 4–6 weeks to assess whether my ISF needs updating?",
  ];

  const citations: string[] = [
    "Mauvais-Jarvis F et al. (2015). PMID: 26260609",
    "Samaras K et al. (1999). PMID: 10333937",
    "NAMS (2022). The menopause and hormone therapy.",
  ];

  return {
    isfImpactLow,
    isfImpactHigh,
    resistanceLevel,
    nocturnalHypoRisk,
    dawnPhenomenonFlag,
    hrtInteractionNote,
    hotFlashCorrelationNote,
    monitoringPlan,
    doctorTalkingPoints,
    citations,
  };
}
