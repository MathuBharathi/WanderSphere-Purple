'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Sparkles, ArrowRight, Loader2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { City, Place } from '@/types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setCities([]);
      setPlaces([]);
      setSelectedIndex(-1);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Parent should handle open via store
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Search with debounce
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setCities([]);
      setPlaces([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCities(data.cities || []);
      setPlaces(data.places || []);
    } catch {
      setCities([]);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const allResults = [
    ...cities.map((c) => ({ type: 'city' as const, item: c })),
    ...places.map((p) => ({ type: 'place' as const, item: p })),
  ];

  const handleSelect = (result: typeof allResults[0]) => {
    if (result.type === 'city') {
      router.push(`/city/${result.item.id}`);
    } else {
      const place = result.item as Place;
      router.push(`/city/${place.city_id}?place=${place.id}`);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      handleSelect(allResults[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ backgroundColor: 'rgba(5, 11, 24, 0.75)' }}
          className="fixed inset-0 backdrop-blur-2xl z-[200] flex items-start justify-center pt-[15vh]"
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl mx-4"
          >
            {/* Search Input */}
            <div 
              style={{
                backgroundColor: 'var(--ws-surface)',
                borderColor: 'var(--ws-border)',
                boxShadow: 'var(--ws-shadow)',
              }}
              className="border rounded-3xl overflow-hidden shadow-2xl transition-colors duration-500"
            >
              <div 
                style={{ borderColor: 'var(--ws-border)' }}
                className="flex items-center gap-3 px-6 py-5 border-b"
              >
                <Search size={20} style={{ color: 'var(--ws-primary)' }} className="flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search cities, places, attractions..."
                  style={{ color: 'var(--ws-text)' }}
                  className="flex-1 bg-transparent text-lg placeholder:text-[var(--ws-text-muted)] focus:outline-none font-medium"
                />
                {loading && <Loader2 size={18} style={{ color: 'var(--ws-primary)' }} className="animate-spin" />}
                <button
                  onClick={onClose}
                  style={{ color: 'var(--ws-text-muted)' }}
                  className="hover:text-[var(--ws-text)] transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Results */}
              {allResults.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto py-2">
                  {cities.length > 0 && (
                    <>
                      <p style={{ color: 'var(--ws-primary)' }} className="px-6 py-2 text-[9px] font-bold uppercase tracking-[0.5em]">
                        Cities
                      </p>
                      {cities.map((city, i) => {
                        const idx = i;
                        return (
                          <button
                            key={city.id}
                            onClick={() => handleSelect({ type: 'city', item: city })}
                            style={{
                              backgroundColor: selectedIndex === idx ? 'var(--ws-surface-elevated)' : 'transparent',
                              color: 'var(--ws-text)',
                            }}
                            className="w-full flex items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-[var(--ws-surface-elevated)]"
                          >
                            <div 
                              style={{
                                backgroundColor: 'var(--ws-surface-elevated)',
                                borderColor: 'var(--ws-border)',
                              }}
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
                            >
                              <MapPin size={16} style={{ color: 'var(--ws-primary)' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate" style={{ color: 'var(--ws-text)' }}>{city.name}</p>
                              <p className="text-xs truncate" style={{ color: 'var(--ws-text-muted)' }}>
                                {city.state_name}
                              </p>
                            </div>
                            {city.tags && city.tags.length > 0 && (
                              <div className="hidden md:flex gap-1 flex-shrink-0">
                                {city.tags.slice(0, 2).map((tag) => (
                                  <span 
                                    key={tag} 
                                    style={{
                                      backgroundColor: 'var(--ws-surface-elevated)',
                                      color: 'var(--ws-text-muted)',
                                      borderColor: 'var(--ws-border)',
                                    }}
                                    className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <ArrowRight size={14} style={{ color: 'var(--ws-text-muted)' }} className="flex-shrink-0" />
                          </button>
                        );
                      })}
                    </>
                  )}

                  {places.length > 0 && (
                    <>
                      <p style={{ color: 'var(--ws-primary)' }} className="px-6 py-2 text-[9px] font-bold uppercase tracking-[0.5em] mt-2">
                        Places
                      </p>
                      {places.map((place, i) => {
                        const idx = cities.length + i;
                        return (
                          <button
                            key={place.id}
                            onClick={() => handleSelect({ type: 'place', item: place })}
                            style={{
                              backgroundColor: selectedIndex === idx ? 'var(--ws-surface-elevated)' : 'transparent',
                              color: 'var(--ws-text)',
                            }}
                            className="w-full flex items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-[var(--ws-surface-elevated)]"
                          >
                            {place.cover_image ? (
                              <div
                                className="w-10 h-10 rounded-xl bg-cover bg-center flex-shrink-0"
                                style={{ backgroundImage: `url(${place.cover_image})` }}
                              />
                            ) : (
                              <div 
                                style={{
                                  backgroundColor: 'var(--ws-surface-elevated)',
                                  borderColor: 'var(--ws-border)',
                                }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
                              >
                                <Sparkles size={16} style={{ color: 'var(--ws-primary)' }} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate" style={{ color: 'var(--ws-text)' }}>{place.name}</p>
                              <p className="text-xs truncate" style={{ color: 'var(--ws-text-muted)' }}>
                                {place.city_name} · {place.category}
                              </p>
                            </div>
                            {place.avg_rating && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Star size={10} style={{ color: 'var(--ws-primary)', fill: 'var(--ws-primary)' }} />
                                <span className="text-xs font-bold" style={{ color: 'var(--ws-primary)' }}>{place.avg_rating}</span>
                              </div>
                            )}
                            <ArrowRight size={14} style={{ color: 'var(--ws-text-muted)' }} className="flex-shrink-0" />
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              )}

              {/* Empty state */}
              {query.length >= 2 && !loading && allResults.length === 0 && (
                <div className="py-12 text-center">
                  <Search size={32} style={{ color: 'var(--ws-text-muted)' }} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium" style={{ color: 'var(--ws-text)' }}>No results for &quot;{query}&quot;</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--ws-text-muted)' }}>Try different keywords</p>
                </div>
              )}

              {/* Hints */}
              {query.length < 2 && !loading && (
                <div className="py-8 text-center">
                  <p className="text-xs font-medium" style={{ color: 'var(--ws-text-muted)' }}>
                    Type at least 2 characters to search
                  </p>
                  <p className="text-[10px] mt-2 uppercase tracking-widest" style={{ color: 'var(--ws-text-muted)' }}>
                    ESC to close · ↑↓ to navigate · Enter to select
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
