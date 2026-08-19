'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, User, Search, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAppStore } from '@/store';
import { SearchOverlay } from '@/components/ui/SearchOverlay';

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
        className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-500 ${
          scrolled ? 'bg-[#0B1914]/90 backdrop-blur-md border-b border-[#2C5E3B]/40 shadow-xl shadow-black/40' : ''
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-[#C69234]/20 border border-[#C69234]/50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Globe size={16} className="text-[#C69234]" />
          </div>
          <span className="font-extrabold text-sm tracking-widest uppercase text-white hidden sm:inline">
            —WanderSphere
          </span>
        </Link>

        {/* Center nav pill */}
        <div className="hidden md:flex items-center gap-1 px-4 py-2 rounded-full bg-[#143028]/80 border border-[#2C5E3B]/40 backdrop-blur-md">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#A3C2B2] hover:text-[#C69234] transition-colors rounded-full"
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <Link
              href="/dashboard"
              className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[#A3C2B2] hover:text-[#C69234] transition-colors rounded-full"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#143028]/80 border border-[#2C5E3B]/40 text-[#A3C2B2] hover:text-white transition-all duration-300"
          >
            <Search size={14} className="text-[#C69234]" />
            <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest">
              Search
            </span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#1B432C] text-[#A3C2B2] text-[9px] font-mono">
              ⌘K
            </kbd>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#143028]/80 border border-[#2C5E3B]/40 text-xs font-bold uppercase tracking-widest text-[#F0F7F4] hover:text-[#C69234] transition-colors">
                <LayoutDashboard size={14} className="text-[#C69234]" />
                <span className="hidden md:inline">Dashboard</span>
              </Link>
            </div>
          ) : (
            <Link href="/auth" className="px-5 py-2.5 rounded-full bg-[#C69234] text-[#0B1914] text-xs font-black uppercase tracking-widest hover:bg-[#b07f2a] transition-all shadow-md shadow-[#C69234]/20">
              Sign In
            </Link>
          )}

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[#A3C2B2] p-1">
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
              className="absolute top-full left-0 right-0 bg-[#143028]/95 border-b border-[#2C5E3B]/40 p-6 flex flex-col gap-4 md:hidden shadow-2xl backdrop-blur-xl"
            >
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-bold uppercase tracking-widest text-[#A3C2B2] hover:text-[#C69234] transition-colors"
                >
                  {l.label}
                </Link>
              ))}
              {user && (
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-bold uppercase tracking-widest text-[#A3C2B2] hover:text-[#C69234] transition-colors"
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
