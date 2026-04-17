/**
 * GluMira™ V7 — useAnonymousAuth
 *
 * Uses Supabase native anonymous sign-in (signInAnonymously) instead of a
 * raw UUID in localStorage. Benefits:
 *   - Session managed by Supabase token refresh — survives localStorage wipe
 *     on the same device as long as the Supabase session is valid.
 *   - User can later convert to a full account by linking email or OAuth
 *     (supabase.auth.updateUser({ email }) → magic-link flow).
 *   - RLS policies work correctly because auth.uid() matches the real user ID.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/api/supabase";
import type { User } from "@supabase/supabase-js";

export type AnonymousUser = {
  id: string;       // Supabase user UUID
  isAnonymous: true;
  createdAt: string;
};

export function useAnonymousAuth() {
  const [user,    setUser]    = useState<AnonymousUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const toAnon = (u: User): AnonymousUser => ({
    id:          u.id,
    isAnonymous: true,
    createdAt:   u.created_at,
  });

  const initializeAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Reuse existing Supabase session if already signed in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(toAnon(session.user));
        return;
      }
      // No session — create a new anonymous Supabase user
      const { data, error: signInErr } = await supabase.auth.signInAnonymously();
      if (signInErr) throw signInErr;
      if (data.user) setUser(toAnon(data.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) setUser(toAnon(session.user));
      else setUser(null);
    });
    return () => subscription.unsubscribe();
  }, [initializeAuth]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  /**
   * Convert this anonymous session to a full account by linking an email.
   * Supabase sends a magic-link; after the user clicks it the anonymous user
   * is upgraded in place — same user ID, all existing data preserved.
   */
  const linkEmail = useCallback(async (email: string) => {
    const { error: updateErr } = await supabase.auth.updateUser({ email });
    if (updateErr) throw updateErr;
  }, []);

  return {
    user,
    userId:  user?.id ?? null,
    loading,
    error,
    logout,
    linkEmail,
  };
}
