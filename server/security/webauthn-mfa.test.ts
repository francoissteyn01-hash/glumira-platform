/**
 * GluMira™ WebAuthn MFA Tests
 * Version: 7.1.0
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  generateChallenge,
  generateMfaSessionToken,
  beginMfaRegistration,
  finishMfaRegistration,
  beginMfaAuthentication,
  finishMfaAuthentication,
  storeChallenge,
  consumeChallenge,
  type WebAuthnCredential,
} from "./webauthn-mfa";

const TEST_USER_ID = "clinician-user-uuid-001";
const TEST_EMAIL = "clinician@glumira.ai";

describe("WebAuthn MFA — Challenge Management", () => {
  it("generates a unique base64url challenge", () => {
    const c1 = generateChallenge();
    const c2 = generateChallenge();
    expect(c1).not.toBe(c2);
    expect(c1.length).toBeGreaterThan(20);
  });

  it("stores and consumes a challenge (single-use)", () => {
    const challenge = generateChallenge();
    storeChallenge({
      challenge,
      userId: TEST_USER_ID,
      expiresAt: Date.now() + 300_000,
      type: "registration",
    });
    const consumed = consumeChallenge(challenge);
    expect(consumed).not.toBeNull();
    expect(consumed?.userId).toBe(TEST_USER_ID);
    // Second consumption must return null (single-use)
    const second = consumeChallenge(challenge);
    expect(second).toBeNull();
  });

  it("returns null for an unknown challenge", () => {
    expect(consumeChallenge("nonexistent-challenge")).toBeNull();
  });

  it("returns null for an expired challenge", () => {
    const challenge = generateChallenge();
    storeChallenge({
      challenge,
      userId: TEST_USER_ID,
      expiresAt: Date.now() - 1, // already expired
      type: "authentication",
    });
    expect(consumeChallenge(challenge)).toBeNull();
  });
});

describe("WebAuthn MFA — MFA Session Token", () => {
  it("generates a unique MFA session token per user", () => {
    const t1 = generateMfaSessionToken(TEST_USER_ID);
    const t2 = generateMfaSessionToken(TEST_USER_ID);
    expect(t1).not.toBe(t2);
    expect(t1.startsWith("mfa_")).toBe(true);
  });
});

describe("WebAuthn MFA — Registration Flow", () => {
  it("returns valid registration options", () => {
    const options = beginMfaRegistration(TEST_USER_ID, TEST_EMAIL);
    expect(options.challenge).toBeTruthy();
    expect(options.rpId).toBe("glumira.ai");
    expect(options.rpName).toBe("GluMira™ Clinical Platform");
    expect(options.userId).toBe(TEST_USER_ID);
    expect(options.authenticatorSelection.userVerification).toBe("required");
    expect(options.authenticatorSelection.residentKey).toBe("required");
  });

  it("completes registration with a valid challenge", () => {
    const options = beginMfaRegistration(TEST_USER_ID, TEST_EMAIL);
    const result = finishMfaRegistration(
      options.challenge,
      "cred-id-base64url",
      "public-key-cose-base64",
      TEST_USER_ID,
      "MacBook Touch ID"
    );
    expect(result.success).toBe(true);
    expect(result.credential?.id).toBe("cred-id-base64url");
    expect(result.credential?.nickname).toBe("MacBook Touch ID");
    expect(result.credential?.counter).toBe(0);
  });

  it("rejects registration with an expired/unknown challenge", () => {
    const result = finishMfaRegistration(
      "invalid-challenge",
      "cred-id",
      "pubkey",
      TEST_USER_ID
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Challenge expired");
  });

  it("rejects registration with a user ID mismatch", () => {
    const options = beginMfaRegistration(TEST_USER_ID, TEST_EMAIL);
    const result = finishMfaRegistration(
      options.challenge,
      "cred-id",
      "pubkey",
      "different-user-id"
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("user mismatch");
  });
});

describe("WebAuthn MFA — Authentication Flow", () => {
  const mockCredential: WebAuthnCredential = {
    id: "cred-id-base64url",
    userId: TEST_USER_ID,
    publicKey: "public-key-cose-base64",
    counter: 5,
    deviceType: "platform",
    transports: ["internal"],
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    nickname: "MacBook Touch ID",
  };

  it("returns valid authentication options", () => {
    const options = beginMfaAuthentication(TEST_USER_ID, [mockCredential]);
    expect(options.challenge).toBeTruthy();
    expect(options.rpId).toBe("glumira.ai");
    expect(options.userVerification).toBe("required");
    expect(options.allowCredentials).toHaveLength(1);
    expect(options.allowCredentials[0].id).toBe("cred-id-base64url");
  });

  it("completes authentication with a valid challenge and counter", () => {
    const options = beginMfaAuthentication(TEST_USER_ID, [mockCredential]);
    const result = finishMfaAuthentication(
      options.challenge,
      "cred-id-base64url",
      TEST_USER_ID,
      6, // counter incremented
      mockCredential
    );
    expect(result.success).toBe(true);
    expect(result.mfaSessionToken).toBeTruthy();
    expect(result.mfaSessionToken?.startsWith("mfa_")).toBe(true);
    expect(result.userId).toBe(TEST_USER_ID);
  });

  it("rejects authentication with a replay counter (counter not incremented)", () => {
    const options = beginMfaAuthentication(TEST_USER_ID, [mockCredential]);
    const result = finishMfaAuthentication(
      options.challenge,
      "cred-id-base64url",
      TEST_USER_ID,
      5, // same counter — replay attack
      mockCredential
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("replay");
  });

  it("rejects authentication with a credential ID mismatch", () => {
    const options = beginMfaAuthentication(TEST_USER_ID, [mockCredential]);
    const result = finishMfaAuthentication(
      options.challenge,
      "wrong-cred-id",
      TEST_USER_ID,
      6,
      mockCredential
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Credential ID mismatch");
  });

  it("rejects authentication with an expired challenge", () => {
    const result = finishMfaAuthentication(
      "expired-challenge",
      "cred-id-base64url",
      TEST_USER_ID,
      6,
      mockCredential
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Challenge expired");
  });
});
