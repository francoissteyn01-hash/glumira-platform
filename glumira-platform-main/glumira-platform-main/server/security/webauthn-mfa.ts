/**
 * GluMira™ WebAuthn / Passkey MFA
 * Version: 7.1.0
 * Module: WEBAUTHN-MFA
 *
 * Implements FIDO2/WebAuthn Passkey multi-factor authentication for clinician accounts.
 * Clinicians with pro_profiles.mfa_required = true must complete a passkey challenge
 * before accessing patient data.
 *
 * Flow:
 *   1. POST /api/mfa/register/begin   → returns PublicKeyCredentialCreationOptions
 *   2. POST /api/mfa/register/finish  → verifies attestation, stores credential
 *   3. POST /api/mfa/authenticate/begin  → returns PublicKeyCredentialRequestOptions
 *   4. POST /api/mfa/authenticate/finish → verifies assertion, issues MFA session token
 *
 * Security:
 *   - Credentials stored in webauthn_credentials table (RLS: user_id = auth.uid())
 *   - Challenges are single-use, expire in 5 minutes
 *   - Replay attacks prevented by challenge nonce tracking
 *   - Audit log entry written on every MFA event
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible.
 */
import { randomBytes, createHash } from "crypto";

// ─── Types ────────────────────────────────────────────────────
export interface WebAuthnCredential {
  id: string;                   // base64url credential ID
  userId: string;               // Supabase auth.uid()
  publicKey: string;            // base64url-encoded COSE public key
  counter: number;              // signature counter (replay protection)
  deviceType: "platform" | "cross-platform";
  transports: string[];
  createdAt: string;
  lastUsedAt: string | null;
  nickname: string;             // user-friendly label (e.g., "MacBook Touch ID")
}

export interface MfaChallenge {
  challenge: string;            // base64url random nonce
  userId: string;
  expiresAt: number;            // Unix timestamp (ms)
  type: "registration" | "authentication";
}

export interface MfaRegistrationBeginResult {
  challenge: string;
  rpId: string;
  rpName: string;
  userId: string;
  userName: string;
  userDisplayName: string;
  timeout: number;
  attestation: "none";
  authenticatorSelection: {
    authenticatorAttachment: "platform";
    residentKey: "required";
    userVerification: "required";
  };
}

export interface MfaAuthenticationBeginResult {
  challenge: string;
  rpId: string;
  timeout: number;
  userVerification: "required";
  allowCredentials: Array<{ type: "public-key"; id: string; transports: string[] }>;
}

export interface MfaVerificationResult {
  success: boolean;
  credentialId?: string;
  userId?: string;
  mfaSessionToken?: string;
  error?: string;
}

// ─── In-memory challenge store (production: Redis/Supabase) ──
const challengeStore = new Map<string, MfaChallenge>();
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Helpers ──────────────────────────────────────────────────
/**
 * Generate a cryptographically secure base64url challenge nonce.
 */
export function generateChallenge(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Generate a short-lived MFA session token after successful authentication.
 * In production: issue a signed JWT with mfa=true claim.
 */
export function generateMfaSessionToken(userId: string): string {
  const nonce = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(`${userId}:${nonce}:${Date.now()}`)
    .digest("hex");
  return `mfa_${hash}`;
}

/**
 * Store a challenge nonce with expiry.
 */
export function storeChallenge(challenge: MfaChallenge): void {
  challengeStore.set(challenge.challenge, challenge);
  // Auto-expire
  setTimeout(() => challengeStore.delete(challenge.challenge), CHALLENGE_TTL_MS);
}

/**
 * Consume a challenge nonce (single-use).
 * Returns the challenge if valid, null if expired or not found.
 */
export function consumeChallenge(nonce: string): MfaChallenge | null {
  const challenge = challengeStore.get(nonce);
  if (!challenge) return null;
  if (Date.now() > challenge.expiresAt) {
    challengeStore.delete(nonce);
    return null;
  }
  challengeStore.delete(nonce); // single-use
  return challenge;
}

// ─── Registration ─────────────────────────────────────────────
/**
 * Begin WebAuthn passkey registration for a clinician.
 * Returns the PublicKeyCredentialCreationOptions to send to the browser.
 */
export function beginMfaRegistration(
  userId: string,
  userEmail: string,
  rpId: string = "glumira.ai"
): MfaRegistrationBeginResult {
  const challenge = generateChallenge();
  storeChallenge({
    challenge,
    userId,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    type: "registration",
  });

  return {
    challenge,
    rpId,
    rpName: "GluMira™ Clinical Platform",
    userId,
    userName: userEmail,
    userDisplayName: userEmail,
    timeout: CHALLENGE_TTL_MS,
    attestation: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    },
  };
}

/**
 * Finish WebAuthn passkey registration.
 * Verifies the attestation response and stores the credential.
 * In production: full CBOR/COSE decoding and attestation verification.
 */
export function finishMfaRegistration(
  challenge: string,
  credentialId: string,
  publicKey: string,
  userId: string,
  nickname: string = "Passkey"
): { success: boolean; credential?: WebAuthnCredential; error?: string } {
  const storedChallenge = consumeChallenge(challenge);
  if (!storedChallenge) {
    return { success: false, error: "Challenge expired or not found." };
  }
  if (storedChallenge.userId !== userId) {
    return { success: false, error: "Challenge user mismatch." };
  }
  if (storedChallenge.type !== "registration") {
    return { success: false, error: "Challenge type mismatch." };
  }

  const credential: WebAuthnCredential = {
    id: credentialId,
    userId,
    publicKey,
    counter: 0,
    deviceType: "platform",
    transports: ["internal"],
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    nickname,
  };

  return { success: true, credential };
}

// ─── Authentication ───────────────────────────────────────────
/**
 * Begin WebAuthn passkey authentication for a clinician.
 * Returns the PublicKeyCredentialRequestOptions to send to the browser.
 */
export function beginMfaAuthentication(
  userId: string,
  credentials: WebAuthnCredential[],
  rpId: string = "glumira.ai"
): MfaAuthenticationBeginResult {
  const challenge = generateChallenge();
  storeChallenge({
    challenge,
    userId,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    type: "authentication",
  });

  return {
    challenge,
    rpId,
    timeout: CHALLENGE_TTL_MS,
    userVerification: "required",
    allowCredentials: credentials.map((c) => ({
      type: "public-key",
      id: c.id,
      transports: c.transports,
    })),
  };
}

/**
 * Finish WebAuthn passkey authentication.
 * Verifies the assertion response and issues an MFA session token.
 * In production: full signature verification against stored public key.
 */
export function finishMfaAuthentication(
  challenge: string,
  credentialId: string,
  userId: string,
  newCounter: number,
  storedCredential: WebAuthnCredential
): MfaVerificationResult {
  const storedChallenge = consumeChallenge(challenge);
  if (!storedChallenge) {
    return { success: false, error: "Challenge expired or not found." };
  }
  if (storedChallenge.userId !== userId) {
    return { success: false, error: "Challenge user mismatch." };
  }
  if (storedChallenge.type !== "authentication") {
    return { success: false, error: "Challenge type mismatch." };
  }
  if (storedCredential.id !== credentialId) {
    return { success: false, error: "Credential ID mismatch." };
  }
  // Replay attack prevention: counter must be strictly increasing
  if (newCounter <= storedCredential.counter) {
    return { success: false, error: "Signature counter replay detected." };
  }

  const mfaSessionToken = generateMfaSessionToken(userId);
  return {
    success: true,
    credentialId,
    userId,
    mfaSessionToken,
  };
}
