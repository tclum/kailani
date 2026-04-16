'use client';
import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { MessageThread } from '@/components/shared/MessageThread';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import type { ApiThread, ApiThreadMember } from '@kailani/types';

function getOtherMember(thread: ApiThread, myUserId: string): ApiThreadMember | undefined {
  return thread.members.find((m) => m.userId !== myUserId);
}

function getMemberDisplay(member: ApiThreadMember) {
  const u = member.user;
  const name =
    u.modelProfile?.displayName ??
    u.brandProfile?.brandName ??
    u.photographerProfile?.displayName ??
    u.email;
  const avatar =
    u.modelProfile?.profileImage ??
    u.modelProfile?.coverImage ??
    u.brandProfile?.profileImage ??
    u.brandProfile?.logoUrl ??
    u.photographerProfile?.profileImage ??
    null;
  const role = u.role;
  return { name, avatar, role };
}

function roleLabel(role: string) {
  if (role === 'MODEL') return 'Model';
  if (role === 'BRAND') return 'Brand';
  if (role === 'PHOTOGRAPHER') return 'Photographer';
  return role;
}

function InboxInner() {
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<ApiThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(searchParams.get('thread'));
  const me = getCurrentUser();

  useEffect(() => {
    apiFetch<ApiThread[]>('/api/threads').then(setThreads).catch(() => {});
  }, []);

  const activeThread = threads.find((t) => t.id === activeId);
  const activeOther = activeThread && me ? getOtherMember(activeThread, me.userId) : null;

  return (
    <div className="flex h-[calc(100vh-8rem)] border rounded-xl overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r flex flex-col shrink-0">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm tracking-wide">Inbox</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
          )}
          {threads.map((t) => {
            const other = me ? getOtherMember(t, me.userId) : null;
            const { name, avatar, role } = other ? getMemberDisplay(other) : { name: 'Unknown', avatar: null, role: '' };
            const last = t.messages[0];
            const isActive = activeId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors border-b border-border/50 ${
                  isActive ? 'bg-muted' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0 relative">
                  {avatar ? (
                    <Image src={avatar} alt={name} fill className="object-cover" />
                  ) : (
                    name[0]?.toUpperCase() ?? '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm truncate font-medium ${isActive ? 'text-foreground' : ''}`}>{name}</span>
                    {role && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 shrink-0">
                        {roleLabel(role)}
                      </Badge>
                    )}
                  </div>
                  {last && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{last.body}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Thread pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeId ? (
          <>
            {activeOther && (
              <div className="px-4 py-3 border-b flex items-center gap-3">
                {(() => {
                  const { name, avatar, role } = getMemberDisplay(activeOther);
                  return (
                    <>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0 relative">
                        {avatar ? (
                          <Image src={avatar} alt={name} fill className="object-cover" />
                        ) : (
                          name[0]?.toUpperCase() ?? '?'
                        )}
                      </div>
                      <span className="font-medium text-sm">{name}</span>
                      {role && (
                        <Badge variant="outline" className="text-[10px]">{roleLabel(role)}</Badge>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
            <MessageThread threadId={activeId} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}

export function InboxPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground p-4 text-sm">Loading…</div>}>
      <InboxInner />
    </Suspense>
  );
}
