'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, Compass, Sparkles, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store';
import { getNearbyCities, getNearbyPlaces, getFeaturedCities, getFeaturedPlaces } from '@/lib/api';
import { getCityImageUrl, getPlaceImageUrl } from '@/lib/placeImages';
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
    <section id="nearby" className="relative py-24 overflow-hidden transition-colors duration-500">
      {/* Ocean atmosphere tint */}
      <div 
        style={{
          background: 'linear-gradient(180deg, rgba(25, 167, 224, 0.06) 0%, transparent 100%)',
        }}
        className="absolute inset-0 z-0 pointer-events-none" 
      />

      <div className="relative max-w-7xl mx-auto px-6 z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ color: 'var(--ws-accent)' }}
            className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.5em] mb-4"
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
            style={{ color: 'var(--ws-text)' }}
            className="font-display text-[8vw] md:text-[5vw] leading-none font-bold"
          >
            {showNearbyMode ? 'EXPLORE NEARBY' : 'BEST PLACES IN INDIA'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ color: 'var(--ws-text-secondary)' }}
            className="text-xs mt-3 flex items-center justify-center gap-1.5"
          >
            {showNearbyMode ? (
              <>
                <MapPin size={12} style={{ color: 'var(--ws-accent)' }} />
                Showing handpicked cities and places near you
              </>
            ) : (
              <>
                <Compass size={12} style={{ color: 'var(--ws-accent)' }} />
                Location access unavailable. Displaying India&apos;s iconic treasures and destinations.
              </>
            )}
          </motion.p>
        </div>

        {/* Loading Indicator */}
        {loading && !showNearbyMode && featuredCities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={32} style={{ color: 'var(--ws-accent)' }} className="animate-spin" />
            <p className="text-sm" style={{ color: 'var(--ws-text-secondary)' }}>Discovering destinations...</p>
          </div>
        )}

        {/* Main Content Area */}
        {(!loading || featuredCities.length > 0) && (
          <>
            {/* Tab Switcher */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex p-1 ws-glass-strong rounded-full shadow-inner">
                <button
                  onClick={() => setActiveTab('cities')}
                  style={{
                    background: activeTab === 'cities' ? 'linear-gradient(135deg, var(--ws-ocean), var(--ws-accent))' : 'transparent',
                    color: activeTab === 'cities' ? '#FFFFFF' : 'var(--ws-text-secondary)',
                  }}
                  className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm"
                >
                  {showNearbyMode ? 'Nearby Cities' : 'Featured Cities'}
                </button>
                <button
                  onClick={() => setActiveTab('places')}
                  style={{
                    background: activeTab === 'places' ? 'linear-gradient(135deg, var(--ws-ocean), var(--ws-accent))' : 'transparent',
                    color: activeTab === 'places' ? '#FFFFFF' : 'var(--ws-text-secondary)',
                  }}
                  className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm"
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
                className="absolute -left-2 md:-left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full ws-glass-strong items-center justify-center text-white shadow-xl opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 z-20 hover:scale-105 active:scale-95 hidden md:flex"
              >
                <ChevronLeft size={20} style={{ color: 'var(--ws-accent)' }} />
              </button>

              {/* Scroll Container */}
              <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto snap-x snap-proximity scroll-smooth pb-6 no-scrollbar"
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
                  const imgUrl = isCitiesTab
                    ? getCityImageUrl(item.name, item.cover_image)
                    : getPlaceImageUrl(item.name, (item as Place).category, item.cover_image);

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.03, duration: 0.4 }}
                      className="flex-shrink-0 w-[260px] md:w-[320px] aspect-[3/4] rounded-3xl overflow-hidden relative snap-start cursor-pointer group ws-glass transition-all duration-300 hover:scale-[1.015] hover:border-[var(--ws-accent)] shadow-lg"
                      onClick={() => handleItemClick(item.id)}
                    >
                      {/* Image tag */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600';
                        }}
                      />

                      {/* Glassmorphic Gradient Overlay over image */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#021423]/90 via-[#021423]/30 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300 z-10" />

                      {/* Card Content */}
                      <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end text-white z-20">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--ws-accent)] mb-1.5 flex items-center gap-1">
                          <Sparkles size={10} />
                          {isCitiesTab ? 'Destination' : 'Attraction'}
                        </span>
                        <h3 className="font-display text-lg md:text-xl font-bold leading-tight line-clamp-2 drop-shadow">
                          {title}
                        </h3>
                        <p className="text-[#A9DFF4] text-[11px] mt-2 flex items-center gap-1.5 font-medium">
                          <MapPin size={11} className="text-[var(--ws-accent)] flex-shrink-0" />
                          <span className="line-clamp-1">{subtitle}</span>
                        </p>
                      </div>

                      {/* Hover Border Glow */}
                      <div className="absolute inset-0 border border-transparent group-hover:border-[var(--ws-accent)] rounded-3xl transition-colors duration-300 z-30" />
                    </motion.div>
                  );
                })}
              </div>

              {/* Right arrow button */}
              <button
                onClick={() => handleScroll('right')}
                className="absolute -right-2 md:-right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full ws-glass-strong items-center justify-center text-white shadow-xl opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 z-20 hover:scale-105 active:scale-95 hidden md:flex"
              >
                <ChevronRight size={20} style={{ color: 'var(--ws-accent)' }} />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
