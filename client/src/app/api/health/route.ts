/**
 * GluMira™ Health Check API Route
 * Version: 7.0.0
 * Route: GET /api/health
 *
 * Returns system health status for:
 *   - Application (always ok if route responds)
 *   - Supabase connectivity
 *   - Database connectivity
 *   - Environment variable completeness
 *
 * Used by:
 *   - Vercel deployment verification
 *   - Datadog synthetic monitor
 *   - CI/CD post-deploy check
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const APP_VERSION = "7.0.0";

type ServiceStatus = "ok" | "degraded" | "error" | "unconfigured";

interface ServiceCheck {
  status: ServiceStatus;
  latencyMs?: number;
  message?: string;
}

interface HealthResponse {
  status: "ok" | "degraded" | "error";
  version: string;
  timestamp: string;
  environment: string;
  services: {
    app: ServiceCheck;
    supabase: ServiceCheck;
    database: ServiceCheck;
    env: ServiceCheck;
  };
}

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
];

function checkEnvVars(): ServiceCheck {
  const missing = REQUIRED_ENV_VARS.filter(
    (v) => !process.env[v] || process.env[v]!.trim() === ""
  );

  if (missing.length === 0) {
    return { status: "ok" };
  }

  return {
    status: "degraded",
    message: `Missing: ${missing.join(", ")}`,
  };
}

async function checkSupabase(): Promise<ServiceCheck> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { status: "unconfigured", message: "Supabase env vars not set" };
  }

  const start = Date.now();
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    // Lightweight ping — fetch a single row from a known table
    const { error } = await supabase
      .from("patient_profiles")
      .select("id")
      .limit(1)
      .maybeSingle();

    const latencyMs = Date.now() - start;

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found — that's fine
      return { status: "error", latencyMs, message: error.message };
    }

    return { status: "ok", latencyMs };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Supabase unreachable",
    };
  }
}

export async function GET(): Promise<NextResponse> {
  const timestamp = new Date().toISOString();
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";

  // Run checks
  const [supabaseCheck, envCheck] = await Promise.all([
    checkSupabase(),
    Promise.resolve(checkEnvVars()),
  ]);

  const appCheck: ServiceCheck = { status: "ok" };

  // Database check — proxied through Supabase
  const databaseCheck: ServiceCheck =
    supabaseCheck.status === "ok"
      ? { status: "ok", latencyMs: supabaseCheck.latencyMs }
      : { status: supabaseCheck.status, message: supabaseCheck.message };

  // Overall status
  const allChecks = [appCheck, supabaseCheck, databaseCheck, envCheck];
  const hasError = allChecks.some((c) => c.status === "error");
  const hasDegraded = allChecks.some(
    (c) => c.status === "degraded" || c.status === "unconfigured"
  );

  const overallStatus: HealthResponse["status"] = hasError
    ? "error"
    : hasDegraded
    ? "degraded"
    : "ok";

  const response: HealthResponse = {
    status: overallStatus,
    version: APP_VERSION,
    timestamp,
    environment,
    services: {
      app: appCheck,
      supabase: supabaseCheck,
      database: databaseCheck,
      env: envCheck,
    },
  };

  const httpStatus = overallStatus === "error" ? 503 : 200;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
