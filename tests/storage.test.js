import { describe, it, expect, beforeEach } from 'vitest';
import { loadHistory, saveSnapshot, clearHistory } from '../js/storage.js';

// A minimal Web Storage-like double so tests never touch real localStorage.
function memoryStore() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

describe('storage', () => {
  let store;
  beforeEach(() => { store = memoryStore(); });

  it('starts empty', () => {
    expect(loadHistory(store)).toEqual([]);
  });

  it('saves and reloads a snapshot', () => {
    saveSnapshot({ total: 4200, breakdown: { food: 2500 } }, store);
    const history = loadHistory(store);
    expect(history).toHaveLength(1);
    expect(history[0].total).toBe(4200);
    expect(typeof history[0].date).toBe('string');
  });

  it('appends snapshots in order', () => {
    saveSnapshot({ total: 1000, breakdown: {} }, store);
    saveSnapshot({ total: 2000, breakdown: {} }, store);
    const totals = loadHistory(store).map((h) => h.total);
    expect(totals).toEqual([1000, 2000]);
  });

  it('discards corrupt data instead of throwing', () => {
    store.setItem('carebon.history.v1', '{ not valid json');
    expect(loadHistory(store)).toEqual([]);
  });

  it('filters out entries with the wrong shape', () => {
    store.setItem('carebon.history.v1', JSON.stringify([
      { total: 100, breakdown: {}, date: '2025-01-01T00:00:00Z' },
      { total: 'oops', breakdown: {}, date: 'x' },
      { nope: true },
    ]));
    expect(loadHistory(store)).toHaveLength(1);
  });

  it('clears history', () => {
    saveSnapshot({ total: 500, breakdown: {} }, store);
    expect(clearHistory(store)).toEqual([]);
    expect(loadHistory(store)).toEqual([]);
  });

  it('coerces a non-numeric total to 0 on save', () => {
    saveSnapshot({ total: 'bad', breakdown: {} }, store);
    expect(loadHistory(store)[0].total).toBe(0);
  });
});
