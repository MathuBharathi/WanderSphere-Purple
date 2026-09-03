'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft, Search, Map, Calendar, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { NavDock } from '@/components/dock/NavDock';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col flex-1" style={{ color: 'var(--ws-text)' }}>
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6 pt-28 pb-16">
        <div className="max-w-xl w-full relative z-10 space-y-8 ws-glass-strong p-8 md:p-12 rounded-3xl border shadow-2xl text-center">
          {/* Animated Compass Icon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 mx-auto ws-glass-soft border rounded-full flex items-center justify-center shadow-md"
          >
            <Compass className="w-10 h-10" style={{ color: 'var(--ws-accent)' }} />
          </motion.div>

          <div className="space-y-3">
            <motion.h1
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-8xl font-extrabold tracking-tighter"
              style={{ color: 'var(--ws-accent)' }}
            >
              404
            </motion.h1>
            <h2 className="text-2xl font-bold uppercase tracking-wide">
              Destination Not Found
            </h2>
            <p className="text-xs md:text-sm leading-relaxed max-w-md mx-auto" style={{ color: 'var(--ws-text-secondary)' }}>
              The page or travel route you are looking for has drifted off the map. Search for Indian destinations below or return home.
            </p>
          </div>

          {/* Quick Search Box */}
          <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cities (e.g. Jaipur, Manali, Kochi)..."
              style={{
                backgroundColor: 'var(--ws-input-bg)',
                borderColor: 'var(--ws-input-border)',
                color: 'var(--ws-text)',
              }}
              className="w-full border rounded-2xl py-3 pl-4 pr-10 text-xs focus:outline-none focus:border-[var(--ws-accent)] transition-colors"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-white ws-ocean-btn-primary"
            >
              <Search size={14} />
            </button>
          </form>

          {/* Navigation CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="px-5 py-3 rounded-2xl text-xs font-bold ws-ocean-btn-primary flex items-center gap-2 shadow-lg"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </Link>
            <Link
              href="/map"
              className="px-5 py-3 rounded-2xl text-xs font-bold ws-glass border hover:border-[var(--ws-accent)] flex items-center gap-2 transition-all"
            >
              <Map size={14} style={{ color: 'var(--ws-accent)' }} />
              <span>Explore Map</span>
            </Link>
            <Link
              href="/itinerary"
              className="px-5 py-3 rounded-2xl text-xs font-bold ws-glass border hover:border-[var(--ws-accent)] flex items-center gap-2 transition-all"
            >
              <Calendar size={14} style={{ color: 'var(--ws-accent)' }} />
              <span>Plan Trip</span>
            </Link>
          </div>

          {/* Quick Popular Links */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--ws-border)' }}>
            <p className="text-[10px] uppercase font-bold tracking-widest mb-3" style={{ color: 'var(--ws-accent)' }}>
              Popular Cities
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { label: 'Jaipur', href: '/city/jaipur' },
                { label: 'Goa', href: '/city/north-goa' },
                { label: 'Varanasi', href: '/city/varanasi' },
                { label: 'Shimla', href: '/city/shimla' },
                { label: 'Munnar', href: '/city/munnar' },
              ].map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  className="px-3 py-1 rounded-full text-[11px] font-medium ws-glass hover:text-[var(--ws-accent)] transition-colors"
                  style={{ color: 'var(--ws-text-secondary)' }}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer className="mt-auto" />
      <NavDock />
    </main>
  );
}
