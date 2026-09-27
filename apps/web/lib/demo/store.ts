import type { DemoState } from './types';
import { buildFixtures } from './fixtures';

// One state object for the whole demo backend. Seeded from the fixtures on
// first use, then persisted to localStorage after every request. Every storage
// access is guarded: if localStorage is unavailable (private mode, blocked
// site data) the demo keeps running on in-memory state for the session.

export const STORAGE_KEY = 'kailani_demo_state_v1';

/** Shown in place of an uploaded ID image after a reload (uploads are not persisted). */
export const UPLOAD_PLACEHOLDER = 'https://picsum.photos/seed/kailani-demo-upload/800/1000';

let state: DemoState | null = null;
let fixtureCache: DemoState | null = null;

function fixtures(): DemoState {
  if (!fixtureCache) fixtureCache = buildFixtures();
  return fixtureCache;
}

function readStorage(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    return parsed && parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

function writeStorage(value: DemoState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage full or blocked: keep going in memory.
  }
}

const isBlob = (v: unknown): v is string => typeof v === 'string' && v.startsWith('blob:');

/**
 * Uploaded files live only as in-memory object URLs. Before persisting, swap
 * each blob: URL for the fixture image it replaced, so a reload falls back to
 * the fixture instead of a dead link.
 */
function forStorage(s: DemoState): DemoState {
  const copy = JSON.parse(JSON.stringify(s)) as DemoState;
  const fx = fixtures();
  for (const p of copy.modelProfiles) {
    const original = fx.modelProfiles.find((f) => f.userId === p.userId);
    if (isBlob(p.profileImage)) p.profileImage = original?.profileImage;
    if (isBlob(p.coverImage)) p.coverImage = original?.coverImage;
    p.portfolioImages = p.portfolioImages.filter((u) => !isBlob(u));
  }
  for (const v of copy.verifications) {
    if (isBlob(v.idImageUrl)) v.idImageUrl = UPLOAD_PLACEHOLDER;
  }
  return copy;
}

export function getState(): DemoState {
  if (state) return state;
  const stored = typeof window === 'undefined' ? null : readStorage();
  state = stored ?? buildFixtures();
  if (!stored) persist();
  return state;
}

export function persist(): void {
  if (!state || typeof window === 'undefined') return;
  writeStorage(forStorage(state));
}

/** Restore the fixtures (the Navbar "Reset demo" control). */
export function resetDemo(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  fixtureCache = null;
  state = buildFixtures();
  persist();
}

let seq = 0;

/** Unique id for rows created at runtime. */
export function newId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}${seq.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
