'use client';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { useRouter } from 'next/navigation';
import { getUserItineraries, deleteItinerary } from '@/lib/api';
import {
  Sparkles, Compass, ArrowRight, MapPin,
  User, Loader2, LogOut, Heart, Plus, BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { NavDock } from '@/components/dock/NavDock';
import { Footer } from '@/components/ui/Footer';
import { ItineraryCard } from '@/components/ui/ItineraryCard';
import type { SavedItinerary, Place } from '@/types';
import { places as staticPlaces } from '@/data/travelData';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const {
    user, setUser, profile, setProfile, authReady,
    savedPlaces, setGeneratedItinerary, setItineraryConfig, setCurrentItineraryId
  } = useAppStore();
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistPlaces, setWishlistPlaces] = useState<Place[]>([]);

  // Wait for authReady, then load data
  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/auth');
          return;
        }
        const trips = await getUserItineraries(authUser.id);
        if (!cancelled) setItineraries(trips);
      } catch (e) {
        console.error('Failed to load itineraries:', e);
        if (!cancelled) toast.error('Failed to load your itineraries.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [authReady, router]);

  // Populate wishlist from static places based on saved IDs
  useEffect(() => {
    if (savedPlaces.length > 0) {
      const items = staticPlaces.filter((p) => savedPlaces.includes(p.id));
      setWishlistPlaces(items);
    } else {
      setWishlistPlaces([]);
    }
  }, [savedPlaces]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this itinerary?')) return;

    try {
      await deleteItinerary(id);
      setItineraries(prev => prev.filter((i) => i.id !== id));
      toast.success('Itinerary deleted.');
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast.error(err?.message || 'Failed to delete itinerary. Please try again.');
    }
  };

  const handleOpenItinerary = (itinerary: SavedItinerary) => {
    setItineraryConfig(itinerary.config);
    setGeneratedItinerary(itinerary.itinerary_data);
    setCurrentItineraryId(itinerary.id);
    router.push('/itinerary');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    toast.success('Signed out successfully');
    router.push('/');
  };

  // Show loading while auth is initializing
  if (!authReady || (loading && !user)) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ color: 'var(--ws-text)' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} style={{ color: 'var(--ws-primary)' }} className="animate-spin" />
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--ws-text-muted)' }}>Loading Dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[100svh] flex flex-col transition-colors duration-500" style={{ color: 'var(--ws-text)' }}>
      {/* Top Navbar */}
      <nav className="ws-glass-strong border-b backdrop-blur-xl py-5 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-extrabold text-lg tracking-widest" style={{ color: 'var(--ws-text)' }}>—WANDERSPHERE</Link>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider hover:underline transition-colors" style={{ color: 'var(--ws-accent)' }}>
              <User size={14} />
              <span className="hidden sm:inline">Profile Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider hover:text-rose-400 transition-colors"
              style={{ color: 'var(--ws-text-secondary)' }}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
        {/* Welcome Section */}
        <div className="mb-10">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] mb-1" style={{ color: 'var(--ws-accent)' }}>
            Welcome back
          </p>
          <h1 className="font-extrabold text-3xl md:text-4xl uppercase tracking-tight" style={{ color: 'var(--ws-text)' }}>
            {profile?.full_name || user?.email?.split('@')[0] || 'Traveler'}&apos;s Hub
          </h1>
          <p className="text-xs mt-2 max-w-xl leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>
            Manage your saved trips, explore wishlist places, and plan your next Indian adventure.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column — Itineraries */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--ws-text)' }}>
                <Sparkles size={18} style={{ color: 'var(--ws-accent)' }} />
                My Saved Trips ({itineraries.length})
              </h2>
              <Link
                href="/#explore"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs ws-ocean-btn-primary shadow-md"
              >
                <Plus size={14} />
                New Trip
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center ws-glass rounded-3xl">
                <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: 'var(--ws-accent)' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--ws-text-secondary)' }}>Loading your saved itineraries...</p>
              </div>
            ) : itineraries.length === 0 ? (
              <div className="ws-glass rounded-3xl p-8 text-center border">
                <Compass size={36} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--ws-accent)' }} />
                <p className="font-bold text-sm" style={{ color: 'var(--ws-text)' }}>No trips planned yet</p>
                <p className="text-xs mt-1 mb-4" style={{ color: 'var(--ws-text-secondary)' }}>Use the search tool on the home page to generate an AI itinerary.</p>
                <Link
                  href="/#explore"
                  className="inline-flex items-center gap-1.5 py-3 px-5 rounded-xl text-xs ws-ocean-btn-primary shadow-md"
                >
                  <Sparkles size={14} />
                  <span>Generate Itinerary</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {itineraries.map((trip) => (
                  <ItineraryCard
                    key={trip.id}
                    itinerary={trip}
                    onOpen={(itinerary) => {
                      setItineraryConfig(itinerary.config);
                      setGeneratedItinerary(itinerary.itinerary_data);
                      setCurrentItineraryId(itinerary.id);
                      router.push('/itinerary');
                    }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Wishlist Sights */}
          <div className="space-y-5">
            <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--ws-text)' }}>
              <Heart size={18} style={{ color: 'var(--ws-accent)' }} />
              My Wishlist
            </h2>

            {wishlistPlaces.length === 0 ? (
              <div className="ws-glass rounded-3xl p-6 text-center border">
                <p className="text-xs" style={{ color: 'var(--ws-text-secondary)' }}>Your wishlist is empty.</p>
                <p className="text-[10px] opacity-70 mt-1 mb-4" style={{ color: 'var(--ws-text-secondary)' }}>Click the heart icon on any tourist place to save it here.</p>
                <Link
                  href="/"
                  className="inline-flex px-4 py-2 rounded-lg text-[10px] ws-ocean-btn-primary shadow-md"
                >
                  Browse Sights
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlistPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="ws-glass p-3.5 rounded-2xl flex gap-3.5 hover:border-[var(--ws-accent)] transition-all"
                  >
                    {place.cover_image && (
                      <div
                        className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url(${place.cover_image})` }}
                      />
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="font-extrabold text-sm truncate" style={{ color: 'var(--ws-text)' }}>
                          {place.name}
                        </h4>
                        <p className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5" style={{ color: 'var(--ws-text-secondary)' }}>
                          <MapPin size={10} style={{ color: 'var(--ws-accent)' }} />
                          {place.city_name}, {place.state_name}
                        </p>
                      </div>
                      <Link
                        href={`/city/${place.city_id}`}
                        className="text-[9px] font-bold hover:underline uppercase tracking-wider inline-flex items-center gap-0.5"
                        style={{ color: 'var(--ws-accent)' }}
                      >
                        Explore City <ArrowRight size={8} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer className="mt-auto" />
      <NavDock />
    </main>
  );
}
