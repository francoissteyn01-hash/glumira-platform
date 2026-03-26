/**
 * GluMira™ Environment Variable Validator
 * Version: 7.0.0
 *
 * Run before deployment to verify all required environment variables are set.
 * Usage: npx tsx scripts/validate-env.ts
 *
 * Exit codes:
 *   0 — All required variables present
 *   1 — One or more required variables missing
 */

const REQUIRED_ENV_VARS: { name: string; description: string; tier: "critical" | "required" | "optional" }[] = [
  // Critical — app will not start without these
  { name: "NEXT_PUBLIC_SUPABASE_URL", description: "Supabase project URL", tier: "critical" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", description: "Supabase anon/public key", tier: "critical" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Supabase service role key (server-only)", tier: "critical" },
  { name: "DATABASE_URL", description: "MySQL/TiDB connection string", tier: "critical" },

  // Required — features will be degraded without these
  { name: "ANTHROPIC_API_KEY", description: "Claude Sonnet API key for Clinician Assistant", tier: "required" },
  { name: "NIGHTSCOUT_BASE_URL", description: "Default Nightscout instance URL", tier: "required" },
  { name: "NIGHTSCOUT_API_SECRET", description: "Nightscout API secret (hashed)", tier: "required" },
  { name: "CRON_SECRET", description: "Secret for cron endpoint authentication", tier: "required" },
  { name: "DATADOG_API_KEY", description: "Datadog API key for SIEM monitors", tier: "required" },
  { name: "DATADOG_APP_KEY", description: "Datadog application key", tier: "required" },
  { name: "AUDIT_HMAC_SECRET", description: "HMAC-SHA256 secret for audit log chaining", tier: "required" },

  // Optional — gracefully degraded if absent
  { name: "SMTP_HOST", description: "SMTP host for transactional email", tier: "optional" },
  { name: "SMTP_PORT", description: "SMTP port", tier: "optional" },
  { name: "SMTP_USER", description: "SMTP username", tier: "optional" },
  { name: "SMTP_PASS", description: "SMTP password", tier: "optional" },
  { name: "SNYK_TOKEN", description: "Snyk token for CI security scanning", tier: "optional" },
  { name: "VERCEL_ENV", description: "Vercel environment (production/preview/development)", tier: "optional" },
];

function validateEnv(): void {
  const missing: typeof REQUIRED_ENV_VARS = [];
  const present: typeof REQUIRED_ENV_VARS = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name];
    if (!value || value.trim() === "") {
      missing.push(envVar);
    } else {
      present.push(envVar);
    }
  }

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║       GluMira™ Environment Validation v7.0.0         ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // Print present variables
  if (present.length > 0) {
    console.log("✅ Present variables:\n");
    for (const v of present) {
      const tier = v.tier === "critical" ? "[CRITICAL]" : v.tier === "required" ? "[REQUIRED]" : "[OPTIONAL]";
      console.log(`   ✓ ${v.name.padEnd(40)} ${tier}`);
    }
    console.log();
  }

  // Print missing variables
  const criticalMissing = missing.filter((v) => v.tier === "critical");
  const requiredMissing = missing.filter((v) => v.tier === "required");
  const optionalMissing = missing.filter((v) => v.tier === "optional");

  if (missing.length > 0) {
    console.log("❌ Missing variables:\n");
    for (const v of missing) {
      const tier = v.tier === "critical" ? "[CRITICAL]" : v.tier === "required" ? "[REQUIRED]" : "[OPTIONAL]";
      console.log(`   ✗ ${v.name.padEnd(40)} ${tier}`);
      console.log(`     → ${v.description}\n`);
    }
  }

  // Summary
  console.log("─────────────────────────────────────────────────────");
  console.log(`Present:  ${present.length}/${REQUIRED_ENV_VARS.length}`);
  console.log(`Missing:  ${missing.length}/${REQUIRED_ENV_VARS.length}`);
  if (criticalMissing.length > 0) {
    console.log(`\n🚨 CRITICAL: ${criticalMissing.length} critical variable(s) missing — app WILL NOT start.`);
  }
  if (requiredMissing.length > 0) {
    console.log(`\n⚠️  WARNING: ${requiredMissing.length} required variable(s) missing — features will be degraded.`);
  }
  console.log();

  if (criticalMissing.length > 0) {
    process.exit(1);
  }

  console.log("✅ All critical variables present. Ready to deploy.\n");
  process.exit(0);
}

validateEnv();
