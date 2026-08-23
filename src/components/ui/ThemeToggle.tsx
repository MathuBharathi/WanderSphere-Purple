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
      style={{ color: 'var(--ws-text)' }}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full ws-glass hover:border-[var(--ws-accent)] transition-all duration-300 ${className}`}
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Moon size={15} style={{ color: 'var(--ws-accent)', fill: 'var(--ws-accent)' }} />
        ) : (
          <Sun size={15} style={{ color: 'var(--ws-accent)', fill: 'var(--ws-accent)' }} />
        )}
      </motion.div>

      <span className="text-[10px] font-extrabold uppercase tracking-widest hidden sm:inline-block select-none" style={{ color: 'var(--ws-text-secondary)' }}>
        {isDark ? 'Night' : 'Day'}
      </span>
    </button>
  );
}

export default ThemeToggle;
