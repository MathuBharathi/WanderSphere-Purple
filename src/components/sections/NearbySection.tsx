'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, Compass, Sparkles, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store';
import { getNearbyCities, getNearbyPlaces, getFeaturedCities, getFeaturedPlaces } from '@/lib/api';
import { useRouter } from 'next/navigation';
import type { City, Place } from '@/types';

export function NearbySection() {
  const { userLocation } = useAppStore();
  const [nearbyCities, setNearbyCities] = useState<City[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [featuredCities, setFeaturedCities] = useState<City[]>([]);
  const [featuredPlaces, setFeaturedPlaces] = useState<Place[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [activeTab, setActiveTab] = useState<'cities' | 'places'>('cities');
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 1. Proactively check navigator permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        if (result.state === 'denied') {
          setDenied(true);
        }
        result.onchange = () => {
          if (result.state === 'denied') {
            setDenied(true);
          } else if (result.state === 'granted') {
            setDenied(false);
          }
        };
      });
    }
  }, []);

  // 2. Fetch featured data (always load in parallel for fallback)
  useEffect(() => {
    Promise.all([getFeaturedCities(), getFeaturedPlaces()])
      .then(([fCities, fPlaces]) => {
        setFeaturedCities(fCities);
        setFeaturedPlaces(fPlaces);
        // If location is denied and finished, we can stop loading
        if (!userLocation && denied) {
          setLoading(false);
        }
      })
      .catch((err) => console.error('Error loading featured data:', err));
  }, [userLocation, denied]);

  // 3. Fetch nearby data when location is available
  useEffect(() => {
    if (!userLocation) return;
    setLoading(true);
    setDenied(false);
    
    Promise.all([
      getNearbyCities(userLocation.lat, userLocation.lng, 300),
      getNearbyPlaces(userLocation.lat, userLocation.lng, 150)
    ])
      .then(([nCities, nPlaces]) => {
        setNearbyCities(nCities);
        setNearbyPlaces(nPlaces);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading nearby data:', err);
        setLoading(false);
      });
  }, [userLocation]);

  // 4. Geolocation timeout fallback (if prompt is pending / ignored)
  useEffect(() => {
    if (!userLocation && !denied) {
      const timer = setTimeout(() => {
        setDenied(true);
        setLoading(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [userLocation, denied]);

  // Fallbacks: if location allowed but no cities/places within range, show featured
  const hasNearbyCities = userLocation && nearbyCities.length > 0;
  const hasNearbyPlaces = userLocation && nearbyPlaces.length > 0;
  
  const showNearbyMode = userLocation && (hasNearbyCities || hasNearbyPlaces);
  
  const citiesList = hasNearbyCities ? nearbyCities : featuredCities;
  const placesList = hasNearbyPlaces ? nearbyPlaces : featuredPlaces;

  // Active list based on selected tab
  const listToUse = activeTab === 'cities' ? citiesList : placesList;
  const isCitiesTab = activeTab === 'cities';

  // Desktop Scroll Handlers
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      
      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  const handleItemClick = (id: string) => {
    if (isCitiesTab) {
      router.push(`/city/${id}`);
    } else {
      router.push(`/place/${id}`);
    }
  };

  return (
    <section id="nearby" className="relative py-24 overflow-hidden bg-[#0B1914]">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1914] via-[#143028]/30 to-[#0B1914] z-0" />

      <div className="relative max-w-7xl mx-auto px-6 z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.5em] text-[#C69234] mb-4"
          >
            {showNearbyMode ? (
              <>
                <Navigation size={12} className="animate-pulse" />
                <span>Based on your location</span>
              </>
            ) : (
              <>
                <Sparkles size={12} />
                <span>Best of India</span>
              </>
            )}
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[8vw] md:text-[5vw] text-white leading-none font-bold"
            style={{ letterSpacing: '-0.03em' }}
          >
            {showNearbyMode ? 'EXPLORE NEARBY' : 'BEST PLACES IN INDIA'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[#A3C2B2] text-xs mt-3 flex items-center justify-center gap-1.5"
          >
            {showNearbyMode ? (
              <>
                <MapPin size={12} className="text-[#C69234]" />
                Showing handpicked cities and places near you
              </>
            ) : (
              <>
                <Compass size={12} className="text-[#C69234]" />
                Location access unavailable. Displaying India&apos;s iconic treasures and destinations.
              </>
            )}
          </motion.p>
        </div>

        {/* Loading Indicator */}
        {loading && !showNearbyMode && featuredCities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={32} className="text-[#C69234] animate-spin" />
            <p className="text-[#A3C2B2] text-sm">Discovering destinations...</p>
          </div>
        )}

        {/* Main Content Area */}
        {(!loading || featuredCities.length > 0) && (
          <>
            {/* Tab Switcher */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex p-1 bg-[#143028] backdrop-blur-xl border border-[#2C5E3B]/60 rounded-full shadow-inner">
                <button
                  onClick={() => setActiveTab('cities')}
                  className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    activeTab === 'cities'
                      ? 'bg-[#C69234] text-[#0B1914] font-black shadow-md shadow-[#C69234]/20'
                      : 'text-[#A3C2B2] hover:text-white'
                  }`}
                >
                  {showNearbyMode ? 'Nearby Cities' : 'Featured Cities'}
                </button>
                <button
                  onClick={() => setActiveTab('places')}
                  className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    activeTab === 'places'
                      ? 'bg-[#C69234] text-[#0B1914] font-black shadow-md shadow-[#C69234]/20'
                      : 'text-[#A3C2B2] hover:text-white'
                  }`}
                >
                  {showNearbyMode ? 'Nearby Attractions' : 'Top Attractions'}
                </button>
              </div>
            </div>

            {/* Horizontal Scroll Swiper Carousel */}
            <div className="relative group/scroll px-2">
              {/* Left arrow button */}
              <button
                onClick={() => handleScroll('left')}
                className="absolute -left-2 md:-left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#143028] backdrop-blur-md border border-[#2C5E3B] items-center justify-center text-white shadow-xl opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 z-20 hover:scale-105 hover:bg-[#1B432C] active:scale-95 hidden md:flex"
              >
                <ChevronLeft size={20} className="text-[#C69234]" />
              </button>

              {/* Scroll Container */}
              <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {listToUse.map((item, idx) => {
                  const title = item.name;
                  const subtitle = isCitiesTab 
                    ? (item as City).distance_km 
                      ? `${Math.round((item as City).distance_km!)} km away` 
                      : (item as City).state_name
                    : (item as Place).distance_km 
                      ? `${Math.round((item as Place).distance_km!)} km away` 
                      : (item as Place).city_name;
                  const imgUrl = item.cover_image || `https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80`;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.04, duration: 0.5 }}
                      className="flex-shrink-0 w-[260px] md:w-[320px] aspect-[3/4] rounded-3xl overflow-hidden relative snap-start cursor-pointer group shadow-xl hover:shadow-2xl border border-[#2C5E3B]/60 transition-all duration-300 bg-[#143028]"
                      onClick={() => handleItemClick(item.id)}
                    >
                      {/* Image tag - safe from WebGL CORS limits */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          // Image load fallback
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600';
                        }}
                      />

                      {/* Glassmorphic Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1914]/95 via-[#0B1914]/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300 z-10" />

                      {/* Card Content */}
                      <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end text-white z-20">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#C69234] mb-1.5 flex items-center gap-1">
                          <Sparkles size={10} />
                          {isCitiesTab ? 'Destination' : 'Attraction'}
                        </span>
                        <h3 className="font-display text-lg md:text-xl font-bold leading-tight line-clamp-2 drop-shadow">
                          {title}
                        </h3>
                        <p className="text-[#A3C2B2] text-[11px] mt-2 flex items-center gap-1.5 font-medium">
                          <MapPin size={11} className="text-[#C69234] flex-shrink-0" />
                          <span className="line-clamp-1">{subtitle}</span>
                        </p>
                      </div>

                      {/* Hover Border Glow */}
                      <div className="absolute inset-0 border border-transparent group-hover:border-[#C69234]/60 rounded-3xl transition-colors duration-300 z-30" />
                    </motion.div>
                  );
                })}
              </div>

              {/* Right arrow button */}
              <button
                onClick={() => handleScroll('right')}
                className="absolute -right-2 md:-right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#143028] backdrop-blur-md border border-[#2C5E3B] items-center justify-center text-white shadow-xl opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 z-20 hover:scale-105 hover:bg-[#1B432C] active:scale-95 hidden md:flex"
              >
                <ChevronRight size={20} className="text-[#C69234]" />
              </button>
            </div>

            {/* Quick List Section below Slider */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-5 border-b border-[#2C5E3B]/40 pb-2">
                <h3 className="font-semibold text-md text-white tracking-tight">
                  {isCitiesTab ? 'Trending Destinations' : 'Must-Visit Places'}
                </h3>
                <span className="text-[10px] text-[#A3C2B2] font-bold uppercase tracking-wider">Top selections</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {isCitiesTab ? (
                  citiesList.slice(0, 4).map((city, i) => (
                    <motion.button
                      key={city.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => router.push(`/city/${city.id}`)}
                      className="border border-[#2C5E3B]/60 bg-[#143028]/80 rounded-2xl p-4 text-left hover:border-[#C69234] hover:bg-[#1B432C] transition-all duration-300 card-hover group"
                    >
                      <div
                        className="w-full h-28 rounded-xl bg-cover bg-center mb-3 overflow-hidden shadow-sm"
                        style={{ backgroundImage: `url(${city.cover_image || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400'})` }}
                      />
                      <p className="text-white text-xs font-bold group-hover:text-[#C69234] transition-colors line-clamp-1">
                        {city.name}
                      </p>
                      <p className="text-[#A3C2B2] text-[10px] mt-1 flex items-center gap-1 font-semibold">
                        {city.distance_km ? (
                          <>
                            <Navigation size={9} className="text-[#C69234]" />
                            <span>{Math.round(city.distance_km)} km away</span>
                          </>
                        ) : (
                          <span>{city.state_name}</span>
                        )}
                      </p>
                    </motion.button>
                  ))
                ) : (
                  placesList.slice(0, 4).map((place, i) => (
                    <motion.button
                      key={place.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => router.push(`/place/${place.id}`)}
                      className="border border-[#2C5E3B]/60 bg-[#143028]/80 rounded-2xl p-4 text-left hover:border-[#C69234] hover:bg-[#1B432C] transition-all duration-300 card-hover group"
                    >
                      <div
                        className="w-full h-28 rounded-xl bg-cover bg-center mb-3 overflow-hidden shadow-sm"
                        style={{ backgroundImage: `url(${place.cover_image || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400'})` }}
                      />
                      <p className="text-white text-xs font-bold group-hover:text-[#C69234] transition-colors line-clamp-1">
                        {place.name}
                      </p>
                      <p className="text-[#A3C2B2] text-[10px] mt-1 flex items-center gap-1 font-semibold">
                        {place.distance_km ? (
                          <>
                            <Navigation size={9} className="text-[#C69234]" />
                            <span>{Math.round(place.distance_km)} km away</span>
                          </>
                        ) : (
                          <span>{place.city_name}</span>
                        )}
                      </p>
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
