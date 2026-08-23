'use client';
import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Thermometer, Clock, Star, Loader2,
  Globe, Camera, Coffee, ShoppingBag, Moon, Sparkles,
  Landmark, TreePine, Utensils, Zap, Compass, DollarSign, X, Eye, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { getCityById, getPlacesByCity, getWeather, createItinerary } from '@/lib/api';
import { generateItinerary } from '@/lib/itineraryEngine';
import { MasonryGallery } from '@/components/gallery/MasonryGallery';
import { PlaceModal } from '@/components/ui/PlaceModal';
import { NavDock } from '@/components/dock/NavDock';
import { WeatherWidget } from '@/components/ui/WeatherWidget';
import { Footer } from '@/components/ui/Footer';
import { useAppStore } from '@/store';
import type { City, Place, MasonryItem, TravelStyle, BudgetLevel } from '@/types';
import dynamic from 'next/dynamic';

// Dynamic import of LeafletMap
const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex items-center justify-center bg-violet-50/50 dark:bg-white/5 rounded-3xl">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        <p className="text-violet-500 text-xs font-semibold uppercase tracking-widest">Map Loading...</p>
      </div>
    </div>
  ),
});

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Globe },
  { key: 'historical', label: 'Historical', icon: Landmark },
  { key: 'nature', label: 'Nature', icon: TreePine },
  { key: 'adventure', label: 'Adventure', icon: Zap },
  { key: 'spiritual', label: 'Spiritual', icon: Compass },
  { key: 'food', label: 'Food', icon: Utensils },
  { key: 'beach', label: 'Beach', icon: WavesIcon },
  { key: 'cultural', label: 'Cultural', icon: Camera },
  { key: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { key: 'hidden_gem', label: 'Hidden Gems', icon: Sparkles },
];

function WavesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      style={{ width: '12px', height: '12px' }}
    >
      <path d="M2 6c.6.5 1.2 1 2.5 1C6 7 7 5 9 5c2 0 3 2 4.5 2 1.3 0 1.9-.5 2.5-1" />
      <path d="M2 12c.6.5 1.2 1 2.5 1 1.5 0 2.5-2 4.5-2 2 0 3 2 4.5 2 1.3 0 1.9-.5 2.5-1" />
      <path d="M2 18c.6.5 1.2 1 2.5 1 1.5 0 2.5-2 4.5-2 2 0 3 2 4.5 2 1.3 0 1.9-.5 2.5-1" />
    </svg>
  );
}

function CityContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const openPlaceId = searchParams.get('place');
  const { user, generatedItinerary, setGeneratedItinerary, setItineraryConfig, setCurrentItineraryId } = useAppStore();

  const [city, setCity] = useState<City | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [allPlacesForMap, setAllPlacesForMap] = useState<Place[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  
  // Itinerary Generation Modal State
  const [showGenModal, setShowGenModal] = useState(false);
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState<BudgetLevel>('moderate');
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('adventure');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getCityById(id), getPlacesByCity(id)]).then(([c, p]) => {
      setCity(c);
      setPlaces(p);
      setAllPlacesForMap(p);
      setLoading(false);
      if (c?.latitude && c?.longitude) {
        getWeather(c.latitude, c.longitude).then(setWeather);
      }
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const filterCat = activeCategory === 'all' ? undefined : activeCategory === 'hidden_gem' ? undefined : activeCategory;
    getPlacesByCity(id, filterCat).then((p) => {
      let filtered = p;
      if (activeCategory === 'hidden_gem') {
        filtered = p.filter(item => item.is_hidden_gem);
      }
      setPlaces(filtered);
      setLoading(false);
    });
  }, [id, activeCategory]);

  useEffect(() => {
    if (openPlaceId && allPlacesForMap.length > 0) {
      const p = allPlacesForMap.find((pl) => pl.id === openPlaceId);
      if (p) setSelectedPlace(p);
    }
  }, [openPlaceId, allPlacesForMap]);

  const handleGenerateItinerary = () => {
    if (!city) return;
    setGenerating(true);
    setTimeout(async () => {
      const config = {
        stateId: city.state_id,
        stateName: city.state_name || 'State',
        cityId: city.id,
        cityName: city.name,
        days,
        budget,
        travelStyle
      };
      const itinerary = generateItinerary(config);
      setItineraryConfig(config);
      setGeneratedItinerary(itinerary);

      try {
        const saved = await createItinerary({
          user_id: user?.id || 'local-user-id',
          title: `Trip to ${config.cityName}`,
          config,
          itinerary_data: itinerary,
          is_public: false
        });
        setCurrentItineraryId(saved.id);
      } catch (e) {
        console.warn('City page auto-save failed:', e);
      }

      setGenerating(false);
      setShowGenModal(false);
      router.push('/itinerary');
    }, 1200);
  };

  const masonryItems: MasonryItem[] = places
    .filter((p) => p.cover_image)
    .map((p, i) => ({
      id: p.id,
      img: p.cover_image!,
      height: [350, 280, 420, 300, 380][i % 5],
      title: p.name,
    }));

  // Map Items formatting
  const mapItems = allPlacesForMap.map((p) => ({
    id: p.id,
    name: p.name,
    latitude: p.latitude,
    longitude: p.longitude,
    cover_image: p.cover_image,
    description: p.description,
    type: 'place' as const,
    category: p.category,
  }));

  if (loading && !city) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--ws-text)' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} style={{ color: 'var(--ws-accent)' }} className="animate-spin" />
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--ws-text-secondary)' }}>Loading city...</p>
        </div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6" style={{ color: 'var(--ws-text)' }}>
        <div>
          <p className="text-lg mb-4" style={{ color: 'var(--ws-text-secondary)' }}>City not found</p>
          <Link href="/" className="text-sm underline font-semibold" style={{ color: 'var(--ws-accent)' }}>Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-24 transition-colors duration-500" style={{ color: 'var(--ws-text)' }}>
      {/* Back Link */}
      <Link
        href="/"
        style={{ color: 'var(--ws-text)' }}
        className="absolute top-6 left-6 z-30 flex items-center gap-2 ws-glass text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-full hover:border-[var(--ws-accent)] transition-all"
      >
        <ArrowLeft size={14} />
        Back
      </Link>

      {/* Cinematic Banner */}
      <div className="relative h-[65vh] md:h-[75vh] overflow-hidden">
        {/* Main image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${city.cover_image || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200'})` }}
        />
        {/* Dark ocean gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020B18] via-[#041B31]/40 to-transparent" />

        {/* Content info overlay */}
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-12 max-w-7xl mx-auto w-full z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.4em] mb-3 flex items-center gap-2" style={{ color: 'var(--ws-accent)' }}>
              <MapPin size={12} style={{ color: 'var(--ws-accent)' }} />
              {city.state_name || 'India'}
            </p>
            <h1 className="font-extrabold text-5xl md:text-7xl text-white uppercase leading-none tracking-tight">
              {city.name}
            </h1>
            <p className="max-w-2xl text-white/90 text-sm md:text-base mt-4 leading-relaxed font-light">
              {city.description}
            </p>

            {/* Quick stats tags */}
            <div className="flex flex-wrap gap-2 mt-6">
              {city.best_season && (
                <span className="ws-glass-soft text-white text-[10px] font-bold uppercase tracking-widest px-3.5 py-2 rounded-xl flex items-center gap-1.5 backdrop-blur-md shadow-sm">
                  <Clock size={10} style={{ color: 'var(--ws-accent)' }} />
                  Best: {city.best_season}
                </span>
              )}
              {city.avg_temp_celsius && (
                <span className="ws-glass-soft text-white text-[10px] font-bold uppercase tracking-widest px-3.5 py-2 rounded-xl flex items-center gap-1.5 backdrop-blur-md shadow-sm">
                  <Thermometer size={10} style={{ color: 'var(--ws-accent)' }} />
                  {city.avg_temp_celsius}°C Avg
                </span>
              )}
              {city.tags?.map((tag) => (
                <span key={tag} className="ws-glass-soft text-white/90 text-[10px] font-bold uppercase tracking-widest px-3.5 py-2 rounded-xl backdrop-blur-md">
                  #{tag}
                </span>
              ))}
            </div>

            {/* AI itinerary button */}
            <div className="mt-8">
              <button
                onClick={() => setShowGenModal(true)}
                className="flex items-center gap-2 px-6 py-5 rounded-2xl text-xs ws-ocean-btn-primary shadow-xl hover:scale-[1.02]"
              >
                <Sparkles size={14} className="animate-pulse" />
                <span>Create AI Itinerary for {city.name}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="sticky top-0 z-20 w-full ws-glass-strong border-b py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                style={{
                  background: activeCategory === key ? 'linear-gradient(135deg, var(--ws-ocean), var(--ws-accent))' : undefined,
                  color: activeCategory === key ? '#FFFFFF' : 'var(--ws-text-secondary)',
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                  activeCategory === key
                    ? 'shadow-md font-black'
                    : 'ws-glass hover:border-[var(--ws-accent)]'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Leaflet Map of the City places */}
      <div className="max-w-7xl mx-auto px-6 pt-16">
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#C69234] mb-3">
            ✦ Geographic View ✦
          </p>
          <h2 className="font-extrabold text-3xl text-white uppercase tracking-tight">
            Interactive City Map
          </h2>
          <p className="text-xs text-[#A3C2B2] mt-1">
            Visual map of all major sights, hidden gems, and local recommendations.
          </p>
        </div>
        <div className="h-[400px] border border-[#2C5E3B] rounded-3xl overflow-hidden shadow-xl p-2 bg-[#143028]">
          <LeafletMap
            items={mapItems}
            center={city.latitude && city.longitude ? [city.latitude, city.longitude] : [20.5937, 78.9629]}
            zoom={12}
            onItemSelect={(item) => {
              if (!item) return;
              const place = allPlacesForMap.find(p => p.id === item.id);
              if (place) setSelectedPlace(place);
            }}
          />
        </div>
      </div>

      {/* Places Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#C69234] mb-3">
              ✦ {activeCategory === 'all' ? 'All Places' : CATEGORIES.find(c => c.key === activeCategory)?.label} ✦
            </p>
            <h2 className="font-extrabold text-4xl text-white uppercase tracking-tight">
              {places.length} Sights
            </h2>
          </div>
          <p className="text-[#A3C2B2] text-xs uppercase tracking-widest font-bold hidden md:block">
            Click any photo to explore
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-[#C69234] animate-spin" />
          </div>
        ) : masonryItems.length > 0 ? (
          <MasonryGallery
            items={masonryItems}
            animateFrom="bottom"
            blurToFocus={true}
            stagger={0.06}
            scaleOnHover={true}
            hoverScale={0.97}
            colorShiftOnHover={true}
            onItemClick={(item) => {
              const place = places.find((p) => p.id === item.id);
              if (place) setSelectedPlace(place);
            }}
          />
        ) : (
          <div className="text-center py-20 bg-[#143028]/60 border border-[#2C5E3B] rounded-3xl">
            <p className="text-[#A3C2B2] text-sm font-semibold">No places found in this category.</p>
          </div>
        )}
      </div>

      {/* Travel Tips Section */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-[#143028] border border-[#2C5E3B] rounded-3xl p-8 shadow-xl">
          <h3 className="font-extrabold text-2xl text-white uppercase tracking-tight mb-6 flex items-center gap-2">
            <Sparkles size={20} className="text-[#C69234]" />
            Travel Tips for {city.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[#C69234]">Best Time to Visit</h4>
              <p className="text-xs text-[#A3C2B2] leading-relaxed">
                Generally, {city.best_season || 'Nov-Feb'} offers the most pleasant weather. Monsoons can be intense, but beautiful for hills, while summers can be quite warm in plain states.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[#C69234]">Local Food & Culture</h4>
              <p className="text-xs text-[#A3C2B2] leading-relaxed">
                Try the street food trails! Tap into native dishes (like filter coffee & dosas in South, thalis in West, or chaats in North). Dress modestly when visiting spiritual temples or mosques.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[#C69234]">Budget & Commute</h4>
              <p className="text-xs text-[#A3C2B2] leading-relaxed">
                Use local autos, metro systems, or app cab services (Ola/Uber) for transparent rates. Free entry exists for many open beaches and ghats, but historical forts have small tickets.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Itinerary Options Generator Modal */}
      <AnimatePresence>
        {showGenModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-[#143028] border border-[#2C5E3B] rounded-3xl p-6 shadow-2xl text-white"
            >
              <button
                onClick={() => setShowGenModal(false)}
                className="absolute top-4 right-4 text-[#A3C2B2] hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <h3 className="font-extrabold text-xl text-white uppercase tracking-tight flex items-center gap-1.5">
                  <Sparkles size={16} className="text-[#C69234]" />
                  AI Plan Options
                </h3>
                <p className="text-xs text-[#A3C2B2] mt-1">Configure your custom {city.name} itinerary.</p>
              </div>

              <div className="space-y-5">
                {/* Days Slider */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#C69234] mb-2">
                    <Clock size={12} />
                    Trip Duration
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="7"
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                      className="w-full accent-[#C69234]"
                    />
                    <span className="font-extrabold text-xs text-white bg-[#1B432C] border border-[#2C5E3B] px-3 py-1.5 rounded-lg min-w-[50px] text-center">
                      {days} {days === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#C69234] mb-2">
                    <DollarSign size={12} />
                    Budget Level
                  </label>
                  <div className="flex items-center bg-[#1B432C] p-1 rounded-xl border border-[#2C5E3B]/40 w-full overflow-hidden">
                    {(['budget', 'moderate', 'luxury'] as BudgetLevel[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setBudget(level)}
                        className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-tight text-center rounded-lg transition-all truncate ${
                          budget === level
                            ? 'bg-[#C69234] text-[#0B1914] shadow-md'
                            : 'text-[#A3C2B2] hover:bg-[#2C5E3B]/50 hover:text-white'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Travel Style */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#C69234] mb-2">
                    <Compass size={12} />
                    Travel Style
                  </label>
                  <select
                    value={travelStyle}
                    onChange={(e) => setTravelStyle(e.target.value as TravelStyle)}
                    className="w-full bg-[#1B432C] border border-[#2C5E3B] rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider outline-none text-white cursor-pointer"
                  >
                    <option value="adventure" className="bg-[#143028]">Adventure</option>
                    <option value="spiritual" className="bg-[#143028]">Spiritual</option>
                    <option value="family" className="bg-[#143028]">Family</option>
                    <option value="couple" className="bg-[#143028]">Couple</option>
                    <option value="solo" className="bg-[#143028]">Solo</option>
                    <option value="luxury" className="bg-[#143028]">Luxury</option>
                    <option value="budget" className="bg-[#143028]">Budget</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  {generatedItinerary && (
                    <button
                      type="button"
                      onClick={() => router.push('/itinerary')}
                      className="w-full py-3.5 rounded-xl bg-[#1B432C] border border-[#C69234] text-[#C69234] font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 hover:bg-[#C69234] hover:text-[#0B1914]"
                    >
                      <Eye size={14} />
                      <span>View Generated Itinerary</span>
                      <ArrowRight size={14} />
                    </button>
                  )}

                  <button
                    onClick={handleGenerateItinerary}
                    disabled={generating}
                    className="w-full py-4 rounded-xl bg-[#C69234] text-[#0B1914] font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-[#C69234]/20 flex items-center justify-center gap-2 hover:bg-[#b07f2a]"
                  >
                    {generating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Creating itinerary...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-[#0B1914] animate-pulse" />
                        <span>Generate Itinerary</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Place Detail Modal */}
      <AnimatePresence>
        {selectedPlace && (
          <PlaceModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
        )}
      </AnimatePresence>

      {/* Weather widget */}
      {weather && <WeatherWidget weather={weather} />}

      <Footer />
      <div className="h-28" />
      <NavDock />
    </main>
  );
}

export default function CityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F4FF] dark:bg-[#0F081D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-violet animate-spin" />
          <p className="text-violet-mauve/50 text-sm uppercase tracking-widest">Loading City...</p>
        </div>
      </div>
    }>
      <CityContent />
    </Suspense>
  );
}
