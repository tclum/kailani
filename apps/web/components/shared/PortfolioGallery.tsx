'use client';
import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Star } from 'lucide-react';

export interface GalleryAction {
  label: string;
  icon: React.ReactNode;
  onClick: (imageUrl: string, index: number) => void;
  variant?: 'primary' | 'secondary';
}

export interface PortfolioGalleryProps {
  images: string[];
  coverImage?: string | null;
  profileName?: string;
  profileLocation?: string | null;
  tags?: string[];
  /** Actions shown below the image in the sidebar (e.g. Message, Save) */
  actions?: GalleryAction[];
  /** If true, shows cover/delete/reorder controls instead of profile info */
  managementMode?: boolean;
  onSetCover?: (url: string) => void;
  onDelete?: (url: string) => void;
  /** Update URL with ?photo=N for shareable links */
  updateUrl?: boolean;
}

function PortfolioGalleryInner(props: PortfolioGalleryProps) {
  const {
    images,
    coverImage,
    profileName,
    profileLocation,
    tags,
    actions,
    managementMode,
    onSetCover,
    onDelete,
    updateUrl,
  } = props;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const searchParams = useSearchParams();

  // On mount, check for ?photo=N in URL
  useEffect(() => {
    if (!updateUrl) return;
    const photoParam = searchParams.get('photo');
    if (photoParam !== null) {
      const idx = parseInt(photoParam) - 1;
      if (idx >= 0 && idx < images.length) setActiveIndex(idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAt(i: number) {
    setActiveIndex(i);
    if (updateUrl && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('photo', String(i + 1));
      window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    }
  }

  function close() {
    setActiveIndex(null);
    if (updateUrl && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.delete('photo');
      const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }

  function prev() {
    if (activeIndex === null) return;
    const n = (activeIndex - 1 + images.length) % images.length;
    openAt(n);
  }

  function next() {
    if (activeIndex === null) return;
    const n = (activeIndex + 1) % images.length;
    openAt(n);
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (activeIndex === null) return;
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, images.length]);

  return (
    <>
      {/* Masonry grid */}
      <div className="columns-2 md:columns-3 gap-2 space-y-2">
        {images.map((url, i) => (
          <div key={url} className="break-inside-avoid relative group cursor-pointer" onClick={() => openAt(i)}>
            <div className="relative overflow-hidden rounded-xl">
              <Image
                src={url}
                alt=""
                width={400}
                height={300}
                sizes="(max-width: 768px) 50vw, 300px"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                    <path d="M11 8v6M8 11h6" />
                  </svg>
                </div>
              </div>
              {/* Cover star badge */}
              {coverImage === url && (
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-400 shadow flex items-center justify-center">
                  <Star size={12} className="text-white fill-white" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar lightbox */}
      <AnimatePresence>
        {activeIndex !== null && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={close}
            />
            <motion.div
              key="sidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-background z-50 flex flex-col shadow-2xl overflow-y-auto"
            >
              {/* Close + counter header */}
              <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                <span className="text-sm text-muted-foreground font-medium">
                  {activeIndex + 1} of {images.length}
                </span>
                <button
                  onClick={close}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Image with fade transition */}
              <div className="relative bg-muted flex-shrink-0" style={{ maxHeight: '60vh' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Image
                      src={images[activeIndex]}
                      alt=""
                      width={800}
                      height={600}
                      sizes="(max-width: 768px) 100vw, 480px"
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: '60vh' }}
                    />
                  </motion.div>
                </AnimatePresence>
                {/* Arrow navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Profile info or management controls */}
              <div className="p-4 flex-1">
                {managementMode ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Manage Photo</p>
                    <button
                      onClick={() => {
                        if (activeIndex !== null) onSetCover?.(images[activeIndex]);
                        close();
                      }}
                      className="w-full h-10 rounded-xl border border-border text-sm font-medium flex items-center gap-2 px-4 hover:bg-muted transition-colors"
                    >
                      <Star
                        size={15}
                        className={activeIndex !== null && coverImage === images[activeIndex] ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}
                      />
                      {activeIndex !== null && coverImage === images[activeIndex] ? 'Cover photo' : 'Set as cover photo'}
                    </button>
                    <button
                      onClick={() => {
                        if (activeIndex !== null) onDelete?.(images[activeIndex]);
                        close();
                      }}
                      className="w-full h-10 rounded-xl border border-red-200 text-sm font-medium flex items-center gap-2 px-4 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6" />
                        <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" />
                        <path d="M10,11v6M14,11v6" />
                        <path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2" />
                      </svg>
                      Delete photo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profileName && (
                      <div>
                        <p className="font-semibold">{profileName}</p>
                        {profileLocation && <p className="text-sm text-muted-foreground">{profileLocation}</p>}
                      </div>
                    )}
                    {tags && tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.slice(0, 6).map((t) => (
                          <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}
                    {actions && actions.length > 0 && (
                      <div className="flex gap-2 pt-2">
                        {actions.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (activeIndex !== null) action.onClick(images[activeIndex], activeIndex);
                            }}
                            className={`flex-1 h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                              action.variant === 'primary'
                                ? 'text-white'
                                : 'border border-border hover:bg-muted'
                            }`}
                            style={action.variant === 'primary' ? { background: 'linear-gradient(135deg,#ec4899,#be185d)' } : undefined}
                          >
                            {action.icon}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function PortfolioGallery(props: PortfolioGalleryProps) {
  return (
    <Suspense fallback={null}>
      <PortfolioGalleryInner {...props} />
    </Suspense>
  );
}
