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
    <main className="relative min-h-screen bg-[#0B1914] text-[#F0F7F4]">
      <Navbar />
      <HeroSection />
      <SearchSection />
      <NearbySection />
      <TrendingSection />
      <HiddenGemsSection />
      <Footer />
      {/* Bottom padding for dock */}
      <div className="h-24" />
      <NavDock />
    </main>
  );
}
