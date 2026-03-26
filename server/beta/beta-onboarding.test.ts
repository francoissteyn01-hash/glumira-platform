/**
 * GluMira™ Beta Onboarding — Test Suite
 * Version: 7.0.0
 * Tests: 34
 */

import { describe, it, expect } from "vitest";
import {
  generateParticipantId,
  validateParticipantId,
  createEmptyChecklist,
  calculateOnboardingProgress,
  getNextOnboardingStep,
  generateNightscoutInstructions,
  generateWelcomeEmail,
  validateFeedbackEntry,
  type OnboardingChecklist,
  type FeedbackEntry,
} from "./beta-onboarding";

// ─── Participant ID ───────────────────────────────────────────

describe("Participant ID", () => {
  it("generates NAM-001 correctly", () => {
    expect(generateParticipantId("NAM", 1)).toBe("NAM-001");
  });

  it("generates ZA-001 correctly", () => {
    expect(generateParticipantId("ZA", 1)).toBe("ZA-001");
  });

  it("pads sequence to 3 digits", () => {
    expect(generateParticipantId("UK", 12)).toBe("UK-012");
    expect(generateParticipantId("US", 100)).toBe("US-100");
  });

  it("validates correct IDs", () => {
    expect(validateParticipantId("NAM-001")).toBe(true);
    expect(validateParticipantId("ZA-001")).toBe(true);
    expect(validateParticipantId("UK-999")).toBe(true);
  });

  it("rejects invalid IDs", () => {
    expect(validateParticipantId("nam-001")).toBe(false);
    expect(validateParticipantId("NAM001")).toBe(false);
    expect(validateParticipantId("NAM-1")).toBe(false);
    expect(validateParticipantId("")).toBe(false);
    expect(validateParticipantId("TOOLONG-001")).toBe(false);
  });
});

// ─── Onboarding Checklist ─────────────────────────────────────

describe("Onboarding Checklist", () => {
  it("creates empty checklist with all false", () => {
    const checklist = createEmptyChecklist();
    expect(Object.values(checklist).every((v) => v === false)).toBe(true);
  });

  it("calculates 0% progress for empty checklist", () => {
    expect(calculateOnboardingProgress(createEmptyChecklist())).toBe(0);
  });

  it("calculates 100% progress for fully complete checklist", () => {
    const full: OnboardingChecklist = {
      inviteSent: true,
      profileCreated: true,
      nightscoutConnected: true,
      firstSyncComplete: true,
      dashboardAccessed: true,
      feedbackCollected: true,
    };
    expect(calculateOnboardingProgress(full)).toBe(100);
  });

  it("calculates 50% for half complete checklist", () => {
    const half: OnboardingChecklist = {
      inviteSent: true,
      profileCreated: true,
      nightscoutConnected: true,
      firstSyncComplete: false,
      dashboardAccessed: false,
      feedbackCollected: false,
    };
    expect(calculateOnboardingProgress(half)).toBe(50);
  });

  it("returns first step when nothing done", () => {
    const step = getNextOnboardingStep(createEmptyChecklist());
    expect(step).toContain("invite");
  });

  it("returns null when all steps complete", () => {
    const full: OnboardingChecklist = {
      inviteSent: true,
      profileCreated: true,
      nightscoutConnected: true,
      firstSyncComplete: true,
      dashboardAccessed: true,
      feedbackCollected: true,
    };
    expect(getNextOnboardingStep(full)).toBeNull();
  });

  it("returns profile step after invite sent", () => {
    const step = getNextOnboardingStep({
      ...createEmptyChecklist(),
      inviteSent: true,
    });
    expect(step).toContain("profile");
  });

  it("returns nightscout step after profile created", () => {
    const step = getNextOnboardingStep({
      ...createEmptyChecklist(),
      inviteSent: true,
      profileCreated: true,
    });
    expect(step?.toLowerCase()).toContain("nightscout");
  });
});

// ─── Nightscout Instructions ──────────────────────────────────

describe("Nightscout Instructions", () => {
  const instructions = generateNightscoutInstructions(
    "NAM-001",
    "https://nam001.ns.10be.de/"
  );

  it("returns correct participantId", () => {
    expect(instructions.participantId).toBe("NAM-001");
  });

  it("returns correct nightscoutUrl", () => {
    expect(instructions.nightscoutUrl).toBe("https://nam001.ns.10be.de/");
  });

  it("returns at least 5 setup steps", () => {
    expect(instructions.steps.length).toBeGreaterThanOrEqual(5);
  });

  it("includes the URL in the steps", () => {
    const hasUrl = instructions.steps.some((s) =>
      s.includes("https://nam001.ns.10be.de/")
    );
    expect(hasUrl).toBe(true);
  });

  it("returns at least 3 troubleshooting items", () => {
    expect(instructions.troubleshooting.length).toBeGreaterThanOrEqual(3);
  });

  it("returns support email", () => {
    expect(instructions.supportEmail).toBe("dev@glumira.ai");
  });
});

// ─── Welcome Email ────────────────────────────────────────────

describe("Welcome Email", () => {
  const email = generateWelcomeEmail(
    "ZA-001",
    "https://glumira.ai/auth/magic?token=abc123",
    "ZA"
  );

  it("uses dev@glumira.ai as recipient (anonymised)", () => {
    expect(email.to).toBe("dev@glumira.ai");
  });

  it("includes participant ID in subject", () => {
    expect(email.subject).toContain("ZA-001");
  });

  it("includes magic link in HTML body", () => {
    expect(email.htmlBody).toContain("https://glumira.ai/auth/magic?token=abc123");
  });

  it("includes magic link in text body", () => {
    expect(email.textBody).toContain("https://glumira.ai/auth/magic?token=abc123");
  });

  it("includes disclaimer in HTML body", () => {
    expect(email.htmlBody).toContain("not a medical device");
  });

  it("includes GluMira branding", () => {
    expect(email.htmlBody).toContain("GluMira");
    expect(email.htmlBody).toContain("IOB Hunter");
  });

  it("includes South Africa in body for ZA region", () => {
    expect(email.htmlBody).toContain("South Africa");
  });
});

// ─── Feedback Validation ──────────────────────────────────────

describe("Feedback Validation", () => {
  it("accepts valid feedback entry", () => {
    const result = validateFeedbackEntry({
      category: "iob_chart",
      rating: 5,
      comment: "The IOB chart is very clear and easy to understand.",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing category", () => {
    const result = validateFeedbackEntry({ rating: 4, comment: "Great tool!" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("category"))).toBe(true);
  });

  it("rejects rating below 1", () => {
    const result = validateFeedbackEntry({
      category: "general",
      rating: 0,
      comment: "Some feedback here",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("rating"))).toBe(true);
  });

  it("rejects rating above 5", () => {
    const result = validateFeedbackEntry({
      category: "general",
      rating: 6,
      comment: "Some feedback here",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects comment that is too short", () => {
    const result = validateFeedbackEntry({
      category: "bug",
      rating: 2,
      comment: "Bad",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("comment"))).toBe(true);
  });

  it("rejects comment that is too long", () => {
    const result = validateFeedbackEntry({
      category: "general",
      rating: 3,
      comment: "x".repeat(2001),
    });
    expect(result.valid).toBe(false);
  });

  it("accepts all valid feedback categories", () => {
    const categories: FeedbackEntry["category"][] = [
      "iob_chart",
      "glucose_timeline",
      "school_care_plan",
      "general",
      "bug",
    ];
    for (const category of categories) {
      const result = validateFeedbackEntry({
        category,
        rating: 4,
        comment: "This is valid feedback for testing purposes.",
      });
      expect(result.valid).toBe(true);
    }
  });
});
