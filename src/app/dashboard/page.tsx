'use client';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { useRouter } from 'next/navigation';
import { getUserItineraries, deleteItinerary, getPlacesByCity } from '@/lib/api';
import { 
  Sparkles, Calendar, Compass, Trash2, ArrowRight, MapPin, 
  User, Loader2, LogOut, Heart, Plus, BookOpen, Clock
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { NavDock } from '@/components/dock/NavDock';
import type { SavedItinerary, Place } from '@/types';
import { places as staticPlaces } from '@/data/travelData';

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, profile, setProfile, savedPlaces, setGeneratedItinerary, setItineraryConfig } = useAppStore();
  const [itineraries, setItineraries] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistPlaces, setWishlistPlaces] = useState<Place[]>([]);

  // 1. Authenticate user — check Zustand store first, then Supabase session
  useEffect(() => {
    const initDashboard = async () => {
      // If user is already loaded in the store (from AuthProvider), use that
      if (user) {
        loadDashboardData(user.id);
        return;
      }
      // Otherwise try Supabase session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          loadDashboardData(session.user.id);
          return;
        }
      } catch (e) {
        console.warn('Supabase session check failed:', e);
      }
      // Check for local session fallback
      if (typeof window !== 'undefined') {
        try {
          const localUser = JSON.parse(localStorage.getItem('local_session_user') || 'null');
          if (localUser) {
            setUser(localUser);
            loadDashboardData(localUser.id);
            return;
          }
        } catch (e) {
          console.warn('Local session check failed:', e);
        }
      }
      // No session at all — redirect to auth
      router.push('/auth');
    };
    initDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load itineraries and wishlist places
  const loadDashboardData = async (userId: string) => {
    setLoading(true);
    try {
      const userItits = await getUserItineraries(userId);
      setItineraries(userItits);
    } catch (e) {
      console.error('Failed to load itineraries', e);
    } finally {
      setLoading(false);
    }
  };

  // Populate wishlist from static places based on local storage saved IDs
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
      setItineraries(itineraries.filter((i) => i.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete itinerary. Please try again.');
    }
  };

  const handleOpenItinerary = (itinerary: SavedItinerary) => {
    setItineraryConfig(itinerary.config);
    setGeneratedItinerary(itinerary.itinerary_data);
    router.push('/itinerary');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/');
  };

  if (loading && !user) {
    return (
      <main className="min-h-screen bg-[#0B1914] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#C69234]" />
          <p className="text-[#A3C2B2] text-xs uppercase tracking-widest font-semibold">Loading Dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1914] pb-32 text-[#F0F7F4] transition-colors duration-300">
      {/* Top Navbar */}
      <nav className="border-b border-[#2C5E3B]/60 bg-[#143028]/80 backdrop-blur-xl py-5 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-extrabold text-lg text-white tracking-widest">—WANDERSPHERE</Link>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C69234] hover:underline transition-colors">
              <User size={14} />
              <span>Profile Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-800/40 hover:bg-rose-950/30 text-rose-400 text-xs font-semibold transition-all"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        {/* Welcome message */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">
            Hello, {profile?.full_name || user?.email?.split('@')[0] || 'Explorer'}
          </h1>
          <p className="text-[#A3C2B2] text-sm mt-1">
            Manage your saved Indian travel plans and wishlist destinations.
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <div className="bg-[#143028] border border-[#2C5E3B] rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <div className="w-10 h-10 rounded-2xl bg-[#1B432C] text-[#C69234] border border-[#2C5E3B] flex items-center justify-center mb-4">
              <Compass size={20} />
            </div>
            <p className="text-2xs font-extrabold uppercase tracking-widest text-[#A3C2B2]">Saved Itineraries</p>
            <p className="text-3xl font-black text-[#C69234] mt-1">{itineraries.length}</p>
          </div>

          <div className="bg-[#143028] border border-[#2C5E3B] rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <div className="w-10 h-10 rounded-2xl bg-[#1B432C] text-[#A65D29] border border-[#2C5E3B] flex items-center justify-center mb-4">
              <Heart size={20} />
            </div>
            <p className="text-2xs font-extrabold uppercase tracking-widest text-[#A3C2B2]">Wishlist Sights</p>
            <p className="text-3xl font-black text-[#A65D29] mt-1">{wishlistPlaces.length}</p>
          </div>

          <div className="bg-[#143028] border border-[#2C5E3B] rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Ready for a new adventure?</p>
              <p className="text-2xs text-[#A3C2B2] mt-1">Let AI craft your next custom trip itinerary.</p>
            </div>
            <Link
              href="/#explore"
              className="mt-4 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#C69234] hover:bg-[#b07f2a] text-[#0B1914] text-xs font-black uppercase tracking-wider transition-all shadow-md"
            >
              <Plus size={14} />
              <span>Generate New Itinerary</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Saved Itineraries List */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <BookOpen size={18} className="text-[#C69234]" />
              Saved Travel Plans
            </h2>

            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="animate-spin text-[#C69234]" />
              </div>
            ) : itineraries.length === 0 ? (
              <div className="bg-[#143028]/60 border border-[#2C5E3B] rounded-3xl p-8 text-center">
                <Compass size={36} className="text-[#A3C2B2]/40 mx-auto mb-3" />
                <p className="font-extrabold text-sm text-white">No itineraries saved yet</p>
                <p className="text-[#A3C2B2] text-xs mt-1 mb-5">Plans generated on our site can be saved directly here.</p>
                <Link
                  href="/#explore"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#C69234] text-[#0B1914] text-xs font-black uppercase tracking-wider shadow-md hover:bg-[#b07f2a]"
                >
                  <Plus size={12} /> Plan a Trip
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {itineraries.map((itinerary) => (
                  <div
                    key={itinerary.id}
                    onClick={() => handleOpenItinerary(itinerary)}
                    className="bg-[#143028] border border-[#2C5E3B] rounded-2xl overflow-hidden hover:border-[#C69234] transition-all cursor-pointer group shadow-lg"
                  >
                    {itinerary.itinerary_data?.config?.cityId && (
                      <div
                        className="h-28 bg-cover bg-center shrink-0"
                        style={{
                          backgroundImage: `url(${
                            staticPlaces.find(p => p.city_id === itinerary.itinerary_data.config.cityId)?.cover_image || 
                            'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800'
                          })`
                        }}
                      />
                    )}
                    <div className="p-4.5 flex flex-col justify-between h-40">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#C69234]">
                            {itinerary.config?.stateName}
                          </span>
                          <span className="text-[9px] font-semibold text-[#A3C2B2]/80">
                            {itinerary.created_at ? new Date(itinerary.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-base text-white mt-1 group-hover:text-[#C69234] transition-colors">
                          Trip to {itinerary.config?.cityName || itinerary.title}
                        </h3>
                        <div className="flex gap-3 text-2xs font-semibold uppercase tracking-wider text-[#A3C2B2] mt-2">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {itinerary.config?.days} Days</span>
                          <span className="flex items-center gap-1"><Sparkles size={10} /> {itinerary.config?.travelStyle}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center border-t border-[#2C5E3B]/60 pt-3">
                        <span className="text-xs font-bold text-[#C69234] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          View Details <ArrowRight size={12} />
                        </span>
                        <button
                          onClick={(e) => handleDelete(itinerary.id, e)}
                          className="p-1.5 text-[#A3C2B2] hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-950/30"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wishlist Sights */}
          <div className="space-y-5">
            <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Heart size={18} className="text-[#A65D29]" />
              My Wishlist
            </h2>

            {wishlistPlaces.length === 0 ? (
              <div className="bg-[#143028]/60 border border-[#2C5E3B] rounded-3xl p-6 text-center">
                <p className="text-xs text-[#A3C2B2]">Your wishlist is empty.</p>
                <p className="text-2xs text-[#A3C2B2]/60 mt-1 mb-4">Click the heart icon on any tourist place to save it here.</p>
                <Link
                  href="/"
                  className="inline-flex px-4 py-2 bg-[#C69234] text-[#0B1914] rounded-lg text-2xs font-black uppercase tracking-wider"
                >
                  Browse Sights
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlistPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="bg-[#143028] border border-[#2C5E3B] p-3.5 rounded-2xl flex gap-3.5 hover:border-[#C69234] transition-all"
                  >
                    {place.cover_image && (
                      <div
                        className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url(${place.cover_image})` }}
                      />
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="font-extrabold text-sm text-white truncate">
                          {place.name}
                        </h4>
                        <p className="text-[10px] text-[#A3C2B2] font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-[#C69234]" />
                          {place.city_name}, {place.state_name}
                        </p>
                      </div>
                      <Link
                        href={`/city/${place.city_id}`}
                        className="text-[9px] font-bold text-[#C69234] hover:underline uppercase tracking-wider inline-flex items-center gap-0.5"
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
      <NavDock />
    </main>
  );
}
