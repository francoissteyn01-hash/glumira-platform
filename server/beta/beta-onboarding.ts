/**
 * GluMira™ Beta Onboarding Module
 * Version: 7.0.0
 * Module: BETA-ONBOARDING
 *
 * Manages beta participant onboarding for NAM-001 and ZA-001.
 * Features:
 *   - Participant registration (ID assignment, profile creation)
 *   - Nightscout sync instruction generation
 *   - Welcome email template generation
 *   - Onboarding checklist tracking
 *   - Feedback collection endpoint
 *
 * Beta participants:
 *   NAM-001 — Namibia participant (Africa region)
 *   ZA-001  — South Africa participant (Africa region)
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

import { createHash } from "crypto";

// ─── Types ────────────────────────────────────────────────────

export type BetaRegion = "NAM" | "ZA" | "UK" | "US" | "AU";
export type BetaStatus = "invited" | "registered" | "synced" | "active" | "churned";

export interface BetaParticipant {
  id: string;                    // e.g. "NAM-001"
  region: BetaRegion;
  status: BetaStatus;
  registeredAt?: string;
  nightscoutUrl?: string;
  nightscoutApiKey?: string;     // Stored in Vault — never logged
  diabetesType: "T1" | "T2" | "T3" | "LADA" | "MODY" | "OTHER";
  insulinPump: boolean;
  cgmDevice?: string;            // e.g. "Dexcom G6", "Libre 3"
  onboardingChecklist: OnboardingChecklist;
  feedbackEntries: FeedbackEntry[];
}

export interface OnboardingChecklist {
  inviteSent: boolean;
  profileCreated: boolean;
  nightscoutConnected: boolean;
  firstSyncComplete: boolean;
  dashboardAccessed: boolean;
  feedbackCollected: boolean;
}

export interface FeedbackEntry {
  collectedAt: string;
  category: "iob_chart" | "glucose_timeline" | "school_care_plan" | "general" | "bug";
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  resolvedAt?: string;
}

export interface NightscoutInstructions {
  participantId: string;
  nightscoutUrl: string;
  steps: string[];
  troubleshooting: string[];
  supportEmail: string;
}

export interface WelcomeEmailContent {
  to: string;                    // Anonymised — dev@glumira.ai
  subject: string;
  htmlBody: string;
  textBody: string;
}

// ─── Participant ID Generator ─────────────────────────────────

/**
 * Generate a beta participant ID from region and sequence number.
 * Format: {REGION}-{NNN} e.g. "NAM-001", "ZA-002"
 */
export function generateParticipantId(region: BetaRegion, sequence: number): string {
  const seq = String(sequence).padStart(3, "0");
  return `${region}-${seq}`;
}

/**
 * Validate a participant ID format.
 */
export function validateParticipantId(id: string): boolean {
  return /^[A-Z]{2,3}-\d{3}$/.test(id);
}

// ─── Onboarding Checklist ─────────────────────────────────────

/**
 * Create a fresh onboarding checklist (all false).
 */
export function createEmptyChecklist(): OnboardingChecklist {
  return {
    inviteSent: false,
    profileCreated: false,
    nightscoutConnected: false,
    firstSyncComplete: false,
    dashboardAccessed: false,
    feedbackCollected: false,
  };
}

/**
 * Calculate onboarding completion percentage.
 */
export function calculateOnboardingProgress(checklist: OnboardingChecklist): number {
  const items = Object.values(checklist);
  const completed = items.filter(Boolean).length;
  return Math.round((completed / items.length) * 100);
}

/**
 * Get the next onboarding step for a participant.
 */
export function getNextOnboardingStep(checklist: OnboardingChecklist): string | null {
  if (!checklist.inviteSent) return "Send invite email with magic link";
  if (!checklist.profileCreated) return "Create patient profile in GluMira";
  if (!checklist.nightscoutConnected) return "Send Nightscout sync instructions";
  if (!checklist.firstSyncComplete) return "Verify first Nightscout sync completes";
  if (!checklist.dashboardAccessed) return "Share dashboard access link";
  if (!checklist.feedbackCollected) return "Collect initial feedback (IOB chart + glucose timeline)";
  return null; // All complete
}

// ─── Nightscout Instructions ──────────────────────────────────

/**
 * Generate Nightscout sync instructions for a participant.
 * Instructions are plain-text and safe to share via email.
 */
export function generateNightscoutInstructions(
  participantId: string,
  nightscoutUrl: string
): NightscoutInstructions {
  return {
    participantId,
    nightscoutUrl,
    steps: [
      `1. Open your Nightscout site: ${nightscoutUrl}`,
      "2. Go to Admin Tools → Profile Editor",
      "3. Note your API Secret (you will need this in step 5)",
      "4. Open GluMira and go to Settings → Nightscout Integration",
      `5. Enter your Nightscout URL: ${nightscoutUrl}`,
      "6. Enter your API Secret",
      "7. Click 'Test Connection' — you should see a green tick",
      "8. Click 'Start Sync' — your glucose data will import in 2-3 minutes",
      "9. Return to the GluMira Dashboard to see your glucose chart",
    ],
    troubleshooting: [
      "If 'Test Connection' fails: check that your Nightscout URL ends with / (e.g. https://yoursite.ns.10be.de/)",
      "If you see 'Unauthorised': double-check your API Secret — it is case-sensitive",
      "If no data appears after 5 minutes: check that your CGM is uploading to Nightscout",
      "If you see 'CORS error': your Nightscout site needs ENABLE_CORS=true in settings",
    ],
    supportEmail: "dev@glumira.ai",
  };
}

// ─── Welcome Email ────────────────────────────────────────────

/**
 * Generate the welcome email content for a new beta participant.
 */
export function generateWelcomeEmail(
  participantId: string,
  magicLink: string,
  region: BetaRegion
): WelcomeEmailContent {
  const regionNames: Record<BetaRegion, string> = {
    NAM: "Namibia",
    ZA: "South Africa",
    UK: "United Kingdom",
    US: "United States",
    AU: "Australia",
  };

  const subject = `Welcome to GluMira™ Beta — Your Access Link (${participantId})`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; background: #f5f8fc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1A6DB5; padding: 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 0; }
    .header p { color: #b3d4f0; font-size: 13px; margin: 8px 0 0; }
    .body { padding: 32px; }
    .body h2 { color: #1A6DB5; font-size: 18px; }
    .body p { font-size: 14px; line-height: 1.6; color: #444; }
    .cta { text-align: center; margin: 32px 0; }
    .cta a { background: #1A6DB5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .disclaimer { background: #f0f7ff; border-left: 4px solid #1A6DB5; padding: 12px 16px; margin-top: 24px; font-size: 12px; color: #555; }
    .footer { background: #f5f8fc; padding: 20px 32px; text-align: center; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GluMira™</h1>
      <p>Visualizing the science of insulin · Powered by IOB Hunter™</p>
    </div>
    <div class="body">
      <h2>Welcome to the GluMira Beta, ${participantId}!</h2>
      <p>Thank you for joining the GluMira beta programme from <strong>${regionNames[region]}</strong>. You are one of our first participants, and your feedback will directly shape the product.</p>
      <p>Your participant ID is: <strong>${participantId}</strong></p>
      <p>Click the button below to access your GluMira dashboard. This link is unique to you — please do not share it.</p>
      <div class="cta">
        <a href="${magicLink}">Access My GluMira Dashboard</a>
      </div>
      <p>Once you are logged in, please follow the Nightscout sync instructions we will send separately to connect your CGM data.</p>
      <p>If you have any questions, reply to this email or contact us at <a href="mailto:dev@glumira.ai">dev@glumira.ai</a>.</p>
      <div class="disclaimer">
        <strong>Important:</strong> GluMira™ is an informational tool only. It is not a medical device and does not provide medical advice, diagnoses, or treatment recommendations. Always consult your diabetes care team before making any changes to your diabetes management.
      </div>
    </div>
    <div class="footer">
      GluMira™ · Powered by IOB Hunter™ · v7.0.0<br>
      Not a medical device · Not a dosing tool · Always consult your diabetes care team<br>
      BIPA Trademark filed March 2026
    </div>
  </div>
</body>
</html>`;

  const textBody = `
Welcome to GluMira Beta — ${participantId}

Thank you for joining the GluMira beta programme from ${regionNames[region]}.

Your participant ID: ${participantId}

Access your dashboard here:
${magicLink}

This link is unique to you — please do not share it.

Questions? Contact us at dev@glumira.ai

---
DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
Always consult your diabetes care team before making any clinical decisions.

GluMira™ · Powered by IOB Hunter™ · v7.0.0
`.trim();

  return {
    to: "dev@glumira.ai",
    subject,
    htmlBody,
    textBody,
  };
}

// ─── Feedback Validation ──────────────────────────────────────

/**
 * Validate a feedback entry before storing.
 */
export function validateFeedbackEntry(entry: Partial<FeedbackEntry>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!entry.category) errors.push("category is required");
  if (!entry.rating || entry.rating < 1 || entry.rating > 5) {
    errors.push("rating must be between 1 and 5");
  }
  if (!entry.comment || entry.comment.trim().length < 5) {
    errors.push("comment must be at least 5 characters");
  }
  if (entry.comment && entry.comment.length > 2000) {
    errors.push("comment must be under 2000 characters");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Express Route ────────────────────────────────────────────

import { Router, type Request, type Response } from "express";

export const betaOnboardingRouter = Router();

/**
 * GET /api/beta/participants
 * Returns list of beta participants (admin only).
 */
betaOnboardingRouter.get("/participants", (_req: Request, res: Response) => {
  // In production: query DB for all beta participants
  const participants: Partial<BetaParticipant>[] = [
    {
      id: "NAM-001",
      region: "NAM",
      status: "invited",
      diabetesType: "T1",
      insulinPump: false,
      onboardingChecklist: { ...createEmptyChecklist(), inviteSent: true },
    },
    {
      id: "ZA-001",
      region: "ZA",
      status: "invited",
      diabetesType: "T1",
      insulinPump: false,
      onboardingChecklist: { ...createEmptyChecklist(), inviteSent: true },
    },
  ];
  return res.status(200).json({ participants });
});

/**
 * POST /api/beta/feedback
 * Submit feedback from a beta participant.
 */
betaOnboardingRouter.post("/feedback", (req: Request, res: Response) => {
  const { participantId, category, rating, comment } = req.body as {
    participantId?: string;
    category?: FeedbackEntry["category"];
    rating?: number;
    comment?: string;
  };

  if (!participantId || !validateParticipantId(participantId)) {
    return res.status(400).json({ error: "Valid participantId is required" });
  }

  const validation = validateFeedbackEntry({ category, rating: rating as any, comment });
  if (!validation.valid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const entry: FeedbackEntry = {
    collectedAt: new Date().toISOString(),
    category: category!,
    rating: rating as FeedbackEntry["rating"],
    comment: comment!.trim(),
  };

  // In production: store in DB
  return res.status(201).json({
    message: "Feedback received. Thank you!",
    entry,
    participantId,
  });
});

/**
 * GET /api/beta/nightscout-instructions/:participantId
 * Returns Nightscout sync instructions for a participant.
 */
betaOnboardingRouter.get(
  "/nightscout-instructions/:participantId",
  (req: Request, res: Response) => {
    const { participantId } = req.params;

    if (!validateParticipantId(participantId)) {
      return res.status(400).json({ error: "Invalid participantId format" });
    }

    // In production: look up participant's Nightscout URL from DB
    const nightscoutUrl = `https://${participantId.toLowerCase().replace("-", "")}.ns.10be.de/`;
    const instructions = generateNightscoutInstructions(participantId, nightscoutUrl);
    return res.status(200).json(instructions);
  }
);
