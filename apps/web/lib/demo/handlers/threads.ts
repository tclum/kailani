import type { DemoMessage, DemoState, DemoThread } from '../types';
import { GENERIC_REPLIES, SCRIPTED_REPLIES } from '../fixtures/social';
import { newId } from '../store';
import { fail, findUser, iso, messageUser, requireAuth, t, type HandlerMap } from './util';

// Mirrors apps/api/src/routes/messages.ts and services/message.service.ts.
//
// Scripted replies: when the signed-in user messages a fixture user, the
// reply is written immediately with a createdAt 2–4 s in the future. Every
// read below only returns messages whose createdAt is at or before now, so
// the reply surfaces through the inbox's existing ?after= polling, no timers.

const visible = (m: DemoMessage, now: number) => t(m.createdAt) <= now;

function threadMessages(state: DemoState, threadId: string, now: number): DemoMessage[] {
  return state.messages
    .filter((m) => m.threadId === threadId && visible(m, now))
    .sort((a, b) => t(a.createdAt) - t(b.createdAt));
}

function unreadIn(state: DemoState, thread: DemoThread, userId: string, now: number): number {
  const lastRead = t(thread.members.find((m) => m.userId === userId)?.lastReadAt);
  return threadMessages(state, thread.id, now).filter((m) => m.senderId !== userId && (!lastRead || t(m.createdAt) > lastRead)).length;
}

function memberThread(state: DemoState, threadId: string, userId: string): DemoThread {
  const thread = state.threads.find((x) => x.id === threadId);
  if (!thread || !thread.members.some((m) => m.userId === userId)) fail(403, 'Not a member of this thread');
  return thread;
}

const withSender = (state: DemoState, m: DemoMessage) => ({ ...m, sender: messageUser(state, m.senderId) });

function scheduleReply(state: DemoState, thread: DemoThread, senderId: string, now: number, sentAt: number) {
  const other = thread.members.find((m) => m.userId !== senderId)?.userId;
  if (!other || !findUser(state, other)) return;
  const script = SCRIPTED_REPLIES[other] ?? GENERIC_REPLIES;
  // Count only messages sent during the demo, so the first reply is the script's first line.
  const sentSoFar = state.messages.filter((m) => m.threadId === thread.id && m.senderId === senderId && t(m.createdAt) > t(state.seededAt)).length;
  const body = script[(sentSoFar - 1 + script.length) % script.length];
  const delay = 2000 + Math.floor(Math.random() * 2000);
  state.messages.push({ id: newId('m'), threadId: thread.id, senderId: other, body, createdAt: iso(Math.max(now, sentAt) + delay) });
}

export const threadHandlers: HandlerMap = {
  'threads.list': (ctx) => {
    const userId = requireAuth(ctx);
    const { state, now } = ctx;
    return state.threads
      .filter((th) => th.members.some((m) => m.userId === userId))
      .map((th) => {
        const msgs = threadMessages(state, th.id, now);
        const last = msgs[msgs.length - 1];
        return {
          id: th.id,
          createdAt: th.createdAt,
          members: th.members.map((m) => ({ threadId: th.id, userId: m.userId, lastReadAt: m.lastReadAt, user: messageUser(state, m.userId) })),
          messages: last ? [last] : [],
          unreadCount: unreadIn(state, th, userId, now),
        };
      })
      .sort((a, b) => t(b.messages[0]?.createdAt ?? b.createdAt) - t(a.messages[0]?.createdAt ?? a.createdAt));
  },

  'threads.unreadCount': (ctx) => {
    const userId = requireAuth(ctx);
    const count = ctx.state.threads
      .filter((th) => th.members.some((m) => m.userId === userId))
      .reduce((sum, th) => sum + unreadIn(ctx.state, th, userId, ctx.now), 0);
    return { count };
  },

  'threads.create': (ctx) => {
    const userId = requireAuth(ctx);
    const recipientId = ctx.body?.recipientId;
    if (typeof recipientId !== 'string' || !recipientId) fail(400, 'recipientId is required');
    const { state } = ctx;
    if (!findUser(state, recipientId)) fail(404, 'Recipient not found');
    const existing = state.threads.find(
      (th) => th.members.some((m) => m.userId === userId) && th.members.some((m) => m.userId === recipientId),
    );
    if (existing) return { id: existing.id, createdAt: existing.createdAt };
    const thread: DemoThread = {
      id: newId('t'),
      createdAt: iso(ctx.now),
      members: [{ userId, lastReadAt: null }, { userId: recipientId, lastReadAt: null }],
    };
    state.threads.push(thread);
    return { id: thread.id, createdAt: thread.createdAt };
  },

  'threads.messages': (ctx) => {
    const userId = requireAuth(ctx);
    const { state, params, query, now } = ctx;
    memberThread(state, params.id, userId);
    const afterRaw = query.get('after');
    const after = afterRaw ? new Date(afterRaw).getTime() : NaN;
    return threadMessages(state, params.id, now)
      .filter((m) => Number.isNaN(after) || t(m.createdAt) > after)
      .map((m) => withSender(state, m));
  },

  'threads.send': (ctx) => {
    const userId = requireAuth(ctx);
    const body = ctx.body?.body;
    if (typeof body !== 'string' || body.length === 0) fail(400, 'Message body is required');
    const { state, params, now } = ctx;
    // The real route does not check membership on send; the FK fails as a 500.
    const thread = state.threads.find((x) => x.id === params.id);
    if (!thread) fail(500, 'Failed to send message');
    // InboxPage moves its ?after= cursor to the sent message's createdAt. A reply
    // that became visible since the last 3 s poll would sit behind that cursor
    // and never be fetched, so the sent message is dated just before it.
    const recentReplies = state.messages
      .filter((m) => m.threadId === thread.id && m.senderId !== userId && visible(m, now) && t(m.createdAt) > now - 4000)
      .map((m) => t(m.createdAt));
    const sentAt = recentReplies.length ? Math.min(...recentReplies) - 1 : now;
    const message: DemoMessage = { id: newId('m'), threadId: thread.id, senderId: userId, body, createdAt: iso(sentAt) };
    state.messages.push(message);
    scheduleReply(state, thread, userId, now, sentAt);
    return withSender(state, message);
  },

  'threads.read': (ctx) => {
    const userId = requireAuth(ctx);
    const thread = ctx.state.threads.find((x) => x.id === ctx.params.id);
    const member = thread?.members.find((m) => m.userId === userId);
    if (member) member.lastReadAt = iso(ctx.now);
    return { ok: true };
  },
};
