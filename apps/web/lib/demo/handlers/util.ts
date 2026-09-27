import type { DemoState, DemoUser } from '../types';

export interface Ctx {
  state: DemoState;
  params: Record<string, string>;
  query: URLSearchParams;
  /** Parsed JSON body, or FormData for uploads. */
  body: any;
  userId: string | null;
  role: string | null;
  now: number;
}

export type Handler = (ctx: Ctx) => unknown;
export type HandlerMap = Record<string, Handler>;

/** Error thrown by handlers. The router rethrows it as `{ error, code? }`, like the real API. */
export interface DemoHttpError {
  status: number;
  error: string;
  code?: string;
}

export function fail(status: number, error: string, code?: string): never {
  const err: DemoHttpError = { status, error, ...(code ? { code } : {}) };
  throw err;
}

// Mirrors apps/api/src/middleware/auth.ts
export function requireAuth(ctx: Ctx): string {
  if (!ctx.userId) fail(401, 'Missing or invalid Authorization header');
  return ctx.userId;
}

export function requireRole(ctx: Ctx, ...roles: string[]): string {
  const userId = requireAuth(ctx);
  if (!ctx.role || !roles.includes(ctx.role)) fail(403, 'Forbidden');
  return userId;
}

export const iso = (ms: number) => new Date(ms).toISOString();
export const t = (s: string | null | undefined) => (s ? new Date(s).getTime() : 0);

export function findUser(state: DemoState, id: string): DemoUser | undefined {
  return state.users.find((u) => u.id === id);
}

// ─── Prisma `select` equivalents used across routes ───────────────────────────

/** message.service.ts `userSelect` */
export function messageUser(state: DemoState, id: string) {
  const u = findUser(state, id);
  const m = state.modelProfiles.find((p) => p.userId === id);
  const b = state.brandProfiles.find((p) => p.userId === id);
  const ph = state.photographerProfiles.find((p) => p.userId === id);
  return {
    id,
    email: u?.email ?? '',
    role: u?.role ?? '',
    modelProfile: m ? { displayName: m.displayName, profileImage: m.profileImage ?? null, coverImage: m.coverImage ?? null } : null,
    brandProfile: b ? { brandName: b.brandName, logoUrl: b.logoUrl ?? null, profileImage: b.profileImage ?? null } : null,
    photographerProfile: ph ? { displayName: ph.displayName, profileImage: ph.profileImage ?? null } : null,
  };
}

/** structured-reviews.ts / working-together.ts `userProfileSelect` */
export function profileUser(state: DemoState, id: string, withFlag = false) {
  const u = findUser(state, id);
  const m = state.modelProfiles.find((p) => p.userId === id);
  const b = state.brandProfiles.find((p) => p.userId === id);
  const ph = state.photographerProfiles.find((p) => p.userId === id);
  return {
    id,
    role: u?.role ?? '',
    email: u?.email ?? '',
    ...(withFlag ? { communityFlagged: u?.communityFlagged ?? false } : {}),
    modelProfile: m ? { displayName: m.displayName, profileImage: m.profileImage ?? null } : null,
    brandProfile: b ? { brandName: b.brandName, profileImage: b.profileImage ?? null, logoUrl: b.logoUrl ?? null } : null,
    photographerProfile: ph ? { displayName: ph.displayName, profileImage: ph.profileImage ?? null } : null,
  };
}

/** reviews.ts reviewer select */
export function reviewerUser(state: DemoState, id: string) {
  const { email: _email, ...rest } = profileUser(state, id);
  return rest;
}

export function displayName(state: DemoState, id: string): string {
  const p = profileUser(state, id);
  return p.modelProfile?.displayName ?? p.brandProfile?.brandName ?? p.photographerProfile?.displayName ?? p.email;
}

/** User ids blocked by or blocking `userId`. */
export function blockedIds(state: DemoState, userId: string | null): Set<string> {
  const out = new Set<string>();
  if (!userId) return out;
  for (const b of state.blocks) {
    if (b.blockerId === userId) out.add(b.blockedId);
    if (b.blockedId === userId) out.add(b.blockerId);
  }
  return out;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
