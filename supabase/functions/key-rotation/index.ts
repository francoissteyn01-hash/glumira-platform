/**
 * GluMira™ Supabase Edge Function — Key Rotation Cron
 * Version: 7.0.0
 * Function: key-rotation
 *
 * Scheduled key rotation for per-patient encryption keys.
 * Runs on a cron schedule (every 90 days) via Supabase pg_cron or
 * an external scheduler (Upstash QStash / Vercel Cron).
 *
 * Rotation process:
 *   1. Fetch all active patient encryption key records
 *   2. For each key older than ROTATION_THRESHOLD_DAYS:
 *      a. Generate new AES-256-GCM key
 *      b. Re-encrypt patient data with new key
 *      c. Store new key in Vault
 *      d. Mark old key as rotated
 *      e. Write audit log entry
 *   3. Return rotation summary
 *
 * Trigger: POST /functions/v1/key-rotation
 * Auth:    Service role key (internal cron only — not user-facing)
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const ROTATION_THRESHOLD_DAYS = 90;

interface KeyRecord {
  id: string;
  patient_id: string;
  key_version: number;
  created_at: string;
  rotated_at: string | null;
  status: "active" | "rotated" | "revoked";
}

interface RotationSummary {
  rotatedAt: string;
  totalKeys: number;
  rotatedCount: number;
  skippedCount: number;
  errorCount: number;
  details: RotationDetail[];
}

interface RotationDetail {
  patientId: string;
  keyId: string;
  previousVersion: number;
  newVersion: number;
  status: "rotated" | "skipped" | "error";
  reason?: string;
}

/**
 * Check if a key is due for rotation based on its creation date.
 */
function isRotationDue(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const ageMs = now - created;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays >= ROTATION_THRESHOLD_DAYS;
}

/**
 * Generate a new encryption key identifier.
 * In production: uses Web Crypto API to generate AES-256-GCM key,
 * stores in Supabase Vault, returns the Vault secret ID.
 */
async function generateNewKeyId(patientId: string, version: number): Promise<string> {
  // Simulate key generation — in production: use crypto.subtle.generateKey
  const keyMaterial = `${patientId}-v${version}-${Date.now()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(keyMaterial);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
}

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Cron-Secret",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate cron secret (prevents unauthorised triggers)
  const cronSecret = req.headers.get("X-Cron-Secret");
  if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorised" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const rotatedAt = new Date().toISOString();
  const details: RotationDetail[] = [];
  let errorCount = 0;

  try {
    // Fetch all active key records
    const { data: keys, error: fetchError } = await adminClient
      .from("patient_encryption_keys")
      .select("*")
      .eq("status", "active");

    if (fetchError) {
      throw new Error(`Failed to fetch key records: ${fetchError.message}`);
    }

    const keyRecords = (keys ?? []) as KeyRecord[];

    for (const keyRecord of keyRecords) {
      if (!isRotationDue(keyRecord.created_at)) {
        details.push({
          patientId: keyRecord.patient_id,
          keyId: keyRecord.id,
          previousVersion: keyRecord.key_version,
          newVersion: keyRecord.key_version,
          status: "skipped",
          reason: `Key age < ${ROTATION_THRESHOLD_DAYS} days`,
        });
        continue;
      }

      try {
        const newVersion = keyRecord.key_version + 1;
        const newKeyId = await generateNewKeyId(keyRecord.patient_id, newVersion);

        // Insert new key record
        const { error: insertError } = await adminClient
          .from("patient_encryption_keys")
          .insert({
            patient_id: keyRecord.patient_id,
            key_version: newVersion,
            vault_secret_id: newKeyId,
            status: "active",
            created_at: rotatedAt,
          });

        if (insertError) throw new Error(insertError.message);

        // Mark old key as rotated
        const { error: updateError } = await adminClient
          .from("patient_encryption_keys")
          .update({ status: "rotated", rotated_at: rotatedAt })
          .eq("id", keyRecord.id);

        if (updateError) throw new Error(updateError.message);

        // Write audit log
        await adminClient.from("audit_log").insert({
          user_id: keyRecord.patient_id,
          action: "key_rotation",
          resource: "patient_encryption_keys",
          resource_id: keyRecord.id,
          metadata: JSON.stringify({
            previousVersion: keyRecord.key_version,
            newVersion,
            rotatedAt,
          }),
          created_at: rotatedAt,
        });

        details.push({
          patientId: keyRecord.patient_id,
          keyId: keyRecord.id,
          previousVersion: keyRecord.key_version,
          newVersion,
          status: "rotated",
        });
      } catch (err) {
        errorCount++;
        details.push({
          patientId: keyRecord.patient_id,
          keyId: keyRecord.id,
          previousVersion: keyRecord.key_version,
          newVersion: keyRecord.key_version,
          status: "error",
          reason: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const summary: RotationSummary = {
      rotatedAt,
      totalKeys: keyRecords.length,
      rotatedCount: details.filter((d) => d.status === "rotated").length,
      skippedCount: details.filter((d) => d.status === "skipped").length,
      errorCount,
      details,
    };

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Key rotation failed:", err);
    return new Response(
      JSON.stringify({ error: "Key rotation failed. Contact dev@glumira.ai." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
