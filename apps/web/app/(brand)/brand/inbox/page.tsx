'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageThread } from '@/components/shared/MessageThread';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import type { Thread } from '@kailani/types';

function InboxInner() {
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(searchParams.get('thread'));

  useEffect(() => {
    apiFetch<Thread[]>('/api/threads').then(setThreads);
  }, []);

  function threadName(thread: Thread): string {
    const me = getCurrentUser();
    const other = thread.members?.find((m) => m.userId !== me?.userId);
    return other?.displayName ?? 'Thread';
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] border rounded-lg overflow-hidden">
      <aside className="w-64 border-r flex flex-col">
        <div className="p-3 border-b font-semibold">Inbox</div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors ${
                activeId === t.id ? 'bg-muted font-medium' : ''
              }`}
            >
              {threadName(t)}
            </button>
          ))}
          {threads.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
          )}
        </div>
      </aside>
      <div className="flex-1">
        {activeId ? (
          <MessageThread threadId={activeId} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrandInboxPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground p-4">Loading…</div>}>
      <InboxInner />
    </Suspense>
  );
}
