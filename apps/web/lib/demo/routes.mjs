// Demo route table. Plain data, shared by lib/demo/router.ts (dispatch) and
// scripts/check-demo-coverage.mjs (coverage gate), so the two cannot drift.
//
// ROUTES: (method, path pattern) -> handler name registered in lib/demo/handlers.
// Order matters: the first matching entry wins, so literal segments ('me',
// 'my-applications', 'unread-count') come before ':param' siblings, mirroring
// the Express route order in apps/api.
//
// DEFERRED: endpoints owned by a later slice. The router answers them with
// "Not available in the demo". Entries are allowed only under
// DEFERRED_PREFIXES (brand-, photographer-, and admin-only endpoints).

export const ROUTES = [
  // ── auth ──
  { method: 'POST', path: '/api/auth/login', handler: 'auth.login' },
  { method: 'POST', path: '/api/auth/register', handler: 'auth.register' },
  { method: 'POST', path: '/api/auth/forgot-password', handler: 'auth.forgotPassword' },
  { method: 'POST', path: '/api/auth/reset-password', handler: 'auth.resetPassword' },
  { method: 'GET', path: '/api/auth/me', handler: 'auth.me' },

  // ── models ──
  { method: 'GET', path: '/api/models', handler: 'models.list' },
  { method: 'GET', path: '/api/models/me/comp-card', handler: 'models.me' },
  { method: 'GET', path: '/api/models/me', handler: 'models.me' },
  { method: 'PUT', path: '/api/models/me', handler: 'models.update' },
  { method: 'POST', path: '/api/models/me/portfolio', handler: 'models.uploadPortfolio' },
  { method: 'DELETE', path: '/api/models/me/portfolio', handler: 'models.removePortfolio' },
  { method: 'POST', path: '/api/models/me/profile-image', handler: 'models.uploadProfileImage' },
  { method: 'GET', path: '/api/models/:id', handler: 'models.get' },

  // ── public brand / photographer profiles (read-only) ──
  { method: 'GET', path: '/api/brands/:id', handler: 'profiles.brand' },
  { method: 'GET', path: '/api/photographers/:id', handler: 'profiles.photographer' },

  // ── campaigns ──
  { method: 'GET', path: '/api/campaigns', handler: 'campaigns.list' },
  { method: 'GET', path: '/api/campaigns/my-applications', handler: 'campaigns.myApplications' },
  { method: 'POST', path: '/api/campaigns', handler: 'campaigns.create' },
  { method: 'PUT', path: '/api/campaigns/applications/:applicationId/status', handler: 'campaigns.updateApplicationStatus' },
  { method: 'GET', path: '/api/campaigns/:id/my-application', handler: 'campaigns.myApplication' },
  { method: 'GET', path: '/api/campaigns/:id/applications', handler: 'campaigns.listApplications' },
  { method: 'POST', path: '/api/campaigns/:id/apply', handler: 'campaigns.apply' },
  { method: 'GET', path: '/api/campaigns/:id', handler: 'campaigns.get' },
  { method: 'PUT', path: '/api/campaigns/:id', handler: 'campaigns.update' },

  // ── messaging ──
  { method: 'GET', path: '/api/threads', handler: 'threads.list' },
  { method: 'GET', path: '/api/threads/unread-count', handler: 'threads.unreadCount' },
  { method: 'POST', path: '/api/threads', handler: 'threads.create' },
  { method: 'GET', path: '/api/threads/:id/messages', handler: 'threads.messages' },
  { method: 'POST', path: '/api/threads/:id/messages', handler: 'threads.send' },
  { method: 'POST', path: '/api/threads/:id/read', handler: 'threads.read' },

  // ── swipe ──
  { method: 'GET', path: '/api/swipe/queue', handler: 'swipe.queue' },
  { method: 'POST', path: '/api/swipe/like', handler: 'swipe.like' },
  { method: 'POST', path: '/api/swipe/pass', handler: 'swipe.pass' },
  { method: 'GET', path: '/api/swipe/matches', handler: 'swipe.matches' },

  // ── saved boards ──
  { method: 'GET', path: '/api/saved', handler: 'saved.list' },
  { method: 'POST', path: '/api/saved', handler: 'saved.create' },
  { method: 'GET', path: '/api/saved/check/:savedId', handler: 'saved.check' },
  { method: 'DELETE', path: '/api/saved/:savedId', handler: 'saved.remove' },

  // ── reviews ──
  { method: 'POST', path: '/api/reviews', handler: 'reviews.create' },
  { method: 'GET', path: '/api/reviews/:userId', handler: 'reviews.list' },
  { method: 'POST', path: '/api/structured-reviews', handler: 'structuredReviews.create' },
  { method: 'POST', path: '/api/structured-reviews/:id/respond', handler: 'structuredReviews.respond' },
  { method: 'GET', path: '/api/structured-reviews/:userId', handler: 'structuredReviews.list' },

  // ── community ──
  { method: 'GET', path: '/api/working-together', handler: 'community.feed' },
  { method: 'POST', path: '/api/working-together', handler: 'community.create' },
  { method: 'POST', path: '/api/working-together/:id/respond', handler: 'community.respond' },

  // ── content ──
  { method: 'GET', path: '/api/spotlights/current', handler: 'content.spotlights' },
  { method: 'POST', path: '/api/spotlights', handler: 'content.upsertSpotlight' },
  { method: 'DELETE', path: '/api/spotlights/:userId', handler: 'content.deleteSpotlight' },
  { method: 'GET', path: '/api/tutorials', handler: 'content.tutorials' },

  // ── trust & safety ──
  { method: 'GET', path: '/api/blocks', handler: 'safety.listBlocks' },
  { method: 'POST', path: '/api/blocks', handler: 'safety.block' },
  { method: 'DELETE', path: '/api/blocks/:blockedId', handler: 'safety.unblock' },
  { method: 'POST', path: '/api/reports', handler: 'safety.report' },
  { method: 'GET', path: '/api/verification/me', handler: 'safety.verificationMe' },
  { method: 'POST', path: '/api/verification/submit', handler: 'safety.verificationSubmit' },
];

export const DEFERRED_PREFIXES = ['/api/brands', '/api/photographers', '/api/admin'];

export const DEFERRED = [
  // slice 2 (Brand)
  { method: 'GET', path: '/api/brands/me', slice: 'brand' },
  // slice 2 (Brand)
  { method: 'PUT', path: '/api/brands/me', slice: 'brand' },
  // slice 2 (Brand)
  { method: 'GET', path: '/api/brands/me/campaigns', slice: 'brand' },
  // slice 2 (Brand)
  { method: 'POST', path: '/api/brands/me/logo', slice: 'brand' },

  // slice 3 (Photographer)
  { method: 'GET', path: '/api/photographers/me', slice: 'photographer' },
  // slice 3 (Photographer)
  { method: 'PUT', path: '/api/photographers/me', slice: 'photographer' },
  // slice 3 (Photographer)
  { method: 'POST', path: '/api/photographers/me/profile-image', slice: 'photographer' },
  // slice 3 (Photographer)
  { method: 'POST', path: '/api/photographers/me/portfolio', slice: 'photographer' },
  // slice 3 (Photographer)
  { method: 'DELETE', path: '/api/photographers/me/portfolio', slice: 'photographer' },

  // slice 4 (Admin)
  { method: 'GET', path: '/api/admin/stats', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'GET', path: '/api/admin/activity', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'GET', path: '/api/admin/users', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'DELETE', path: '/api/admin/users/:id', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'PUT', path: '/api/admin/users/:id/approve', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'PUT', path: '/api/admin/users/:id/unapprove', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'PUT', path: '/api/admin/users/:id/clear-flag', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'POST', path: '/api/admin/users/:id/warn', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'GET', path: '/api/admin/flagged-users', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'GET', path: '/api/admin/campaigns', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'PUT', path: '/api/admin/campaigns/:id/flag', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'PUT', path: '/api/admin/campaigns/:id/close', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'GET', path: '/api/admin/verification-queue', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'PUT', path: '/api/admin/verification/:id/approve', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'PUT', path: '/api/admin/verification/:id/reject', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'GET', path: '/api/admin/reports', slice: 'admin' },
  // slice 4 (Admin)
  { method: 'PUT', path: '/api/admin/reports/:id/resolve', slice: 'admin' },
];
