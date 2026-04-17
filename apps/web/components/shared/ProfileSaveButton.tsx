'use client';
import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export function ProfileSaveButton({ targetUserId, className = '' }: { targetUserId: string; className?: string }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ saved: boolean; boards: string[] }>(`/api/saved/check/${targetUserId}`)
      .then((d) => setSaved(d.saved))
      .catch(() => {});
  }, [targetUserId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      if (saved) {
        await apiFetch(`/api/saved/${targetUserId}?boardName=Saved`, { method: 'DELETE' });
        setSaved(false);
      } else {
        await apiFetch('/api/saved', { method: 'POST', body: { savedId: targetUserId, boardName: 'Saved' } });
        setSaved(true);
      }
    } catch {
      // revert on error
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      title={saved ? 'Remove from saved' : 'Save profile'}
      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
        saved
          ? 'bg-pink-500 text-white hover:bg-pink-600'
          : 'bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm'
      } ${className}`}
    >
      {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
    </button>
  );
}
