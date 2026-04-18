'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, FolderOpen } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { SaveButton } from '@/components/brand/SaveButton';

interface SavedUser {
  id: string;
  role: string;
  modelProfile: { id: string; userId: string; displayName: string; profileImage?: string | null; coverImage?: string | null; location?: string | null; tags: string[] } | null;
  photographerProfile: { id: string; userId: string; displayName: string; profileImage?: string | null; location?: string | null; specialties: string[] } | null;
  brandProfile: { id: string; userId: string; brandName: string; logoUrl?: string | null; profileImage?: string | null; location?: string | null } | null;
}

interface SavedEntry {
  savedId: string;
  savedUserId: string;
  boardName: string;
  createdAt: string;
  user: SavedUser;
}

interface SavedData {
  grouped: Record<string, SavedEntry[]>;
  boards: string[];
}

function getName(user: SavedUser) {
  return user.modelProfile?.displayName ?? user.photographerProfile?.displayName ?? user.brandProfile?.brandName ?? 'Unknown';
}

function getImage(user: SavedUser): string | null {
  return user.modelProfile?.profileImage ?? user.modelProfile?.coverImage ?? user.photographerProfile?.profileImage ?? user.brandProfile?.profileImage ?? user.brandProfile?.logoUrl ?? null;
}

function getProfileHref(user: SavedUser): string {
  if (user.modelProfile) return `/model/${user.id}`;
  if (user.photographerProfile) return `/photographer/${user.id}`;
  if (user.brandProfile) return `/brand/${user.id}`;
  return '#';
}

function getTags(user: SavedUser): string[] {
  if (user.modelProfile) return user.modelProfile.tags.slice(0, 3);
  if (user.photographerProfile) return user.photographerProfile.specialties.slice(0, 3);
  return [];
}

// ─── Profile card ──────────────────────────────────────────────────────────────
function SavedCard({
  entry,
  allBoards,
  onSave,
  onUnsave,
  savedBoards,
}: {
  entry: SavedEntry;
  allBoards: string[];
  onSave: (userId: string, board: string) => void;
  onUnsave: (userId: string, board: string) => void;
  savedBoards: string[];
}) {
  const { user } = entry;
  const name = getName(user);
  const img = getImage(user);
  const href = getProfileHref(user);
  const tags = getTags(user);
  const location = user.modelProfile?.location ?? user.photographerProfile?.location ?? user.brandProfile?.location;
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="rounded-2xl border bg-card overflow-hidden group relative">
      {/* Cover image */}
      <Link href={href} className="block">
        <div className="aspect-[3/4] relative bg-muted overflow-hidden">
          {img ? (
            <Image src={img} alt={name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
              {initials}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-white font-semibold text-sm truncate">{name}</p>
            {location && <p className="text-white/70 text-xs">{location}</p>}
          </div>
        </div>
      </Link>

      {/* Save button */}
      <div className="absolute top-3 right-3">
        <SaveButton
          targetUserId={entry.savedUserId}
          existingBoards={savedBoards}
          allBoards={allBoards}
          onSave={(board) => onSave(entry.savedUserId, board)}
          onUnsave={(board) => onUnsave(entry.savedUserId, board)}
        />
      </div>

      {tags.length > 0 && (
        <div className="px-3 py-2.5 flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function SavedProfilesPage() {
  const [data, setData] = useState<SavedData>({ grouped: {}, boards: [] });
  const [loading, setLoading] = useState(true);
  const [activeBoard, setActiveBoard] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<SavedData>('/api/saved')
      .then((d) => {
        setData(d);
        if (d.boards.length > 0) setActiveBoard(d.boards[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Track saved state per user
  const [savedMap, setSavedMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // Build saved map from grouped data
    const map: Record<string, string[]> = {};
    for (const [board, entries] of Object.entries(data.grouped)) {
      for (const entry of entries) {
        if (!map[entry.savedUserId]) map[entry.savedUserId] = [];
        if (!map[entry.savedUserId].includes(board)) map[entry.savedUserId].push(board);
      }
    }
    setSavedMap(map);
  }, [data]);

  async function handleSave(userId: string, board: string) {
    try {
      await apiFetch('/api/saved', { method: 'POST', body: { savedId: userId, boardName: board } });
      setSavedMap((prev) => ({ ...prev, [userId]: [...(prev[userId] ?? []), board] }));
      // Re-fetch to update grouped structure
      apiFetch<SavedData>('/api/saved').then(setData).catch(() => {});
    } catch {}
  }

  async function handleUnsave(userId: string, board: string) {
    try {
      await apiFetch(`/api/saved/${userId}?boardName=${encodeURIComponent(board)}`, { method: 'DELETE' });
      setSavedMap((prev) => ({ ...prev, [userId]: (prev[userId] ?? []).filter((b) => b !== board) }));
      apiFetch<SavedData>('/api/saved').then((d) => {
        setData(d);
        if (d.boards.length > 0 && !d.boards.includes(activeBoard ?? '')) {
          setActiveBoard(d.boards[0] ?? null);
        }
      }).catch(() => {});
    } catch {}
  }

  const allBoards = data.boards;
  const displayBoard = activeBoard ?? allBoards[0] ?? null;
  const entries = displayBoard ? (data.grouped[displayBoard] ?? []) : [];

  // Deduplicate by savedUserId within the board
  const seen = new Set<string>();
  const uniqueEntries = entries.filter((e) => {
    if (seen.has(e.savedUserId)) return false;
    seen.add(e.savedUserId);
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}
        >
          <Bookmark size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved Profiles</h1>
          <p className="text-sm text-muted-foreground">Your shortlisted models and photographers</p>
        </div>
      </div>

      {loading ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-4">
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="aspect-[3/4] bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : allBoards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <Bookmark size={24} />
          </div>
          <div>
            <h3 className="text-base font-semibold">No saved profiles yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Start swiping to discover and save talent.</p>
          </div>
          <Link
            href="/brand/discover"
            className="h-9 px-5 rounded-xl text-sm font-medium text-white inline-flex items-center"
            style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
          >
            Discover Models
          </Link>
        </div>
      ) : (
        <>
          {/* Board tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit flex-wrap">
            {allBoards.map((board) => (
              <button
                key={board}
                onClick={() => setActiveBoard(board)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  displayBoard === board ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {board}
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  displayBoard === board ? 'bg-pink-100 text-pink-700' : 'bg-muted-foreground/20 text-muted-foreground'
                }`}>
                  {(data.grouped[board] ?? []).length}
                </span>
              </button>
            ))}
          </div>

          {/* Masonry grid */}
          {uniqueEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <FolderOpen size={32} className="text-muted-foreground/40" />
              <p className="text-muted-foreground">This board is empty.</p>
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-0">
              {uniqueEntries.map((entry) => (
                <div key={entry.savedUserId} className="break-inside-avoid mb-4">
                  <SavedCard
                    entry={entry}
                    allBoards={allBoards}
                    savedBoards={savedMap[entry.savedUserId] ?? []}
                    onSave={handleSave}
                    onUnsave={handleUnsave}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
