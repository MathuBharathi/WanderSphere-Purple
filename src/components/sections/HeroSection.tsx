'use client';
import { motion } from 'framer-motion';
import { ChevronDown, Compass, MapPin, Sparkles, Milestone } from 'lucide-react';

const LETTERS = 'WANDERSPHERE'.split('');

const stats = [
  { value: '20+', label: 'States', icon: MapPin },
  { value: '40+', label: 'Cities', icon: Milestone },
  { value: '200+', label: 'Attractions', icon: Compass },
  { value: '50+', label: 'Hidden Gems', icon: Sparkles },
];

export function HeroSection() {
  return (
    <section className="relative w-full h-screen overflow-hidden flex flex-col justify-center items-center">
      {/* Dynamic gradient overlay to ensure smooth contrast with WebGL background */}
      <div 
        style={{ background: 'var(--ws-overlay-gradient)' }}
        className="absolute inset-0 pointer-events-none z-10 transition-colors duration-800" 
      />

      {/* Hero Content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-6 max-w-5xl mx-auto">
        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ color: 'var(--ws-accent)' }}
          className="text-[10px] font-extrabold uppercase tracking-[0.5em] mb-6"
        >
          ✦ Explore the beauty of India ✦
        </motion.p>

        {/* Giant Anton title with staggered letter reveal */}
        <div className="flex flex-wrap justify-center overflow-hidden mb-4" aria-label="WanderSphere">
          {LETTERS.map((letter, i) => (
            <motion.span
              key={i}
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.5 + i * 0.05,
                duration: 1,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ color: 'var(--ws-text)' }}
              className="font-display text-[12vw] md:text-[8vw] leading-none drop-shadow-md"
            >
              {letter}
            </motion.span>
          ))}
        </div>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ color: 'var(--ws-text-secondary)' }}
          className="max-w-xl text-sm md:text-base font-medium leading-relaxed mb-10"
        >
          Discover Indian cities intelligently. Explore hidden gems, plan customized routes, 
          and experience India like never before.
        </motion.p>

        {/* Stats section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-12 max-w-3xl w-full"
        >
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div 
                key={idx} 
                className="ws-glass border rounded-2xl p-4 flex flex-col items-center shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Icon size={16} style={{ color: 'var(--ws-accent)' }} className="mb-1.5" />
                <span className="font-extrabold text-2xl leading-none" style={{ color: 'var(--ws-text)' }}>{stat.value}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--ws-text-secondary)' }}>{stat.label}</span>
              </div>
            );
          })}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex gap-4"
        >
          <a
            href="#explore"
            className="px-8 py-4 rounded-full text-xs ws-ocean-btn-primary shadow-lg"
          >
            Explore India
          </a>
          <a
            href="#explore"
            className="px-8 py-4 rounded-full text-xs ws-ocean-btn-secondary"
          >
            Use My Location
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          style={{ color: 'var(--ws-text-muted)' }}
          className="absolute bottom-8 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.4em]">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
