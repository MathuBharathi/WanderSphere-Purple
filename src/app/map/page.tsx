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
    <main className="relative w-full h-[100svh] overflow-hidden" style={{ color: 'var(--ws-text)', backgroundColor: 'var(--ws-bg)' }}>
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
          className="flex items-center gap-2 ws-glass-strong border rounded-full px-4 py-2 hover:border-[var(--ws-accent)] transition-all text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-lg pointer-events-auto"
          style={{ color: 'var(--ws-text)' }}
        >
          <ArrowLeft size={14} style={{ color: 'var(--ws-accent)' }} />
          Home
        </Link>

        {!selectedCity && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setMapView(mapView === 'all' ? 'nearby' : 'all')}
              className={`flex items-center gap-2 border rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-lg transition-all duration-300 ${
                mapView === 'nearby'
                  ? 'border-[var(--ws-accent)] text-[var(--ws-accent)] ws-glass-strong'
                  : 'ws-glass-strong hover:border-[var(--ws-accent)]'
              }`}
              style={{ color: mapView === 'nearby' ? 'var(--ws-accent)' : 'var(--ws-text)' }}
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
            className="flex items-center gap-2 ws-glass-strong border rounded-full px-4 py-2 hover:border-[var(--ws-accent)] transition-all text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-lg pointer-events-auto"
            style={{ color: 'var(--ws-text)' }}
          >
            <X size={14} />
            Show All Cities
          </button>
        )}
      </div>

      {/* Badges / Stats */}
      <div className="absolute top-20 left-4 z-10 pointer-events-none">
        <div className="ws-glass-strong border rounded-2xl px-4 py-3 backdrop-blur-md shadow-lg flex flex-col items-center">
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>Showing</p>
          <p className="font-extrabold text-2xl" style={{ color: 'var(--ws-text)' }}>
            {selectedCity ? places.length : cities.length}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--ws-text-secondary)' }}>
            {selectedCity ? 'Places' : 'Cities'}
          </p>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[500] bg-[#020B18]/60 backdrop-blur-xs flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-[var(--ws-accent)] border-t-transparent animate-spin" />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--ws-accent)' }}>
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
            className="absolute top-4 right-4 bottom-24 w-80 z-10 ws-glass-strong backdrop-blur-xl border rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            style={{ color: 'var(--ws-text)' }}
          >
            {selectedCity.cover_image && (
              <div
                className="h-40 bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${selectedCity.cover_image})` }}
              />
            )}
            <div className="p-5 flex-1 flex flex-col justify-between overflow-y-auto">
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
                  {selectedCity.state_name || 'India'}
                </span>
                <h3 className="font-extrabold text-2xl mt-1 mb-2" style={{ color: 'var(--ws-text)' }}>
                  {selectedCity.name}
                </h3>
                {selectedCity.description && (
                  <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--ws-text-secondary)' }}>
                    {selectedCity.description}
                  </p>
                )}
                <div className="ws-glass rounded-2xl p-4 border space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--ws-text-secondary)' }}>Best Season:</span>
                    <span className="font-semibold" style={{ color: 'var(--ws-text)' }}>{selectedCity.best_season || 'Anytime'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--ws-text-secondary)' }}>Avg Temp:</span>
                    <span className="font-semibold" style={{ color: 'var(--ws-text)' }}>{selectedCity.avg_temp_celsius || 26}°C</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4 shrink-0">
                <Link
                  href={`/city/${selectedCity.id}`}
                  className="w-full inline-flex items-center justify-center py-3 rounded-xl ws-ocean-btn-primary text-xs font-black uppercase tracking-widest shadow-md"
                >
                  Explore in Detail
                </Link>
                <button
                  onClick={() => {
                    setSelectedCity(null);
                    setPlaces([]);
                  }}
                  className="w-full py-2 hover:underline text-xs transition-colors"
                  style={{ color: 'var(--ws-text-secondary)' }}
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
            className="absolute top-4 right-4 bottom-24 w-80 z-10 ws-glass-strong backdrop-blur-xl border rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            style={{ color: 'var(--ws-text)' }}
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
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
                    {selectedPlace.category}
                  </span>
                  {selectedPlace.is_hidden_gem && (
                    <span className="flex items-center gap-0.5 text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ws-glass border" style={{ color: 'var(--ws-accent)' }}>
                      <Sparkles size={8} />
                      Hidden Gem
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-2xl mt-1 mb-2" style={{ color: 'var(--ws-text)' }}>
                  {selectedPlace.name}
                </h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--ws-text-secondary)' }}>
                  {selectedPlace.description}
                </p>

                <div className="ws-glass rounded-2xl p-4 border space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--ws-text-secondary)' }}>Entry Fee:</span>
                    <span className="font-semibold" style={{ color: 'var(--ws-text)' }}>
                      {selectedPlace.entry_fee === 0 ? 'Free' : `₹${selectedPlace.entry_fee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--ws-text-secondary)' }}>Visit Duration:</span>
                    <span className="font-semibold" style={{ color: 'var(--ws-text)' }}>{selectedPlace.avg_visit_duration} mins</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--ws-text-secondary)' }}>Rating:</span>
                    <span className="font-semibold" style={{ color: 'var(--ws-accent)' }}>★ {selectedPlace.avg_rating || '4.5'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4 shrink-0">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center py-3 rounded-xl ws-ocean-btn-primary text-xs font-black uppercase tracking-widest shadow-md"
                >
                  Get Directions
                </a>
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="w-full py-2 hover:underline text-xs transition-colors"
                  style={{ color: 'var(--ws-text-secondary)' }}
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
