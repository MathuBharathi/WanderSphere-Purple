'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Navigation, Sparkles, Clock, Compass, DollarSign, SlidersHorizontal, Loader2, Eye, ArrowRight } from 'lucide-react';
import { getStates, getCitiesByState, getNearbyCities, createItinerary } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { generateItinerary } from '@/lib/itineraryEngine';
import { useAppStore } from '@/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { State, City, TravelStyle, BudgetLevel, SavedItinerary } from '@/types';

export function SearchSection() {
  const router = useRouter();
  const { 
    userLocation, 
    user,
    setSelectedState, 
    setSelectedCity,
    setGeneratedItinerary,
    setItineraryConfig,
    setCurrentItineraryId,
    generatedItinerary
  } = useAppStore();

  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [selState, setSelState] = useState<State | null>(null);
  const [selCity, setSelCity] = useState<City | null>(null);

  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [openDropdown, setOpenDropdown] = useState<'state' | 'city' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Itinerary generation preferences
  const [showPreferences, setShowPreferences] = useState(false);
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState<BudgetLevel>('moderate');
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('adventure');

  useEffect(() => {
    getStates().then((data) => {
      setStates(data);
      setLoadingStates(false);
    });
  }, []);

  useEffect(() => {
    if (!selState) return;
    setLoadingCities(true);
    setCities([]);
    setSelCity(null);
    getCitiesByState(selState.id).then((data) => {
      setCities(data);
      setLoadingCities(false);
    });
  }, [selState]);

  const handleExplore = () => {
    if (!selCity) return;
    setSelectedState(selState);
    setSelectedCity(selCity);
    router.push(`/city/${selCity.id}`);
  };

  const handleGenerate = () => {
    if (!selCity || !selState) return;
    
    // Auth gate: user must be logged in to generate an itinerary
    if (!user) {
      toast.error('Please sign in to create an itinerary', { icon: '🔒' });
      router.push('/auth');
      return;
    }
    
    setGenerating(true);
    
    setTimeout(async () => {
      try {
        const config = {
          stateId: selState.id,
          stateName: selState.name,
          cityId: selCity.id,
          cityName: selCity.name,
          days,
          budget,
          travelStyle
        };
        const itinerary = generateItinerary(config);
        
        // Save to store
        setItineraryConfig(config);
        setGeneratedItinerary(itinerary);
        
        // Auto-save to user's account
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const payload: Partial<SavedItinerary> = {
              user_id: authUser.id,
              title: `Trip to ${config.cityName}`,
              config: config,
              itinerary_data: itinerary,
              is_public: false
            };
            const saved = await createItinerary(payload);
            setCurrentItineraryId(saved.id);
            toast.success('Itinerary created & saved!');
          }
        } catch (saveErr) {
          console.warn('Auto-save failed, itinerary still available:', saveErr);
          setCurrentItineraryId(null);
        }
        
        // Route to itinerary page
        router.push('/itinerary');
      } catch (e) {
        console.error('Itinerary generation failed', e);
        toast.error('Failed to generate itinerary. Please try again.');
      } finally {
        setGenerating(false);
      }
    }, 1200); // 1.2s realistic premium generation loader
  };

  const handleNearMe = async () => {
    if (!userLocation) {
      alert('Please allow location access in your browser settings.');
      return;
    }
    const nearby = await getNearbyCities(userLocation.lat, userLocation.lng, 150);
    if (nearby.length > 0) {
      router.push(`/city/${nearby[0].id}`);
    } else {
      alert('No cities found within 150km of your location.');
    }
  };

  const filtered = (arr: any[], key = 'name') =>
    searchQuery ? arr.filter((i) => i[key]?.toLowerCase().includes(searchQuery.toLowerCase())) : arr;

  const Dropdown = ({
    label, value, items, loading, onSelect, dropdownKey, disabled
  }: any) => (
    <div className="relative flex-1 min-w-[200px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpenDropdown(openDropdown === dropdownKey ? null : dropdownKey);
          setSearchQuery('');
        }}
        style={{
          backgroundColor: 'var(--ws-surface-elevated)',
          borderColor: openDropdown === dropdownKey ? 'var(--ws-primary)' : 'var(--ws-border)',
        }}
        className={`w-full flex items-center justify-between gap-3 px-6 py-5 rounded-2xl border backdrop-blur-md transition-all duration-300 text-left ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-[var(--ws-primary)] cursor-pointer'
        }`}
      >
        <div>
          <p className="text-[9px] uppercase tracking-widest font-bold mb-0.5" style={{ color: 'var(--ws-primary)' }}>{label}</p>
          <p className="text-sm font-semibold" style={{ color: value ? 'var(--ws-text)' : 'var(--ws-text-muted)' }}>
            {loading ? <Loader2 size={14} style={{ color: 'var(--ws-primary)' }} className="animate-spin" /> : (value || `Select ${label}`)}
          </p>
        </div>
        <ChevronDown
          size={14}
          style={{ color: openDropdown === dropdownKey ? 'var(--ws-primary)' : 'var(--ws-text-muted)' }}
          className={`flex-shrink-0 transition-transform ${openDropdown === dropdownKey ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {openDropdown === dropdownKey && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              backgroundColor: 'var(--ws-surface)',
              borderColor: 'var(--ws-border)',
              boxShadow: 'var(--ws-shadow)',
            }}
            className="absolute top-full mt-2 left-0 right-0 border rounded-2xl overflow-hidden z-50 max-h-64 flex flex-col shadow-2xl backdrop-blur-xl"
          >
            <div className="p-2 border-b" style={{ borderColor: 'var(--ws-border)' }}>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                style={{
                  backgroundColor: 'var(--ws-surface-elevated)',
                  color: 'var(--ws-text)',
                  borderColor: 'var(--ws-border)',
                }}
                className="w-full text-sm px-3 py-2 rounded-xl outline-none placeholder:text-[var(--ws-text-muted)] border"
              />
            </div>
            <div className="overflow-y-auto py-1">
              {filtered(items).length === 0 ? (
                <p className="text-center text-xs py-4" style={{ color: 'var(--ws-text-muted)' }}>No results found</p>
              ) : (
                filtered(items).map((item: any) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { onSelect(item); setOpenDropdown(null); setSearchQuery(''); }}
                    style={{ color: 'var(--ws-text)' }}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--ws-surface-elevated)] transition-colors text-sm"
                  >
                    <span>{item.name}</span>
                    {item.code && <span className="text-[10px] opacity-60 uppercase font-semibold">{item.code}</span>}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <section id="explore" className="relative py-24 px-6 max-w-6xl mx-auto z-10">
      {/* Section title */}
      <div className="text-center mb-16">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ color: 'var(--ws-primary)' }}
          className="text-[10px] font-bold uppercase tracking-[0.5em] mb-4"
        >
          ✦ Discover India ✦
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ color: 'var(--ws-text)' }}
          className="font-extrabold text-[12vw] md:text-[6vw] leading-none tracking-tighter"
        >
          PLAN YOUR TOUR
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          style={{ color: 'var(--ws-text-muted)' }}
          className="text-sm mt-4 max-w-md mx-auto"
        >
          Select an Indian state and city to explore hidden gems, or let AI generate a customized itinerary for you.
        </motion.p>
      </div>

      {/* Main search bar card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          backgroundColor: 'var(--ws-surface-translucent)',
          borderColor: 'var(--ws-border)',
          boxShadow: 'var(--ws-shadow)',
        }}
        className="max-w-4xl mx-auto border rounded-3xl p-5 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <Dropdown
              label="Indian State"
              value={selState?.name}
              items={states}
              loading={loadingStates}
              dropdownKey="state"
              onSelect={(s: State) => setSelState(s)}
            />
            <Dropdown
              label="City / District"
              value={selCity?.name}
              items={cities}
              loading={loadingCities}
              dropdownKey="city"
              disabled={!selState}
              onSelect={(c: City) => setSelCity(c)}
            />
          </div>

          <div className="flex gap-2.5 shrink-0">
            {/* Preferences trigger */}
            <button
              type="button"
              onClick={() => setShowPreferences(!showPreferences)}
              disabled={!selCity}
              style={{
                backgroundColor: showPreferences ? 'var(--ws-primary)' : 'var(--ws-surface-elevated)',
                borderColor: showPreferences ? 'var(--ws-primary)' : 'var(--ws-border)',
                color: showPreferences ? '#FFFFFF' : 'var(--ws-primary)',
              }}
              className="flex items-center justify-center p-5 rounded-2xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              title="Itinerary Options"
            >
              <SlidersHorizontal size={18} />
            </button>

            {/* Explore Button */}
            <button
              type="button"
              onClick={handleExplore}
              disabled={!selCity}
              style={{
                backgroundColor: 'var(--ws-surface-elevated)',
                borderColor: 'var(--ws-border)',
                color: 'var(--ws-text)',
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-5 rounded-2xl border font-bold uppercase tracking-widest text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--ws-primary)] transition-all shadow-sm"
            >
              <Search size={14} style={{ color: 'var(--ws-primary)' }} />
              <span>Explore</span>
            </button>

            {/* Generate Button */}
            <button
              type="button"
              onClick={() => {
                if (!showPreferences) {
                  setShowPreferences(true);
                } else {
                  handleGenerate();
                }
              }}
              disabled={!selCity || generating}
              className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-8 py-5 rounded-2xl bg-[#C69234] text-[#0B1914] font-black uppercase tracking-widest text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#b07f2a] transition-all shadow-md shadow-[#C69234]/20"
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-[#0B1914]" />
                  <span>AI Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Preferences Panel */}
        <AnimatePresence>
          {showPreferences && selCity && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-[#2C5E3B]/40 mt-4 pt-4 space-y-4 text-white"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Days Selector */}
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
                    <span className="font-extrabold text-sm text-white bg-[#1B432C] border border-[#2C5E3B] px-3 py-1.5 rounded-xl min-w-[60px] text-center">
                      {days} {days === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>
                </div>

                {/* Budget Selector */}
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

                {/* Travel Style Selector */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#C69234] mb-2">
                    <Compass size={12} />
                    Travel Style
                  </label>
                  <div className="relative">
                    <select
                      value={travelStyle}
                      onChange={(e) => setTravelStyle(e.target.value as TravelStyle)}
                      className="w-full bg-[#1B432C] border border-[#2C5E3B] rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider outline-none text-white accent-[#C69234] cursor-pointer"
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
                </div>
              </div>

              {/* Start Generating & View Itinerary buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {generatedItinerary && (
                  <button
                    type="button"
                    onClick={() => router.push('/itinerary')}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1B432C] border border-[#C69234] text-[#C69234] text-xs font-extrabold uppercase tracking-wider hover:bg-[#C69234] hover:text-[#0B1914] transition-all shadow-md"
                  >
                    <Eye size={14} />
                    <span>View Itinerary</span>
                    <ArrowRight size={14} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C69234] text-[#0B1914] text-xs font-black uppercase tracking-widest hover:bg-[#b07f2a] transition-all shadow-md shadow-[#C69234]/20"
                >
                  {generating ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Creating itinerary...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} className="text-[#0B1914] animate-pulse" />
                      <span>Generate My {days}-Day Plan</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Near me button */}
      <div className="flex justify-center mt-6">
        <button
          type="button"
          onClick={handleNearMe}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#2C5E3B] bg-[#143028] text-[#A3C2B2] hover:text-white hover:border-[#C69234] transition-all text-xs font-bold uppercase tracking-widest shadow-md"
        >
          <Navigation size={12} className="text-[#C69234]" />
          <span>Use My Location</span>
        </button>
      </div>
    </section>
  );
}
