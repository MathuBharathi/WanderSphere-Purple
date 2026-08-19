'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store';
import { getProfile } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setSavedPlaces } = useAppStore();

  // Hydrate localStorage-based state on mount (SSR-safe)
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

  useEffect(() => {
    const loadLocalSession = () => {
      if (typeof window === 'undefined') return;
      try {
        const localUser = JSON.parse(localStorage.getItem('local_session_user') || 'null');
        const localProfile = JSON.parse(localStorage.getItem('local_session_profile') || 'null');
        if (localUser) {
          setUser(localUser);
          if (localProfile) setProfile(localProfile);
        }
      } catch (e) {
        console.error('Failed to load local sandbox session', e);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        try {
          const profile = await getProfile(session.user.id);
          if (profile) setProfile(profile);
        } catch (e) {
          console.warn('Failed to fetch profile on init:', e);
        }
      } else {
        // Fallback to local offline session if Supabase is unreachable/inactive
        loadLocalSession();
      }
    }).catch(() => {
      // Direct network failure fallback
      loadLocalSession();
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          setUser(session.user);
          try {
            const profile = await getProfile(session.user.id);
            if (profile) setProfile(profile);
          } catch (e) {
            console.warn('Failed to fetch profile on auth change:', e);
          }
          // Clear offline session once live Supabase is active
          if (typeof window !== 'undefined') {
            localStorage.removeItem('local_session_user');
            localStorage.removeItem('local_session_profile');
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          // Clear offline session on signout
          if (typeof window !== 'undefined') {
            localStorage.removeItem('local_session_user');
            localStorage.removeItem('local_session_profile');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile]);

  return <>{children}</>;
}
