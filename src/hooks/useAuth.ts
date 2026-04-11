import { useEffect, useState } from "react";
import { createClient, type User, type Session, type SupabaseClient } from "@supabase/supabase-js";

/* ─── Supabase client ────────────────────────────────────────────────────── */
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://jxkdtvwlzhdgzhkbilbf.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4a2R0dndsemhkZ3poa2JpbGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTE2NzksImV4cCI6MjA4OTU2NzY3OX0.ka74Ohcq8r3HhlZcEWaqRU15FR6TdlkwuGLdGLrnyfc";

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
