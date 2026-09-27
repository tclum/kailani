#!/usr/bin/env node
// check-demo-coverage: every API path the web app calls must be answered by the
// in-browser demo backend (a route in lib/demo/routes.mjs) or be listed in
// DEFERRED for a later slice. The route table and the matcher are imported from
// the same modules lib/demo/router.ts uses, so the check and the router agree.
//
// Checks
//   1. Each apiFetch/apiUpload call in app/, components/, lib/ has a literal
//      first argument that resolves to a route or a DEFERRED entry.
//   2. No file outside lib/ calls fetch() against the API base URL.
//   3. Every DEFERRED entry sits under DEFERRED_PREFIXES and names its slice.
//   4. Every route's handler name is registered in lib/demo/handlers/.
//   5. Only lib/demo/flag.ts reads NEXT_PUBLIC_DEMO_MODE.
//
// Usage
//   node apps/web/scripts/check-demo-coverage.mjs             check the app
//   node apps/web/scripts/check-demo-coverage.mjs --selftest  prove each check can fail
//
// Exits nonzero on any failure.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as routeTable from '../lib/demo/routes.mjs';
import { resolve } from '../lib/demo/resolve.mjs';

const VERSION = '1.0.0';
const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['app', 'components', 'lib'];
const SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs)$/;
const FLAG_FILE = 'lib/demo/flag.ts';
const HANDLER_DIR = 'lib/demo/handlers/';
const PLACEHOLDER = '\u0000';

// ─── Source scanning ──────────────────────────────────────────────────────────

/** Index just past the string/template literal that starts at src[i]. */
function skipLiteral(src, i) {
  const quote = src[i];
  let j = i + 1;
  while (j < src.length) {
    const ch = src[j];
    if (ch === '\\') { j += 2; continue; }
    if (ch === quote) return j + 1;
    if (quote === '`' && ch === '$' && src[j + 1] === '{') { j = skipBalanced(src, j + 1); continue; }
    j++;
  }
  return j;
}

/** Index just past the bracket group that opens at src[i] ('(', '[', or '{'). */
function skipBalanced(src, i) {
  const pairs = { '(': ')', '[': ']', '{': '}' };
  const stack = [pairs[src[i]]];
  let j = i + 1;
  while (j < src.length && stack.length) {
    const ch = src[j];
    if (ch === '"' || ch === "'" || ch === '`') { j = skipLiteral(src, j); continue; }
    if (pairs[ch]) stack.push(pairs[ch]);
    else if (ch === stack[stack.length - 1]) stack.pop();
    j++;
  }
  return j;
}

/** Replace comments with spaces (newlines kept, so line numbers survive). */
function stripComments(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const end = skipLiteral(src, i);
      out += src.slice(i, end);
      i = end;
    } else if (ch === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') { out += ' '; i++; }
    } else if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? src.length : end + 2;
      out += src.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

const lineAt = (src, index) => src.slice(0, index).split('\n').length;

/** Split the argument list of the call whose '(' is at src[open] into top-level args. */
function callArgs(src, open) {
  const close = skipBalanced(src, open) - 1;
  const args = [];
  let start = open + 1;
  let j = open + 1;
  while (j < close) {
    const ch = src[j];
    if (ch === '"' || ch === "'" || ch === '`') { j = skipLiteral(src, j); continue; }
    if (ch === '(' || ch === '[' || ch === '{') { j = skipBalanced(src, j); continue; }
    if (ch === ',') { args.push(src.slice(start, j).trim()); start = j + 1; }
    j++;
  }
  const last = src.slice(start, close).trim();
  if (last) args.push(last);
  return args;
}

/** Skip a TypeScript type-argument list '<...>' starting at src[i]. */
function skipTypeArgs(src, i) {
  let depth = 0;
  let j = i;
  while (j < src.length) {
    const ch = src[j];
    if (ch === '"' || ch === "'" || ch === '`') { j = skipLiteral(src, j); continue; }
    if (ch === '<') depth++;
    else if (ch === '>' && src[j - 1] !== '=') { depth--; if (depth === 0) return j + 1; }
    j++;
  }
  return j;
}

/** Calls to `names` in src: [{ name, args, line }]. Definitions are skipped. */
function findCalls(src, names) {
  const calls = [];
  const re = new RegExp(`(?<![\\w$.])(${names.join('|')})\\b`, 'g');
  let m;
  while ((m = re.exec(src))) {
    if (/function\s*$/.test(src.slice(Math.max(0, m.index - 20), m.index))) continue;
    let j = m.index + m[1].length;
    while (/\s/.test(src[j])) j++;
    if (src[j] === '<') { j = skipTypeArgs(src, j); while (/\s/.test(src[j])) j++; }
    if (src[j] !== '(') continue;
    calls.push({ name: m[1], args: callArgs(src, j), line: lineAt(src, m.index) });
  }
  return calls;
}

/**
 * Literal path from a first argument, template placeholders normalized:
 *   `/api/threads/${id}/messages${q}` -> /api/threads/:param/messages
 *   `/api/campaigns?${params}`        -> /api/campaigns
 * Returns null when the argument is not a string or template literal.
 */
export function normalizePath(arg) {
  if (!arg) return null;
  const q = arg[0];
  if ((q !== "'" && q !== '"' && q !== '`') || skipLiteral(arg, 0) !== arg.length) return null;
  let body = arg.slice(1, -1);
  if (q === '`') {
    let out = '';
    for (let i = 0; i < body.length; ) {
      if (body[i] === '$' && body[i + 1] === '{') { out += PLACEHOLDER; i = skipBalanced(body, i + 1); }
      else { out += body[i]; i++; }
    }
    body = out;
  }
  let p = body.split('?')[0];
  // A placeholder glued to the end of a segment carries a query string (`messages${q}`).
  p = p.replace(new RegExp(`([^/])${PLACEHOLDER}+$`), '$1');
  return p.split(PLACEHOLDER).join(':param');
}

function callMethod(call) {
  if (call.name === 'apiUpload') return 'POST';
  const m = /\bmethod\s*:\s*['"`](\w+)['"`]/.exec(call.args.slice(1).join(','));
  return m ? m[1].toUpperCase() : 'GET';
}

/** fetch() calls whose URL is built from the API base. */
function directApiFetches(src) {
  const baseVars = new Set();
  const decl = /\b(?:const|let|var)\s+(\w+)\s*=\s*process\.env\.NEXT_PUBLIC_API_URL\b/g;
  let m;
  while ((m = decl.exec(src))) baseVars.add(m[1]);
  return findCalls(src, ['fetch'])
    .filter((c) => {
      const a = c.args[0] ?? '';
      if (a.includes('NEXT_PUBLIC_API_URL')) return true;
      const tpl = /^`\$\{\s*(\w+)\s*\}/.exec(a);
      if (tpl && baseVars.has(tpl[1])) return true;
      const concat = /^(\w+)\s*\+/.exec(a);
      return !!(concat && baseVars.has(concat[1]));
    })
    .map((c) => c.line);
}

// ─── Analysis (shared by the real run and --selftest) ─────────────────────────

/**
 * @param {{ files: Record<string, string>, table: { ROUTES: any[], DEFERRED: any[], DEFERRED_PREFIXES: string[] } }} input
 *   files: web-root-relative path -> source text
 */
export function analyze({ files, table }) {
  const paths = new Map(); // "METHOD path" -> { method, path, kind, sites[] }
  const unanalyzable = [];
  const directFetches = [];
  const flagReaders = [];
  let handlerSource = '';

  for (const [file, raw] of Object.entries(files)) {
    const src = stripComments(raw);
    if (file.startsWith(HANDLER_DIR)) handlerSource += src;
    if (file !== FLAG_FILE && raw.includes('NEXT_PUBLIC_DEMO_MODE')) flagReaders.push(file);
    if (!file.startsWith('lib/')) {
      for (const line of directApiFetches(src)) directFetches.push(`${file}:${line}`);
    }
    for (const call of findCalls(src, ['apiFetch', 'apiUpload'])) {
      const p = normalizePath(call.args[0]);
      if (p === null) { unanalyzable.push(`${file}:${call.line} ${call.name}(${call.args[0] ?? ''})`); continue; }
      const method = callMethod(call);
      const key = `${method} ${p}`;
      if (!paths.has(key)) paths.set(key, { method, path: p, kind: resolve(table, method, p).kind, sites: [] });
      paths.get(key).sites.push(`${file}:${call.line}`);
    }
  }

  const badDeferred = table.DEFERRED
    .filter((d) => typeof d.slice !== 'string' || !d.slice || !table.DEFERRED_PREFIXES.some((pre) => d.path === pre || d.path.startsWith(`${pre}/`)))
    .map((d) => `${d.method} ${d.path}`);

  const missingHandlers = [...new Set(table.ROUTES.map((r) => r.handler))]
    .filter((h) => !new RegExp(`['"]${h.replace(/\./g, '\\.')}['"]\\s*:`).test(handlerSource));

  const all = [...paths.values()];
  const unrouted = all.filter((p) => p.kind === 'none');
  return {
    total: all.length,
    routed: all.filter((p) => p.kind === 'route'),
    deferred: all.filter((p) => p.kind === 'deferred'),
    unrouted,
    unanalyzable,
    directFetches,
    badDeferred,
    missingHandlers,
    flagReaders,
    ok: unrouted.length === 0 && unanalyzable.length === 0 && directFetches.length === 0 &&
      badDeferred.length === 0 && missingHandlers.length === 0 && flagReaders.length === 0,
  };
}

function report(r, { verbose }) {
  console.log(`total paths: ${r.total}`);
  console.log(`routed:      ${r.routed.length}`);
  console.log(`deferred:    ${r.deferred.length}`);
  console.log(`unrouted:    ${r.unrouted.length}`);
  if (verbose && r.deferred.length) {
    console.log('\ndeferred (answered "Not available in the demo"):');
    for (const p of r.deferred) console.log(`  ${p.method} ${p.path}`);
  }
  const problems = [
    ['unrouted paths (add a route or a DEFERRED entry)', r.unrouted.map((p) => `${p.method} ${p.path}  <- ${p.sites.join(', ')}`)],
    ['apiFetch/apiUpload calls without a literal path', r.unanalyzable],
    ['direct fetch() to the API base outside lib/ (use apiFetch/apiUpload)', r.directFetches],
    ['DEFERRED entries outside DEFERRED_PREFIXES or without a slice', r.badDeferred],
    ['route handlers not registered in lib/demo/handlers/', r.missingHandlers],
    [`files other than ${FLAG_FILE} that read NEXT_PUBLIC_DEMO_MODE`, r.flagReaders],
  ];
  for (const [title, items] of problems) {
    if (!items.length) continue;
    console.log(`\nFAIL: ${title}`);
    for (const it of items) console.log(`  ${it}`);
  }
  console.log(r.ok ? '\nOK' : '\nFAILED');
}

// ─── Real run ─────────────────────────────────────────────────────────────────

function loadFiles() {
  const files = {};
  const walk = (dir) => {
    for (const ent of fs.readdirSync(path.join(WEB_ROOT, dir), { withFileTypes: true })) {
      const rel = path.posix.join(dir, ent.name);
      if (ent.isDirectory()) { if (ent.name !== 'node_modules' && ent.name !== '.next') walk(rel); }
      else if (SOURCE_EXT.test(ent.name)) files[rel] = fs.readFileSync(path.join(WEB_ROOT, rel), 'utf8');
    }
  };
  for (const d of SCAN_DIRS) walk(d);
  return files;
}

// ─── Self-test ────────────────────────────────────────────────────────────────

const FIXTURE_TABLE = {
  ROUTES: [
    { method: 'GET', path: '/api/things', handler: 'things.list' },
    { method: 'GET', path: '/api/things/:id', handler: 'things.get' },
    { method: 'POST', path: '/api/things/:id/like', handler: 'things.like' },
  ],
  DEFERRED: [{ method: 'GET', path: '/api/admin/stats', slice: 'admin' }],
  DEFERRED_PREFIXES: ['/api/admin'],
};

const FIXTURE_FILES = {
  'lib/api.ts': [
    "const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';",
    'export async function apiFetch<T = unknown>(path: string, options = {}): Promise<T> {',
    '  return fetch(`${BASE}${path}`).then((r) => r.json());',
    '}',
    'export async function apiUpload<T = unknown>(path: string, fd: FormData): Promise<T> {',
    "  return fetch(`${BASE}${path}`, { method: 'POST', body: fd }).then((r) => r.json());",
    '}',
  ].join('\n'),
  'lib/demo/flag.ts': "export const isDemo = () => process.env.NEXT_PUBLIC_DEMO_MODE === '1';",
  'lib/demo/handlers/things.ts': "export const h = { 'things.list': () => [], 'things.get': () => ({}), 'things.like': () => ({}) };",
  'app/page.tsx': [
    "// apiFetch('/api/in-a-comment') is ignored",
    "apiFetch<{ items: Array<{ id: string }> }>('/api/things');",
    'apiFetch(`/api/things/${encodeURIComponent(id)}?full=${full}`);',
    'apiFetch(`/api/things/${id}/like`, {',
    "  method: 'POST',",
    '});',
    "apiUpload<{ url: string }>('/api/things/abc/like', fd);",
    "apiFetch<Stats>('/api/admin/stats');",
    "fetch('https://newsapi.example/v2/everything');",
  ].join('\n'),
};

function selftest() {
  const cases = [
    {
      name: 'fully routed fixture stays green',
      input: { files: FIXTURE_FILES, table: FIXTURE_TABLE },
      expect: (r) => r.ok && r.total === 5 && r.routed.length === 4 && r.deferred.length === 1 && r.unanalyzable.length === 0,
    },
    {
      name: '(a) an unrouted path goes red',
      input: { files: { ...FIXTURE_FILES, 'components/Extra.tsx': "apiFetch('/api/unknown/thing', { method: 'DELETE' });" }, table: FIXTURE_TABLE },
      expect: (r) => !r.ok && r.unrouted.length === 1 && r.unrouted[0].path === '/api/unknown/thing',
    },
    {
      name: '(b) a direct API fetch outside lib/ goes red',
      input: {
        files: {
          ...FIXTURE_FILES,
          'components/Upload.tsx': "const API = process.env.NEXT_PUBLIC_API_URL ?? 'x';\nawait fetch(`${API}/api/things/1/like`, { method: 'POST' });",
        },
        table: FIXTURE_TABLE,
      },
      expect: (r) => !r.ok && r.directFetches.length === 1 && r.unrouted.length === 0,
    },
    {
      name: '(c) a deferred entry outside the allowed prefixes goes red',
      input: {
        files: FIXTURE_FILES,
        table: { ...FIXTURE_TABLE, DEFERRED: [...FIXTURE_TABLE.DEFERRED, { method: 'GET', path: '/api/things/secret', slice: 'brand' }] },
      },
      expect: (r) => !r.ok && r.badDeferred.length === 1 && r.unrouted.length === 0,
    },
    {
      name: '(extra) a route with no registered handler goes red',
      input: {
        files: FIXTURE_FILES,
        table: { ...FIXTURE_TABLE, ROUTES: [...FIXTURE_TABLE.ROUTES, { method: 'GET', path: '/api/other', handler: 'other.list' }] },
      },
      expect: (r) => !r.ok && r.missingHandlers.length === 1,
    },
    {
      name: '(extra) reading NEXT_PUBLIC_DEMO_MODE outside flag.ts goes red',
      input: { files: { ...FIXTURE_FILES, 'app/x.tsx': "const on = process.env.NEXT_PUBLIC_DEMO_MODE === '1';" }, table: FIXTURE_TABLE },
      expect: (r) => !r.ok && r.flagReaders.length === 1,
    },
  ];

  let allPass = true;
  for (const c of cases) {
    const r = analyze(c.input);
    const pass = c.expect(r);
    allPass &&= pass;
    console.log(`${pass ? 'ok  ' : 'FAIL'}  ${c.name}  (ok=${r.ok}, routed=${r.routed.length}, deferred=${r.deferred.length}, unrouted=${r.unrouted.length}, directFetches=${r.directFetches.length}, badDeferred=${r.badDeferred.length}, missingHandlers=${r.missingHandlers.length}, flagReaders=${r.flagReaders.length})`);
  }
  console.log(`RESULT: ${allPass ? 'pass' : 'fail'}`);
  return allPass;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function main(argv = process.argv.slice(2)) {
  console.log(`check-demo-coverage v${VERSION}`);
  if (argv.includes('--selftest')) return selftest() ? 0 : 1;
  const r = analyze({ files: loadFiles(), table: routeTable });
  report(r, { verbose: true });
  return r.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
