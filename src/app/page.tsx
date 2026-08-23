'use client';
import { HeroSection } from '@/components/sections/HeroSection';
import { SearchSection } from '@/components/sections/SearchSection';
import { NearbySection } from '@/components/sections/NearbySection';
import { TrendingSection } from '@/components/sections/TrendingSection';
import { HiddenGemsSection } from '@/components/sections/HiddenGemsSection';
import { NavDock } from '@/components/dock/NavDock';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';

export default function HomePage() {
  useGeolocation();

  return (
    <main className="relative min-h-[100svh] flex flex-col flex-1 transition-colors duration-800" style={{ color: 'var(--ws-text)' }}>
      <Navbar />
      <div className="flex-1">
        <HeroSection />
        <SearchSection />
        <NearbySection />
        <TrendingSection />
        <HiddenGemsSection />
      </div>
      <Footer className="mt-auto" />
      <NavDock />
    </main>
  );
}
