/**
 * GluMira™ Caregiver Consent Flow
 * Version: 7.1.0
 * Module: CAREGIVER-CONSENT
 *
 * Manages the full lifecycle of caregiver data sharing consent:
 *   1. Clinician/patient initiates a share invitation
 *   2. Caregiver receives an invite token (email/link)
 *   3. Caregiver accepts or declines consent
 *   4. Consent is recorded with timestamp and scope
 *   5. Revocation is supported at any time by either party
 *
 * Consent scopes:
 *   - "read:glucose"    — view glucose readings
 *   - "read:insulin"    — view insulin doses
 *   - "read:meals"      — view meal logs
 *   - "read:iob"        — view IOB calculations
 *   - "read:full"       — all of the above
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible.
 */
import { randomBytes, createHash } from "crypto";

// ─── Types ────────────────────────────────────────────────────
export type ConsentScope =
  | "read:glucose"
  | "read:insulin"
  | "read:meals"
  | "read:iob"
  | "read:full";

export type ConsentStatus = "pending" | "accepted" | "declined" | "revoked";

export interface CaregiverInvite {
  inviteToken: string;          // single-use secure token
  patientProfileId: string;
  invitedByUserId: string;      // clinician or patient who initiated
  caregiverEmail: string;
  scopes: ConsentScope[];
  expiresAt: number;            // Unix timestamp (ms)
  createdAt: string;
}

export interface CaregiverConsent {
  id: string;
  patientProfileId: string;
  caregiverUserId: string;
  sharedByUserId: string;
  scopes: ConsentScope[];
  status: ConsentStatus;
  consentedAt: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  inviteToken: string;
}

export interface ConsentResult {
  success: boolean;
  consent?: CaregiverConsent;
  error?: string;
}

// ─── In-memory store (production: Supabase caregiver_shares table) ──
const inviteStore = new Map<string, CaregiverInvite>();
const consentStore = new Map<string, CaregiverConsent>();
const INVITE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

// ─── Helpers ──────────────────────────────────────────────────
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function generateConsentId(patientId: string, caregiverId: string): string {
  return createHash("sha256")
    .update(`${patientId}:${caregiverId}:${Date.now()}`)
    .digest("hex")
    .slice(0, 32);
}

// ─── Invite Creation ──────────────────────────────────────────
/**
 * Create a caregiver share invitation.
 * Returns an invite token to be sent to the caregiver via email.
 */
export function createCaregiverInvite(
  patientProfileId: string,
  invitedByUserId: string,
  caregiverEmail: string,
  scopes: ConsentScope[]
): CaregiverInvite {
  if (!scopes || scopes.length === 0) {
    throw new Error("At least one consent scope must be specified.");
  }

  const inviteToken = generateInviteToken();
  const invite: CaregiverInvite = {
    inviteToken,
    patientProfileId,
    invitedByUserId,
    caregiverEmail,
    scopes,
    expiresAt: Date.now() + INVITE_TTL_MS,
    createdAt: new Date().toISOString(),
  };

  inviteStore.set(inviteToken, invite);
  return invite;
}

// ─── Consent Acceptance ───────────────────────────────────────
/**
 * Caregiver accepts a share invitation.
 * Validates the token and creates a consent record.
 */
export function acceptCaregiverConsent(
  inviteToken: string,
  caregiverUserId: string
): ConsentResult {
  const invite = inviteStore.get(inviteToken);
  if (!invite) {
    return { success: false, error: "Invite token not found or already used." };
  }
  if (Date.now() > invite.expiresAt) {
    inviteStore.delete(inviteToken);
    return { success: false, error: "Invite token has expired." };
  }

  const consentId = generateConsentId(invite.patientProfileId, caregiverUserId);
  const consent: CaregiverConsent = {
    id: consentId,
    patientProfileId: invite.patientProfileId,
    caregiverUserId,
    sharedByUserId: invite.invitedByUserId,
    scopes: invite.scopes,
    status: "accepted",
    consentedAt: new Date().toISOString(),
    revokedAt: null,
    revokedBy: null,
    inviteToken,
  };

  consentStore.set(consentId, consent);
  inviteStore.delete(inviteToken); // single-use token consumed
  return { success: true, consent };
}

// ─── Consent Decline ──────────────────────────────────────────
/**
 * Caregiver declines a share invitation.
 */
export function declineCaregiverConsent(
  inviteToken: string,
  caregiverUserId: string
): ConsentResult {
  const invite = inviteStore.get(inviteToken);
  if (!invite) {
    return { success: false, error: "Invite token not found or already used." };
  }

  const consentId = generateConsentId(invite.patientProfileId, caregiverUserId);
  const consent: CaregiverConsent = {
    id: consentId,
    patientProfileId: invite.patientProfileId,
    caregiverUserId,
    sharedByUserId: invite.invitedByUserId,
    scopes: invite.scopes,
    status: "declined",
    consentedAt: null,
    revokedAt: new Date().toISOString(),
    revokedBy: caregiverUserId,
    inviteToken,
  };

  inviteStore.delete(inviteToken);
  return { success: true, consent };
}

// ─── Consent Revocation ───────────────────────────────────────
/**
 * Revoke an active consent. Can be initiated by either the patient or caregiver.
 */
export function revokeCaregiverConsent(
  consentId: string,
  revokedByUserId: string
): ConsentResult {
  const consent = consentStore.get(consentId);
  if (!consent) {
    return { success: false, error: "Consent record not found." };
  }
  if (consent.status === "revoked") {
    return { success: false, error: "Consent has already been revoked." };
  }
  if (
    consent.caregiverUserId !== revokedByUserId &&
    consent.sharedByUserId !== revokedByUserId
  ) {
    return { success: false, error: "Unauthorized: only the patient or caregiver can revoke consent." };
  }

  const revoked: CaregiverConsent = {
    ...consent,
    status: "revoked",
    revokedAt: new Date().toISOString(),
    revokedBy: revokedByUserId,
  };

  consentStore.set(consentId, revoked);
  return { success: true, consent: revoked };
}

// ─── Consent Validation ───────────────────────────────────────
/**
 * Check if a caregiver has active consent for a specific scope.
 */
export function hasActiveConsent(
  consentId: string,
  requiredScope: ConsentScope
): boolean {
  const consent = consentStore.get(consentId);
  if (!consent || consent.status !== "accepted") return false;
  return (
    consent.scopes.includes(requiredScope) ||
    consent.scopes.includes("read:full")
  );
}

// ─── Lookup helpers ───────────────────────────────────────────
export function getConsent(consentId: string): CaregiverConsent | undefined {
  return consentStore.get(consentId);
}

export function getInvite(inviteToken: string): CaregiverInvite | undefined {
  return inviteStore.get(inviteToken);
}
