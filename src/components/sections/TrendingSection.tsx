'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { getTrendingCities, getFeaturedCities } from '@/lib/api';
import { getCityImageUrl } from '@/lib/placeImages';
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
    beach: 'bg-blue-500/20 text-blue-400',
    history: 'bg-amber-500/20 text-amber-400',
    food: 'bg-orange-500/20 text-orange-400',
    nature: 'bg-emerald-500/20 text-emerald-400',
    adventure: 'bg-red-500/20 text-red-400',
    culture: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <section id="trending" className="relative py-24 px-6 transition-colors duration-500">
      {/* Background overlay */}
      <div 
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--ws-surface-translucent), transparent)',
        }}
        className="absolute inset-0 pointer-events-none" 
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              style={{ color: 'var(--ws-primary)' }}
              className="text-[10px] font-bold uppercase tracking-[0.5em] mb-4"
            >
              ✦ Hot right now ✦
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ color: 'var(--ws-text)' }}
              className="font-display text-[10vw] md:text-[6vw] leading-none"
            >
              TRENDING
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ color: 'var(--ws-text-muted)' }}
            className="flex items-center gap-2 text-xs uppercase tracking-widest"
          >
            <TrendingUp size={14} style={{ color: 'var(--ws-primary)' }} />
            <span>Most visited destinations this season</span>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} style={{ color: 'var(--ws-primary)' }} className="animate-spin" />
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
                style={{
                  backgroundColor: 'var(--ws-surface)',
                  borderColor: 'var(--ws-border)',
                  boxShadow: 'var(--ws-shadow)',
                  height: i % 3 === 0 ? 400 : 300,
                }}
                className="group relative cursor-pointer rounded-4xl overflow-hidden card-hover border"
              >
                {/* Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{
                    backgroundImage: `url(${getCityImageUrl(city.name, city.cover_image)})`,
                  }}
                />

                {/* Gradient */}
                <div 
                  style={{
                    background: 'linear-gradient(to top, var(--ws-bg) 0%, rgba(5,11,24,0.4) 50%, transparent 100%)',
                  }}
                  className="absolute inset-0" 
                />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                  {/* Tags */}
                  {city.tags && city.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {city.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            backgroundColor: 'var(--ws-surface-elevated)',
                            color: 'var(--ws-primary)',
                            borderColor: 'var(--ws-border)',
                          }}
                          className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${tagColors[tag] || ''}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 style={{ color: '#FFFFFF' }} className="font-display text-2xl group-hover:text-[var(--ws-secondary)] transition-colors drop-shadow-md">
                    {city.name}
                  </h3>
                  <p style={{ color: 'rgba(244, 248, 255, 0.8)' }} className="text-xs mt-1 drop-shadow">{city.state_name}</p>

                  {/* Arrow reveal */}
                  <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span style={{ color: 'var(--ws-secondary)' }} className="text-xs font-bold uppercase tracking-widest">Explore</span>
                    <ArrowRight size={12} style={{ color: 'var(--ws-secondary)' }} />
                  </div>
                </div>

                {/* Visit count badge */}
                {city.visit_count && city.visit_count > 0 && (
                  <div 
                    style={{
                      backgroundColor: 'var(--ws-surface-translucent)',
                      borderColor: 'var(--ws-border)',
                      color: 'var(--ws-primary)',
                    }}
                    className="absolute top-4 right-4 border rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest z-10 backdrop-blur-md shadow-sm"
                  >
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
