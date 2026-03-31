/**
 * GluMira™ StoryEngine — Animation Component Registry
 *
 * Maps every visual_id string to its Framer Motion animation component.
 * All 28 unique visual_ids across all 7 story scripts are registered here.
 *
 * Each stub renders a branded placeholder with the visual_note as a
 * design brief. Replace with production Lottie/Framer Motion animations.
 *
 * Onboarding 3 — Prompt 3 (Upgrade 3)
 */

export { AnimGlucoseCurveStabilising } from "./AnimGlucoseCurveStabilising";
export { AnimProfileBuilding } from "./AnimProfileBuilding";
export { AnimIobCurveDecay } from "./AnimIobCurveDecay";
export { AnimPatternDetection } from "./AnimPatternDetection";
export { AnimCgmConnect } from "./AnimCgmConnect";
export { AnimReportGenerating } from "./AnimReportGenerating";
export { AnimDashboardOverview } from "./AnimDashboardOverview";
export { AnimParentNightWorry } from "./AnimParentNightWorry";
export { AnimIobParentView } from "./AnimIobParentView";
export { AnimParentNetwork } from "./AnimParentNetwork";
export { AnimPatternParent } from "./AnimPatternParent";
export { AnimCarePlanParent } from "./AnimCarePlanParent";
export { AnimParentCta } from "./AnimParentCta";
export { AnimChildHeroIntro } from "./AnimChildHeroIntro";
export { AnimChildGlucoseExplained } from "./AnimChildGlucoseExplained";
export { AnimChildBadgeUnlock } from "./AnimChildBadgeUnlock";
export { AnimChildSchoolSafe } from "./AnimChildSchoolSafe";
export { AnimChildCta } from "./AnimChildCta";
export { AnimTeenDashboardDark } from "./AnimTeenDashboardDark";
export { AnimIobTeenView } from "./AnimIobTeenView";
export { AnimPatternDetectionDark } from "./AnimPatternDetectionDark";
export { AnimTeenCustomise } from "./AnimTeenCustomise";
export { AnimReportTeen } from "./AnimReportTeen";
export { AnimTeenCta } from "./AnimTeenCta";
export { AnimClinicianDashboard } from "./AnimClinicianDashboard";
export { AnimIobClinical } from "./AnimIobClinical";
export { AnimPatternClinical } from "./AnimPatternClinical";
export { AnimPatientProfileClinical } from "./AnimPatientProfileClinical";
export { AnimClinicalReport } from "./AnimClinicalReport";
export { AnimClinicianCta } from "./AnimClinicianCta";
export { AnimSchoolShield } from "./AnimSchoolShield";
export { AnimCarePlanSchool } from "./AnimCarePlanSchool";
export { AnimAllergyProtocol } from "./AnimAllergyProtocol";
export { AnimOrgDashboard } from "./AnimOrgDashboard";
export { AnimEmergencyProtocol } from "./AnimEmergencyProtocol";
export { AnimOrgCta } from "./AnimOrgCta";
export { AnimResearcherDataOverview } from "./AnimResearcherDataOverview";
export { AnimDataSchema } from "./AnimDataSchema";
export { AnimCohortPatterns } from "./AnimCohortPatterns";
export { AnimPopulationDiversity } from "./AnimPopulationDiversity";
export { AnimExportPanel } from "./AnimExportPanel";
export { AnimResearcherCta } from "./AnimResearcherCta";

// ─── Registry Map ─────────────────────────────────────────────────────────────

import type { ComponentType } from "react";
import type { AnimationProps } from "../types";
import { AnimGlucoseCurveStabilising } from "./AnimGlucoseCurveStabilising";
import { AnimProfileBuilding } from "./AnimProfileBuilding";
import { AnimIobCurveDecay } from "./AnimIobCurveDecay";
import { AnimPatternDetection } from "./AnimPatternDetection";
import { AnimCgmConnect } from "./AnimCgmConnect";
import { AnimReportGenerating } from "./AnimReportGenerating";
import { AnimDashboardOverview } from "./AnimDashboardOverview";
import { AnimParentNightWorry } from "./AnimParentNightWorry";
import { AnimIobParentView } from "./AnimIobParentView";
import { AnimParentNetwork } from "./AnimParentNetwork";
import { AnimPatternParent } from "./AnimPatternParent";
import { AnimCarePlanParent } from "./AnimCarePlanParent";
import { AnimParentCta } from "./AnimParentCta";
import { AnimChildHeroIntro } from "./AnimChildHeroIntro";
import { AnimChildGlucoseExplained } from "./AnimChildGlucoseExplained";
import { AnimChildBadgeUnlock } from "./AnimChildBadgeUnlock";
import { AnimChildSchoolSafe } from "./AnimChildSchoolSafe";
import { AnimChildCta } from "./AnimChildCta";
import { AnimTeenDashboardDark } from "./AnimTeenDashboardDark";
import { AnimIobTeenView } from "./AnimIobTeenView";
import { AnimPatternDetectionDark } from "./AnimPatternDetectionDark";
import { AnimTeenCustomise } from "./AnimTeenCustomise";
import { AnimReportTeen } from "./AnimReportTeen";
import { AnimTeenCta } from "./AnimTeenCta";
import { AnimClinicianDashboard } from "./AnimClinicianDashboard";
import { AnimIobClinical } from "./AnimIobClinical";
import { AnimPatternClinical } from "./AnimPatternClinical";
import { AnimPatientProfileClinical } from "./AnimPatientProfileClinical";
import { AnimClinicalReport } from "./AnimClinicalReport";
import { AnimClinicianCta } from "./AnimClinicianCta";
import { AnimSchoolShield } from "./AnimSchoolShield";
import { AnimCarePlanSchool } from "./AnimCarePlanSchool";
import { AnimAllergyProtocol } from "./AnimAllergyProtocol";
import { AnimOrgDashboard } from "./AnimOrgDashboard";
import { AnimEmergencyProtocol } from "./AnimEmergencyProtocol";
import { AnimOrgCta } from "./AnimOrgCta";
import { AnimResearcherDataOverview } from "./AnimResearcherDataOverview";
import { AnimDataSchema } from "./AnimDataSchema";
import { AnimCohortPatterns } from "./AnimCohortPatterns";
import { AnimPopulationDiversity } from "./AnimPopulationDiversity";
import { AnimExportPanel } from "./AnimExportPanel";
import { AnimResearcherCta } from "./AnimResearcherCta";

/**
 * Maps every visual_id string to its animation component.
 * StoryEngine uses this registry to resolve visual_id at runtime.
 */
export const ANIMATION_REGISTRY: Record<
  string,
  ComponentType<AnimationProps>
> = {
  // Patient
  anim_glucose_curve_stabilising: AnimGlucoseCurveStabilising,
  anim_profile_building: AnimProfileBuilding,
  anim_iob_curve_decay: AnimIobCurveDecay,
  anim_pattern_detection: AnimPatternDetection,
  anim_cgm_connect: AnimCgmConnect,
  anim_report_generating: AnimReportGenerating,
  anim_dashboard_overview: AnimDashboardOverview,

  // Parent
  anim_parent_night_worry: AnimParentNightWorry,
  anim_iob_parent_view: AnimIobParentView,
  anim_parent_network: AnimParentNetwork,
  anim_pattern_parent: AnimPatternParent,
  anim_care_plan_parent: AnimCarePlanParent,
  anim_parent_cta: AnimParentCta,

  // Child
  anim_child_hero_intro: AnimChildHeroIntro,
  anim_child_glucose_explained: AnimChildGlucoseExplained,
  anim_child_badge_unlock: AnimChildBadgeUnlock,
  anim_child_school_safe: AnimChildSchoolSafe,
  anim_child_cta: AnimChildCta,

  // Teen
  anim_teen_dashboard_dark: AnimTeenDashboardDark,
  anim_iob_teen_view: AnimIobTeenView,
  anim_pattern_detection_dark: AnimPatternDetectionDark,
  anim_teen_customise: AnimTeenCustomise,
  anim_report_teen: AnimReportTeen,
  anim_teen_cta: AnimTeenCta,

  // Clinician
  anim_clinician_dashboard: AnimClinicianDashboard,
  anim_iob_clinical: AnimIobClinical,
  anim_pattern_clinical: AnimPatternClinical,
  anim_patient_profile_clinical: AnimPatientProfileClinical,
  anim_clinical_report: AnimClinicalReport,
  anim_clinician_cta: AnimClinicianCta,

  // School / Organisation
  anim_school_shield: AnimSchoolShield,
  anim_care_plan_school: AnimCarePlanSchool,
  anim_allergy_protocol: AnimAllergyProtocol,
  anim_org_dashboard: AnimOrgDashboard,
  anim_emergency_protocol: AnimEmergencyProtocol,
  anim_org_cta: AnimOrgCta,

  // Researcher
  anim_researcher_data_overview: AnimResearcherDataOverview,
  anim_data_schema: AnimDataSchema,
  anim_cohort_patterns: AnimCohortPatterns,
  anim_population_diversity: AnimPopulationDiversity,
  anim_export_panel: AnimExportPanel,
  anim_researcher_cta: AnimResearcherCta,
};
