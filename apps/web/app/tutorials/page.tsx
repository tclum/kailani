'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { BookOpen, Clock, ChevronRight, X, Play } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type Category = 'ALL' | 'MODELING' | 'BEAUTY' | 'PHOTOGRAPHY' | 'BUSINESS' | 'INDUSTRY_GUIDES';
type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: Exclude<Category, 'ALL'>;
  difficulty: Difficulty;
  duration: number;
  thumbnailUrl: string | null;
  videoUrl: string | null;
}

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'MODELING', label: 'Modeling' },
  { key: 'BEAUTY', label: 'Beauty' },
  { key: 'PHOTOGRAPHY', label: 'Photography' },
  { key: 'BUSINESS', label: 'Business' },
  { key: 'INDUSTRY_GUIDES', label: 'Industry Guides' },
];

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  BEGINNER:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  INTERMEDIATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ADVANCED:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const FALLBACK_IMAGES: Record<Exclude<Category, 'ALL'>, string> = {
  MODELING:        'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80',
  BEAUTY:          'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80',
  PHOTOGRAPHY:     'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=80',
  BUSINESS:        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
  INDUSTRY_GUIDES: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80',
};

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('ALL');
  const [selected, setSelected] = useState<Tutorial | null>(null);

  useEffect(() => {
    apiFetch<Tutorial[]>('/api/tutorials')
      .then(setTutorials)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'ALL'
    ? tutorials
    : tutorials.filter((t) => t.category === activeCategory);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <BookOpen size={24} className="text-pink-500 mt-0.5 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tutorials</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Learn from industry professionals. Improve your craft, grow your career.</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === c.key
                ? 'bg-pink-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-600'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border overflow-hidden animate-pulse">
              <div className="h-44 bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">No tutorials in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <TutorialCard key={t.id} tutorial={t} onClick={() => setSelected(t)} />
          ))}
        </div>
      )}

      {/* Coming Soon Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold leading-tight">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden h-40 relative bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.thumbnailUrl ?? FALLBACK_IMAGES[selected.category]}
                alt={selected.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Play size={24} className="text-white ml-1" />
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{selected.description}</p>
            <div className="flex items-center gap-3 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLOR[selected.difficulty]}`}>
                {selected.difficulty.charAt(0) + selected.difficulty.slice(1).toLowerCase()}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock size={12} /> {selected.duration} min
              </span>
            </div>
            <div className="rounded-xl bg-pink-50 dark:bg-pink-950/20 border border-pink-200 p-4 text-center">
              <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">Coming Soon</p>
              <p className="text-xs text-muted-foreground mt-1">Video tutorials are launching soon. Complete your profile to get early access.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TutorialCard({ tutorial, onClick }: { tutorial: Tutorial; onClick: () => void }) {
  const thumb = tutorial.thumbnailUrl ?? FALLBACK_IMAGES[tutorial.category];
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border overflow-hidden hover:shadow-md transition-shadow group bg-card"
    >
      <div className="relative h-44 overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt={tutorial.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/0 group-hover:bg-white/20 backdrop-blur-sm transition-all flex items-center justify-center">
            <Play size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLOR[tutorial.difficulty]}`}>
            {tutorial.difficulty.charAt(0) + tutorial.difficulty.slice(1).toLowerCase()}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-1.5">
        <p className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-pink-600 transition-colors">{tutorial.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{tutorial.description}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={11} /> {tutorial.duration} min
          </span>
          <span className="flex items-center gap-0.5 text-xs text-pink-500 font-medium">
            Preview <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </button>
  );
}
