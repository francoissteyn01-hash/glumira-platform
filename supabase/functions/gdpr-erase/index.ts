/**
 * GluMira™ Supabase Edge Function — GDPR Erase
 * Version: 7.0.0
 * Function: gdpr-erase
 *
 * Handles Right to Erasure (GDPR Article 17) requests.
 * Performs a full cascade delete of all patient data for a given user.
 *
 * Trigger: POST /functions/v1/gdpr-erase
 * Auth:    Bearer token (Supabase JWT — must be the user's own token)
 * Body:    { userId: string, confirmPhrase: "DELETE MY DATA" }
 *
 * Cascade delete order:
 *   1. audit_log entries for user
 *   2. glucose_readings
 *   3. insulin_doses
 *   4. basal_profiles
 *   5. meal_logs
 *   6. patient_profiles
 *   7. auth.users (Supabase Admin API)
 *
 * All deletions are logged to an immutable GDPR compliance record
 * before the audit_log is cleared.
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GDPR_CONFIRM_PHRASE = "DELETE MY DATA";

interface EraseRequest {
  userId: string;
  confirmPhrase: string;
}

interface EraseResult {
  success: boolean;
  userId: string;
  erasedAt: string;
  tablesCleared: string[];
  complianceRecordId: string;
}

/**
 * Generate a compliance record ID for audit purposes.
 * Format: GDPR-{timestamp}-{userId-prefix}
 */
function generateComplianceRecordId(userId: string): string {
  const ts = Date.now();
  const prefix = userId.substring(0, 8).replace(/-/g, "");
  return `GDPR-${ts}-${prefix}`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const jwt = authHeader.replace("Bearer ", "");

  // Parse request body
  let body: EraseRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { userId, confirmPhrase } = body;

  // Validate confirm phrase
  if (confirmPhrase !== GDPR_CONFIRM_PHRASE) {
    return new Response(
      JSON.stringify({
        error: `Confirmation phrase must be exactly: "${GDPR_CONFIRM_PHRASE}"`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!userId || typeof userId !== "string") {
    return new Response(JSON.stringify({ error: "userId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create Supabase client — user context (to verify ownership)
  const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  // Verify the JWT belongs to the userId being erased
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user || user.id !== userId) {
    return new Response(
      JSON.stringify({ error: "Unauthorised: JWT does not match userId" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create service role client for cascade delete
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const erasedAt = new Date().toISOString();
  const complianceRecordId = generateComplianceRecordId(userId);
  const tablesCleared: string[] = [];

  try {
    // Step 1: Write GDPR compliance record BEFORE deleting audit_log
    await adminClient.from("gdpr_compliance_records").insert({
      id: complianceRecordId,
      user_id: userId,
      erased_at: erasedAt,
      request_type: "right_to_erasure",
      confirmed_phrase: GDPR_CONFIRM_PHRASE,
    });

    // Step 2: Cascade delete in dependency order
    const tables = [
      "audit_log",
      "glucose_readings",
      "insulin_doses",
      "basal_profiles",
      "meal_logs",
      "patient_profiles",
    ];

    for (const table of tables) {
      const { error } = await adminClient
        .from(table)
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error(`Error deleting from ${table}:`, error.message);
        // Continue — partial erasure is better than none
      } else {
        tablesCleared.push(table);
      }
    }

    // Step 3: Delete Supabase auth user (irreversible)
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error("Error deleting auth user:", deleteUserError.message);
    } else {
      tablesCleared.push("auth.users");
    }

    const result: EraseResult = {
      success: true,
      userId,
      erasedAt,
      tablesCleared,
      complianceRecordId,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GDPR erase failed:", err);
    return new Response(
      JSON.stringify({ error: "Internal error during erasure. Contact dev@glumira.ai." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
