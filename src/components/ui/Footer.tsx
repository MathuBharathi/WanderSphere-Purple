'use client';

import { Globe, Heart, Mail } from 'lucide-react';
import Link from 'next/link';

export function Footer({ className = '' }: { className?: string }) {
  const hasCustomMargin = className.includes('mt-') || className.includes('my-') || className.includes('m-');
  const marginClass = hasCustomMargin ? className : `mt-16 ${className}`;

  return (
    <footer className={`relative border-t border-b-0 ws-glass transition-colors duration-500 w-full flex-shrink-0 z-20 ${marginClass}`}>
      {/* Accent gradient line */}
      <div 
        style={{
          background: 'linear-gradient(to right, transparent, var(--ws-accent), transparent)',
        }}
        className="absolute top-0 left-0 right-0 h-px opacity-40" 
      />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
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
              Discover cities intelligently across India. Explore hidden gems, plan customized itineraries, and experience seamless travel.
            </p>
          </div>

          {/* Explore */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.4em] mb-4" style={{ color: 'var(--ws-accent)' }}>
              Explore
            </p>
            <ul className="space-y-2.5">
              {[
                { label: 'Trending Cities', href: '/#trending' },
                { label: 'Hidden Gems', href: '/#gems' },
                { label: 'Near Me', href: '/#nearby' },
                { label: 'Interactive Map', href: '/map' },
                { label: 'Itinerary Planner', href: '/itinerary' },
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

          {/* Company & Support */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.4em] mb-4" style={{ color: 'var(--ws-accent)' }}>
              Company
            </p>
            <ul className="space-y-2.5">
              {[
                { label: 'About WanderSphere', href: '/about' },
                { label: 'Contact Support', href: '/contact' },
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

          {/* Legal & Trust */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.4em] mb-4" style={{ color: 'var(--ws-accent)' }}>
              Legal & Trust
            </p>
            <ul className="space-y-2.5">
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Cookie Policy', href: '/cookie-policy' },
                { label: 'Accessibility', href: '/accessibility' },
                { label: 'Disclaimer', href: '/disclaimer' },
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
            <p className="text-[10px] font-extrabold uppercase tracking-[0.4em] mb-4" style={{ color: 'var(--ws-accent)' }}>
              Account
            </p>
            <ul className="space-y-2.5">
              {[
                { label: 'Sign In / Register', href: '/auth' },
                { label: 'Profile Settings', href: '/profile' },
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
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--ws-border)' }}>
          <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
            © 2026 WanderSphere. All rights reserved. • Photography by{' '}
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
              for travelers in India
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
