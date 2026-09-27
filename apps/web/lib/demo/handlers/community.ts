import type { DemoPost, DemoState } from '../types';
import { newId } from '../store';
import { fail, iso, profileUser, requireAuth, t, type HandlerMap } from './util';

// Mirrors apps/api/src/routes/working-together.ts

const HOURS_48 = 48 * 3600_000;

function participants(state: DemoState, campaignId: string): Set<string> {
  const c = state.campaigns.find((x) => x.id === campaignId);
  const out = new Set<string>();
  if (!c) return out;
  const brandUserId = state.brandProfiles.find((b) => b.id === c.brandId)?.userId;
  if (brandUserId) out.add(brandUserId);
  for (const a of state.applications) {
    if (a.campaignId === campaignId && a.status === 'ACCEPTED') {
      const m = state.modelProfiles.find((p) => p.id === a.modelId);
      if (m) out.add(m.userId);
    }
  }
  return out;
}

function postRow(state: DemoState, p: DemoPost) {
  const c = state.campaigns.find((x) => x.id === p.campaignId);
  const brandName = state.brandProfiles.find((b) => b.id === c?.brandId)?.brandName ?? '';
  return { ...p, author: profileUser(state, p.authorId), campaign: { id: p.campaignId, title: c?.title ?? '', brand: { brandName } } };
}

export const communityHandlers: HandlerMap = {
  'community.feed': (ctx) => {
    const userId = requireAuth(ctx);
    const { state, now } = ctx;
    for (const p of state.posts) if (!p.isPublic && t(p.responseDeadline) < now) p.isPublic = true;
    const newestFirst = (a: DemoPost, b: DemoPost) => t(b.createdAt) - t(a.createdAt);

    const posts = state.posts.filter((p) => p.isPublic && !p.adminFlagged).sort(newestFirst).slice(0, 50).map((p) => postRow(state, p));
    const myPending = state.posts
      .filter((p) => p.authorId === userId && !p.isPublic && t(p.responseDeadline) > now)
      .sort(newestFirst)
      .map((p) => postRow(state, p));

    const posted = new Set(state.posts.filter((p) => p.authorId === userId).map((p) => p.campaignId));
    const eligibleCampaigns = state.campaigns
      .filter((c) => c.status === 'COMPLETED' && participants(state, c.id).has(userId) && !posted.has(c.id))
      .map((c) => ({ id: c.id, title: c.title }));

    return { posts, myPending, eligibleCampaigns };
  },

  'community.create': (ctx) => {
    const authorId = requireAuth(ctx);
    const { campaignId, content } = ctx.body ?? {};
    if (typeof campaignId !== 'string' || !campaignId || typeof content !== 'string' || !content || content.length > 1000) {
      fail(400, 'Invalid data');
    }
    const { state, now } = ctx;
    const c = state.campaigns.find((x) => x.id === campaignId);
    if (!c) fail(404, 'Campaign not found');
    if (c.status !== 'COMPLETED') fail(400, 'Campaign must be completed');
    if (!participants(state, campaignId).has(authorId)) fail(403, 'You were not part of this campaign');
    const post: DemoPost = {
      id: newId('wt'),
      authorId,
      campaignId,
      content,
      isPublic: false,
      responseDeadline: iso(now + HOURS_48),
      subjectResponse: null,
      adminFlagged: false,
      createdAt: iso(now),
    };
    state.posts.push(post);
    return postRow(state, post);
  },

  'community.respond': (ctx) => {
    const userId = requireAuth(ctx);
    const response = typeof ctx.body?.response === 'string' ? ctx.body.response.trim() : '';
    if (!response) fail(400, 'response is required');
    const p = ctx.state.posts.find((x) => x.id === ctx.params.id);
    if (!p) fail(404, 'Post not found');
    if (p.authorId === userId) fail(400, 'Cannot respond to your own post');
    if (ctx.now > t(p.responseDeadline)) fail(400, 'Response window has closed');
    if (!participants(ctx.state, p.campaignId).has(userId)) fail(403, 'Not a campaign participant');
    p.subjectResponse = response;
    p.isPublic = true;
    return postRow(ctx.state, p);
  },
};
