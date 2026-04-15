/**
 * Anonymous Auth Hook
 * UUID-based authentication with localStorage persistence
 * No email, no personal data, complete privacy
 */

import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../api/supabase';

interface AnonymousUser {
  id: string; // UUID
  createdAt: number; // timestamp
  sessionId: string; // browser session ID
}

const STORAGE_KEY = 'glumira_anon_user';
const SESSION_KEY = 'glumira_session_id';

export function useAnonymousAuth() {
  const [user, setUser] = useState<AnonymousUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize or retrieve anonymous user
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user exists in localStorage
      const storedUser = localStorage.getItem(STORAGE_KEY);
      let anonUser: AnonymousUser;

      if (storedUser) {
        anonUser = JSON.parse(storedUser);
      } else {
        // Create new anonymous user
        anonUser = {
          id: uuidv4(),
          createdAt: Date.now(),
          sessionId: uuidv4(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(anonUser));
      }

      // Update session ID on each session (for analytics)
      const sessionId = uuidv4();
      sessionStorage.setItem(SESSION_KEY, sessionId);

      // Verify/sync with Supabase (creates user record if needed)
      const { error: err } = await supabase
        .from('anonymous_users')
        .upsert(
          {
            id: anonUser.id,
            session_id: sessionId,
            last_seen: new Date().toISOString(),
            device_type: getDeviceType(),
          },
          { onConflict: 'id' }
        );

      if (err) {
        console.warn('Anonymous user sync failed:', err);
        // Continue offline if sync fails
      }

      setUser(anonUser);
    } catch (err) {
      console.error('Auth initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Auth failed');
      // Fallback: create local-only user
      const localUser: AnonymousUser = {
        id: uuidv4(),
        createdAt: Date.now(),
        sessionId: uuidv4(),
      };
      setUser(localUser);
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout: clear localStorage
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return {
    user,
    userId: user?.id,
    sessionId: user?.sessionId,
    loading,
    error,
    logout,
  };
}

function getDeviceType(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('iphone') || ua.includes('ipod')) return 'ios';
  if (ua.includes('ipad')) return 'ipad';
  if (ua.includes('android')) return 'android';
  if (ua.includes('mobile')) return 'mobile';
  return 'desktop';
}
