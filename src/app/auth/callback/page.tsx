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
    <div className="min-h-screen bg-[#0B1914] flex flex-col items-center justify-center p-6 text-center text-[#F0F7F4]">
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2C5E3B]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C69234]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-[#143028] backdrop-blur-xl border border-[#2C5E3B] rounded-3xl p-8 max-w-md w-full shadow-2xl z-10">
        {error ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-800 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Authentication Failed</h2>
            <p className="text-sm text-[#A3C2B2] leading-relaxed">
              {error === 'Auth session missing!' 
                ? 'We could not establish a secure session. The verification link may have expired or already been used.' 
                : error}
            </p>
            <button
              onClick={() => router.push('/auth')}
              className="w-full py-3 rounded-2xl bg-[#C69234] hover:bg-[#b07f2a] text-[#0B1914] font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-md"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <Loader2 size={36} className="text-[#C69234] animate-spin mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-white">Verifying Credentials</h2>
              <p className="text-xs text-[#A3C2B2] mt-1">Please wait a moment while we set up your secure session...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
