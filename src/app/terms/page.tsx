import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { NavDock } from '@/components/dock/NavDock';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getCanonicalUrl } from '@/lib/siteConfig';
import { Scale, BookOpen, ShieldAlert, CheckSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | WanderSphere',
  description: 'Review the legal terms, travel content disclaimers, and user agreements governing the WanderSphere travel platform.',
  alternates: {
    canonical: getCanonicalUrl('/terms'),
  },
};

export default function TermsPage() {
  return (
    <main className="relative min-h-screen flex flex-col flex-1" style={{ color: 'var(--ws-text)' }}>
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto px-6 pt-28 pb-16 w-full">
        <Breadcrumbs items={[{ label: 'Terms of Service', href: '/terms' }]} className="mb-6" />

        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full ws-glass text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
            <Scale size={14} />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm md:text-base leading-relaxed max-w-2xl" style={{ color: 'var(--ws-text-secondary)' }}>
            Effective date: September 2026. By accessing or using WanderSphere, you agree to comply with and be bound by the following terms and conditions.
          </p>
        </div>

        <div className="space-y-8 ws-glass-strong p-8 md:p-10 rounded-3xl border shadow-xl">
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen size={18} style={{ color: 'var(--ws-accent)' }} />
              1. Platform Purpose & Service Scope
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              WanderSphere provides intelligent travel planning, city discovery guides, attraction details, weather insights, and route generation for Indian destinations. All content is intended for informational and travel planning purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckSquare size={18} style={{ color: 'var(--ws-accent)' }} />
              2. User Accounts & Responsibilities
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              When creating an account on WanderSphere:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1.5" style={{ color: 'var(--ws-text-secondary)' }}>
              <li>You are responsible for maintaining the confidentiality of your authentication details.</li>
              <li>You agree not to submit false, misleading, or offensive reviews or user profile data.</li>
              <li>You must not attempt to breach or compromise our API endpoints or backend infrastructure.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert size={18} style={{ color: 'var(--ws-accent)' }} />
              3. Travel & Advisory Disclaimer
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              While WanderSphere strives to maintain accurate place information, entry fees, opening hours, weather conditions, and travel routes, local conditions may change unexpectedly. Travelers are advised to verify operational hours and local travel advisories directly before embarking on journeys.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Scale size={18} style={{ color: 'var(--ws-accent)' }} />
              4. Intellectual Property & Attribution
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              All brand assets, custom code, UI designs, and algorithm logic are owned by WanderSphere. Photography assets are sourced via licensed APIs and community photographers (including Pexels and Unsplash) with proper attribution.
            </p>
          </section>

          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--ws-border)' }}>
            <p className="text-xs" style={{ color: 'var(--ws-text-secondary)' }}>
              Questions about our Terms of Service?
            </p>
            <Link href="/contact" className="px-5 py-2.5 rounded-full text-xs font-bold ws-ocean-btn-primary">
              Contact Legal Team
            </Link>
          </div>
        </div>
      </div>

      <Footer className="mt-auto" />
      <NavDock />
    </main>
  );
}
