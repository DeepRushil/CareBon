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

  it('falls back to defaultStore when no store argument is provided', () => {
    expect(loadHistory()).toEqual([]);
  });

  it('defaultStore fallback works correctly when localStorage throws or is undefined', () => {
    const origLocalStorage = globalThis.localStorage;
    
    // Test case 1: localStorage throws error on access (like in private browsing mode)
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new Error('SecurityError: Access denied'); }
    });
    
    expect(loadHistory()).toEqual([]);
    saveSnapshot({ total: 1000, breakdown: {} });
    expect(loadHistory()).toHaveLength(1);
    clearHistory();
    expect(loadHistory()).toEqual([]);

    // Test case 2: localStorage is undefined
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: undefined
    });
    
    expect(loadHistory()).toEqual([]);
    saveSnapshot({ total: 2000, breakdown: {} });
    expect(loadHistory()[0].total).toBe(2000);
    clearHistory();

    // Test case 3: localStorage is defined and works
    const mockStorage = memoryStore();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: mockStorage
    });
    
    expect(loadHistory()).toEqual([]);
    saveSnapshot({ total: 3000, breakdown: {} });
    expect(mockStorage.getItem('carebon.history.v1')).toBeDefined();
    expect(loadHistory()[0].total).toBe(3000);
    clearHistory();
    
    // Restore
    if (origLocalStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: origLocalStorage
      });
    }
  });
});
