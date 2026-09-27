import type { DemoState, SwipeTargetType } from '../types';
import { newId } from '../store';
import { blockedIds, fail, findUser, iso, requireAuth, t, type Ctx, type HandlerMap } from './util';
import { threadHandlers } from './threads';

// Mirrors apps/api/src/routes/swipe.ts and services/swipe.service.ts

const TARGET_TYPES: SwipeTargetType[] = ['MODEL', 'BRAND', 'PHOTOGRAPHER', 'CAMPAIGN'];

function parseSwipe(body: any): { targetId: string; targetType: SwipeTargetType } {
  const targetId = body?.targetId;
  const targetType = body?.targetType;
  if (typeof targetId !== 'string' || !targetId || !TARGET_TYPES.includes(targetType)) {
    fail(400, 'targetId and targetType required');
  }
  return { targetId, targetType };
}

function upsertSwipe(state: DemoState, swiperId: string, targetId: string, targetType: SwipeTargetType, direction: 'LIKE' | 'PASS', now: number) {
  const existing = state.swipes.find((s) => s.swiperId === swiperId && s.targetId === targetId && s.targetType === targetType);
  if (existing) existing.direction = direction;
  else state.swipes.push({ id: newId('sw'), swiperId, targetId, targetType, direction, createdAt: iso(now) });
}

function modelQueue(state: DemoState, swiped: Set<string>, blocked: Set<string>) {
  return state.campaigns
    .filter((c) => c.status === 'OPEN')
    .sort((a, b) => t(b.createdAt) - t(a.createdAt))
    .slice(0, 50)
    .map((c) => ({ c, brand: state.brandProfiles.find((b) => b.id === c.brandId) }))
    .filter(({ c, brand }) => brand && !swiped.has(`CAMPAIGN:${c.id}`) && !blocked.has(brand.userId))
    .slice(0, 10)
    .map(({ c, brand }) => ({
      id: c.id,
      targetType: 'CAMPAIGN' as const,
      name: c.title,
      image: brand!.profileImage ?? brand!.logoUrl ?? null,
      location: c.location ?? brand!.location ?? null,
      tags: c.tags,
      bio: c.description.slice(0, 160),
      brandName: brand!.brandName,
      brandImage: brand!.logoUrl ?? brand!.profileImage ?? null,
      budget: c.budget ?? null,
    }));
}

function modelCards(state: DemoState, userId: string, swiped: Set<string>, blocked: Set<string>, take: number) {
  return state.modelProfiles
    .filter((m) => findUser(state, m.userId)?.approved)
    .sort((a, b) => t(b.createdAt) - t(a.createdAt))
    .slice(0, take)
    .filter((m) => m.userId !== userId && !swiped.has(`MODEL:${m.userId}`) && !blocked.has(m.userId))
    .map((m) => ({
      id: m.userId,
      targetType: 'MODEL' as const,
      name: m.displayName,
      image: m.profileImage ?? m.coverImage ?? m.portfolioImages[0] ?? null,
      location: m.location ?? null,
      tags: m.tags,
      bio: m.bio ? m.bio.slice(0, 160) : null,
      userId: m.userId,
    }));
}

function brandCards(state: DemoState, userId: string, swiped: Set<string>, blocked: Set<string>) {
  return state.brandProfiles
    .filter((b) => findUser(state, b.userId)?.approved)
    .sort((a, b) => t(b.createdAt) - t(a.createdAt))
    .slice(0, 50)
    .filter((b) => b.userId !== userId && !swiped.has(`BRAND:${b.userId}`) && !blocked.has(b.userId))
    .map((b) => ({
      id: b.userId,
      targetType: 'BRAND' as const,
      name: b.brandName,
      image: b.profileImage ?? b.logoUrl ?? null,
      location: b.location ?? null,
      tags: b.industry ? [b.industry] : [],
      bio: b.bio ? b.bio.slice(0, 160) : null,
      userId: b.userId,
    }));
}

function queueFor(state: DemoState, userId: string, role: string | null) {
  const swiped = new Set(state.swipes.filter((s) => s.swiperId === userId).map((s) => `${s.targetType}:${s.targetId}`));
  const blocked = blockedIds(state, userId);
  if (role === 'MODEL') return modelQueue(state, swiped, blocked);
  if (role === 'BRAND') return modelCards(state, userId, swiped, blocked, 100).slice(0, 10);
  if (role === 'PHOTOGRAPHER') {
    const models = modelCards(state, userId, swiped, blocked, 50);
    const brands = brandCards(state, userId, swiped, blocked);
    const mixed: Array<(typeof models)[number] | (typeof brands)[number]> = [];
    for (let i = 0; i < Math.max(models.length, brands.length) && mixed.length < 10; i++) {
      if (models[i]) mixed.push(models[i]);
      if (mixed.length < 10 && brands[i]) mixed.push(brands[i]);
    }
    return mixed;
  }
  return [];
}

function matchedProfile(state: DemoState, userId: string) {
  const u = findUser(state, userId);
  if (!u) return { userId, name: 'Unknown', image: null, role: '' };
  const m = state.modelProfiles.find((p) => p.userId === userId);
  const b = state.brandProfiles.find((p) => p.userId === userId);
  const ph = state.photographerProfiles.find((p) => p.userId === userId);
  let name = 'Unknown';
  let image: string | null = null;
  if (m) { name = m.displayName; image = m.profileImage ?? m.coverImage ?? null; }
  else if (b) { name = b.brandName; image = b.profileImage ?? b.logoUrl ?? null; }
  else if (ph) { name = ph.displayName; image = ph.profileImage ?? null; }
  return { userId: u.id, name, image, role: u.role };
}

function matchUser(state: DemoState, id: string) {
  const u = findUser(state, id);
  const m = state.modelProfiles.find((p) => p.userId === id);
  const b = state.brandProfiles.find((p) => p.userId === id);
  const ph = state.photographerProfiles.find((p) => p.userId === id);
  return {
    id,
    role: u?.role ?? '',
    modelProfile: m ? { displayName: m.displayName, profileImage: m.profileImage ?? null, coverImage: m.coverImage ?? null, location: m.location ?? null } : null,
    brandProfile: b ? { brandName: b.brandName, logoUrl: b.logoUrl ?? null, profileImage: b.profileImage ?? null, location: b.location ?? null } : null,
    photographerProfile: ph ? { displayName: ph.displayName, profileImage: ph.profileImage ?? null, location: ph.location ?? null } : null,
  };
}

function openThread(ctx: Ctx, otherUserId: string): string {
  const thread = threadHandlers['threads.create']({ ...ctx, body: { recipientId: otherUserId } }) as { id: string };
  return thread.id;
}

export const swipeHandlers: HandlerMap = {
  'swipe.queue': (ctx) => {
    const userId = requireAuth(ctx);
    return { queue: queueFor(ctx.state, userId, ctx.role) };
  },

  'swipe.like': (ctx) => {
    const swiperId = requireAuth(ctx);
    const { targetId, targetType } = parseSwipe(ctx.body);
    const { state, now } = ctx;
    upsertSwipe(state, swiperId, targetId, targetType, 'LIKE', now);

    if (ctx.role === 'BRAND' && (targetType === 'MODEL' || targetType === 'PHOTOGRAPHER')) {
      const saved = state.saved.some((s) => s.savedById === swiperId && s.savedId === targetId && s.boardName === 'Liked');
      if (!saved) state.saved.push({ id: newId('sv'), savedById: swiperId, savedId: targetId, boardName: 'Liked', createdAt: iso(now) });
    }

    // findReverseUser: a liked campaign's "other side" is its brand's user.
    let otherUserId: string | null = targetId;
    if (targetType === 'CAMPAIGN') {
      const c = state.campaigns.find((x) => x.id === targetId);
      otherUserId = state.brandProfiles.find((b) => b.id === c?.brandId)?.userId ?? null;
    }
    if (!otherUserId || otherUserId === swiperId) return { matched: false };

    // checkReverseSwipe
    let reverse = false;
    if (targetType === 'CAMPAIGN') {
      reverse = state.swipes.some((s) => s.swiperId === otherUserId && s.targetId === swiperId && s.targetType === 'MODEL' && s.direction === 'LIKE');
    } else {
      reverse = state.swipes.some((s) => s.swiperId === otherUserId && s.targetId === swiperId && s.targetType === ctx.role && s.direction === 'LIKE');
      if (!reverse && ctx.role === 'BRAND') {
        const brand = state.brandProfiles.find((b) => b.userId === swiperId);
        if (brand) {
          const campaignIds = new Set(state.campaigns.filter((c) => c.brandId === brand.id).map((c) => c.id));
          reverse = state.swipes.some((s) => s.swiperId === otherUserId && s.targetType === 'CAMPAIGN' && campaignIds.has(s.targetId) && s.direction === 'LIKE');
        }
      }
    }
    if (!reverse) return { matched: false };

    const [user1Id, user2Id] = [swiperId, otherUserId].sort();
    if (!state.matches.some((m) => m.user1Id === user1Id && m.user2Id === user2Id)) {
      state.matches.push({ id: newId('match'), user1Id, user2Id, createdAt: iso(now) });
    }
    return { matched: true, threadId: openThread(ctx, otherUserId), matchedProfile: matchedProfile(state, otherUserId) };
  },

  'swipe.pass': (ctx) => {
    const swiperId = requireAuth(ctx);
    const { targetId, targetType } = parseSwipe(ctx.body);
    upsertSwipe(ctx.state, swiperId, targetId, targetType, 'PASS', ctx.now);
    return { ok: true };
  },

  'swipe.matches': (ctx) => {
    const userId = requireAuth(ctx);
    const { state } = ctx;
    const matches = state.matches
      .filter((m) => m.user1Id === userId || m.user2Id === userId)
      .sort((a, b) => t(b.createdAt) - t(a.createdAt))
      .map((m) => ({
        matchId: m.id,
        createdAt: m.createdAt,
        otherUser: matchUser(state, m.user1Id === userId ? m.user2Id : m.user1Id),
      }));
    return { matches };
  },
};
