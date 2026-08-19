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
      <div className="bg-[#1B432C]/70 border border-[#2C5E3B]/60 rounded-2xl p-6 text-center text-white">
        <p className="text-[#A3C2B2] text-sm mb-3">Sign in to write a review</p>
        <a
          href="/auth"
          className="inline-block px-6 py-2 rounded-full bg-[#C69234] text-[#0B1914] text-xs font-black uppercase tracking-widest hover:bg-[#b07f2a] transition-colors"
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
        className="w-full py-4 rounded-2xl bg-[#143028] border border-[#2C5E3B] text-[#C69234] text-xs font-bold uppercase tracking-widest hover:bg-[#1B432C] hover:border-[#C69234] transition-all duration-300 shadow-md"
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
      className="bg-[#1B432C]/70 border border-[#2C5E3B]/60 rounded-2xl p-6 space-y-4 text-white"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#C69234] mb-2">
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
              className={`transition-colors ${
                star <= (hoverRating || rating)
                  ? 'text-[#C69234] fill-[#C69234]'
                  : 'text-[#2C5E3B]'
              }`}
            />
          </button>
        ))}
        <span className="text-[#A3C2B2] text-xs ml-2">
          {rating > 0 ? `${rating}/5` : 'Select rating'}
        </span>
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Review title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-xl py-3 px-4 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-colors"
      />

      {/* Content */}
      <textarea
        placeholder="Share your experience..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full bg-[#0B1914] border border-[#2C5E3B] rounded-xl py-3 px-4 text-white placeholder-[#A3C2B2]/40 text-sm focus:outline-none focus:border-[#C69234] transition-colors resize-none"
      />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || rating === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C69234] text-[#0B1914] font-black uppercase tracking-widest text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b07f2a] transition-all duration-300 shadow-md"
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
          className="px-6 py-3 rounded-xl bg-[#143028] border border-[#2C5E3B] text-[#A3C2B2] text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
}
