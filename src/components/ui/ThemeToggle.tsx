'use client';

import React from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? 'Day (Light)' : 'Night (Dark)'} Mode`}
      title={`Switch to ${isDark ? 'Day' : 'Night'} Mode`}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
        isDark
          ? 'bg-[#101D33]/90 border border-[rgba(150,190,230,0.2)] text-[#7DD3FC] hover:border-[#58A6FF] shadow-[0_0_15px_rgba(88,166,255,0.15)]'
          : 'bg-white/90 border border-[rgba(15,50,90,0.15)] text-[#1677C8] hover:border-[#38A3DB] shadow-[0_4px_12px_rgba(22,119,200,0.12)]'
      } ${className}`}
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Moon size={16} className="text-[#7DD3FC] fill-[#7DD3FC]/20" />
        ) : (
          <Sun size={16} className="text-[#1677C8] fill-[#1677C8]/20" />
        )}
      </motion.div>

      <span className="text-[10px] font-extrabold uppercase tracking-widest hidden sm:inline-block select-none">
        {isDark ? 'Night' : 'Day'}
      </span>
    </button>
  );
}

export default ThemeToggle;
