'use client';
import { useEffect, useRef, useState } from 'react';
import { Bookmark, BookmarkCheck, Plus } from 'lucide-react';

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
          <p className="px-4 pt-3 pb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Save to board
          </p>

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
