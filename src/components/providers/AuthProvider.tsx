'use client';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store';
import { getProfile } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setAuthReady, setSavedPlaces } = useAppStore();
  const initializedRef = useRef(false);

  // Hydrate saved places wishlist (place IDs) from localStorage on mount (SSR-safe)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('wandersphere_saved_places') || '[]');
        if (saved.length > 0) setSavedPlaces(saved);
      } catch (e) {
        console.error('Failed to hydrate saved places from localStorage', e);
      }
    }
  }, [setSavedPlaces]);

  // Single initialization: get session → set user → fetch profile → set authReady
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          try {
            const profile = await getProfile(session.user.id);
            if (profile) setProfile(profile);
          } catch (e) {
            console.warn('[AuthProvider] Failed to fetch profile on init:', e);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (e) {
        console.warn('[AuthProvider] Supabase session check failed:', e);
        setUser(null);
        setProfile(null);
      } finally {
        setAuthReady(true);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          setUser(session.user);
          getProfile(session.user.id)
            .then((p) => {
              if (p) setProfile(p);
            })
            .catch((e) => console.warn('[AuthProvider] Failed to fetch profile after auth change:', e));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setAuthReady]);

  return <>{children}</>;
}

