import type { DemoState } from '../types';
import { newId } from '../store';
import { fail, findUser, iso, profileUser, requireAuth, reviewerUser, t, type Ctx, type HandlerMap } from './util';

// Mirrors apps/api/src/routes/reviews.ts and structured-reviews.ts

const FLAG_KEYWORDS = ['late', 'payment', 'unsafe', 'unprofessional', 'harassment', 'inappropriate'];
const HOURS_48 = 48 * 3600_000;

const brandUserOf = (state: DemoState, campaignId: string) => {
  const c = state.campaigns.find((x) => x.id === campaignId);
  return c ? state.brandProfiles.find((b) => b.id === c.brandId)?.userId : undefined;
};

function acceptedOn(state: DemoState, campaignId: string, modelUserId: string): boolean {
  const m = state.modelProfiles.find((p) => p.userId === modelUserId);
  return !!m && state.applications.some((a) => a.campaignId === campaignId && a.modelId === m.id && a.status === 'ACCEPTED');
}

/** reviews.ts participant rule: brand <-> accepted model on a COMPLETED campaign. */
function legacyParticipant(state: DemoState, reviewerId: string, revieweeId: string, campaignId: string): boolean {
  const brandUserId = brandUserOf(state, campaignId);
  if (reviewerId === brandUserId) return acceptedOn(state, campaignId, revieweeId);
  return revieweeId === brandUserId && acceptedOn(state, campaignId, reviewerId);
}

/** structured-reviews.ts validateParticipant */
function structuredParticipant(state: DemoState, reviewerId: string, revieweeId: string, campaignId: string): boolean {
  const c = state.campaigns.find((x) => x.id === campaignId);
  if (!c || c.status !== 'COMPLETED') return false;
  const brandUserId = brandUserOf(state, campaignId);
  if (reviewerId === brandUserId) {
    if (acceptedOn(state, campaignId, revieweeId)) return true;
    if (state.photographerProfiles.some((p) => p.userId === revieweeId)) return true;
  }
  if (revieweeId === brandUserId && acceptedOn(state, campaignId, reviewerId)) return true;
  if (revieweeId === brandUserId && state.photographerProfiles.some((p) => p.userId === reviewerId)) return true;
  return false;
}

function calcOverall(dimensions: Record<string, unknown>): number {
  const nums = Object.entries(dimensions)
    .filter(([k, v]) => typeof v === 'number' && k !== 'wouldWorkAgain')
    .map(([, v]) => v as number);
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function autoPublish(state: DemoState, now: number) {
  for (const r of state.structuredReviews) if (!r.isPublic && t(r.responseDeadline) < now) r.isPublic = true;
  for (const p of state.posts) if (!p.isPublic && t(p.responseDeadline) < now) p.isPublic = true;
}

function checkRedFlag(state: DemoState, revieweeId: string) {
  const text = state.structuredReviews
    .filter((r) => r.revieweeId === revieweeId && r.isPublic)
    .map((r) => r.comment ?? '')
    .join(' ')
    .toLowerCase();
  if (FLAG_KEYWORDS.some((kw) => text.split(kw).length - 1 >= 3)) {
    const u = findUser(state, revieweeId);
    if (u) u.communityFlagged = true;
  }
}

const campaignRef = (state: DemoState, id: string) => {
  const c = state.campaigns.find((x) => x.id === id);
  return { id, title: c?.title ?? '' };
};

function structuredRow(ctx: Ctx, r: DemoState['structuredReviews'][number]) {
  return { ...r, reviewer: profileUser(ctx.state, r.reviewerId, true), campaign: campaignRef(ctx.state, r.campaignId) };
}

export const reviewHandlers: HandlerMap = {
  // ── /api/reviews (star rating + comment) ──

  'reviews.create': (ctx) => {
    const reviewerId = requireAuth(ctx);
    const { revieweeId, campaignId, rating, comment } = ctx.body ?? {};
    if (typeof revieweeId !== 'string' || typeof campaignId !== 'string' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      fail(400, 'Invalid review data');
    }
    if (reviewerId === revieweeId) fail(400, 'Cannot review yourself');
    const { state, now } = ctx;
    const c = state.campaigns.find((x) => x.id === campaignId);
    if (!c) fail(404, 'Campaign not found');
    if (c.status !== 'COMPLETED') fail(400, 'Campaign must be completed before leaving a review');
    if (!legacyParticipant(state, reviewerId, revieweeId, campaignId)) fail(403, 'You were not part of this campaign');
    if (state.reviews.some((r) => r.reviewerId === reviewerId && r.revieweeId === revieweeId && r.campaignId === campaignId)) {
      fail(409, 'You have already reviewed this person for this campaign');
    }
    const review = { id: newId('rv'), reviewerId, revieweeId, campaignId, rating, comment: comment ?? null, createdAt: iso(now) };
    state.reviews.push(review);
    return { ...review, reviewer: reviewerUser(state, reviewerId) };
  },

  'reviews.list': ({ state, params }) => {
    const reviews = state.reviews
      .filter((r) => r.revieweeId === params.userId)
      .sort((a, b) => t(b.createdAt) - t(a.createdAt))
      .map((r) => ({ ...r, reviewer: reviewerUser(state, r.reviewerId), campaign: campaignRef(state, r.campaignId) }));
    const total = reviews.length;
    const average = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : null;
    return { reviews, total, average };
  },

  // ── /api/structured-reviews (per-dimension, 48 h response window) ──

  'structuredReviews.create': (ctx) => {
    const reviewerId = requireAuth(ctx);
    const { revieweeId, campaignId, dimensions, comment } = ctx.body ?? {};
    if (typeof revieweeId !== 'string' || typeof campaignId !== 'string' || !dimensions || typeof dimensions !== 'object') {
      fail(400, 'Invalid data');
    }
    if (reviewerId === revieweeId) fail(400, 'Cannot review yourself');
    const { state, now } = ctx;
    if (!structuredParticipant(state, reviewerId, revieweeId, campaignId)) fail(403, 'You were not part of this completed campaign');
    if (state.structuredReviews.some((r) => r.reviewerId === reviewerId && r.revieweeId === revieweeId && r.campaignId === campaignId)) {
      fail(409, 'You have already reviewed this person for this campaign');
    }
    const review = {
      id: newId('sr'),
      reviewerId,
      revieweeId,
      campaignId,
      dimensions,
      overallRating: calcOverall(dimensions),
      comment: comment ?? null,
      reviewerResponse: null,
      responseDeadline: iso(now + HOURS_48),
      isPublic: false,
      flagCount: 0,
      adminFlagged: false,
      createdAt: iso(now),
      updatedAt: iso(now),
    };
    state.structuredReviews.push(review);
    return { ...review, reviewer: profileUser(state, reviewerId, true), reviewee: profileUser(state, revieweeId, true), campaign: campaignRef(state, campaignId) };
  },

  'structuredReviews.respond': (ctx) => {
    const userId = requireAuth(ctx);
    const response = typeof ctx.body?.response === 'string' ? ctx.body.response.trim() : '';
    if (!response) fail(400, 'response is required');
    const r = ctx.state.structuredReviews.find((x) => x.id === ctx.params.id);
    if (!r) fail(404, 'Review not found');
    if (r.revieweeId !== userId) fail(403, 'Not your review');
    if (ctx.now > t(r.responseDeadline)) fail(400, 'Response window has closed');
    r.reviewerResponse = response;
    r.isPublic = true;
    r.updatedAt = iso(ctx.now);
    checkRedFlag(ctx.state, r.revieweeId);
    return structuredRow(ctx, r);
  },

  'structuredReviews.list': (ctx) => {
    const { state, params, userId, now } = ctx;
    autoPublish(state, now);
    const target = params.userId;
    const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) => t(b.createdAt) - t(a.createdAt);

    const reviews = state.structuredReviews
      .filter((r) => r.revieweeId === target && (r.isPublic || t(r.responseDeadline) < now))
      .sort(newestFirst)
      .map((r) => structuredRow(ctx, r));

    const pendingForMe = userId === target
      ? state.structuredReviews.filter((r) => r.revieweeId === target && !r.isPublic && t(r.responseDeadline) > now).sort(newestFirst).map((r) => structuredRow(ctx, r))
      : [];

    const eligibleCampaigns: { campaignId: string; title: string }[] = [];
    if (userId && userId !== target) {
      const reviewed = new Set(state.structuredReviews.filter((r) => r.reviewerId === userId && r.revieweeId === target).map((r) => r.campaignId));
      for (const c of state.campaigns.filter((x) => x.status === 'COMPLETED')) {
        if (!reviewed.has(c.id) && structuredParticipant(state, userId, target, c.id)) {
          eligibleCampaigns.push({ campaignId: c.id, title: c.title });
        }
      }
    }

    const reviewee = findUser(state, target);
    const total = reviews.length;
    return {
      reviews,
      pendingForMe,
      total,
      avgRating: total > 0 ? reviews.reduce((s, r) => s + r.overallRating, 0) / total : null,
      wouldWorkAgainPct: total > 0 ? Math.round((reviews.filter((r) => r.dimensions?.wouldWorkAgain === true).length / total) * 100) : null,
      communityFlagged: reviewee?.communityFlagged ?? false,
      revieweeRole: reviewee?.role ?? null,
      canReview: eligibleCampaigns.length > 0,
      eligibleCampaigns,
    };
  },
};
