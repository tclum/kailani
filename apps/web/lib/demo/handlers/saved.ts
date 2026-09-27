import { newId } from '../store';
import { fail, findUser, iso, requireAuth, t, type HandlerMap } from './util';

// Mirrors apps/api/src/routes/saved.ts. The UI only offers saving to brands,
// so these become reachable once the Brand persona ships.

export const savedHandlers: HandlerMap = {
  'saved.list': (ctx) => {
    const userId = requireAuth(ctx);
    const { state } = ctx;
    const grouped: Record<string, unknown[]> = {};
    const rows = state.saved.filter((s) => s.savedById === userId).sort((a, b) => t(b.createdAt) - t(a.createdAt));
    for (const s of rows) {
      const u = findUser(state, s.savedId);
      if (!u) continue;
      const m = state.modelProfiles.find((p) => p.userId === u.id);
      const ph = state.photographerProfiles.find((p) => p.userId === u.id);
      const b = state.brandProfiles.find((p) => p.userId === u.id);
      const user = {
        id: u.id,
        role: u.role,
        modelProfile: m ? { id: m.id, userId: m.userId, displayName: m.displayName, profileImage: m.profileImage ?? null, coverImage: m.coverImage ?? null, location: m.location ?? null, tags: m.tags } : null,
        photographerProfile: ph ? { id: ph.id, userId: ph.userId, displayName: ph.displayName, profileImage: ph.profileImage ?? null, location: ph.location ?? null, specialties: ph.specialties } : null,
        brandProfile: b ? { id: b.id, userId: b.userId, brandName: b.brandName, logoUrl: b.logoUrl ?? null, profileImage: b.profileImage ?? null, location: b.location ?? null } : null,
      };
      (grouped[s.boardName] ??= []).push({ savedId: s.id, savedUserId: s.savedId, boardName: s.boardName, createdAt: s.createdAt, user });
    }
    return { grouped, boards: Object.keys(grouped) };
  },

  'saved.create': (ctx) => {
    const userId = requireAuth(ctx);
    const savedId = ctx.body?.savedId;
    if (typeof savedId !== 'string' || !savedId) fail(400, 'savedId required');
    const boardName = typeof ctx.body?.boardName === 'string' && ctx.body.boardName ? ctx.body.boardName : 'Saved';
    if (ctx.state.saved.some((s) => s.savedById === userId && s.savedId === savedId && s.boardName === boardName)) {
      fail(409, 'Already saved to this board');
    }
    const entry = { id: newId('sv'), savedById: userId, savedId, boardName, createdAt: iso(ctx.now) };
    ctx.state.saved.push(entry);
    return entry;
  },

  'saved.check': (ctx) => {
    const userId = requireAuth(ctx);
    const boards = ctx.state.saved.filter((s) => s.savedById === userId && s.savedId === ctx.params.savedId).map((s) => s.boardName);
    return { saved: boards.length > 0, boards };
  },

  'saved.remove': (ctx) => {
    const userId = requireAuth(ctx);
    const boardName = ctx.query.get('boardName');
    ctx.state.saved = ctx.state.saved.filter(
      (s) => !(s.savedById === userId && s.savedId === ctx.params.savedId && (!boardName || s.boardName === boardName)),
    );
    return undefined;
  },
};
