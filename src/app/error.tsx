'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Compass, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime error to console/monitoring
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 text-center transition-colors duration-500" style={{ color: 'var(--ws-text)' }}>
      <div className="max-w-md w-full relative z-10 space-y-6 ws-glass-strong p-8 md:p-10 rounded-3xl border shadow-2xl">
        <div className="w-16 h-16 mx-auto ws-glass-soft border rounded-full flex items-center justify-center shadow-md">
          <Compass className="w-8 h-8 animate-spin" style={{ color: 'var(--ws-accent)', animationDuration: '10s' }} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            Unexpected Turbulence
          </h1>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
            We encountered a momentary glitch while loading travel data. Don&apos;t worry, your saved trips are safe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold ws-ocean-btn-primary flex items-center justify-center gap-2 shadow-lg"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold ws-glass border hover:border-[var(--ws-accent)] flex items-center justify-center gap-2 transition-all"
          >
            <Home size={14} />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
