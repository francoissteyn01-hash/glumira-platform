/**
 * GluMira™ — Diabetes Burnout Screener Module
 *
 * Screens for diabetes distress and burnout using validated
 * questionnaire domains and provides supportive recommendations.
 *
 * Clinical relevance:
 * - Diabetes burnout affects 20-40% of people with diabetes
 * - Burnout leads to reduced self-care and worse outcomes
 * - Early detection enables timely support and intervention
 *
 * NOT a medical device. Educational purposes only.
 */

export interface BurnoutResponse {
  domain: "emotional" | "regimen" | "interpersonal" | "physician" | "monitoring";
  question: string;
  score: number;  // 1-5 (1=not a problem, 5=very serious problem)
}

export interface DomainResult {
  domain: string;
  meanScore: number;
  level: "minimal" | "mild" | "moderate" | "high" | "severe";
  questionCount: number;
  topConcern: string | null;
}

export interface BurnoutResult {
  overallScore: number;
  overallLevel: "minimal" | "mild" | "moderate" | "high" | "severe";
  domains: DomainResult[];
  highestDomain: string | null;
  lowestDomain: string | null;
  redFlags: string[];
  supportiveMessages: string[];
  recommendations: string[];
  resources: string[];
  disclaimer: string;
}

/* ── Level classification ────────────────────────────────────── */

function classifyLevel(score: number): BurnoutResult["overallLevel"] {
  if (score <= 1.5) return "minimal";
  if (score <= 2.5) return "mild";
  if (score <= 3.5) return "moderate";
  if (score <= 4.5) return "high";
  return "severe";
}

/* ── Main screener ───────────────────────────────────────────── */

export function screenBurnout(responses: BurnoutResponse[]): BurnoutResult {
  if (responses.length === 0) {
    return {
      overallScore: 0,
      overallLevel: "minimal",
      domains: [],
      highestDomain: null,
      lowestDomain: null,
      redFlags: [],
      supportiveMessages: ["Complete the burnout screener to check in on your diabetes wellbeing."],
      recommendations: [],
      resources: [],
      disclaimer: "GluMira™ is NOT a medical device. This is a screening tool, not a diagnosis.",
    };
  }

  // ── Domain analysis ──
  const domainMap = new Map<string, BurnoutResponse[]>();
  responses.forEach((r) => {
    if (!domainMap.has(r.domain)) domainMap.set(r.domain, []);
    domainMap.get(r.domain)!.push(r);
  });

  const domains: DomainResult[] = [];
  domainMap.forEach((items, domain) => {
    const scores = items.map((i) => i.score);
    const meanScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    const topConcern = items.sort((a, b) => b.score - a.score)[0];

    domains.push({
      domain,
      meanScore,
      level: classifyLevel(meanScore),
      questionCount: items.length,
      topConcern: topConcern.score >= 4 ? topConcern.question : null,
    });
  });

  // ── Overall score ──
  const allScores = responses.map((r) => r.score);
  const overallScore = Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10;
  const overallLevel = classifyLevel(overallScore);

  // ── Highest/lowest domains ──
  const sorted = [...domains].sort((a, b) => b.meanScore - a.meanScore);
  const highestDomain = sorted.length > 0 ? sorted[0].domain : null;
  const lowestDomain = sorted.length > 0 ? sorted[sorted.length - 1].domain : null;

  // ── Red flags ──
  const redFlags: string[] = [];
  if (overallScore >= 4.0) {
    redFlags.push("Overall burnout score is very high — please reach out to your healthcare team.");
  }
  const severeItems = responses.filter((r) => r.score === 5);
  if (severeItems.length >= 3) {
    redFlags.push(`${severeItems.length} questions scored as 'very serious problem' — professional support is recommended.`);
  }
  const emotionalDomain = domains.find((d) => d.domain === "emotional");
  if (emotionalDomain && emotionalDomain.meanScore >= 4.0) {
    redFlags.push("Emotional distress is very high — consider speaking with a diabetes psychologist.");
  }

  // ── Supportive messages ──
  const supportiveMessages: string[] = [];
  if (overallLevel === "minimal" || overallLevel === "mild") {
    supportiveMessages.push("You're doing well managing the emotional side of diabetes. Keep it up!");
  } else if (overallLevel === "moderate") {
    supportiveMessages.push("It's normal to feel overwhelmed sometimes. You're not alone in this.");
    supportiveMessages.push("Small breaks from the routine can help — you don't have to be perfect.");
  } else {
    supportiveMessages.push("Living with diabetes is hard. It's okay to feel burned out.");
    supportiveMessages.push("Reaching out for help is a sign of strength, not weakness.");
    supportiveMessages.push("You deserve support — please talk to someone you trust about how you're feeling.");
  }

  // ── Recommendations ──
  const recommendations: string[] = [];
  if (overallScore >= 3.0) {
    recommendations.push("Discuss your burnout score with your diabetes care team at your next visit.");
  }
  if (emotionalDomain && emotionalDomain.meanScore >= 3.0) {
    recommendations.push("Consider a referral to a diabetes psychologist or counselor.");
  }
  const regimenDomain = domains.find((d) => d.domain === "regimen");
  if (regimenDomain && regimenDomain.meanScore >= 3.0) {
    recommendations.push("Simplify your regimen where possible — ask your team about reducing complexity.");
  }
  const monitoringDomain = domains.find((d) => d.domain === "monitoring");
  if (monitoringDomain && monitoringDomain.meanScore >= 3.0) {
    recommendations.push("If monitoring feels burdensome, discuss CGM options that reduce finger-prick frequency.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Continue your current approach — your burnout levels are manageable.");
  }

  // ── Resources ──
  const resources = [
    "Diabetes UK Helpline: 0345 123 2399",
    "Beyond Type 1 community: beyondtype1.org",
    "DiabetesDaily forums: diabetesdaily.com",
    "JDRF peer support: jdrf.org",
  ];

  return {
    overallScore,
    overallLevel,
    domains,
    highestDomain,
    lowestDomain,
    redFlags,
    supportiveMessages,
    recommendations,
    resources,
    disclaimer:
      "GluMira™ is an informational and educational tool only. It is NOT a medical device. " +
      "This screener is not a clinical diagnosis. If you are in crisis, please contact a healthcare professional immediately.",
  };
}
