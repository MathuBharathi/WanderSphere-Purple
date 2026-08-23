'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read the query parameters from the window location directly
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      supabase.auth.exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            console.error('Error exchanging code for session:', error.message);
            setError(error.message);
          } else {
            // Force dynamic page reload or route transition
            router.push('/dashboard');
          }
        })
        .catch((err: any) => {
          console.error('Unexpected error in auth callback:', err);
          setError(err.message || 'An unexpected error occurred.');
        });
    } else {
      // If there's no code, check if user is already authenticated
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.push('/dashboard');
        } else {
          router.push('/auth');
        }
      });
    }
  }, [router]);

  return (
    <div className="relative min-h-[100svh] flex flex-col items-center justify-center p-6 text-center" style={{ color: 'var(--ws-text)' }}>
      {/* Ambient ocean background glow */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(76, 201, 232, 0.12), transparent 55%)',
        }}
      />

      <div 
        className="relative ws-glass-strong rounded-3xl p-8 max-w-md w-full shadow-2xl z-10 border"
        style={{ borderColor: 'rgba(76, 201, 232, 0.25)' }}
      >
        {error ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-800 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-xl font-extrabold uppercase tracking-tight" style={{ color: 'var(--ws-text)' }}>Authentication Failed</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              {error === 'Auth session missing!' 
                ? 'We could not establish a secure session. The verification link may have expired or already been used.' 
                : error}
            </p>
            <button
              onClick={() => router.push('/auth')}
              className="w-full py-3 rounded-2xl ws-ocean-btn-primary font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-md"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <Loader2 size={36} className="animate-spin mx-auto" style={{ color: 'var(--ws-accent)' }} />
            <div>
              <h2 className="text-xl font-extrabold uppercase tracking-tight" style={{ color: 'var(--ws-text)' }}>Verifying Credentials</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--ws-text-secondary)' }}>Please wait a moment while we set up your secure session...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
