'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, User, Search, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAppStore } from '@/store';
import { SearchOverlay } from '@/components/ui/SearchOverlay';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAppStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const links = [
    { label: 'Explore', href: '/#explore' },
    { label: 'Map', href: '/map' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          backgroundColor: scrolled ? 'var(--ws-navbar-bg)' : 'transparent',
          borderColor: 'var(--ws-navbar-border)',
          color: 'var(--ws-text)',
        }}
        className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-500 ${
          scrolled ? 'backdrop-blur-xl border-b shadow-lg' : ''
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div 
            style={{
              backgroundColor: 'rgba(25, 167, 224, 0.15)',
              borderColor: 'var(--ws-border)',
            }}
            className="w-8 h-8 rounded-full border flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"
          >
            <Globe size={16} style={{ color: 'var(--ws-accent)' }} />
          </div>
          <span className="font-extrabold text-sm tracking-widest uppercase hidden sm:inline" style={{ color: 'var(--ws-text)' }}>
            —WanderSphere
          </span>
        </Link>

        {/* Center nav pill */}
        <div className="hidden md:flex items-center gap-1 px-4 py-2 rounded-full ws-glass-strong shadow-sm">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              style={{ color: 'var(--ws-text-secondary)' }}
              className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[var(--ws-accent)] transition-colors rounded-full"
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <Link
              href="/dashboard"
              style={{ color: 'var(--ws-text-secondary)' }}
              className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] hover:text-[var(--ws-accent)] transition-colors rounded-full"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Day / Night Theme Toggle */}
          <ThemeToggle />

          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              color: 'var(--ws-text-secondary)',
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full ws-glass hover:text-[var(--ws-text)] transition-all duration-300 shadow-sm"
          >
            <Search size={14} style={{ color: 'var(--ws-accent)' }} />
            <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest">
              Search
            </span>
            <kbd 
              style={{
                backgroundColor: 'var(--ws-glass-soft)',
                color: 'var(--ws-text-secondary)',
                borderColor: 'var(--ws-border)',
              }}
              className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-mono"
            >
              ⌘K
            </kbd>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link 
                href="/dashboard" 
                style={{
                  color: 'var(--ws-text)',
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full ws-glass text-xs font-bold uppercase tracking-widest hover:text-[var(--ws-accent)] transition-colors shadow-sm"
              >
                <LayoutDashboard size={14} style={{ color: 'var(--ws-accent)' }} />
                <span className="hidden md:inline">Dashboard</span>
              </Link>
            </div>
          ) : (
            <Link 
              href="/auth" 
              className="px-5 py-2.5 rounded-full text-xs ws-ocean-btn-primary"
            >
              Sign In
            </Link>
          )}

          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            style={{ color: 'var(--ws-text)' }}
            className="md:hidden p-1"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 ws-glass-strong border-b p-6 flex flex-col gap-4 md:hidden shadow-2xl backdrop-blur-xl"
            >
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  style={{ color: 'var(--ws-text-secondary)' }}
                  className="text-sm font-bold uppercase tracking-widest hover:text-[var(--ws-accent)] transition-colors"
                >
                  {l.label}
                </Link>
              ))}
              {user && (
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  style={{ color: 'var(--ws-text-secondary)' }}
                  className="text-sm font-bold uppercase tracking-widest hover:text-[var(--ws-accent)] transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Search Overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
