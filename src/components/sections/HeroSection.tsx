'use client';
import { motion } from 'framer-motion';
import { TubesBackground } from '@/components/effects/TubesBackground';
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
    <section className="relative w-full h-screen overflow-hidden">
      <TubesBackground enableClickInteraction={true} className="absolute inset-0">
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1914]/70 via-transparent to-[#0B1914] pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1914]/50 via-transparent to-[#0B1914]/50 pointer-events-none z-10" />

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-6">
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#C69234] mb-6 neon-glow"
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
                className="font-display text-[12vw] md:text-[8vw] leading-none text-white drop-shadow-md"
                style={{ letterSpacing: '-0.03em' }}
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
            className="max-w-xl text-[#A3C2B2] text-sm md:text-base font-medium leading-relaxed mb-10"
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
                  className="bg-[#143028]/80 border border-[#2C5E3B]/50 rounded-2xl p-4 flex flex-col items-center backdrop-blur-md shadow-lg"
                >
                  <Icon size={16} className="text-[#C69234] mb-1.5" />
                  <span className="font-extrabold text-2xl text-white leading-none">{stat.value}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#A3C2B2] mt-1">{stat.label}</span>
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
              className="px-8 py-4 rounded-full bg-[#C69234] text-[#0B1914] font-black uppercase tracking-widest text-xs hover:bg-[#b07f2a] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(198,146,52,0.4)]"
            >
              Explore India
            </a>
            <a
              href="#explore"
              className="px-8 py-4 rounded-full bg-[#143028] border border-[#2C5E3B] text-white font-bold uppercase tracking-widest text-xs hover:border-[#C69234] hover:bg-[#1B432C] transition-all duration-300"
            >
              Use My Location
            </a>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="absolute bottom-8 flex flex-col items-center gap-2 text-[#A3C2B2]/60"
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
      </TubesBackground>
    </section>
  );
}
