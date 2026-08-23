'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Star } from 'lucide-react';
import { getHiddenGems } from '@/lib/api';
import { getPlaceImageUrl } from '@/lib/placeImages';
import { useRouter } from 'next/navigation';
import { Card3DTilt } from '@/components/ui/Card3DTilt';
import type { Place } from '@/types';

export function HiddenGemsSection() {
  const [gems, setGems] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getHiddenGems().then((data) => { setGems(data); setLoading(false); });
  }, []);

  return (
    <section id="gems" className="relative py-24 px-6 overflow-hidden bg-[#0B1914]">
      {/* Earthy tinted bg */}
      <div
        className="absolute inset-0 rounded-t-[5rem]"
        style={{ background: 'linear-gradient(180deg, #143028 0%, #0B1914 100%)' }}
      />

      <div className="relative max-w-7xl mx-auto z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#C69234] mb-4"
          >
            ✦ Off the beaten path ✦
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[10vw] md:text-[6vw] leading-none text-white"
            style={{ letterSpacing: '-0.03em' }}
          >
            HIDDEN GEMS
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-[#A3C2B2] text-sm mt-4 max-w-md mx-auto"
          >
            Curated secret spots that most travelers miss. Discover the extraordinary.
          </motion.p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-[#C69234] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {gems.map((place, i) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card3DTilt className="group cursor-pointer bg-[#143028] border border-[#2C5E3B]/60 overflow-hidden hover:border-[#C69234] transition-all duration-300">
                  <div
                    onClick={() => router.push(`/city/${place.city_id}?place=${place.id}`)}
                    className="w-full"
                  >
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden">
                      <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{
                          backgroundImage: `url(${getPlaceImageUrl(place.name, place.category, place.cover_image)})`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1914] to-transparent" />

                      {/* Hidden gem badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-[#1B432C]/90 border border-[#2C5E3B] rounded-full px-3 py-1 backdrop-blur-md">
                        <Sparkles size={10} className="text-[#C69234]" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#C69234]">Hidden Gem</span>
                      </div>

                      {/* Rating */}
                      {place.avg_rating && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 bg-[#0B1914]/80 border border-[#2C5E3B] rounded-full px-2.5 py-1 backdrop-blur-md">
                          <Star size={10} className="text-[#C69234] fill-[#C69234]" />
                          <span className="text-[10px] text-white font-bold">{place.avg_rating}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#A65D29]">
                        {place.category.replace('_', ' ')}
                      </span>
                      <h3 className="font-display text-xl text-white mt-1 group-hover:text-[#C69234] transition-colors">
                        {place.name}
                      </h3>
                      <p className="text-[#A3C2B2] text-xs mt-2 leading-relaxed line-clamp-2">{place.description}</p>

                      {/* Meta row */}
                      <div className="flex items-center gap-4 mt-4 text-[10px] text-[#A3C2B2]/70 uppercase tracking-widest font-semibold">
                        {place.entry_fee !== undefined && (
                          <span>{place.entry_fee === 0 ? 'Free Entry' : `₹${place.entry_fee}`}</span>
                        )}
                        {place.best_time_to_visit && (
                          <span>{place.best_time_to_visit}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card3DTilt>
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
          <a
            href="#explore"
            className="magnetic-btn inline-block px-8 py-4 rounded-full bg-[#143028] border border-[#2C5E3B] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#1B432C] hover:border-[#C69234] transition-all duration-300 shadow-lg"
          >
            Explore All Destinations
          </a>
        </motion.div>
      </div>
    </section>
  );
}
