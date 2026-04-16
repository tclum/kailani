'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAccessToken, getCurrentUser } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import type { Message } from '@kailani/types';

interface Props {
  threadId: string;
}

export function MessageThread({ threadId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const me = getCurrentUser();

  useEffect(() => {
    apiFetch<Message[]>(`/api/threads/${threadId}/messages`)
      .then(setMessages)
      .finally(() => setLoading(false));

    const socket = io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000', {
      auth: { token: getAccessToken() },
    });
    socketRef.current = socket;
    socket.emit('join_thread', threadId);
    socket.on('new_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.emit('leave_thread', threadId);
      socket.disconnect();
    };
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await apiFetch(`/api/threads/${threadId}/messages`, { method: 'POST', body: { body } });
    setBody('');
  }

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === me?.userId;
          const name =
            msg.sender?.modelProfile?.displayName ??
            msg.sender?.brandProfile?.brandName ??
            msg.sender?.photographerProfile?.displayName ??
            msg.sender?.email ??
            'Unknown';
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-muted-foreground mb-1">{name}</span>
              <div
                className={`rounded-lg px-3 py-2 text-sm max-w-[70%] ${
                  isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {msg.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="border-t p-3 flex gap-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className="flex-1"
        />
        <Button type="submit" disabled={!body.trim()}>Send</Button>
      </form>
    </div>
  );
}
