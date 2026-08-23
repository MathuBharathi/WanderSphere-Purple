'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Navigation, MapPin, Layers, X, Sparkles } from 'lucide-react';
import { getAllCities, getNearbyCities, getPlacesByCity } from '@/lib/api';
import { useAppStore } from '@/store';
import { NavDock } from '@/components/dock/NavDock';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { City, Place } from '@/types';

// Dynamically import the Leaflet map with SSR disabled
const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--ws-text)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--ws-accent)', borderTopColor: 'transparent' }} />
        <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--ws-accent)' }}>Initializing Map...</p>
      </div>
    </div>
  ),
});

interface MapItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  cover_image?: string;
  description?: string;
  type: 'city' | 'place';
  category?: string;
  exploreUrl?: string;
}

export default function MapPage() {
  const { userLocation } = useAppStore();
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapView, setMapView] = useState<'all' | 'nearby'>('all');

  useEffect(() => {
    loadCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapView, userLocation]);

  const loadCities = async () => {
    setLoading(true);
    let data: City[];
    if (mapView === 'nearby' && userLocation) {
      data = await getNearbyCities(userLocation.lat, userLocation.lng, 500);
    } else {
      data = await getAllCities();
    }
    setCities(data);
    setPlaces([]);
    setSelectedCity(null);
    setSelectedPlace(null);
    setLoading(false);
  };

  // Load places for selected city
  const handleCitySelect = async (cityItem: City) => {
    setLoading(true);
    setSelectedCity(cityItem);
    setSelectedPlace(null);
    try {
      const cityPlaces = await getPlacesByCity(cityItem.id);
      setPlaces(cityPlaces);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Convert cities or places to the map's format
  const getMapItems = (): MapItem[] => {
    if (selectedCity && places.length > 0) {
      return places.map((p) => ({
        id: p.id,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        cover_image: p.cover_image,
        description: p.description,
        type: 'place',
        category: p.category,
        exploreUrl: `/city/${selectedCity.id}`,
      }));
    }

    return cities.map((c) => ({
      id: c.id,
      name: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
      cover_image: c.cover_image,
      description: c.description,
      type: 'city',
      exploreUrl: `/city/${c.id}`,
    }));
  };

  const mapItems = getMapItems();

  return (
    <main className="relative w-full h-screen bg-[#0B1914] overflow-hidden text-[#F0F7F4]">
      {/* Map component */}
      <div className="absolute inset-0 z-0">
        <LeafletMap
          items={mapItems}
          center={userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629]}
          zoom={selectedCity ? 11 : userLocation ? 7 : 5}
          onItemSelect={(item) => {
            if (!item) return;
            if (item.type === 'city') {
              const matchedCity = cities.find((c) => c.id === item.id);
              if (matchedCity) handleCitySelect(matchedCity);
            } else {
              const matchedPlace = places.find((p) => p.id === item.id);
              if (matchedPlace) setSelectedPlace(matchedPlace);
            }
          }}
          activeItemId={selectedPlace?.id || selectedCity?.id}
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between pointer-events-none">
        <Link
          href="/"
          className="flex items-center gap-2 bg-[#143028]/90 border border-[#2C5E3B] rounded-full px-4 py-2 text-white hover:text-[#C69234] transition-all text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-lg pointer-events-auto"
        >
          <ArrowLeft size={14} />
          Home
        </Link>

        {!selectedCity && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setMapView(mapView === 'all' ? 'nearby' : 'all')}
              className={`flex items-center gap-2 border rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-lg transition-all duration-300 ${
                mapView === 'nearby'
                  ? 'border-[#C69234] text-[#C69234] bg-[#143028]'
                  : 'border-[#2C5E3B] bg-[#143028]/90 text-white hover:border-[#C69234]'
              }`}
            >
              {mapView === 'nearby' ? <Navigation size={14} /> : <Layers size={14} />}
              {mapView === 'nearby' ? 'Nearby' : 'All Cities'}
            </button>
          </div>
        )}

        {selectedCity && (
          <button
            onClick={() => {
              setSelectedCity(null);
              setPlaces([]);
              setSelectedPlace(null);
            }}
            className="flex items-center gap-2 bg-[#143028]/90 border border-[#2C5E3B] rounded-full px-4 py-2 text-white hover:text-[#C69234] transition-all text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-lg pointer-events-auto"
          >
            <X size={14} />
            Show All Cities
          </button>
        )}
      </div>

      {/* Badges / Stats */}
      <div className="absolute top-20 left-4 z-10 pointer-events-none">
        <div className="bg-[#143028]/90 border border-[#2C5E3B] rounded-2xl px-4 py-3 backdrop-blur-md shadow-lg flex flex-col items-center text-white">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#C69234]">Showing</p>
          <p className="font-extrabold text-2xl text-white">
            {selectedCity ? places.length : cities.length}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#A3C2B2]">
            {selectedCity ? 'Places' : 'Cities'}
          </p>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[500] bg-[#0B1914]/60 backdrop-blur-xs flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-[#C69234] border-t-transparent animate-spin" />
            <p className="text-[#C69234] text-xs uppercase tracking-widest font-semibold">
              Loading destinations...
            </p>
          </div>
        </div>
      )}

      {/* Sidebars */}
      <AnimatePresence>
        {/* Selected City Details */}
        {selectedCity && !selectedPlace && (
          <motion.div
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            className="absolute top-4 right-4 bottom-24 w-80 z-10 bg-[#143028]/95 backdrop-blur-xl border border-[#2C5E3B] rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white"
          >
            {selectedCity.cover_image && (
              <div
                className="h-40 bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${selectedCity.cover_image})` }}
              />
            )}
            <div className="p-5 flex-1 flex flex-col justify-between overflow-y-auto">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#C69234]">
                  {selectedCity.state_name || 'India'}
                </span>
                <h3 className="font-extrabold text-2xl text-white mt-1 mb-2">
                  {selectedCity.name}
                </h3>
                {selectedCity.description && (
                  <p className="text-[#A3C2B2] text-xs leading-relaxed mb-4">
                    {selectedCity.description}
                  </p>
                )}
                <div className="bg-[#1B432C] rounded-2xl p-4 border border-[#2C5E3B] space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A3C2B2]">Best Season:</span>
                    <span className="font-semibold text-white">{selectedCity.best_season || 'Anytime'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A3C2B2]">Avg Temp:</span>
                    <span className="font-semibold text-white">{selectedCity.avg_temp_celsius || 26}°C</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4 shrink-0">
                <Link
                  href={`/city/${selectedCity.id}`}
                  className="w-full inline-flex items-center justify-center py-3 rounded-xl bg-[#C69234] text-[#0B1914] text-xs font-black uppercase tracking-widest hover:bg-[#b07f2a] transition-all shadow-md"
                >
                  Explore in Detail
                </Link>
                <button
                  onClick={() => {
                    setSelectedCity(null);
                    setPlaces([]);
                  }}
                  className="w-full py-2 text-[#A3C2B2] hover:text-white text-xs transition-colors"
                >
                  Back to All Cities
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Selected Place Details */}
        {selectedPlace && (
          <motion.div
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            className="absolute top-4 right-4 bottom-24 w-80 z-10 bg-[#143028]/95 backdrop-blur-xl border border-[#2C5E3B] rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white"
          >
            {selectedPlace.cover_image && (
              <div
                className="h-40 bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${selectedPlace.cover_image})` }}
              />
            )}
            <div className="p-5 flex-1 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#A65D29]">
                    {selectedPlace.category}
                  </span>
                  {selectedPlace.is_hidden_gem && (
                    <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#1B432C] text-[#C69234] border border-[#2C5E3B]">
                      <Sparkles size={8} />
                      Hidden Gem
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-2xl text-white mt-1 mb-2">
                  {selectedPlace.name}
                </h3>
                <p className="text-[#A3C2B2] text-xs leading-relaxed mb-4">
                  {selectedPlace.description}
                </p>

                <div className="bg-[#1B432C] rounded-2xl p-4 border border-[#2C5E3B] space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A3C2B2]">Entry Fee:</span>
                    <span className="font-semibold text-white">
                      {selectedPlace.entry_fee === 0 ? 'Free' : `₹${selectedPlace.entry_fee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A3C2B2]">Visit Duration:</span>
                    <span className="font-semibold text-white">{selectedPlace.avg_visit_duration} mins</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A3C2B2]">Rating:</span>
                    <span className="font-semibold text-[#C69234]">★ {selectedPlace.avg_rating || '4.5'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4 shrink-0">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center py-3 rounded-xl bg-[#C69234] text-[#0B1914] text-xs font-black uppercase tracking-widest hover:bg-[#b07f2a] transition-all shadow-md"
                >
                  Get Directions
                </a>
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="w-full py-2 text-[#A3C2B2] hover:text-white text-xs transition-colors"
                >
                  Back to City places
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NavDock />
    </main>
  );
}
