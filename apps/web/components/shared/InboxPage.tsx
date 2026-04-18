'use client';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { SkeletonAvatar } from '@/components/shared/Skeleton';
import type { ApiThread, ApiThreadMember, Message } from '@kailani/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOtherMember(thread: ApiThread, myId: string): ApiThreadMember | undefined {
  return thread.members.find((m) => m.userId !== myId);
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
  return { name, avatar, role: u.role };
}

function roleLabel(role: string) {
  if (role === 'MODEL') return 'Model';
  if (role === 'BRAND') return 'Brand';
  if (role === 'PHOTOGRAPHER') return 'Photographer';
  return role;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDateHeader(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function getSenderName(msg: Message) {
  return (
    msg.sender?.modelProfile?.displayName ??
    msg.sender?.brandProfile?.brandName ??
    msg.sender?.photographerProfile?.displayName ??
    msg.sender?.email ??
    'Unknown'
  );
}

function getSenderAvatar(msg: Message): string | null {
  return (
    msg.sender?.modelProfile?.profileImage ??
    msg.sender?.modelProfile?.coverImage ??
    msg.sender?.brandProfile?.profileImage ??
    msg.sender?.brandProfile?.logoUrl ??
    msg.sender?.photographerProfile?.profileImage ??
    null
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 36 }: { src: string | null; name: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center text-white font-semibold flex-shrink-0 relative"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: src ? undefined : 'linear-gradient(135deg,#ec4899,#be185d)',
      }}
    >
      {src ? <Image src={src} alt={name} fill sizes="40px" className="object-cover" /> : initials}
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 px-4 pb-2"
    >
      <div className="flex items-center gap-1 bg-muted rounded-2xl px-3 py-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{name} is typing…</span>
    </motion.div>
  );
}

// ─── Thread list row ──────────────────────────────────────────────────────────

function ThreadRow({
  thread,
  myId,
  isActive,
  onClick,
}: {
  thread: ApiThread;
  myId: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const other = getOtherMember(thread, myId);
  const { name, avatar, role } = other ? getMemberDisplay(other) : { name: 'Unknown', avatar: null, role: '' };
  const last = thread.messages[0];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/60 transition-colors border-b border-border/40 ${
        isActive ? 'bg-muted' : ''
      }`}
    >
      <Avatar src={avatar} name={name} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-sm truncate ${thread.unreadCount > 0 ? 'font-semibold text-foreground' : 'font-medium'}`}>
              {name}
            </span>
            {role && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 shrink-0">
                {roleLabel(role)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {thread.unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
              </span>
            )}
            {last && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {formatTime(last.createdAt)}
              </span>
            )}
          </div>
        </div>
        {last && (
          <p className={`text-xs mt-0.5 truncate ${thread.unreadCount > 0 ? 'text-foreground/70' : 'text-muted-foreground'}`}>
            {last.senderId === myId ? 'You: ' : ''}{last.body.slice(0, 40)}{last.body.length > 40 ? '…' : ''}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isMe, showAvatar }: { msg: Message; isMe: boolean; showAvatar: boolean }) {
  const avatar = getSenderAvatar(msg);
  const name = getSenderName(msg);

  return (
    <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar placeholder to keep alignment */}
      <div className="w-7 flex-shrink-0">
        {showAvatar && !isMe && <Avatar src={avatar} name={name} size={28} />}
      </div>
      <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isMe
              ? 'bg-pink-500 text-white rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
          }`}
        >
          {msg.body}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {formatTime(msg.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ─── Message thread panel ─────────────────────────────────────────────────────

function MessagePanel({
  thread,
  myId,
  onBack,
}: {
  thread: ApiThread;
  myId: string;
  onBack?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [typingName, setTypingName] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const other = getOtherMember(thread, myId);
  const { name: otherName, avatar: otherAvatar, role: otherRole } = other
    ? getMemberDisplay(other)
    : { name: 'Unknown', avatar: null, role: '' };

  // Load messages and join socket room
  useEffect(() => {
    apiFetch<Message[]>(`/api/threads/${thread.id}/messages`)
      .then(setMessages)
      .catch(() => {});

    const socket = getSocket();
    if (socket) {
      socket.emit('join-thread', { threadId: thread.id });
      socket.emit('mark-read', { threadId: thread.id });

      socket.on('new-message', (msg: Message) => {
        setMessages((prev) => {
          // Deduplicate by id
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Mark read since we're viewing the thread
        socket.emit('mark-read', { threadId: thread.id });
      });

      socket.on('user-typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
        if (userId !== myId) {
          setTypingName(isTyping ? otherName : null);
        }
      });
    }

    return () => {
      const s = getSocket();
      if (s) {
        s.emit('leave-thread', { threadId: thread.id });
        s.off('new-message');
        s.off('user-typing');
      }
    };
  }, [thread.id, myId, otherName]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingName]);

  // REST fallback send (also emits via socket on backend)
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setBody('');
    setSending(true);
    stopTyping();
    try {
      const msg = await apiFetch<Message>(`/api/threads/${thread.id}/messages`, {
        method: 'POST',
        body: { body: trimmed },
      });
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } catch {
      setBody(trimmed); // restore on error
    } finally {
      setSending(false);
    }
  }

  function stopTyping() {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      getSocket()?.emit('typing', { threadId: thread.id, isTyping: false });
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setBody(e.target.value);
    const socket = getSocket();
    if (!socket) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { threadId: thread.id, isTyping: true });
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 2000);
  }

  // Group messages by date
  const grouped: Array<{ date: string; msgs: Message[] }> = [];
  for (const msg of messages) {
    const last = grouped[grouped.length - 1];
    if (!last || !sameDay(last.date, msg.createdAt)) {
      grouped.push({ date: msg.createdAt, msgs: [msg] });
    } else {
      last.msgs.push(msg);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-3 flex-shrink-0 bg-background">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors -ml-1"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <Avatar src={otherAvatar} name={otherName} size={34} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{otherName}</p>
          {otherRole && (
            <p className="text-xs text-muted-foreground capitalize">{otherRole.toLowerCase()}</p>
          )}
        </div>
        {otherRole && (
          <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
            {roleLabel(otherRole)}
          </Badge>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Say hello!</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.date} className="space-y-1">
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-muted-foreground px-2 whitespace-nowrap">
                  {formatDateHeader(group.date)}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              {group.msgs.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={msg.senderId === myId}
                  showAvatar={i === 0 || group.msgs[i - 1]?.senderId !== msg.senderId}
                />
              ))}
            </div>
          ))
        )}
        <AnimatePresence>
          {typingName && <TypingIndicator name={typingName} />}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="border-t p-3 flex gap-2 items-center flex-shrink-0 bg-background"
      >
        <input
          value={body}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e as any);
            }
          }}
          placeholder="Type a message…"
          disabled={sending}
          className="flex-1 h-10 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="w-10 h-10 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

// ─── Main inbox inner ─────────────────────────────────────────────────────────

function InboxInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [threads, setThreads] = useState<ApiThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(searchParams.get('thread'));
  // Mobile: 'list' shows thread list, 'thread' shows message panel
  const [mobileView, setMobileView] = useState<'list' | 'thread'>(
    searchParams.get('thread') ? 'thread' : 'list',
  );
  const me = getCurrentUser();

  // Determine discover href based on current path
  const discoverHref =
    pathname?.startsWith('/brand') ? '/brand/discover' :
    pathname?.startsWith('/photographer') ? '/photographer/discover' :
    '/model/discover';

  useEffect(() => {
    apiFetch<ApiThread[]>('/api/threads')
      .then(setThreads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Connect socket once on mount, keep alive
  useEffect(() => {
    connectSocket();
    const socket = getSocket();
    if (!socket) return;

    // When a new message arrives on any thread, update the thread list preview + unread
    socket.on('new-message', (msg: Message) => {
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== msg.threadId) return t;
          const isActive = t.id === activeId;
          return {
            ...t,
            messages: [{ id: msg.id, body: msg.body, createdAt: msg.createdAt, senderId: msg.senderId }],
            unreadCount: isActive ? 0 : t.unreadCount + (msg.senderId !== me?.userId ? 1 : 0),
          };
        }),
      );
    });

    return () => {
      socket.off('new-message');
      disconnectSocket();
    };
  }, [activeId, me?.userId]);

  function openThread(id: string) {
    setActiveId(id);
    setMobileView('thread');
    // Clear unread in state immediately
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unreadCount: 0 } : t)));
  }

  const activeThread = threads.find((t) => t.id === activeId) ?? null;

  return (
    <div className="flex h-[calc(100dvh-8rem)] border rounded-xl overflow-hidden">
      {/* ── Left panel (thread list) ─────────────────────────────────────────── */}
      {/* Desktop: always visible. Mobile: conditionally shown via mobileView */}
      <aside
        className={`
          w-full md:w-80 border-r flex flex-col flex-shrink-0 bg-background
          ${mobileView === 'thread' ? 'hidden md:flex' : 'flex'}
        `}
      >
        <div className="px-4 py-3.5 border-b flex-shrink-0">
          <h2 className="font-semibold tracking-wide">Inbox</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="divide-y divide-border/40">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <SkeletonAvatar size={40} />
                  <div className="flex-1 space-y-2">
                    <div className="animate-pulse bg-muted rounded-xl h-3 w-1/2" />
                    <div className="animate-pulse bg-muted rounded-xl h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-4">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold">No conversations yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Visit someone&apos;s profile to start a conversation.
                </p>
              </div>
              <Link
                href={discoverHref}
                className="h-9 px-5 rounded-xl text-sm font-medium text-white inline-flex items-center"
                style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
              >
                Discover
              </Link>
            </div>
          ) : (
            threads.map((t) => (
              <ThreadRow
                key={t.id}
                thread={t}
                myId={me?.userId ?? ''}
                isActive={activeId === t.id}
                onClick={() => openThread(t.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Right panel (message thread) ────────────────────────────────────── */}
      <div
        className={`
          flex-1 flex flex-col min-w-0
          ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
        `}
      >
        <AnimatePresence mode="wait">
          {activeThread && me ? (
            <motion.div
              key={activeThread.id}
              className="flex flex-col h-full"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <MessagePanel
                thread={activeThread}
                myId={me.userId}
                onBack={() => setMobileView('list')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="flex items-center justify-center h-full flex-col gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-muted-foreground text-sm">Select a conversation</p>
            </motion.div>
          )}
        </AnimatePresence>
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
