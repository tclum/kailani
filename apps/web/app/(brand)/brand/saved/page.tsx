'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, BookmarkCheck, Plus, X, FolderOpen } from 'lucide-react';
import { apiFetch } from '@/lib/api';

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

// ─── Save button with board popover ───────────────────────────────────────────
export function SaveButton({
  targetUserId,
  existingBoards,
  allBoards,
  onSave,
  onUnsave,
}: {
  targetUserId: string;
  existingBoards: string[];
  allBoards: string[];
  onSave: (board: string) => void;
  onUnsave: (board: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newBoard, setNewBoard] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const isSaved = existingBoards.length > 0;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleNewBoard() {
    const name = newBoard.trim();
    if (!name) return;
    onSave(name);
    setNewBoard('');
    setOpen(false);
  }

  const knownBoards = ['Saved', ...allBoards.filter((b) => b !== 'Saved')];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        title={isSaved ? 'Saved — click to manage' : 'Save to board'}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
          isSaved ? 'text-pink-500 bg-pink-50 hover:bg-pink-100' : 'text-muted-foreground hover:text-pink-500 hover:bg-pink-50'
        }`}
      >
        {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-52 bg-card rounded-xl border shadow-lg overflow-hidden">
          <p className="px-4 pt-3 pb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Save to board</p>

          {knownBoards.map((board) => {
            const isBoardSaved = existingBoards.includes(board);
            return (
              <button
                key={board}
                onClick={() => { isBoardSaved ? onUnsave(board) : onSave(board); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <span>{board}</span>
                {isBoardSaved && <BookmarkCheck size={13} className="text-pink-500" />}
              </button>
            );
          })}

          <div className="h-px bg-border mx-2 my-1" />
          <div className="px-3 pb-3 pt-1 flex gap-1.5">
            <input
              value={newBoard}
              onChange={(e) => setNewBoard(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNewBoard()}
              placeholder="New board…"
              className="flex-1 min-w-0 h-8 rounded-lg border border-border bg-background px-2.5 text-xs outline-none focus:border-pink-400 transition-colors"
            />
            <button
              onClick={handleNewBoard}
              disabled={!newBoard.trim()}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-pink-500 text-white disabled:opacity-40 flex-shrink-0"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
            <Image src={img} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
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
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
        </div>
      ) : allBoards.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
          <FolderOpen size={40} className="text-muted-foreground/40" />
          <p className="text-muted-foreground">No saved profiles yet.</p>
          <p className="text-sm text-muted-foreground/60">Browse models and photographers, then tap the bookmark icon to save them here.</p>
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
