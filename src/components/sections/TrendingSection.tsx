'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { getTrendingCities, getFeaturedCities } from '@/lib/api';
import { useRouter } from 'next/navigation';
import type { City } from '@/types';

export function TrendingSection() {
  const [trending, setTrending] = useState<City[]>([]);
  const [featured, setFeatured] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([getTrendingCities(), getFeaturedCities()]).then(([t, f]) => {
      setTrending(t);
      setFeatured(f);
      setLoading(false);
    });
  }, []);

  const cities = [...trending, ...featured].filter(
    (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
  ).slice(0, 8);

  const tagColors: Record<string, string> = {
    beach: 'bg-blue-500/20 text-blue-300',
    history: 'bg-amber-500/20 text-amber-300',
    food: 'bg-orange-500/20 text-orange-300',
    nature: 'bg-green-500/20 text-green-300',
    adventure: 'bg-red-500/20 text-red-300',
    culture: 'bg-purple-500/20 text-purple-300',
  };

  return (
    <section id="trending" className="relative py-24 px-6 bg-[#0B1914]">
      {/* Organic section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1914] via-[#143028]/30 to-[#0B1914] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#C69234] mb-4"
            >
              ✦ Hot right now ✦
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[10vw] md:text-[6vw] text-white leading-none"
              style={{ letterSpacing: '-0.03em' }}
            >
              TRENDING
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 text-[#A3C2B2] text-xs uppercase tracking-widest"
          >
            <TrendingUp size={14} className="text-[#C69234]" />
            <span>Most visited destinations this season</span>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-[#C69234] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cities.map((city, i) => (
              <motion.div
                key={city.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => router.push(`/city/${city.id}`)}
                className="group relative cursor-pointer rounded-4xl overflow-hidden card-hover border border-[#2C5E3B]/50 bg-[#143028]"
                style={{ height: i % 3 === 0 ? 400 : 300 }}
              >
                {/* Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${city.cover_image || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600'})`,
                  }}
                />

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1914]/90 via-[#0B1914]/30 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                  {/* Tags */}
                  {city.tags && city.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {city.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${tagColors[tag] || 'bg-[#1B432C] text-[#C69234] border border-[#2C5E3B]/60'}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="font-display text-2xl text-white group-hover:text-[#C69234] transition-colors">
                    {city.name}
                  </h3>
                  <p className="text-[#A3C2B2] text-xs mt-1">{city.state_name}</p>

                  {/* Arrow reveal */}
                  <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span className="text-[#C69234] text-xs font-bold uppercase tracking-widest">Explore</span>
                    <ArrowRight size={12} className="text-[#C69234]" />
                  </div>
                </div>

                {/* Visit count badge */}
                {city.visit_count && city.visit_count > 0 && (
                  <div className="absolute top-4 right-4 glass border border-[#2C5E3B]/60 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[#C69234] z-10">
                    {city.visit_count.toLocaleString()} visits
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
