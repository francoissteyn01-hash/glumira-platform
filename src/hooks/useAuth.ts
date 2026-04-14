import { useEffect, useState } from "react";
import { createClient, type User, type Session, type SupabaseClient } from "@supabase/supabase-js";

/* ─── Supabase client (hardcoded fallback + defensive detection) ────────── */
//
// Hardcoded fallback values exist so a missing env var in Netlify cannot
// silently break OAuth (see commit 87c9edb). The anon key is public by
// design — RLS policies on the Supabase side are the actual security
// boundary — but committing it does lock the project to one Supabase
// instance. See ARCHIVE-LOG.md 2026-04-11 entry for the trade-off.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://jxkdtvwlzhdgzhkbilbf.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4a2R0dndsemhkZ3poa2JpbGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTE2NzksImV4cCI6MjA4OTU2NzY3OX0.ka74Ohcq8r3HhlZcEWaqRU15FR6TdlkwuGLdGLrnyfc";

/**
 * True when the Supabase client is configured with non-placeholder values.
 * With the hardcoded fallback above this is effectively always true in
 * production today, but the check is kept as defense in depth: if the
 * fallback is ever removed and env vars are missing, this flag will flip
 * false and `ConfigErrorBanner` will render a visible site-wide error
 * instead of letting OAuth redirect users to a non-existent host.
 *
 * History: a 2026-04-11 production deploy shipped with both VITE_*
 * variables unset in Netlify, so the bundle baked the original
 * `placeholder.supabase.co` fallback and OAuth silently broke. The
 * hardcoded fallback (87c9edb) is the immediate fix; this detection
 * layer (ac3d2a8) is the safety net for the next time.
 */
export const isSupabaseConfigured: boolean =
  SUPABASE_URL.length > 0 &&
  SUPABASE_ANON_KEY.length > 0 &&
  !SUPABASE_URL.includes("placeholder.supabase.co") &&
  SUPABASE_ANON_KEY !== "placeholder-anon-key";

export const SUPABASE_CONFIG_ERROR =
  "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
  "in your environment (Netlify env vars in production, .env in local dev) " +
  "and trigger a clean rebuild. See docs/deploy-checklist.md.";

if (!isSupabaseConfigured) {
  console.error(`[GluMira] ${SUPABASE_CONFIG_ERROR}`);
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "glumira-auth",
      flowType: "pkce",
    },
  }
);

// When the client is unconfigured, replace the auth methods most likely to
// be called from the UI so they reject with a visible error instead of
// silently redirecting users to placeholder.supabase.co.
if (!isSupabaseConfigured) {
  const reject = () => Promise.reject(new Error(SUPABASE_CONFIG_ERROR));
  const auth = supabase.auth as unknown as Record<string, unknown>;
  auth.signInWithOAuth     = reject;
  auth.signInWithPassword  = reject;
  auth.signInWithOtp       = reject;
  auth.signUp              = reject;
  auth.resetPasswordForEmail = reject;
}

type AuthState = { user: User | null; session: Session | null; loading: boolean; }

export function useAuth(): AuthState & { signOut: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false });
    }).catch(() => {
      setState({ user: null, session: null, loading: false });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return { ...state, signOut };
}
