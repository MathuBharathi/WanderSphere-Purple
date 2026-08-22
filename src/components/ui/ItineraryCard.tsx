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
      className="bg-[#143028] border border-[#2C5E3B] rounded-2xl overflow-hidden hover:border-[#C69234] transition-all cursor-pointer group shadow-lg flex flex-col"
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
          alt={`Trip to ${cityName}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1914]/80 via-transparent to-transparent" />
        {/* Travel style badge */}
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#0B1914]/70 text-[#C69234] border border-[#2C5E3B]/60 backdrop-blur-sm">
          <Sparkles size={8} />
          {travelStyle}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#C69234]">
            {stateName}
          </span>
          <span className="text-[9px] font-semibold text-[#A3C2B2]/70">
            {createdDate}
          </span>
        </div>

        <h3 className="font-extrabold text-base text-white mt-0.5 group-hover:text-[#C69234] transition-colors line-clamp-1">
          Trip to {cityName}
        </h3>

        <div className="flex gap-3 text-[10px] font-semibold uppercase tracking-wider text-[#A3C2B2] mt-2.5">
          <span className="flex items-center gap-1">
            <Calendar size={10} /> {days} {days === 1 ? 'Day' : 'Days'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin size={10} /> {totalPlaces} {totalPlaces === 1 ? 'Place' : 'Places'}
          </span>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center border-t border-[#2C5E3B]/60 pt-3.5 mt-auto">
          <span className="text-xs font-bold text-[#C69234] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            View Details <ArrowRight size={12} />
          </span>
          <button
            onClick={(e) => onDelete(itinerary.id, e)}
            className="p-1.5 text-[#A3C2B2] hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-950/30"
            aria-label="Delete itinerary"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
