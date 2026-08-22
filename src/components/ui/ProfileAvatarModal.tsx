'use client';
import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2 } from 'lucide-react';

interface ProfileAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl: string;
  onUpload: (file: File) => void;
  onDelete: () => void;
  uploading?: boolean;
  deleting?: boolean;
}

export function ProfileAvatarModal({
  isOpen,
  onClose,
  avatarUrl,
  onUpload,
  onDelete,
  uploading = false,
  deleting = false,
}: ProfileAvatarModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ESC key support
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WebP, etc.).');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB.');
      return;
    }

    onUpload(file);
    // Reset file input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo preview"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0B1914]/90 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center gap-6 max-w-[90vw] max-h-[90vh] p-4"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 md:top-0 md:right-0 p-2.5 rounded-full bg-[#143028] border border-[#2C5E3B] text-[#A3C2B2] hover:text-white hover:border-[#C69234] transition-all z-20 shadow-lg"
              aria-label="Close photo preview"
            >
              <X size={18} />
            </button>

            {/* Large Profile Image */}
            <div className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt="Profile photo"
                className="max-h-[65vh] max-w-[85vw] md:max-h-[70vh] md:max-w-[70vw] object-contain rounded-2xl shadow-2xl border border-[#2C5E3B]/40"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#C69234] hover:bg-[#b07f2a] text-[#0B1914] text-xs font-black uppercase tracking-widest transition-all shadow-md disabled:opacity-50"
              >
                <Upload size={14} />
                {uploading ? 'Uploading...' : 'Upload New Photo'}
              </button>

              <button
                onClick={onDelete}
                disabled={deleting}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#143028] border border-rose-800/40 hover:bg-rose-950/30 text-rose-400 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
              >
                <Trash2 size={14} />
                {deleting ? 'Deleting...' : 'Delete Photo'}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              aria-label="Select profile photo"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
