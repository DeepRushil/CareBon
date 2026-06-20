/**
 * storage.js — Persist a history of footprint snapshots locally.
 *
 * Data never leaves the browser. The backing store is injectable so the same
 * code can be unit-tested with a plain in-memory object. Reads are defensive:
 * corrupt or tampered data is discarded rather than trusted.
 */

const KEY = 'carebon.history.v1';
const MAX_ENTRIES = 60;

/** @returns {Storage|object} a Web Storage-like object, or a no-op fallback. */
function defaultStore() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch { /* access can throw in private mode */ }
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
}

/** Validate one snapshot record loaded from storage. */
function isValidEntry(e) {
  return (
    e && typeof e === 'object' &&
    typeof e.date === 'string' &&
    typeof e.total === 'number' && Number.isFinite(e.total) &&
    e.breakdown && typeof e.breakdown === 'object'
  );
}

export function loadHistory(store = defaultStore()) {
  try {
    const raw = store.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return []; // unreadable data should never crash the app
  }
}

/**
 * Append a snapshot and persist. Returns the new history array.
 * @param {{total:number, breakdown:object}} snapshot
 */
export function saveSnapshot(snapshot, store = defaultStore()) {
  const entry = {
    date: new Date().toISOString(),
    total: Number(snapshot.total) || 0,
    breakdown: snapshot.breakdown ?? {},
  };
  const history = [...loadHistory(store), entry].slice(-MAX_ENTRIES);
  try {
    store.setItem(KEY, JSON.stringify(history));
  } catch { /* quota or disabled storage: keep working in-session */ }
  return history;
}

export function clearHistory(store = defaultStore()) {
  try {
    store.removeItem(KEY);
  } catch { /* ignore */ }
  return [];
}
