import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { NavDock } from '@/components/dock/NavDock';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { JsonLd } from '@/components/ui/JsonLd';
import { getCanonicalUrl } from '@/lib/siteConfig';
import { getDatasetStatistics } from '@/data/travelData';
import { Compass, Globe, Map, Sparkles, Navigation, Layers, ShieldCheck, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About WanderSphere | Intelligent India Travel Discovery',
  description: 'Learn how WanderSphere helps travelers discover famous attractions, hidden gems, and tailored itineraries across Indian states and cities.',
  alternates: {
    canonical: getCanonicalUrl('/about'),
  },
};

export default function AboutPage() {
  const stats = getDatasetStatistics();

  return (
    <main className="relative min-h-screen flex flex-col flex-1" style={{ color: 'var(--ws-text)' }}>
      <JsonLd type="website" />
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto px-6 pt-28 pb-16 w-full">
        <Breadcrumbs items={[{ label: 'About Us', href: '/about' }]} className="mb-6" />

        {/* Hero Section */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full ws-glass text-xs font-extrabold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
            <Globe size={14} />
            <span>Discover India Intelligently</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto">
            Redefining Travel Exploration Across India
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
            WanderSphere combines rich destination data, interactive Leaflet mapping, live weather, and smart itinerary planning to help travelers experience India like never before.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
          {[
            { label: 'Indian States', value: stats.states, icon: Map },
            { label: 'Curated Cities', value: stats.cities, icon: Navigation },
            { label: 'Attractions', value: stats.attractions, icon: Compass },
            { label: 'Hidden Gems', value: stats.hiddenGems, icon: Sparkles },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="ws-glass p-6 rounded-3xl text-center space-y-2 border shadow-lg hover:scale-[1.02] transition-transform">
                <div className="w-10 h-10 mx-auto rounded-full ws-glass-soft border flex items-center justify-center mb-2">
                  <Icon size={18} style={{ color: 'var(--ws-accent)' }} />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold" style={{ color: 'var(--ws-accent)' }}>
                  {stat.value}+
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ws-text-secondary)' }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Core Pillars */}
        <div className="space-y-8 ws-glass-strong p-8 md:p-12 rounded-3xl border shadow-xl mb-16">
          <div className="border-b pb-6" style={{ borderColor: 'var(--ws-border)' }}>
            <h2 className="text-2xl font-bold mb-2">Platform Capabilities</h2>
            <p className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>
              Built from the ground up to address the complexities of multi-destination travel planning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl ws-glass-soft border flex items-center justify-center">
                <Compass size={20} style={{ color: 'var(--ws-accent)' }} />
              </div>
              <h3 className="text-base font-bold">Smart Itinerary Generator</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
                Algorithms calculate optimal daily sequences, time slots, and travel distances based on budget, duration, and travel style.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl ws-glass-soft border flex items-center justify-center">
                <Navigation size={20} style={{ color: 'var(--ws-accent)' }} />
              </div>
              <h3 className="text-base font-bold">Interactive Leaflet Map</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
                Filter places by category (historical, nature, food, spiritual, hidden gems) and view distance metrics relative to your location.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl ws-glass-soft border flex items-center justify-center">
                <Layers size={20} style={{ color: 'var(--ws-accent)' }} />
              </div>
              <h3 className="text-base font-bold">Ocean Glassmorphism UI</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
                Dynamic WebGL ocean background with seamless light/dark day/night theme toggle for comfortable browsing day or night.
              </p>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="text-center ws-glass p-10 rounded-3xl border shadow-xl space-y-6">
          <h2 className="text-2xl font-bold">Ready to Start Exploring?</h2>
          <p className="text-xs md:text-sm max-w-xl mx-auto" style={{ color: 'var(--ws-text-secondary)' }}>
            Search over 134 cities across India or let our planner craft your next multi-day itinerary.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/map" className="px-6 py-3 rounded-full text-xs font-bold ws-ocean-btn-primary">
              Explore Interactive Map
            </Link>
            <Link href="/itinerary" className="px-6 py-3 rounded-full text-xs font-bold ws-glass border hover:border-[var(--ws-accent)] transition-all">
              Plan Custom Itinerary
            </Link>
          </div>
        </div>
      </div>

      <Footer className="mt-auto" />
      <NavDock />
    </main>
  );
}
