import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { NavDock } from '@/components/dock/NavDock';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getCanonicalUrl } from '@/lib/siteConfig';
import { AlertTriangle, MapPin, SunMedium, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Disclaimer | WanderSphere',
  description: 'Important legal and travel advisory notices regarding weather estimates, attraction schedules, maps, and third-party content.',
  alternates: {
    canonical: getCanonicalUrl('/disclaimer'),
  },
};

export default function DisclaimerPage() {
  return (
    <main className="relative min-h-screen flex flex-col flex-1" style={{ color: 'var(--ws-text)' }}>
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto px-6 pt-28 pb-16 w-full">
        <Breadcrumbs items={[{ label: 'Disclaimer', href: '/disclaimer' }]} className="mb-6" />

        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full ws-glass text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
            <AlertTriangle size={14} />
            <span>Travel Advisory</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Disclaimer & Travel Guidance
          </h1>
          <p className="text-sm md:text-base leading-relaxed max-w-2xl" style={{ color: 'var(--ws-text-secondary)' }}>
            Information provided by WanderSphere is intended for general guidance and travel planning across Indian cities and states.
          </p>
        </div>

        <div className="space-y-8 ws-glass-strong p-8 md:p-10 rounded-3xl border shadow-xl">
          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapPin size={18} style={{ color: 'var(--ws-accent)' }} />
              1. Attraction & Entry Details
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              Attraction details, ticket costs, opening times, and recommended visit durations are derived from official tourism boards and historical data. Local administration rules, holiday closures, or maintenance schedules may affect operating hours. Travelers should verify ticket desks locally.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <SunMedium size={18} style={{ color: 'var(--ws-accent)' }} />
              2. Weather Forecasts & Conditions
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              Weather information is fetched via OpenWeather APIs and climate data. Meteorological conditions may fluctuate rapidly. Travel advisories issued by official weather monitoring services take precedence over automated forecasts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ExternalLink size={18} style={{ color: 'var(--ws-accent)' }} />
              3. External Media & Map Services
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
              WanderSphere integrates third-party mapping tiles from OpenStreetMap & Leaflet and photo media from Pexels/Unsplash photographers. External media remains the property of respective copyright holders.
            </p>
          </section>

          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--ws-border)' }}>
            <p className="text-xs" style={{ color: 'var(--ws-text-secondary)' }}>
              Need further clarification or wish to update destination information?
            </p>
            <Link href="/contact" className="px-5 py-2.5 rounded-full text-xs font-bold ws-ocean-btn-primary">
              Contact Team
            </Link>
          </div>
        </div>
      </div>

      <Footer className="mt-auto" />
      <NavDock />
    </main>
  );
}
