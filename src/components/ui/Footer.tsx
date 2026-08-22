'use client';
import { Globe, Heart, MapPin, Compass, Mail, Github, Twitter } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative mt-20 border-t border-[#2C5E3B]/40 bg-[#0B1914]">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C69234]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-full bg-[#C69234]/20 border border-[#C69234]/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Globe size={14} className="text-[#C69234]" />
              </div>
              <span className="font-display text-lg text-white tracking-widest uppercase">
                WanderSphere
              </span>
            </Link>
            <p className="text-[#A3C2B2] text-xs leading-relaxed max-w-xs">
              Discover cities intelligently. Explore hidden gems, plan cinematic routes,
              and experience the world like never before.
            </p>
          </div>

          {/* Explore */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#C69234] mb-4">
              Explore
            </p>
            <ul className="space-y-3">
              {[
                { label: 'Trending Cities', href: '/#trending' },
                { label: 'Hidden Gems', href: '/#gems' },
                { label: 'Near Me', href: '/#nearby' },
                { label: 'Map', href: '/map' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#A3C2B2] text-xs hover:text-[#C69234] transition-colors duration-200 flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#C69234]/50" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#C69234] mb-4">
              Account
            </p>
            <ul className="space-y-3">
              {[
                { label: 'Sign In', href: '/auth' },
                { label: 'Profile', href: '/profile' },
                { label: 'Saved Places', href: '/profile?tab=saved' },
                { label: 'My Trips', href: '/profile?tab=trips' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#A3C2B2] text-xs hover:text-[#C69234] transition-colors duration-200 flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#C69234]/50" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#C69234] mb-4">
              Stay Connected
            </p>
            <p className="text-[#A3C2B2] text-xs mb-4">
              Get travel inspiration delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-[#143028] border border-[#2C5E3B] rounded-xl py-2.5 px-4 text-white placeholder-[#A3C2B2]/40 text-xs focus:outline-none focus:border-[#C69234] transition-colors"
              />
              <button className="px-4 py-2.5 rounded-xl bg-[#C69234] text-[#0B1914] text-xs font-bold hover:bg-[#b07f2a] transition-colors">
                <Mail size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-6 border-t border-[#2C5E3B]/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#A3C2B2]/50 text-[10px] uppercase tracking-widest">
            © 2026 WanderSphere. All rights reserved. • Photos provided by{' '}
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C69234] hover:underline"
            >
              Pexels
            </a>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[#A3C2B2]/50 text-[10px] uppercase tracking-widest">
              Built with
            </span>
            <Heart size={10} className="text-[#A65D29] fill-current" />
            <span className="text-[#A3C2B2]/50 text-[10px] uppercase tracking-widest">
              for travelers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
