import { ROUTES, DEFERRED } from './routes.mjs';
import { resolve } from './resolve.mjs';
import { HANDLERS } from './handlers';
import { readDemoToken } from './handlers/auth';
import type { DemoHttpError } from './handlers/util';
import { getState, persist } from './store';

// In-browser stand-in for the Express API. lib/api.ts calls demoDispatch()
// instead of fetch() when isDemo() is true. It returns the response body or
// throws `{ error, code?, status }`, matching what apiFetch callers expect.

export interface DemoRequest {
  method: string;
  path: string;
  body?: unknown;
  token: string | null;
}

export const NOT_IN_DEMO = 'Not available in the demo';

const LATENCY_MS = 120;

// resolve.mjs is plain JS; this is the shape it returns.
type Resolved =
  | { kind: 'route'; entry: { handler: string }; params: Record<string, string> }
  | { kind: 'deferred' | 'none' };

function isHttpError(e: unknown): e is DemoHttpError {
  return typeof e === 'object' && e !== null && typeof (e as DemoHttpError).status === 'number' && typeof (e as DemoHttpError).error === 'string';
}

export async function demoDispatch(req: DemoRequest): Promise<unknown> {
  // A short delay so loading states render the way they do against the real API.
  await new Promise((r) => setTimeout(r, LATENCY_MS));

  const match = resolve({ ROUTES, DEFERRED }, req.method, req.path) as Resolved;
  if (match.kind !== 'route') throw { status: 404, error: NOT_IN_DEMO };

  const handler = HANDLERS[match.entry.handler];
  if (!handler) throw { status: 404, error: NOT_IN_DEMO };

  const now = Date.now();
  const auth = readDemoToken(req.token, now);
  const state = getState();
  const query = new URLSearchParams(req.path.split('?')[1] ?? '');

  try {
    const result = handler({ state, params: match.params, query, body: req.body, userId: auth?.userId ?? null, role: auth?.role ?? null, now });
    // Detach the response from the store, as a JSON round trip over HTTP would.
    return result === undefined ? undefined : JSON.parse(JSON.stringify(result));
  } catch (e) {
    if (isHttpError(e)) throw e;
    console.error('[demo]', req.method, req.path, e);
    throw { status: 500, error: 'Internal server error' };
  } finally {
    persist();
  }
}
