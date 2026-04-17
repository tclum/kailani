'use client';
import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Heart, X, MapPin, MessageSquare, Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export interface SwipeCard {
  id: string;
  targetType: 'MODEL' | 'BRAND' | 'PHOTOGRAPHER' | 'CAMPAIGN';
  name: string;
  image: string | null;
  location: string | null;
  tags: string[];
  bio: string | null;
  brandName?: string;
  brandImage?: string | null;
  budget?: string | null;
}

interface MatchResult {
  matched: boolean;
  threadId?: string;
  matchedProfile?: {
    userId: string;
    name: string;
    image: string | null;
    role: string;
  };
}

interface MatchOverlayProps {
  myImage: string | null;
  matchedName: string;
  matchedImage: string | null;
  threadId: string;
  inboxHref: string;
  onKeepSwiping: () => void;
}

function MatchOverlay({ myImage, matchedName, matchedImage, threadId, inboxHref, onKeepSwiping }: MatchOverlayProps) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm px-6"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 16, stiffness: 200 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        {/* Sparkles header */}
        <div className="flex items-center gap-2 text-pink-400">
          <Sparkles size={20} />
          <span className="text-sm font-semibold uppercase tracking-widest">It's a match!</span>
          <Sparkles size={20} />
        </div>

        {/* Two avatars */}
        <div className="flex items-center gap-4">
          <Avatar src={myImage} size={96} />
          <div className="text-4xl">💫</div>
          <Avatar src={matchedImage} size={96} />
        </div>

        <div>
          <p className="text-2xl font-bold text-white">You and {matchedName}</p>
          <p className="text-sm text-white/60 mt-1">matched! Start a conversation.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button
            onClick={() => router.push(`${inboxHref}?thread=${threadId}`)}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 20px rgba(236,72,153,0.4)' }}
          >
            <MessageSquare size={18} />
            Send a message
          </button>
          <button
            onClick={onKeepSwiping}
            className="flex-1 h-12 rounded-2xl font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
          >
            Keep swiping
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Avatar({ src, size }: { src: string | null; size: number }) {
  return (
    <div
      className="rounded-full overflow-hidden border-4 border-pink-400 shadow-xl flex-shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
    >
      {src && <Image src={src} alt="" width={size} height={size} className="object-cover w-full h-full" />}
    </div>
  );
}

interface DraggableCardProps {
  card: SwipeCard;
  onLike: () => void;
  onPass: () => void;
  active: boolean;
}

function DraggableCard({ card, onLike, onPass, active }: DraggableCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -30], [1, 0]);

  function handleDragEnd(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    if (info.offset.x > 90 || info.velocity.x > 400) {
      onLike();
    } else if (info.offset.x < -90 || info.velocity.x < -400) {
      onPass();
    }
  }

  const imageSrc = card.image;
  const initials = card.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.div
      style={{ x, rotate, touchAction: 'none' }}
      drag={active ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
    >
      {/* Card */}
      <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Background image */}
        {imageSrc ? (
          <Image src={imageSrc} alt={card.name} fill className="object-cover" draggable={false} />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-6xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
          >
            {initials}
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {/* LIKE stamp */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-10 left-6 px-4 py-2 rounded-xl border-4 border-green-400 rotate-[-15deg]"
        >
          <span className="text-green-400 font-black text-2xl tracking-wider">LIKE</span>
        </motion.div>

        {/* PASS stamp */}
        <motion.div
          style={{ opacity: passOpacity }}
          className="absolute top-10 right-6 px-4 py-2 rounded-xl border-4 border-red-400 rotate-[15deg]"
        >
          <span className="text-red-400 font-black text-2xl tracking-wider">PASS</span>
        </motion.div>

        {/* Campaign brand badge */}
        {card.targetType === 'CAMPAIGN' && card.brandName && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
            {card.brandImage && (
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                <Image src={card.brandImage} alt={card.brandName} width={20} height={20} className="object-cover" />
              </div>
            )}
            <span className="text-white text-xs font-medium">{card.brandName}</span>
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between gap-2 mb-2">
            <h3 className="text-white font-bold text-2xl leading-tight drop-shadow">{card.name}</h3>
            {card.budget && (
              <span className="text-xs font-semibold bg-pink-500/80 text-white px-2 py-1 rounded-full whitespace-nowrap">
                {card.budget}
              </span>
            )}
          </div>

          {card.location && (
            <p className="text-white/80 text-sm flex items-center gap-1 mb-2 drop-shadow">
              <MapPin size={13} /> {card.location}
            </p>
          )}

          {card.bio && (
            <p className="text-white/70 text-sm line-clamp-2 leading-relaxed mb-3">{card.bio}</p>
          )}

          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {card.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface SwipeStackProps {
  inboxHref: string;
}

export function SwipeStack({ inboxHref }: SwipeStackProps) {
  const [cards, setCards] = useState<SwipeCard[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [exhausted, setExhausted] = useState(false);
  const [match, setMatch] = useState<MatchResult & { myImage?: string | null } | null>(null);
  const [approved, setApproved] = useState<boolean | null>(null);

  // Load queue and approval status on mount
  useEffect(() => {
    Promise.all([
      apiFetch<{ queue: SwipeCard[] }>('/api/swipe/queue').catch(() => ({ queue: [] })),
      apiFetch<{ approved: boolean }>('/api/auth/me').catch(() => ({ approved: false })),
    ]).then(([queueRes, meRes]) => {
      setCards(queueRes.queue);
      setApproved(meRes.approved);
    }).finally(() => setLoading(false));
  }, []);

  const handleLike = useCallback(async () => {
    if (!cards || cards.length === 0) return;
    const card = cards[0];
    const remaining = cards.slice(1);
    setCards(remaining);
    if (remaining.length === 0) setExhausted(true);

    try {
      const result = await apiFetch<MatchResult>('/api/swipe/like', {
        method: 'POST',
        body: { targetId: card.id, targetType: card.targetType },
      });
      if (result.matched) {
        // Get own image for overlay
        let myImage: string | null = null;
        try {
          const myProfile = await apiFetch<any>('/api/models/me').catch(() => null)
            ?? await apiFetch<any>('/api/brands/me').catch(() => null)
            ?? await apiFetch<any>('/api/photographers/me').catch(() => null);
          myImage = myProfile?.profileImage ?? myProfile?.coverImage ?? myProfile?.logoUrl ?? null;
        } catch {}
        setMatch({ ...result, myImage });
      }
    } catch {}
  }, [cards]);

  const handlePass = useCallback(async () => {
    if (!cards || cards.length === 0) return;
    const card = cards[0];
    const remaining = cards.slice(1);
    setCards(remaining);
    if (remaining.length === 0) setExhausted(true);

    try {
      await apiFetch('/api/swipe/pass', {
        method: 'POST',
        body: { targetId: card.id, targetType: card.targetType },
      });
    } catch {}
  }, [cards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="w-10 h-10 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
      </div>
    );
  }

  if (approved === false) {
    return <UnapprovedPlaceholder />;
  }

  if (exhausted || (cards && cards.length === 0)) {
    return <EmptyQueue />;
  }

  const visibleCards = (cards ?? []).slice(0, 3);

  return (
    <>
      <AnimatePresence>
        {match && (
          <MatchOverlay
            myImage={match.myImage ?? null}
            matchedName={match.matchedProfile?.name ?? 'Someone'}
            matchedImage={match.matchedProfile?.image ?? null}
            threadId={match.threadId!}
            inboxHref={inboxHref}
            onKeepSwiping={() => setMatch(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-8 pb-10">
        {/* Card stack */}
        <div className="relative w-full max-w-sm mx-auto" style={{ height: 520 }}>
          <AnimatePresence>
            {visibleCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={i === 0 ? { scale: 0.9, opacity: 0 } : false}
                animate={{
                  scale: 1 - i * 0.04,
                  y: i * 10,
                  zIndex: visibleCards.length - i,
                  opacity: 1,
                }}
                exit={{ x: 0, opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                className="absolute inset-0"
                style={{ transformOrigin: 'bottom center' }}
              >
                <DraggableCard
                  card={card}
                  active={i === 0}
                  onLike={handleLike}
                  onPass={handlePass}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handlePass}
            className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800 shadow-xl flex items-center justify-center border-2 border-red-200 hover:border-red-400 transition-colors"
          >
            <X size={28} className="text-red-400" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className="w-20 h-20 rounded-full shadow-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 8px 30px rgba(236,72,153,0.4)' }}
          >
            <Heart size={32} className="text-white fill-white" />
          </motion.button>

          <div className="w-16 h-16" /> {/* spacer to keep heart centered */}
        </div>

        {cards && cards.length > 0 && (
          <p className="text-xs text-muted-foreground">{cards.length} more to discover</p>
        )}
      </div>
    </>
  );
}

function UnapprovedPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-[500px] gap-4 text-center px-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
        style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8)' }}
      >
        ✨
      </div>
      <h2 className="text-xl font-bold">Almost there!</h2>
      <p className="text-muted-foreground max-w-xs">
        Complete your profile and wait for admin approval to start discovering talent and opportunities.
      </p>
    </div>
  );
}

function EmptyQueue() {
  return (
    <div className="flex flex-col items-center justify-center h-[500px] gap-4 text-center px-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
        style={{ background: 'linear-gradient(135deg,#fce7f3,#fdf2f8)' }}
      >
        🎉
      </div>
      <h2 className="text-xl font-bold">You're all caught up!</h2>
      <p className="text-muted-foreground max-w-xs">
        You've seen everyone for now. Check back later for new profiles and campaigns.
      </p>
    </div>
  );
}
