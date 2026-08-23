'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 text-center transition-colors duration-500" style={{ color: 'var(--ws-text)' }}>
      <div className="max-w-md w-full relative z-10 space-y-8 ws-glass-strong p-10 rounded-3xl shadow-2xl">
        {/* Animated Compass Icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 mx-auto ws-glass-soft border rounded-full flex items-center justify-center shadow-md"
        >
          <Compass className="w-10 h-10" style={{ color: 'var(--ws-accent)' }} />
        </motion.div>

        <div className="space-y-4">
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-9xl font-extrabold tracking-tighter"
            style={{ color: 'var(--ws-accent)' }}
          >
            404
          </motion.h1>
          <h2 className="text-2xl font-bold uppercase tracking-wide" style={{ color: 'var(--ws-text)' }}>
            Spheres Collided
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
            The page you are looking for has drifted off the map. Let&apos;s get you back on track to exploring India.
          </p>
        </div>

        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs ws-ocean-btn-primary shadow-xl hover:scale-[1.02]"
          >
            <ArrowLeft size={14} />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
