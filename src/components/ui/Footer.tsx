'use client';
import { Globe, Heart, MapPin, Compass, Mail, Github, Twitter } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative mt-20 border-t ws-glass transition-colors duration-500">
      {/* Accent gradient line */}
      <div 
        style={{
          background: 'linear-gradient(to right, transparent, var(--ws-accent), transparent)',
        }}
        className="absolute top-0 left-0 right-0 h-px opacity-40" 
      />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div 
                style={{
                  backgroundColor: 'rgba(25, 167, 224, 0.15)',
                  borderColor: 'var(--ws-border)',
                }}
                className="w-8 h-8 rounded-full border flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"
              >
                <Globe size={14} style={{ color: 'var(--ws-accent)' }} />
              </div>
              <span className="font-display text-lg tracking-widest uppercase" style={{ color: 'var(--ws-text)' }}>
                WanderSphere
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--ws-text-secondary)' }}>
              Discover cities intelligently. Explore hidden gems, plan cinematic routes,
              and experience the world like never before.
            </p>
          </div>

          {/* Explore */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.5em] mb-4" style={{ color: 'var(--ws-accent)' }}>
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
                    style={{ color: 'var(--ws-text-secondary)' }}
                    className="text-xs hover:text-[var(--ws-accent)] transition-colors duration-200 flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--ws-accent)' }} />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.5em] mb-4" style={{ color: 'var(--ws-accent)' }}>
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
                    style={{ color: 'var(--ws-text-secondary)' }}
                    className="text-xs hover:text-[var(--ws-accent)] transition-colors duration-200 flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--ws-accent)' }} />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.5em] mb-4" style={{ color: 'var(--ws-accent)' }}>
              Stay Connected
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--ws-text-secondary)' }}>
              Get travel inspiration delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                style={{
                  backgroundColor: 'var(--ws-input-bg)',
                  borderColor: 'var(--ws-input-border)',
                  color: 'var(--ws-text)',
                }}
                className="flex-1 border rounded-xl py-2.5 px-4 text-xs placeholder:text-[var(--ws-text-secondary)] focus:outline-none focus:border-[var(--ws-accent)] transition-colors"
              />
              <button 
                className="px-4 py-2.5 rounded-xl ws-ocean-btn-primary"
              >
                <Mail size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--ws-border)' }}>
          <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
            © 2026 WanderSphere. All rights reserved. • Photos provided by{' '}
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--ws-accent)' }}
              className="hover:underline"
            >
              Pexels
            </a>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
              Built with
            </span>
            <Heart size={10} style={{ color: 'var(--ws-accent)', fill: 'var(--ws-accent)' }} />
            <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
              for travelers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
