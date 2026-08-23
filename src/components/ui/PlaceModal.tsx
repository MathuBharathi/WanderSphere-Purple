'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Star, Clock, MapPin, DollarSign, Users, Shield,
  Sun, Camera, ExternalLink, Heart, Share2, Loader2
} from 'lucide-react';
import { getPlaceImages, getReviewsByPlace } from '@/lib/api';
import { getPlaceImageUrl } from '@/lib/placeImages';
import { MasonryGallery } from '@/components/gallery/MasonryGallery';
import { ReviewForm } from '@/components/ui/ReviewForm';
import { useAppStore } from '@/store';
import toast from 'react-hot-toast';
import type { Place, MasonryItem } from '@/types';

interface PlaceModalProps {
  place: Place;
  onClose: () => void;
}

const crowdColors: Record<string, string> = {
  low: 'text-emerald-400',
  moderate: 'text-[#C69234]',
  high: 'text-[#A65D29]',
};

export function PlaceModal({ place, onClose }: PlaceModalProps) {
  const { savedPlaces, toggleSavedPlace } = useAppStore();
  const [images, setImages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    loadData();
    return () => { document.body.style.overflow = ''; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.id]);

  const loadData = async () => {
    const [imgs, revs] = await Promise.all([
      getPlaceImages(place.id),
      getReviewsByPlace(place.id),
    ]);
    setImages(imgs);
    setReviews(revs);
    setLoading(false);
  };

  const saved = savedPlaces.includes(place.id);

  const handleToggleSave = () => {
    toggleSavedPlace(place.id);
    const isSavedNow = !saved;
    toast.success(isSavedNow ? 'Place saved!' : 'Place removed from saved');
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/city/${place.city_id}?place=${place.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: place.name, text: place.description || '', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } catch { /* user cancelled share */ }
  };

  const handleReviewSubmitted = () => {
    // Reload reviews
    getReviewsByPlace(place.id).then(setReviews);
  };

  // Build masonry items from place images + cover
  const allImages = [
    ...(place.cover_image ? [{ url: place.cover_image, caption: place.name }] : []),
    ...images,
  ];

  const masonryItems: MasonryItem[] = allImages.map((img, i) => ({
    id: `img-${i}`,
    img: img.url,
    height: [350, 280, 420, 300, 380, 260][i % 6],
    title: img.caption || place.name,
  }));

  const infoItems = [
    { icon: Star, label: 'Rating', value: place.avg_rating ? `${place.avg_rating}/5 (${place.review_count} reviews)` : 'Not rated', color: 'text-[#C69234]' },
    { icon: Clock, label: 'Best Time', value: place.best_time_to_visit || 'Any time', color: 'text-[#C69234]' },
    { icon: DollarSign, label: 'Entry Fee', value: place.entry_fee === 0 ? 'Free' : place.entry_fee ? `₹${place.entry_fee}` : 'Varies', color: 'text-emerald-400' },
    { icon: Users, label: 'Crowd Level', value: place.crowd_level || 'Moderate', color: crowdColors[place.crowd_level || 'moderate'] },
    { icon: Shield, label: 'Safety', value: place.safety_rating ? `${place.safety_rating}/5` : 'Good', color: 'text-blue-400' },
    { icon: Clock, label: 'Visit Duration', value: place.avg_visit_duration ? `~${place.avg_visit_duration} mins` : 'Varies', color: 'text-[#A3C2B2]' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-[#020B18]/80 backdrop-blur-xl z-[100] overflow-y-auto"
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="min-h-screen md:min-h-0 md:my-8 md:mx-auto md:max-w-5xl ws-glass-strong border md:rounded-4xl overflow-hidden shadow-2xl"
      >
        {/* Header image */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${getPlaceImageUrl(place.name, place.category, place.cover_image)})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020B18] via-transparent to-transparent" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 ws-glass-strong border rounded-full p-2 hover:border-[var(--ws-accent)] transition-colors backdrop-blur-lg"
            style={{ color: 'var(--ws-text)' }}
          >
            <X size={18} />
          </button>

          {/* Actions */}
          <div className="absolute top-5 left-5 flex gap-2">
            <button
              onClick={handleToggleSave}
              className={`border rounded-full p-2 transition-all duration-300 backdrop-blur-lg ${
                saved
                  ? 'border-[var(--ws-accent)] bg-[var(--ws-accent)]/20'
                  : 'ws-glass-strong border hover:border-[var(--ws-accent)]'
              }`}
            >
              <Heart
                size={16}
                style={{
                  color: saved ? 'var(--ws-accent)' : 'var(--ws-text)',
                  fill: saved ? 'var(--ws-accent)' : 'transparent',
                }}
              />
            </button>
            <button
              onClick={handleShare}
              className="ws-glass-strong border rounded-full p-2 hover:border-[var(--ws-accent)] transition-colors backdrop-blur-lg"
              style={{ color: 'var(--ws-text)' }}
            >
              <Share2 size={16} />
            </button>
          </div>

          {/* Category badge */}
          <div className="absolute bottom-5 left-5">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.4em] ws-glass-strong border backdrop-blur-md px-3 py-1 rounded-full" style={{ color: 'var(--ws-accent)' }}>
              {place.category.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10" style={{ color: 'var(--ws-text)' }}>
          {/* Title + rating */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-display text-4xl md:text-5xl" style={{ letterSpacing: '-0.02em', color: 'var(--ws-text)' }}>
                {place.name}
              </h2>
              {place.address && (
                <p className="text-sm mt-2 flex items-center gap-1 font-medium" style={{ color: 'var(--ws-text-secondary)' }}>
                  <MapPin size={12} style={{ color: 'var(--ws-accent)' }} /> {place.address}
                </p>
              )}
            </div>
            {place.avg_rating && (
              <div className="flex items-center gap-1 ws-glass border rounded-full px-3 py-2 flex-shrink-0">
                <Star size={14} style={{ color: 'var(--ws-accent)', fill: 'var(--ws-accent)' }} />
                <span className="font-bold text-sm" style={{ color: 'var(--ws-accent)' }}>{place.avg_rating}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {place.description && (
            <p className="leading-relaxed mb-8 text-sm md:text-base font-medium" style={{ color: 'var(--ws-text-secondary)' }}>{place.description}</p>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {infoItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="ws-glass border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={12} style={{ color: 'var(--ws-accent)' }} />
                  <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--ws-text-secondary)' }}>{label}</span>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--ws-text)' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          {place.tags && place.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {place.tags.map((tag) => (
                <span key={tag} className="ws-glass border rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--ws-accent)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Photo Gallery — Masonry */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ws-accent)' }} />
            </div>
          ) : masonryItems.length > 0 ? (
            <div className="mb-10">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.5em] mb-6 flex items-center gap-2" style={{ color: 'var(--ws-accent)' }}>
                <Camera size={12} />
                Photo Gallery
              </p>
              <MasonryGallery
                items={masonryItems}
                animateFrom="bottom"
                blurToFocus={true}
                stagger={0.04}
                scaleOnHover={true}
                hoverScale={0.97}
                colorShiftOnHover={true}
              />
            </div>
          ) : null}

          {/* Review Form */}
          <div className="mb-10">
            <ReviewForm placeId={place.id} onReviewSubmitted={handleReviewSubmitted} />
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.5em] mb-6 flex items-center gap-2" style={{ color: 'var(--ws-accent)' }}>
                <Star size={12} />
                Recent Reviews ({reviews.length})
              </p>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="ws-glass border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full ws-glass-soft border flex items-center justify-center text-xs font-bold" style={{ color: 'var(--ws-accent)' }}>
                          {review.profiles?.full_name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--ws-text)' }}>{review.profiles?.full_name || 'Traveler'}</p>
                          <p className="text-[10px]" style={{ color: 'var(--ws-text-secondary)' }}>{review.visit_date || ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            style={{
                              color: i < review.rating ? 'var(--ws-accent)' : 'var(--ws-text-secondary)',
                              fill: i < review.rating ? 'var(--ws-accent)' : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {review.title && <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ws-text)' }}>{review.title}</p>}
                    {review.content && <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>{review.content}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
