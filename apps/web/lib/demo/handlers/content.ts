import { newId } from '../store';
import { fail, findUser, iso, requireRole, t, type HandlerMap } from './util';

// Mirrors apps/api/src/routes/spotlights.ts and tutorials.ts

function startOfWeek(now: number): number {
  const d = new Date(now);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const contentHandlers: HandlerMap = {
  // Deliberate deviation: the real route only returns spotlights for the
  // current week. Fixture spotlights would expire a week after seeding, so the
  // demo returns them all.
  'content.spotlights': ({ state }) =>
    [...state.spotlights]
      .sort((a, b) => t(a.createdAt) - t(b.createdAt))
      .map((s) => {
        const u = findUser(state, s.userId);
        const m = state.modelProfiles.find((p) => p.userId === s.userId);
        const ph = state.photographerProfiles.find((p) => p.userId === s.userId);
        const b = state.brandProfiles.find((p) => p.userId === s.userId);
        return {
          ...s,
          user: {
            id: s.userId,
            role: u?.role ?? '',
            modelProfile: m ? { displayName: m.displayName, profileImage: m.profileImage ?? null, location: m.location ?? null, tags: m.tags } : null,
            photographerProfile: ph ? { displayName: ph.displayName, profileImage: ph.profileImage ?? null, location: ph.location ?? null, specialties: ph.specialties } : null,
            brandProfile: b ? { brandName: b.brandName, logoUrl: b.logoUrl ?? null, location: b.location ?? null, industry: b.industry ?? null } : null,
          },
        };
      }),

  // Admin-only (reachable once the Admin persona ships).
  'content.upsertSpotlight': (ctx) => {
    requireRole(ctx, 'ADMIN');
    const { userId, type, reason } = ctx.body ?? {};
    if (!userId || !type || !reason) fail(400, 'userId, type, reason required');
    if (!findUser(ctx.state, userId)) fail(400, 'Failed to create spotlight');
    const weekOf = iso(startOfWeek(ctx.now));
    const existing = ctx.state.spotlights.find((s) => s.userId === userId);
    if (existing) {
      Object.assign(existing, { type, reason, weekOf });
      return existing;
    }
    const spotlight = { id: newId('sp'), userId, type, reason, weekOf, createdAt: iso(ctx.now) };
    ctx.state.spotlights.push(spotlight);
    return spotlight;
  },

  'content.deleteSpotlight': (ctx) => {
    requireRole(ctx, 'ADMIN');
    ctx.state.spotlights = ctx.state.spotlights.filter((s) => s.userId !== ctx.params.userId);
    return { ok: true };
  },

  'content.tutorials': ({ state }) =>
    state.tutorials.filter((x) => x.published).sort((a, b) => t(b.createdAt) - t(a.createdAt)),
};
