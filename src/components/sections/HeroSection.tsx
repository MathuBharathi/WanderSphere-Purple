'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TubesBackground } from '@/components/effects/TubesBackground';
import { HeroGlobe } from '@/components/effects/HeroGlobe';
import { ChevronDown, Compass, MapPin, Sparkles, Milestone, Globe2, Sparkle } from 'lucide-react';

const LETTERS = 'WANDERSPHERE'.split('');

const stats = [
  { value: '20+', label: 'States', icon: MapPin },
  { value: '40+', label: 'Cities', icon: Milestone },
  { value: '200+', label: 'Attractions', icon: Compass },
  { value: '50+', label: 'Hidden Gems', icon: Sparkles },
];

export function HeroSection() {
  const [viewMode, setViewMode] = useState<'canvas' | 'globe'>('canvas');

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-[#0B1914]">
      {/* Background Mode: Tubes WebGL or 3D Globe */}
      <AnimatePresence mode="wait">
        {viewMode === 'canvas' ? (
          <motion.div
            key="tubes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-0"
          >
            <TubesBackground enableClickInteraction={true} className="w-full h-full" />
          </motion.div>
        ) : (
          <motion.div
            key="globe"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-0 flex items-center justify-center pt-16"
          >
            <HeroGlobe />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1914]/80 via-transparent to-[#0B1914] pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B1914]/60 via-transparent to-[#0B1914]/60 pointer-events-none z-10" />

      {/* Mode Switcher Floating Badge */}
      <div className="absolute top-28 right-6 md:right-12 z-30">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#143028]/80 border border-[#2C5E3B]/60 backdrop-blur-xl shadow-xl"
        >
          <button
            onClick={() => setViewMode('canvas')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              viewMode === 'canvas'
                ? 'bg-[#C69234] text-[#0B1914] shadow-md'
                : 'text-[#A3C2B2] hover:text-white'
            }`}
          >
            <Sparkle size={13} />
            <span>Vibe</span>
          </button>
          <button
            onClick={() => setViewMode('globe')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              viewMode === 'globe'
                ? 'bg-[#C69234] text-[#0B1914] shadow-md'
                : 'text-[#A3C2B2] hover:text-white'
            }`}
          >
            <Globe2 size={13} />
            <span>3D Globe</span>
          </button>
        </motion.div>
      </div>

      {/* Hero Content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen text-center px-6 pt-24 pb-12">
        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#143028]/60 border border-[#C69234]/40 backdrop-blur-md mb-6 shimmer-border"
        >
          <Sparkles size={14} className="text-[#C69234] animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-[#F5D77F]">
            Explore the beauty of India
          </span>
        </motion.div>

        {/* Title */}
        <div className="flex flex-wrap justify-center overflow-hidden mb-4" aria-label="WANDERSPHERE">
          {LETTERS.map((letter, i) => (
            <motion.span
              key={i}
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.4 + i * 0.04,
                duration: 0.9,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-display text-[13vw] md:text-[8vw] leading-none text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] select-none"
              style={{ letterSpacing: '-0.02em' }}
            >
              {letter}
            </motion.span>
          ))}
        </div>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="max-w-xl text-[#A3C2B2] text-sm md:text-base font-medium leading-relaxed mb-8 drop-shadow-sm"
        >
          Intelligent Indian city travel guide. Uncover hidden gems, plan personalized itineraries,
          and experience rich culture & nature in stunning 3D.
        </motion.p>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-10 max-w-3xl w-full"
        >
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -5, borderColor: '#C69234' }}
                className="bg-[#143028]/70 border border-[#2C5E3B]/50 rounded-2xl p-4 flex flex-col items-center backdrop-blur-xl shadow-lg transition-all duration-300"
              >
                <Icon size={18} className="text-[#C69234] mb-1.5" />
                <span className="font-extrabold text-2xl md:text-3xl text-white leading-none gradient-text">
                  {stat.value}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A3C2B2] mt-1">
                  {stat.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#search"
            className="magnetic-btn px-8 py-4 rounded-full bg-gradient-to-r from-[#F5D77F] via-[#C69234] to-[#A65D29] text-[#0B1914] font-black uppercase tracking-widest text-xs shadow-lg flex items-center gap-2"
          >
            <Compass size={16} />
            Explore Destinations
          </a>
          <button
            onClick={() => setViewMode(viewMode === 'canvas' ? 'globe' : 'canvas')}
            className="magnetic-btn px-8 py-4 rounded-full bg-[#143028]/90 border border-[#2C5E3B] text-white font-bold uppercase tracking-widest text-xs hover:border-[#C69234] transition-all backdrop-blur-md flex items-center gap-2"
          >
            <Globe2 size={16} className="text-[#C69234]" />
            {viewMode === 'canvas' ? 'View 3D Hotspot Globe' : 'Interactive Tubes Vibe'}
          </button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="mt-12 flex flex-col items-center gap-2 text-[#A3C2B2]/60"
        >
          <span className="text-[10px] uppercase tracking-[0.4em]">Scroll to Discover</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronDown size={18} className="text-[#C69234]" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
