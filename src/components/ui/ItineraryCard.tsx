'use client';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, MapPin, ArrowRight, Trash2 } from 'lucide-react';
import type { SavedItinerary } from '@/types';
import { places as staticPlaces } from '@/data/travelData';
import { getCityImageUrl } from '@/lib/placeImages';

interface ItineraryCardProps {
  itinerary: SavedItinerary;
  onOpen: (itinerary: SavedItinerary) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function ItineraryCard({ itinerary, onOpen, onDelete }: ItineraryCardProps) {
  const cityName = itinerary.config?.cityName || itinerary.title;
  const stateName = itinerary.config?.stateName || 'India';
  const days = itinerary.config?.days || 3;
  const travelStyle = itinerary.config?.travelStyle || 'adventure';
  const totalPlaces = itinerary.itinerary_data?.totalPlaces || 0;
  const createdDate = itinerary.created_at
    ? new Date(itinerary.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  // Get cover image: try cover_image field, then find from static places, then city image utility
  const coverImage =
    itinerary.cover_image ||
    staticPlaces.find(p => p.city_id === itinerary.config?.cityId)?.cover_image ||
    (itinerary.config?.cityName ? getCityImageUrl(itinerary.config.cityName) : '') ||
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      onClick={() => onOpen(itinerary)}
      className="ws-glass rounded-3xl overflow-hidden hover:border-[var(--ws-accent)] transition-all cursor-pointer group shadow-xl flex flex-col border"
    >
      {/* Cover Image or Ocean Glass Placeholder */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt={`Trip to ${cityName}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(76, 201, 232, 0.18), rgba(8, 120, 184, 0.12))',
            }}
            className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center"
          >
            <Sparkles size={24} style={{ color: 'var(--ws-accent)' }} />
            <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: 'var(--ws-text)' }}>{cityName}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020B18]/80 via-transparent to-transparent" />
        {/* Travel style badge */}
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ws-glass-strong text-[var(--ws-accent)] border backdrop-blur-md shadow-sm">
          <Sparkles size={8} />
          {travelStyle}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
            {stateName}
          </span>
          <span className="text-[9px] font-semibold" style={{ color: 'var(--ws-text-secondary)' }}>
            {createdDate}
          </span>
        </div>

        <h3 className="font-extrabold text-base mt-0.5 group-hover:text-[var(--ws-accent)] transition-colors line-clamp-1" style={{ color: 'var(--ws-text)' }}>
          Trip to {cityName}
        </h3>

        <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider mt-2.5" style={{ color: 'var(--ws-text-secondary)' }}>
          <span className="flex items-center gap-1">
            <Calendar size={10} style={{ color: 'var(--ws-accent)' }} /> {days} {days === 1 ? 'Day' : 'Days'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin size={10} style={{ color: 'var(--ws-accent)' }} /> {totalPlaces} {totalPlaces === 1 ? 'Place' : 'Places'}
          </span>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t pt-3.5 mt-auto" style={{ borderColor: 'var(--ws-border)' }}>
          <span className="text-xs font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1" style={{ color: 'var(--ws-accent)' }}>
            View Details <ArrowRight size={12} />
          </span>
          <button
            onClick={(e) => onDelete(itinerary.id, e)}
            className="p-1.5 transition-colors rounded-lg hover:bg-rose-500/20 hover:text-rose-400"
            style={{ color: 'var(--ws-text-secondary)' }}
            aria-label="Delete itinerary"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
