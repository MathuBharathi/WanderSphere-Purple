'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, Loader2 } from 'lucide-react';
import { createReview } from '@/lib/api';
import { useAppStore } from '@/store';
import toast from 'react-hot-toast';

interface ReviewFormProps {
  placeId: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({ placeId, onReviewSubmitted }: ReviewFormProps) {
  const { user } = useAppStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (!user) {
    return (
      <div className="ws-glass border rounded-2xl p-6 text-center shadow-lg">
        <p className="text-sm mb-3" style={{ color: 'var(--ws-text-secondary)' }}>Sign in to write a review</p>
        <a
          href="/auth"
          className="inline-block px-6 py-2 rounded-full ws-ocean-btn-primary text-xs font-black uppercase tracking-widest transition-transform hover:scale-105 shadow-md"
        >
          Sign In
        </a>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full py-4 rounded-2xl ws-glass border text-xs font-bold uppercase tracking-widest hover:border-[var(--ws-accent)] transition-all duration-300 shadow-md"
        style={{ color: 'var(--ws-accent)' }}
      >
        ✦ Write a Review ✦
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setLoading(true);
    try {
      await createReview({
        place_id: placeId,
        user_id: user.id,
        rating,
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        visit_date: new Date().toISOString().split('T')[0],
      });
      toast.success('Review submitted!');
      setRating(0);
      setTitle('');
      setContent('');
      setShowForm(false);
      onReviewSubmitted();
    } catch (err: any) {
      if (err?.message?.includes('duplicate') || err?.code === '23505') {
        toast.error('You have already reviewed this place');
      } else {
        toast.error(err?.message || 'Failed to submit review');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="ws-glass border rounded-2xl p-6 space-y-4 shadow-xl"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.5em] mb-2" style={{ color: 'var(--ws-accent)' }}>
        Your Review
      </p>

      {/* Star rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={24}
              style={{
                color: star <= (hoverRating || rating) ? 'var(--ws-accent)' : 'var(--ws-text-secondary)',
                fill: star <= (hoverRating || rating) ? 'var(--ws-accent)' : 'transparent',
              }}
              className="transition-colors"
            />
          </button>
        ))}
        <span className="text-xs ml-2" style={{ color: 'var(--ws-text-secondary)' }}>
          {rating > 0 ? `${rating}/5` : 'Select rating'}
        </span>
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Review title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full ws-glass border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[var(--ws-accent)] transition-colors"
        style={{ color: 'var(--ws-text)' }}
      />

      {/* Content */}
      <textarea
        placeholder="Share your experience..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full ws-glass border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[var(--ws-accent)] transition-colors resize-none"
        style={{ color: 'var(--ws-text)' }}
      />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || rating === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ws-ocean-btn-primary font-black uppercase tracking-widest text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-md"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Submit
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-6 py-3 rounded-xl ws-glass border text-xs font-bold uppercase tracking-widest hover:border-[var(--ws-accent)] transition-colors"
          style={{ color: 'var(--ws-text-secondary)' }}
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
}
