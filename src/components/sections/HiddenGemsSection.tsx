'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Star } from 'lucide-react';
import { getHiddenGems } from '@/lib/api';
import { getPlaceImageUrl } from '@/lib/placeImages';
import { useRouter } from 'next/navigation';
import type { Place } from '@/types';

export function HiddenGemsSection() {
  const [gems, setGems] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getHiddenGems().then((data) => { setGems(data); setLoading(false); });
  }, []);

  return (
    <section id="gems" className="relative py-24 px-6 overflow-hidden transition-colors duration-500">
      {/* Background tint overlay */}
      <div
        className="absolute inset-0 rounded-t-[5rem] pointer-events-none"
        style={{ background: 'linear-gradient(180deg, var(--ws-surface-translucent) 0%, transparent 100%)' }}
      />

      <div className="relative max-w-7xl mx-auto z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ color: 'var(--ws-accent)' }}
            className="text-[10px] font-extrabold uppercase tracking-[0.5em] mb-4"
          >
            ✦ Off the beaten path ✦
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ color: 'var(--ws-text)' }}
            className="font-display text-[10vw] md:text-[6vw] leading-none"
          >
            HIDDEN GEMS
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            style={{ color: 'var(--ws-text-secondary)' }}
            className="text-sm mt-4 max-w-md mx-auto"
          >
            Curated secret spots that most travelers miss. Discover the extraordinary.
          </motion.p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} style={{ color: 'var(--ws-accent)' }} className="animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {gems.map((place, i) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => router.push(`/city/${place.city_id}?place=${place.id}`)}
                className="group cursor-pointer rounded-2xl sm:rounded-3xl md:rounded-4xl overflow-hidden ws-glass hover:border-[var(--ws-accent)] transition-all duration-300 card-hover"
              >
                {/* Image */}
                <div className="relative h-36 sm:h-44 md:h-56 overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${getPlaceImageUrl(place.name, place.category, place.cover_image)})`,
                    }}
                  />
                  <div 
                    style={{
                      background: 'linear-gradient(to top, #020B18 0%, transparent 100%)',
                    }}
                    className="absolute inset-0" 
                  />

                  {/* Hidden gem badge */}
                  <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center gap-1 sm:gap-1.5 ws-glass-soft rounded-full px-2 py-0.5 sm:px-3 sm:py-1 shadow-sm">
                    <Sparkles size={8} className="sm:w-2.5 sm:h-2.5" style={{ color: 'var(--ws-accent)' }} />
                    <span className="text-[7px] sm:text-[9px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>Hidden Gem</span>
                  </div>

                  {/* Rating */}
                  {place.avg_rating && (
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-0.5 sm:gap-1 ws-glass-soft rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-sm">
                      <Star size={8} className="sm:w-2.5 sm:h-2.5" style={{ color: 'var(--ws-accent)', fill: 'var(--ws-accent)' }} />
                      <span className="text-[8px] sm:text-[10px] font-extrabold" style={{ color: '#FFFFFF' }}>{place.avg_rating}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 sm:p-4 md:p-5">
                  <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
                    {place.category.replace('_', ' ')}
                  </span>
                  <h3 className="font-display text-sm sm:text-lg md:text-xl mt-0.5 sm:mt-1 group-hover:text-[var(--ws-accent)] transition-colors truncate" style={{ color: 'var(--ws-text)' }}>
                    {place.name}
                  </h3>
                  <p className="text-xs mt-2 leading-relaxed line-clamp-2" style={{ color: 'var(--ws-text-secondary)' }}>{place.description}</p>

                  {/* Meta row */}
                  <div className="flex items-center gap-4 mt-4 text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--ws-text-secondary)' }}>
                    {place.entry_fee !== undefined && (
                      <span>{place.entry_fee === 0 ? 'Free Entry' : `₹${place.entry_fee}`}</span>
                    )}
                    {place.best_time_to_visit && (
                      <span>{place.best_time_to_visit}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button className="px-8 py-4 rounded-full text-xs ws-ocean-btn-secondary">
            View All Hidden Gems
          </button>
        </motion.div>
      </div>
    </section>
  );
}
