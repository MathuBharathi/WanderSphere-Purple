import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { NavDock } from '@/components/dock/NavDock';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getCanonicalUrl } from '@/lib/siteConfig';
import { Cookie, Settings, ShieldCheck, Database } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cookie Policy & Local Storage | WanderSphere',
  description: 'Learn how WanderSphere uses essential cookies and local storage to save your theme preferences and saved trips.',
  alternates: {
    canonical: getCanonicalUrl('/cookie-policy'),
  },
};

export default function CookiePolicyPage() {
  return (
    <main className="relative min-h-screen flex flex-col flex-1" style={{ color: 'var(--ws-text)' }}>
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto px-6 pt-28 pb-16 w-full">
        <Breadcrumbs items={[{ label: 'Cookie Policy', href: '/cookie-policy' }]} className="mb-6" />

        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full ws-glass text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
            <Cookie size={14} />
            <span>Preferences & Storage</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-sm md:text-base leading-relaxed max-w-2xl" style={{ color: 'var(--ws-text-secondary)' }}>
            Learn how WanderSphere uses cookies and client-side storage technologies to deliver a personalized travel experience.
          </p>
        </div>

        <div className="space-y-8 ws-glass-strong p-8 md:p-10 rounded-3xl border shadow-xl">
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Database size={18} style={{ color: 'var(--ws-accent)' }} />
              1. Essential Storage We Use
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              WanderSphere relies on lightweight browser storage (`localStorage` and essential session cookies) to ensure core features work smoothly without forcing you to log in repeatedly:
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--ws-border)' }}>
                    <th className="py-2.5 px-3 font-bold uppercase">Storage Key / Cookie</th>
                    <th className="py-2.5 px-3 font-bold uppercase">Purpose</th>
                    <th className="py-2.5 px-3 font-bold uppercase">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--ws-border)' }}>
                  <tr>
                    <td className="py-2.5 px-3 font-mono">wandersphere_theme</td>
                    <td className="py-2.5 px-3">Remembers your preference for Light or Dark theme mode.</td>
                    <td className="py-2.5 px-3">Persistent</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono">wandersphere_saved_places</td>
                    <td className="py-2.5 px-3">Stores saved places and wishlist items on your local device.</td>
                    <td className="py-2.5 px-3">Persistent</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono">sb-access-token / sb-refresh-token</td>
                    <td className="py-2.5 px-3">Secure authentication tokens for Supabase user sessions.</td>
                    <td className="py-2.5 px-3">Session / Auth expiry</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck size={18} style={{ color: 'var(--ws-accent)' }} />
              2. No Third-Party Tracking Cookies
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              WanderSphere does <strong>not</strong> install cross-site advertising trackers or sell browsing data to third-party data brokers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings size={18} style={{ color: 'var(--ws-accent)' }} />
              3. Managing Your Storage Preferences
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              You can clear your stored places and theme preferences anytime through your browser settings or by signing out of your account.
            </p>
          </section>

          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--ws-border)' }}>
            <p className="text-xs" style={{ color: 'var(--ws-text-secondary)' }}>
              Need assistance managing your saved data?
            </p>
            <Link href="/contact" className="px-5 py-2.5 rounded-full text-xs font-bold ws-ocean-btn-primary">
              Contact Privacy Team
            </Link>
          </div>
        </div>
      </div>

      <Footer className="mt-auto" />
      <NavDock />
    </main>
  );
}
