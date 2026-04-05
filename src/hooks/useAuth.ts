import { useEffect, useState } from "react";
import { createClient, type User, type Session, type SupabaseClient } from "@supabase/supabase-js";

/* ─── Defensive Supabase client ──────────────────────────────────────────── */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "[GluMira] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.\n" +
    "Ensure both are set in your .env file (local) or Netlify environment variables (production).\n" +
    "The auth form will render but sign-in/sign-up calls will fail gracefully."
  );
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder-anon-key",
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

interface AuthState { user: User | null; session: Session | null; loading: boolean; }

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
