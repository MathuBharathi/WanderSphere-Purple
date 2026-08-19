'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0B1914] flex items-center justify-center p-6 text-center text-[#F0F7F4] transition-colors duration-300">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2C5E3B]/10 to-transparent pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10 space-y-8">
        {/* Animated Compass Icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 mx-auto bg-[#1B432C] border border-[#2C5E3B] rounded-full flex items-center justify-center"
        >
          <Compass className="w-10 h-10 text-[#C69234]" />
        </motion.div>

        <div className="space-y-4">
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-9xl font-extrabold text-[#C69234] tracking-tighter"
          >
            404
          </motion.h1>
          <h2 className="text-2xl font-bold uppercase tracking-wide text-white">
            Spheres Collided
          </h2>
          <p className="text-sm text-[#A3C2B2] leading-relaxed">
            The page you are looking for has drifted off the map. Let&apos;s get you back on track to exploring India.
          </p>
        </div>

        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#C69234] hover:bg-[#b07f2a] text-[#0B1914] font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-[#C69234]/20 hover:scale-[1.02]"
          >
            <ArrowLeft size={14} />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
