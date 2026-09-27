import type { AuthResponse } from '@kailani/types';
import { personaForRole } from '../personas';
import { fail, findUser, requireAuth, type HandlerMap } from './util';

const ONE_YEAR_S = 365 * 24 * 3600;

function base64url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Unsigned three-part token whose payload decodes to { userId, role, exp }.
 * lib/auth.ts parseJwt decodes the payload with plain atob(), which rejects the
 * base64url characters '-' and '_'. The exp second is nudged until the encoded
 * payload contains neither, so parseJwt works unchanged.
 */
export function demoToken(userId: string, role: string, nowMs: number): string {
  const header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const baseExp = Math.floor(nowMs / 1000) + ONE_YEAR_S;
  for (let i = 0; i < 10_000; i++) {
    const payload = base64url(JSON.stringify({ userId, role, exp: baseExp + i }));
    if (!/[-_]/.test(payload)) return `${header}.${payload}.`;
  }
  throw new Error('Could not build demo token');
}

/** Decode a demo token. Returns null for anything malformed or expired. */
export function readDemoToken(token: string | null, nowMs: number): { userId: string; role: string } | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const p = JSON.parse(json) as { userId?: string; role?: string; exp?: number };
    if (!p.userId || !p.role) return null;
    if (p.exp && p.exp * 1000 < nowMs) return null;
    return { userId: p.userId, role: p.role };
  } catch {
    return null;
  }
}

const SIGNUP_DISABLED = 'Sign-up is turned off in the demo. Pick a role on the login page.';

export const authHandlers: HandlerMap = {
  // Demo login: body { role } picks the persona for that role.
  'auth.login': ({ state, body, now }): AuthResponse => {
    const persona = personaForRole(String(body?.role ?? ''));
    if (!persona) fail(401, 'That role is not available in the demo yet');
    const u = findUser(state, persona.userId);
    if (!u) fail(401, 'Demo account missing. Use "Reset demo" to restore it.');
    return {
      accessToken: demoToken(u.id, u.role, now),
      refreshToken: 'demo-refresh-token',
      user: { id: u.id, email: u.email, role: u.role, approved: u.approved, createdAt: u.createdAt, updatedAt: u.updatedAt },
    };
  },

  'auth.register': () => fail(400, SIGNUP_DISABLED),
  'auth.forgotPassword': () => fail(400, SIGNUP_DISABLED),
  'auth.resetPassword': () => fail(400, SIGNUP_DISABLED),

  'auth.me': (ctx) => {
    const userId = requireAuth(ctx);
    const u = findUser(ctx.state, userId);
    if (!u) fail(404, 'User not found');
    return { id: u.id, email: u.email, role: u.role, approved: u.approved, emailVerified: u.emailVerified, verified: u.verified };
  },
};
