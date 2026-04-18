'use client';
import { useEffect, useState } from 'react';
import { Zap, LayoutGrid, Search, MapPin, Users } from 'lucide-react';
import { SwipeStack } from '@/components/swipe/SwipeStack';
import { ModelCard } from '@/components/model/ModelCard';
import { SkeletonCard } from '@/components/shared/Skeleton';
import { apiFetch } from '@/lib/api';

interface ModelListing {
  id: string;
  userId: string;
  displayName: string;
  bio?: string | null;
  location?: string | null;
  coverImage?: string | null;
  profileImage?: string | null;
  tags: string[];
  heightCm?: number | null;
  user?: { verified?: boolean } | null;
}

type Tab = 'browse' | 'swipe';

export default function BrandDiscoverPage() {
  const [tab, setTab] = useState<Tab>('browse');
  const [models, setModels] = useState<ModelListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (tab !== 'browse') return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (locationFilter.trim()) params.set('location', locationFilter.trim());
    apiFetch<{ profiles: ModelListing[]; total: number }>(`/api/models?${params}`)
      .then((r) => { setModels(r.profiles); setTotal(r.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, page, locationFilter]);

  const filtered = search.trim()
    ? models.filter((m) =>
        m.displayName.toLowerCase().includes(search.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : models;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}
        >
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discover Models</h1>
          <p className="text-sm text-muted-foreground">Browse or swipe talent to work with</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit">
        <button
          onClick={() => setTab('browse')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'browse' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutGrid size={15} /> Browse
        </button>
        <button
          onClick={() => setTab('swipe')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'swipe' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap size={15} /> Swipe
        </button>
      </div>

      {tab === 'swipe' ? (
        <div className="max-w-lg mx-auto">
          <SwipeStack inboxHref="/brand/inbox" />
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or tag…"
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-pink-400 transition-colors"
              />
            </div>
            <div className="relative min-w-[160px]">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={locationFilter}
                onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
                placeholder="Filter by location…"
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-pink-400 transition-colors"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold">No models found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Try adjusting your filters or check back later.</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{total} model{total !== 1 ? 's' : ''} available</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map((m) => (
                  <ModelCard
                    key={m.userId}
                    id={m.id}
                    userId={m.userId}
                    displayName={m.displayName}
                    bio={m.bio}
                    location={m.location}
                    coverImage={m.coverImage}
                    profileImage={m.profileImage}
                    tags={m.tags}
                    height={m.heightCm}
                    user={m.user}
                  />
                ))}
              </div>
              {/* Pagination */}
              {total > 20 && (
                <div className="flex justify-center gap-2 pt-4">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-3 text-sm text-muted-foreground">
                    Page {page} of {Math.ceil(total / 20)}
                  </span>
                  <button
                    disabled={page >= Math.ceil(total / 20)}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
