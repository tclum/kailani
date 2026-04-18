'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Star, MessageSquare, Bookmark, Pencil, Camera } from 'lucide-react';

export interface ProfilePortfolioPanelProps {
  images: string[];
  coverImage?: string | null;
  displayName: string;
  isOwnProfile?: boolean;
  /** true when the viewer is a BRAND user */
  isBrandViewer?: boolean;
  editPortfolioHref?: string;
  onMessage?: () => Promise<void> | void;
  onSave?: () => void;
  onSetCover?: (url: string) => void;
  onDelete?: (url: string) => void;
  messagingLabel?: string;
}

export function ProfilePortfolioPanel({
  images,
  coverImage,
  displayName,
  isOwnProfile,
  isBrandViewer,
  editPortfolioHref,
  onMessage,
  onSave,
  onSetCover,
  onDelete,
  messagingLabel = 'Message',
}: ProfilePortfolioPanelProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [messaging, setMessaging] = useState(false);

  // Cover photo first, then the rest
  const sorted = coverImage
    ? [coverImage, ...images.filter((u) => u !== coverImage)]
    : images;

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i - 1 + sorted.length) % sorted.length : null));
  }, [sorted.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i !== null ? (i + 1) % sorted.length : null));
  }, [sorted.length]);

  const close = useCallback(() => setLightboxIndex(null), []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, prev, next, close]);

  async function handleMessage() {
    setMessaging(true);
    try { await onMessage?.(); } finally { setMessaging(false); }
  }

  if (sorted.length === 0) {
    return (
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.15 }}
        className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground gap-3"
      >
        <Camera size={36} className="opacity-30" />
        <p className="text-sm">No portfolio images yet</p>
        {isOwnProfile && editPortfolioHref && (
          <Link href={editPortfolioHref}
            className="mt-2 h-9 px-4 rounded-xl text-sm font-medium text-white inline-flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
            <Pencil size={14} /> Add Photos
          </Link>
        )}
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.15 }}
        className="flex flex-col h-full"
      >
        {/* Panel header — sticky within the panel */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
          <p className="text-sm font-semibold text-muted-foreground">
            Portfolio · {sorted.length} photo{sorted.length !== 1 ? 's' : ''}
          </p>
          {isOwnProfile && editPortfolioHref && (
            <Link
              href={editPortfolioHref}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium border border-border hover:bg-muted transition-colors"
            >
              <Pencil size={12} /> Edit Portfolio
            </Link>
          )}
        </div>

        {/* Scrollable images */}
        <div className="flex-1 overflow-y-auto">
          {sorted.map((url, i) => (
            <div
              key={url}
              className="relative group cursor-zoom-in"
              onClick={() => setLightboxIndex(i)}
            >
              <Image
                src={url}
                alt={`${displayName} portfolio ${i + 1}`}
                width={800}
                height={600}
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="w-full h-auto object-cover block"
              />

              {/* Cover badge */}
              {url === coverImage && (
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-400 shadow-md flex items-center justify-center">
                  <Star size={12} className="text-white fill-white" />
                </div>
              )}

              {/* Hover overlay — public view */}
              {!isOwnProfile && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="w-11 h-11 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><path d="M11 8v6M8 11h6" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Hover overlay — own profile management */}
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSetCover?.(url); }}
                    className="h-8 px-3 rounded-xl bg-white/90 hover:bg-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Star size={12} className={url === coverImage ? 'text-amber-500 fill-amber-500' : ''} />
                    {url === coverImage ? 'Cover' : 'Set Cover'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.(url); }}
                    className="h-8 px-3 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA buttons — pinned to bottom, brand viewers only */}
        {isBrandViewer && (
          <div className="flex-shrink-0 p-4 border-t bg-background flex gap-2">
            {onSave && (
              <button
                onClick={onSave}
                className="flex-1 h-10 rounded-xl border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors"
              >
                <Bookmark size={15} /> Save
              </button>
            )}
            {onMessage && (
              <button
                onClick={handleMessage}
                disabled={messaging}
                className="flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}
              >
                <MessageSquare size={15} />
                {messaging ? 'Opening…' : messagingLabel}
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Full-screen lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100] bg-black/92 flex items-center justify-center"
            onClick={close}
          >
            {/* Image with fade on navigate */}
            <AnimatePresence mode="wait">
              <motion.div
                key={lightboxIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="relative max-w-4xl w-full px-16"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={sorted[lightboxIndex]}
                  alt={`${displayName} — ${lightboxIndex + 1} of ${sorted.length}`}
                  width={1400}
                  height={1000}
                  sizes="100vw"
                  className="w-full h-auto max-h-[85vh] object-contain"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Counter */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
              {lightboxIndex + 1} / {sorted.length}
            </div>

            {/* Close */}
            <button
              onClick={close}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Prev */}
            {sorted.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
