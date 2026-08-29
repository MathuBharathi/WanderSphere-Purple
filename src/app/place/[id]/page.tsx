'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Star, Clock, DollarSign, Users, Shield,
  Heart, Share2, Camera, Loader2, Navigation, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { getPlaceById, getPlaceImages, getReviewsByPlace } from '@/lib/api';
import { getPlaceImageUrl } from '@/lib/placeImages';
import { MasonryGallery } from '@/components/gallery/MasonryGallery';
import { ReviewForm } from '@/components/ui/ReviewForm';
import { NavDock } from '@/components/dock/NavDock';
import { Footer } from '@/components/ui/Footer';
import { useAppStore } from '@/store';
import toast from 'react-hot-toast';
import type { Place, MasonryItem } from '@/types';

const crowdColors: Record<string, string> = {
  low: 'text-green-400',
  moderate: 'text-violet',
  high: 'text-soft-pink',
};

export default function PlacePage() {
  const { id } = useParams<{ id: string }>();
  const { savedPlaces, toggleSavedPlace } = useAppStore();

  const [place, setPlace] = useState<Place | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAll = async () => {
    const [p, imgs, revs] = await Promise.all([
      getPlaceById(id),
      getPlaceImages(id),
      getReviewsByPlace(id),
    ]);
    setPlace(p);
    setImages(imgs);
    setReviews(revs);
    setLoading(false);
  };

  const saved = place ? savedPlaces.includes(place.id) : false;

  const handleToggleSave = () => {
    if (!place) return;
    toggleSavedPlace(place.id);
    const isSavedNow = !saved;
    toast.success(isSavedNow ? 'Place saved!' : 'Removed from saved');
  };

  const handleShare = async () => {
    if (!place) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: place.name, text: place.description || '', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
      }
    } catch { /* cancelled */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--ws-text)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--ws-text-secondary)' }}>Loading place...</p>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6" style={{ color: 'var(--ws-text)' }}>
        <div>
          <p className="text-lg mb-4" style={{ color: 'var(--ws-text-secondary)' }}>Place not found</p>
          <Link href="/" className="text-sm underline font-semibold" style={{ color: 'var(--ws-accent)' }}>Go Home</Link>
        </div>
      </div>
    );
  }

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
    { icon: Star, label: 'Rating', value: place.avg_rating ? `${place.avg_rating}/5 (${place.review_count} reviews)` : 'Not rated', color: 'var(--ws-accent)' },
    { icon: Clock, label: 'Best Time', value: place.best_time_to_visit || 'Any time', color: 'var(--ws-accent)' },
    { icon: DollarSign, label: 'Entry Fee', value: place.entry_fee === 0 ? 'Free' : place.entry_fee ? `₹${place.entry_fee}` : 'Varies', color: 'var(--ws-accent)' },
    { icon: Users, label: 'Crowd Level', value: place.crowd_level || 'Moderate', color: 'var(--ws-accent)' },
    { icon: Shield, label: 'Safety', value: place.safety_rating ? `${place.safety_rating}/5` : 'Good', color: 'var(--ws-text-secondary)' },
    { icon: Clock, label: 'Duration', value: place.avg_visit_duration ? `~${place.avg_visit_duration} mins` : 'Varies', color: 'var(--ws-text-secondary)' },
  ];

  return (
    <main className="relative min-h-[100svh] flex flex-col transition-colors duration-500" style={{ color: 'var(--ws-text)' }}>
      {/* Hero Banner */}
      <div className="relative h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] hover:scale-105"
          style={{
            backgroundImage: `url(${getPlaceImageUrl(place.name, place.category, place.cover_image)})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020B18] via-[#041B31]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020B18]/60 via-transparent to-transparent" />

        {/* Navigation */}
        <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-10">
          <Link
            href={place.city_id ? `/city/${place.city_id}` : '/'}
            style={{ color: 'var(--ws-text)' }}
            className="flex items-center gap-2 ws-glass rounded-full px-4 py-2 hover:border-[var(--ws-accent)] transition-all duration-300 text-xs font-bold uppercase tracking-widest backdrop-blur-lg shadow-sm"
          >
            <ArrowLeft size={14} />
            Back
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSave}
              className={`border rounded-full p-3 transition-all duration-300 backdrop-blur-lg ${
                saved
                  ? 'border-[#A65D29]/80 bg-[#A65D29]/20'
                  : 'bg-[#0B1914]/80 border-[#2C5E3B] hover:border-[#C69234]'
              }`}
            >
              <Heart size={16} className={saved ? 'text-[#A65D29] fill-current' : 'text-white'} />
            </button>
            <button
              onClick={handleShare}
              className="bg-[#0B1914]/80 border border-[#2C5E3B] rounded-full p-3 hover:border-[#C69234] transition-all duration-300 backdrop-blur-lg"
            >
              <Share2 size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Place name reveal */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mb-3"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#C69234] bg-[#1B432C] border border-[#2C5E3B] px-3 py-1 rounded-full">
              {place.category.replace('_', ' ')}
            </span>
            {place.is_hidden_gem && (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#C69234] bg-[#1B432C] border border-[#2C5E3B] px-3 py-1 rounded-full">
                <Sparkles size={10} /> Hidden Gem
              </span>
            )}
          </motion.div>

          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[10vw] md:text-[6vw] text-white leading-none"
              style={{ letterSpacing: '-0.03em' }}
            >
              {place.name.toUpperCase()}
            </motion.h1>
          </div>

          {place.address && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-[#A3C2B2] text-sm mt-3 flex items-center gap-1"
            >
              <MapPin size={12} className="text-[#C69234]" /> {place.address}
            </motion.p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6">
        {/* Description */}
        {place.description && (
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#A3C2B2] text-base leading-relaxed py-12 text-center max-w-3xl mx-auto"
          >
            {place.description}
          </motion.p>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {infoItems.map(({ icon: Icon, label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#143028] border border-[#2C5E3B]/60 rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className="text-[#C69234]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#A3C2B2]">{label}</span>
              </div>
              <p className="text-sm font-semibold text-white">{value}</p>
            </motion.div>
          ))}
        </div>

        {/* Tags */}
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12">
            {place.tags.map((tag) => (
              <span key={tag} className="bg-[#143028] border border-[#2C5E3B]/60 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#A3C2B2]">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Photo Gallery */}
        {masonryItems.length > 0 && (
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#C69234] mb-8 flex items-center gap-2">
              <Camera size={12} />
              Photo Gallery ({masonryItems.length} photos)
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
        )}

        {/* Map embed */}
        {place.latitude && place.longitude && (
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#C69234] mb-6 flex items-center gap-2">
              <Navigation size={12} />
              Location
            </p>
            <div className="bg-[#143028] border border-[#2C5E3B] rounded-3xl overflow-hidden h-64 p-1">
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${place.longitude! - 0.02},${place.latitude! - 0.01},${place.longitude! + 0.02},${place.latitude! + 0.01}&layer=mapnik&marker=${place.latitude},${place.longitude}`}
                className="w-full h-full rounded-2xl border-0"
                loading="lazy"
              />
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-[#C69234] text-xs font-bold uppercase tracking-widest hover:underline transition-colors"
            >
              <MapPin size={12} />
              Open in Google Maps
            </a>
          </div>
        )}

        {/* Review Form */}
        <div className="mb-10">
          <ReviewForm placeId={place.id} onReviewSubmitted={() => getReviewsByPlace(place.id).then(setReviews)} />
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#C69234] mb-8 flex items-center gap-2">
              <Star size={12} />
              Reviews ({reviews.length})
            </p>
            <div className="space-y-4">
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-[#143028] border border-[#2C5E3B]/60 rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#C69234]/20 border border-[#C69234]/50 flex items-center justify-center text-[#C69234] text-xs font-bold">
                        {review.profiles?.full_name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{review.profiles?.full_name || 'Traveler'}</p>
                        <p className="text-[#A3C2B2]/60 text-[10px]">
                          {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < review.rating ? 'text-[#C69234] fill-[#C69234]' : 'text-[#2C5E3B]'} />
                      ))}
                    </div>
                  </div>
                  {review.title && <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ws-text)' }}>{review.title}</p>}
                  {review.content && <p className="text-sm leading-relaxed" style={{ color: 'var(--ws-text-secondary)' }}>{review.content}</p>}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer className="mt-auto" />
      <NavDock />
    </main>
  );
}
