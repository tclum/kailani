import { fail, findUser, type HandlerMap } from './util';

// Public profile reads from apps/api/src/routes/brands.ts and photographers.ts.
// Their /me endpoints belong to later slices (see DEFERRED in routes.mjs).

export const profileHandlers: HandlerMap = {
  'profiles.brand': ({ state, params }) => {
    const b = state.brandProfiles.find((p) => p.userId === params.id);
    const u = b && findUser(state, b.userId);
    if (!b || !u) fail(404, 'Brand not found');
    return { ...b, user: { id: u.id, email: u.email, approved: u.approved, verified: u.verified } };
  },

  'profiles.photographer': ({ state, params }) => {
    const p = state.photographerProfiles.find((x) => x.userId === params.id);
    const u = p && findUser(state, p.userId);
    if (!p || !u || !u.approved) fail(404, 'Photographer not found');
    return { ...p, user: { id: u.id, email: u.email, approved: u.approved, verified: u.verified } };
  },
};
