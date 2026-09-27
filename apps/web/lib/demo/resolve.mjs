// Route resolution shared by lib/demo/router.ts and
// scripts/check-demo-coverage.mjs, so dispatch and the coverage gate agree on
// what "matched" means.
//
// DEFERRED is consulted before ROUTES, so a deferred literal such as
// GET /api/brands/me is never swallowed by the routed GET /api/brands/:id.

function segments(path) {
  const bare = path.split('?')[0].split('#')[0];
  return bare.split('/').filter((s) => s.length > 0);
}

/** Match a pattern ('/api/models/:id') against a path. Returns params or null. */
export function matchPattern(pattern, path) {
  const p = segments(pattern);
  const s = segments(path);
  if (p.length !== s.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) {
      params[p[i].slice(1)] = decodeURIComponent(s[i]);
    } else if (p[i] !== s[i]) {
      return null;
    }
  }
  return params;
}

/**
 * @param {{ ROUTES: Array<{method: string, path: string, handler: string}>, DEFERRED: Array<{method: string, path: string, slice: string}> }} table
 * @param {string} method
 * @param {string} path
 */
export function resolve(table, method, path) {
  const m = method.toUpperCase();
  for (const entry of table.DEFERRED) {
    if (entry.method === m && matchPattern(entry.path, path)) return { kind: 'deferred', entry };
  }
  for (const entry of table.ROUTES) {
    if (entry.method !== m) continue;
    const params = matchPattern(entry.path, path);
    if (params) return { kind: 'route', entry, params };
  }
  return { kind: 'none' };
}
