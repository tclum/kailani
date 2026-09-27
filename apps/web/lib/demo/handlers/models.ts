import type { DemoModelProfile } from '../types';
import { blockedIds, fail, findUser, iso, requireRole, shuffle, t, type Ctx, type HandlerMap } from './util';

// Mirrors apps/api/src/routes/models.ts and services/model.service.ts

const listSelect = (state: Ctx['state'], m: DemoModelProfile) => ({
  id: m.id,
  userId: m.userId,
  displayName: m.displayName,
  bio: m.bio ?? null,
  location: m.location ?? null,
  coverImage: m.coverImage ?? null,
  profileImage: m.profileImage ?? null,
  tags: m.tags,
  heightCm: m.heightCm ?? null,
  createdAt: m.createdAt,
  user: { verified: findUser(state, m.userId)?.verified ?? false },
});

// updateModelProfileSchema keys; anything else is stripped, as zod does.
const UPDATABLE = new Set([
  'displayName', 'bio', 'location', 'instagramUrl', 'heightCm', 'bustCm', 'waistCm', 'hipsCm', 'shoeSize',
  'hairColor', 'eyeColor', 'skinTone', 'tags', 'coverImage', 'portfolioImages', 'profileImage', 'rates',
  'availability', 'weightKg', 'build', 'playingAgeMin', 'playingAgeMax', 'gender', 'televisionCredits',
  'modelingCredits', 'filmCredits', 'commercialCredits', 'skills', 'languages', 'education', 'unionStatus',
  'representation', 'website',
]);

function myProfile(ctx: Ctx): DemoModelProfile {
  const userId = requireRole(ctx, 'MODEL');
  const profile = ctx.state.modelProfiles.find((p) => p.userId === userId);
  if (!profile) fail(404, 'Model profile not found');
  return profile;
}

function uploadedUrl(body: unknown): string {
  const file = body instanceof FormData ? body.get('image') : null;
  if (!(file instanceof Blob)) fail(400, 'No image file provided');
  return URL.createObjectURL(file);
}

export const modelHandlers: HandlerMap = {
  'models.list': ({ state, query, userId }) => {
    const limit = query.get('limit') ? Number(query.get('limit')) : 20;
    const approved = (m: DemoModelProfile) => findUser(state, m.userId)?.approved === true;

    if (query.get('featured') === 'true') {
      const withPortfolio = state.modelProfiles.filter((m) => approved(m) && m.profileImage && m.portfolioImages.length > 0);
      const profiles = shuffle(withPortfolio).slice(0, limit).map((m) => listSelect(state, m));
      return { profiles, total: profiles.length, page: 1, limit };
    }

    const page = query.get('page') ? Number(query.get('page')) : 1;
    const location = query.get('location');
    const tags = query.get('tags')?.split(',');
    const blocked = blockedIds(state, userId);
    const filtered = state.modelProfiles
      .filter(approved)
      .filter((m) => !blocked.has(m.userId))
      .filter((m) => !location || (m.location ?? '').toLowerCase().includes(location.toLowerCase()))
      .filter((m) => !tags || tags.length === 0 || m.tags.some((tag) => tags.includes(tag)))
      .sort((a, b) => t(b.createdAt) - t(a.createdAt));
    const profiles = filtered.slice((page - 1) * limit, page * limit).map((m) => listSelect(state, m));
    return { profiles, total: filtered.length, page, limit };
  },

  // GET /me and GET /me/comp-card both return getMyModel(): the bare profile row.
  'models.me': (ctx) => myProfile(ctx),

  'models.get': ({ state, params }) => {
    const m = state.modelProfiles.find((p) => p.userId === params.id);
    const u = m && findUser(state, m.userId);
    if (!m || !u || !u.approved) fail(404, 'Model not found');
    return { ...m, user: { id: u.id, email: u.email, approved: u.approved, verified: u.verified } };
  },

  'models.update': (ctx) => {
    const profile = myProfile(ctx);
    const body = (ctx.body ?? {}) as Record<string, unknown>;
    if (typeof body.bio === 'string' && body.bio.length > 400) fail(400, 'String must contain at most 400 character(s)');
    for (const [k, v] of Object.entries(body)) {
      if (UPDATABLE.has(k) && v !== undefined) (profile as unknown as Record<string, unknown>)[k] = v;
    }
    profile.updatedAt = iso(ctx.now);
    return profile;
  },

  'models.uploadPortfolio': (ctx) => {
    const profile = myProfile(ctx);
    const url = uploadedUrl(ctx.body);
    profile.portfolioImages = [...profile.portfolioImages, url];
    profile.updatedAt = iso(ctx.now);
    return { url };
  },

  'models.removePortfolio': (ctx) => {
    const profile = myProfile(ctx);
    const url = ctx.body?.url as string | undefined;
    if (!url) fail(400, 'url is required');
    profile.portfolioImages = profile.portfolioImages.filter((u) => u !== url);
    if (profile.coverImage === url) profile.coverImage = undefined;
    profile.updatedAt = iso(ctx.now);
    return profile;
  },

  'models.uploadProfileImage': (ctx) => {
    const profile = myProfile(ctx);
    const url = uploadedUrl(ctx.body);
    profile.profileImage = url;
    profile.updatedAt = iso(ctx.now);
    return { url, profile };
  },
};
